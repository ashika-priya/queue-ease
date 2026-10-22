const Queue = require('../models/Queue');
const QueueEntry = require('../models/QueueEntry');
const Service = require('../models/Service');
const Counter = require('../models/Counter');
const Organization = require('../models/Organization');
const Notification = require('../models/Notification');
const { generateNextToken } = require('../services/tokenGeneratorService');
const { calculateWaitTime } = require('../services/waitTimeService');
const { getIO } = require('../socket/socketHandler');

const isValidIndianPhone = (phone) => {
  if (!phone) return false;
  const cleaned = String(phone).replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(cleaned);
};

// Helper to broadcast socket events safely
const broadcastQueueEvent = (eventName, data, queueId, orgId) => {
  const io = getIO();
  if (!io) return;

  if (queueId) {
    io.to(`queue:${queueId}`).emit(eventName, data);
  }
  if (orgId) {
    io.to(`public:${orgId}`).emit(eventName, data);
  }
  io.to('admin').emit(eventName, data);
  io.emit(eventName, data); // Global broadcast fallback
};

exports.joinQueue = async (req, res) => {
  try {
    const { organizationId, serviceId, customerName, customerPhone, notes } = req.body;

    if (!organizationId || !serviceId || !customerName || !customerPhone) {
      return res.status(400).json({
        success: false,
        message: 'Organization, service, customer name, and 10-digit mobile phone are required.',
      });
    }

    const cleanPhone = String(customerPhone).replace(/\D/g, '');
    if (!isValidIndianPhone(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile phone number. Must be a 10-digit Indian phone number starting with 6, 7, 8, or 9.',
      });
    }

    const service = await Service.findById(serviceId);
    if (!service || service.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Selected service is currently inactive or not found.' });
    }

    const today = new Date().toISOString().slice(0, 10);
    let queue = await Queue.findOne({ serviceId, date: today });
    if (!queue) {
      queue = await Queue.create({
        organizationId,
        serviceId,
        date: today,
        status: 'active',
      });
    }

    if (queue.status === 'paused') {
      return res.status(400).json({
        success: false,
        message: 'This queue is currently paused for new admissions. Please try again shortly.',
      });
    }

    if (queue.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'This queue is closed for the day.',
      });
    }

    // Server-side duplicate active ticket check
    const existingActiveTicket = await QueueEntry.findOne({
      queueId: queue._id,
      customerPhone: cleanPhone,
      status: { $in: ['waiting', 'calling'] },
    }).populate({
      path: 'queueId',
      populate: { path: 'serviceId organizationId' },
    });

    if (existingActiveTicket) {
      // Calculate position metrics for existing ticket to show in modal
      const peopleAhead = await QueueEntry.countDocuments({
        queueId: queue._id,
        status: 'waiting',
        sequenceNumber: { $lt: existingActiveTicket.sequenceNumber },
      });

      const activeCounters = await Counter.countDocuments({
        serviceId,
        status: 'open',
      });

      const waitEstimate = await calculateWaitTime({
        customersAhead: peopleAhead,
        averageServiceTime: service.averageServiceTime,
        activeCounters: activeCounters || 1,
      });

      return res.status(409).json({
        success: false,
        code: 'ALREADY_IN_QUEUE',
        message: `You already hold active token ${existingActiveTicket.tokenNumber} in this queue. A duplicate ticket was not generated.`,
        ticket: {
          id: existingActiveTicket._id,
          tokenNumber: existingActiveTicket.tokenNumber,
          sequenceNumber: existingActiveTicket.sequenceNumber,
          status: existingActiveTicket.status,
          serviceName: service.name,
          organizationName: (await Organization.findById(organizationId))?.name || 'Organization',
          nowServing: queue.currentToken || 'None',
          peopleAhead,
          estimatedWait: waitEstimate.formattedWait,
          estimatedMinutes: waitEstimate.estimatedMinutes,
        },
      });
    }

    // Atomically generate sequential token
    const { tokenNumber, sequenceNumber } = await generateNextToken(queue._id, service.prefix);

    let customerId = null;
    if (req.user) {
      customerId = req.user._id;
    }

    let newEntry;
    try {
      newEntry = await QueueEntry.create({
        queueId: queue._id,
        customerId,
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        tokenNumber,
        sequenceNumber,
        status: 'waiting',
        notes: notes ? String(notes).trim() : '',
        joinedAt: new Date(),
      });
    } catch (dbErr) {
      // Catch MongoDB Code 11000 duplicate key error from partial unique index
      if (dbErr.code === 11000) {
        return res.status(409).json({
          success: false,
          code: 'ALREADY_IN_QUEUE',
          message: 'Duplicate queue entry rejected by database constraint: An active ticket already exists for this phone number.',
        });
      }
      throw dbErr;
    }

    const peopleAhead = await QueueEntry.countDocuments({
      queueId: queue._id,
      status: 'waiting',
      sequenceNumber: { $lt: sequenceNumber },
    });

    const activeCounters = await Counter.countDocuments({
      serviceId,
      status: 'open',
    });

    const waitEstimate = await calculateWaitTime({
      customersAhead: peopleAhead,
      averageServiceTime: service.averageServiceTime,
      activeCounters: activeCounters || 1,
    });

    const org = await Organization.findById(organizationId);

    // Create persistent notification record
    if (customerId) {
      await Notification.create({
        userId: customerId,
        queueEntryId: newEntry._id,
        title: `Token ${tokenNumber} Issued`,
        message: `You are in line for ${service.name} at ${org ? org.name : 'facility'}. Estimated wait: ${waitEstimate.formattedWait}.`,
        type: 'ticket_created',
      });
    }

    // Emit live WebSocket update
    broadcastQueueEvent(
      'queue:updated',
      {
        queueId: queue._id,
        serviceId,
        organizationId,
        action: 'new_entry',
        tokenNumber,
      },
      queue._id,
      organizationId
    );

    return res.status(201).json({
      success: true,
      message: 'Queue token generated successfully.',
      ticket: {
        id: newEntry._id,
        tokenNumber,
        sequenceNumber,
        status: newEntry.status,
        serviceId: service._id,
        serviceName: service.name,
        averageServiceTime: service.averageServiceTime,
        organizationId: org ? org._id : organizationId,
        organizationName: org ? org.name : '',
        nowServing: queue.currentToken || 'None',
        peopleAhead,
        estimatedWait: waitEstimate.formattedWait,
        estimatedMinutes: waitEstimate.estimatedMinutes,
        joinedAt: newEntry.joinedAt,
      },
    });
  } catch (err) {
    console.error('Queue admission error:', err);
    return res.status(500).json({ success: false, message: 'Failed to join queue.' });
  }
};

