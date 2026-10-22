const Queue = require('../models/Queue');

/**
 * Atomically generates the next sequential zero-padded token for a queue
 * @param {string|ObjectId} queueId 
 * @param {string} prefix - e.g. 'Q', 'PED', 'CSH'
 * @returns {Promise<{ tokenNumber: string, sequenceNumber: number }>}
 */
async function generateNextToken(queueId, prefix = 'Q') {
  const cleanPrefix = (prefix || 'Q').trim().toUpperCase();

  // Atomic $inc operation guarantees no duplicate sequence numbers even under concurrent load
  const updatedQueue = await Queue.findByIdAndUpdate(
    queueId,
    { $inc: { lastIssuedNumber: 1 } },
    { new: true }
  );

  if (!updatedQueue) {
    throw new Error('Queue not found for token generation');
  }

  const sequenceNumber = updatedQueue.lastIssuedNumber;
  const zeroPadded = String(sequenceNumber).padStart(3, '0');
  const tokenNumber = `${cleanPrefix}-${zeroPadded}`;

  return { tokenNumber, sequenceNumber };
}

module.exports = { generateNextToken };
