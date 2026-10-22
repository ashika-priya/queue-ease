const Service = require('../models/Service');
const Queue = require('../models/Queue');
const QueueEntry = require('../models/QueueEntry');
const Counter = require('../models/Counter');
const { calculateWaitTime } = require('../services/waitTimeService');

exports.getServicesByOrg = async (req, res) => {
  try {
    const { orgId } = req.params;
    const today = new Date().toISOString().slice(0, 10);

    const services = await Service.find({ organizationId: orgId, status: 'active' }).sort({ createdAt: 1 });

    const enrichedServices = await Promise.all(
      services.map(async (srv) => {
        let queue = await Queue.findOne({ serviceId: srv._id, date: today });
        if (!queue) {
          queue = await Queue.create({
            organizationId: orgId,
            serviceId: srv._id,
            date: today,
            status: 'active',
          });
        }

        const waitingCount = await QueueEntry.countDocuments({
          queueId: queue._id,
          status: 'waiting',
        });

        const activeCountersCount = await Counter.countDocuments({
          serviceId: srv._id,
          status: 'open',
        });

        const waitEstimate = await calculateWaitTime({
          customersAhead: waitingCount,
          averageServiceTime: srv.averageServiceTime,
          activeCounters: activeCountersCount || 1,
        });

        return {
          ...srv.toObject(),
          queueId: queue._id,
          queueStatus: queue.status,
          currentToken: queue.currentToken,
          waitingCount,
          activeCountersCount,
          estimatedWait: waitEstimate.formattedWait,
          estimatedMinutes: waitEstimate.estimatedMinutes,
        };
      })
    );

    return res.json({ success: true, services: enrichedServices });
  } catch (err) {
    console.error('Error fetching services:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch services' });
  }
};

exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.serviceId).populate('organizationId');
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    return res.json({ success: true, service });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch service' });
  }
};
