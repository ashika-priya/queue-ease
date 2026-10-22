const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },
    date: {
      type: String, // e.g. YYYY-MM-DD
      required: true,
      default: () => new Date().toISOString().slice(0, 10),
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'closed'],
      default: 'active',
    },
    currentToken: {
      type: String,
      default: null,
    },
    currentCounterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Counter',
      default: null,
    },
    lastIssuedNumber: {
      type: Number,
      default: 0,
    },
    completedDurations: {
      type: [Number], // in minutes, rolling history
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Unique queue per service per day
queueSchema.index({ serviceId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Queue', queueSchema);