exports.getMyActiveTickets = async (req, res) => {
  try {
    const queryPhone = req.query.phone ? String(req.query.phone).replace(/\D/g, '') : null;
    const filter = {
      status: { $in: ['waiting', 'calling'] },
    };

    if (req.user && req.user._id) {
      if (req.user.phone) {
        filter.$or = [{ customerId: req.user._id }, { customerPhone: req.user.phone }];
      } else {
        filter.customerId = req.user._id;
      }
    } else if (queryPhone) {
      filter.customerPhone = queryPhone;
    } else {
      return res.json({ success: true, tickets: [] });
    }

    const entries = await QueueEntry.find(filter)
      .populate({
        path: 'queueId',
        populate: [
          { path: 'serviceId' },
          { path: 'organizationId' },
          { path: 'currentCounterId' },
        ],
      })
      .populate('counterId')
      .sort({ joinedAt: -1 });

    const enrichedTickets = await Promise.all(
      entries.map(async (entry) => {
        const queue = entry.queueId;
        const service = queue ? queue.serviceId : null;
        const org = queue ? queue.organizationId : null;

        let peopleAhead = 0;
        let estimatedWait = '0 min';
        let estimatedMinutes = 0;
        let activeCounters = 1;

        if (queue && service) {
          peopleAhead = await QueueEntry.countDocuments({
            queueId: queue._id,
            status: 'waiting',
            sequenceNumber: { $lt: entry.sequenceNumber },
          });

          activeCounters = await Counter.countDocuments({
            serviceId: service._id,
            status: 'open',
          });

          const wait = await calculateWaitTime({
            customersAhead: peopleAhead,
            averageServiceTime: service.averageServiceTime || 5,
            activeCounters: activeCounters || 1,
          });

          estimatedWait = wait.formattedWait;
          estimatedMinutes = wait.estimatedMinutes;
        }

        return {
          id: entry._id,
          tokenNumber: entry.tokenNumber,
          sequenceNumber: entry.sequenceNumber,
          status: entry.status,
          customerName: entry.customerName,
          customerPhone: entry.customerPhone,
          notes: entry.notes,
          joinedAt: entry.joinedAt,
          calledAt: entry.calledAt,
          queueId: queue ? queue._id : null,
          serviceName: service ? service.name : 'Service',
          servicePrefix: service ? service.prefix : 'Q',
          organizationName: org ? org.name : 'Facility',
          nowServing: queue ? queue.currentToken || 'None' : 'None',
          counterNumber: entry.counterId ? entry.counterId.counterNumber : (queue && queue.currentCounterId ? queue.currentCounterId.counterNumber : null),
          peopleAhead,
          estimatedWait,
          estimatedMinutes,
          activeCounters: activeCounters || 1,
        };
      })
    );

    return res.json({ success: true, tickets: enrichedTickets });
  } catch (err) {
    console.error('Error fetching tickets:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch active tickets.' });
  }
};

