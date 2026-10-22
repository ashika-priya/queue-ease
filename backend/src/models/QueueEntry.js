const mongoose = require('mongoose');

const queueEntrySchema = new mongoose.Schema(
  {
    queueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Queue',
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    tokenNumber: {
      type: String,
      required: true,
      trim: true,
    },
    sequenceNumber: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'calling', 'completed', 'skipped', 'cancelled'],
      default: 'waiting',
      index: true,
    },
    counterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Counter',
      default: null,
    },
    servedByStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    calledAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Partial Unique Index: prohibits duplicate active tickets for identical phone number in same queue
queueEntrySchema.index(
  { queueId: 1, customerPhone: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['waiting', 'calling'] },
    },
  }
);

module.exports = mongoose.model('QueueEntry', queueEntrySchema);