exports.cancelTicket = async (req, res) => {
  try {
    const { entryId } = req.params;
    const entry = await QueueEntry.findById(entryId).populate('queueId');

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Queue ticket not found.' });
    }

    if (['completed', 'cancelled'].includes(entry.status)) {
      return res.status(400).json({ success: false, message: 'This ticket is already finalized.' });
    }

    entry.status = 'cancelled';
    await entry.save();

    if (entry.queueId) {
      broadcastQueueEvent(
        'queue:updated',
        {
          queueId: entry.queueId._id,
          action: 'cancelled',
          tokenNumber: entry.tokenNumber,
        },
        entry.queueId._id,
        entry.queueId.organizationId
      );
    }

    return res.json({
      success: true,
      message: `Token ${entry.tokenNumber} has been cancelled successfully.`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to cancel ticket.' });
  }
};

exports.getStaffQueue = async (req, res) => {
  try {
    const user = req.user;
    if (!user.counterId) {
      // Find or assign first open counter for staff's org
      const availableCounter = await Counter.findOne({
        organizationId: user.organizationId,
      }).populate('serviceId organizationId');

      if (!availableCounter) {
        return res.status(400).json({
          success: false,
          message: 'No counter assigned to this staff member. Please contact administrator.',
        });
      }
      user.counterId = availableCounter._id;
      await user.save();
    }

    const counter = await Counter.findById(user.counterId)
      .populate('serviceId')
      .populate('organizationId');

    if (!counter) {
      return res.status(404).json({ success: false, message: 'Assigned counter not found.' });
    }

    const today = new Date().toISOString().slice(0, 10);
    let queue = await Queue.findOne({ serviceId: counter.serviceId._id, date: today });
    if (!queue) {
      queue = await Queue.create({
        organizationId: counter.organizationId._id,
        serviceId: counter.serviceId._id,
        date: today,
        status: 'active',
      });
    }

    // Ticket currently being served at this counter
    const currentServing = await QueueEntry.findOne({
      queueId: queue._id,
      counterId: counter._id,
      status: 'calling',
    }).sort({ calledAt: -1 });

    // Next in line waiting ticket
    const nextTicket = await QueueEntry.findOne({
      queueId: queue._id,
      status: 'waiting',
    }).sort({ sequenceNumber: 1 });

    // Full waiting list
    const waitingList = await QueueEntry.find({
      queueId: queue._id,
      status: 'waiting',
    }).sort({ sequenceNumber: 1 });

    const waitingCount = waitingList.length;
    const avgDuration = counter.serviceId.averageServiceTime || 6;
    const estimatedTotalWaitMinutes = waitingCount * avgDuration;

    return res.json({
      success: true,
      queue: {
        id: queue._id,
        status: queue.status,
        currentToken: queue.currentToken,
        date: queue.date,
      },
      counter: {
        id: counter._id,
        number: counter.counterNumber,
        name: counter.name,
        status: counter.status,
      },
      service: {
        id: counter.serviceId._id,
        name: counter.serviceId.name,
        prefix: counter.serviceId.prefix,
        averageServiceTime: avgDuration,
      },
      organization: {
        id: counter.organizationId._id,
        name: counter.organizationId.name,
      },
      staff: {
        id: user._id,
        name: user.name,
      },
      currentServing,
      nextTicket,
      waitingCount,
      estimatedTotalWaitMinutes,
      waitingList,
    });
  } catch (err) {
    console.error('Error in getStaffQueue:', err);
    return res.status(500).json({ success: false, message: 'Failed to load staff queue terminal.' });
  }
};

exports.callNext = async (req, res) => {
  try {
    const { queueId } = req.params;
    const user = req.user;

    const queue = await Queue.findById(queueId).populate('serviceId organizationId');
    if (!queue) {
      return res.status(404).json({ success: false, message: 'Queue not found.' });
    }

    const counter = await Counter.findById(user.counterId);
    const counterNumber = counter ? counter.counterNumber : '1';

    // If there is already a ticket calling at this counter, mark it completed
    const existingCalling = await QueueEntry.findOne({
      queueId,
      counterId: user.counterId,
      status: 'calling',
    });
    if (existingCalling) {
      existingCalling.status = 'completed';
      existingCalling.completedAt = new Date();
      await existingCalling.save();
    }

    // Find the next waiting customer
    const nextEntry = await QueueEntry.findOne({
      queueId,
      status: 'waiting',
    }).sort({ sequenceNumber: 1 });

    if (!nextEntry) {
      return res.status(404).json({
        success: false,
        message: 'No waiting customers in queue.',
      });
    }

    nextEntry.status = 'calling';
    nextEntry.calledAt = new Date();
    nextEntry.counterId = user.counterId;
    nextEntry.servedByStaffId = user._id;
    await nextEntry.save();

    queue.currentToken = nextEntry.tokenNumber;
    queue.currentCounterId = user.counterId;
    await queue.save();

    // Broadcast ticket:called with counter details for Public TV and Customer alert
    const eventPayload = {
      tokenNumber: nextEntry.tokenNumber,
      counterNumber,
      staffName: user.name,
      serviceName: queue.serviceId.name,
      organizationName: queue.organizationId.name,
      queueId: queue._id,
      ticketId: nextEntry._id,
      isRecall: false,
    };

    broadcastQueueEvent('ticket:called', eventPayload, queue._id, queue.organizationId._id);
    broadcastQueueEvent('queue:updated', { queueId: queue._id, action: 'called' }, queue._id, queue.organizationId._id);

    return res.json({
      success: true,
      message: `Now serving ${nextEntry.tokenNumber} at Counter ${counterNumber}.`,
      calledTicket: nextEntry,
      queue,
    });
  } catch (err) {
    console.error('Call next error:', err);
    return res.status(500).json({ success: false, message: 'Failed to call next customer.' });
  }
};

exports.recall = async (req, res) => {
  try {
    const { queueId } = req.params;
    const user = req.user;

    const queue = await Queue.findById(queueId).populate('serviceId organizationId');
    if (!queue) {
      return res.status(404).json({ success: false, message: 'Queue not found.' });
    }

    const callingEntry = await QueueEntry.findOne({
      queueId,
      counterId: user.counterId,
      status: 'calling',
    });

    if (!callingEntry) {
      return res.status(400).json({ success: false, message: 'No customer currently being called to recall.' });
    }

    const counter = await Counter.findById(user.counterId);
    const counterNumber = counter ? counter.counterNumber : '1';

    const eventPayload = {
      tokenNumber: callingEntry.tokenNumber,
      counterNumber,
      staffName: user.name,
      serviceName: queue.serviceId.name,
      organizationName: queue.organizationId.name,
      queueId: queue._id,
      ticketId: callingEntry._id,
      isRecall: true,
    };

    broadcastQueueEvent('ticket:called', eventPayload, queue._id, queue.organizationId._id);

    return res.json({
      success: true,
      message: `Re-announced token ${callingEntry.tokenNumber}.`,
      ticket: callingEntry,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to recall customer.' });
  }
};

exports.skip = async (req, res) => {
  try {
    const { queueId } = req.params;
    const user = req.user;

    const callingEntry = await QueueEntry.findOne({
      queueId,
      counterId: user.counterId,
      status: 'calling',
    });

    if (!callingEntry) {
      return res.status(400).json({ success: false, message: 'No calling customer to skip.' });
    }

    callingEntry.status = 'skipped';
    callingEntry.completedAt = new Date();
    await callingEntry.save();

    const queue = await Queue.findById(queueId).populate('organizationId');
    broadcastQueueEvent('queue:updated', { queueId, action: 'skipped' }, queueId, queue?.organizationId?._id);

    return res.json({
      success: true,
      message: `Marked token ${callingEntry.tokenNumber} as skipped.`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to skip ticket.' });
  }
};

exports.complete = async (req, res) => {
  try {
    const { queueId } = req.params;
    const user = req.user;

    const callingEntry = await QueueEntry.findOne({
      queueId,
      counterId: user.counterId,
      status: 'calling',
    });

    if (!callingEntry) {
      return res.status(400).json({ success: false, message: 'No active consultation currently calling to complete.' });
    }

    callingEntry.status = 'completed';
    callingEntry.completedAt = new Date();
    await callingEntry.save();

    // Record consultation duration
    const callTime = callingEntry.calledAt ? new Date(callingEntry.calledAt).getTime() : new Date(callingEntry.joinedAt).getTime();
    const durationMinutes = Math.max(1, Math.round((callingEntry.completedAt.getTime() - callTime) / 60000));

    const queue = await Queue.findById(queueId).populate('organizationId');
    if (queue) {
      queue.completedDurations.push(durationMinutes);
      await queue.save();
    }

    broadcastQueueEvent('queue:updated', { queueId, action: 'completed' }, queueId, queue?.organizationId?._id);

    return res.json({
      success: true,
      message: `Consultation for token ${callingEntry.tokenNumber} marked completed (${durationMinutes} min).`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to complete consultation.' });
  }
};

exports.pauseQueue = async (req, res) => {
  try {
    const { queueId } = req.params;
    const queue = await Queue.findById(queueId).populate('organizationId');
    if (!queue) {
      return res.status(404).json({ success: false, message: 'Queue not found.' });
    }

    queue.status = 'paused';
    await queue.save();

    broadcastQueueEvent('queue:status_changed', { queueId, status: 'paused' }, queueId, queue.organizationId._id);
    return res.json({ success: true, message: 'Queue paused successfully.', queue });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to pause queue.' });
  }
};

exports.resumeQueue = async (req, res) => {
  try {
    const { queueId } = req.params;
    const queue = await Queue.findById(queueId).populate('organizationId');
    if (!queue) {
      return res.status(404).json({ success: false, message: 'Queue not found.' });
    }

    queue.status = 'active';
    await queue.save();

    broadcastQueueEvent('queue:status_changed', { queueId, status: 'active' }, queueId, queue.organizationId._id);
    return res.json({ success: true, message: 'Queue resumed successfully.', queue });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to resume queue.' });
  }
};

exports.getPublicDisplayData = async (req, res) => {
  try {
    const { orgId } = req.params;
    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found.' });
    }

    const today = new Date().toISOString().slice(0, 10);
    const services = await Service.find({ organizationId: orgId, status: 'active' });

    // Most recent calling token across the entire organization
    const activeCallingEntry = await QueueEntry.findOne({
      status: 'calling',
    })
      .populate({
        path: 'queueId',
        match: { organizationId: orgId, date: today },
        populate: { path: 'serviceId' },
      })
      .populate('counterId')
      .sort({ calledAt: -1 });

    const departmentRows = await Promise.all(
      services.map(async (srv) => {
        const queue = await Queue.findOne({ serviceId: srv._id, date: today });
        const waitingCount = queue
          ? await QueueEntry.countDocuments({ queueId: queue._id, status: 'waiting' })
          : 0;

        const nextWaiting = queue
          ? await QueueEntry.findOne({ queueId: queue._id, status: 'waiting' }).sort({ sequenceNumber: 1 })
          : null;

        const openCounter = await Counter.findOne({ serviceId: srv._id, status: 'open' });

        return {
          serviceId: srv._id,
          serviceName: srv.name,
          prefix: srv.prefix,
          nowServing: queue?.currentToken || '—',
          nextInLine: nextWaiting?.tokenNumber || '—',
          waitingCount,
          counterNumber: openCounter ? openCounter.counterNumber : '1',
        };
      })
    );

    return res.json({
      success: true,
      organization: {
        id: org._id,
        name: org.name,
        tagline: org.tagline,
      },
      activeCall: activeCallingEntry && activeCallingEntry.queueId
        ? {
            tokenNumber: activeCallingEntry.tokenNumber,
            counterNumber: activeCallingEntry.counterId ? activeCallingEntry.counterId.counterNumber : '1',
            serviceName: activeCallingEntry.queueId.serviceId.name,
            calledAt: activeCallingEntry.calledAt,
          }
        : null,
      departmentRows,
    });
  } catch (err) {
    console.error('Error fetching public display:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch public display data.' });
  }
};
