const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema(
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
    counterNumber: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'paused'],
      default: 'open',
    },
    currentStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Counter', counterSchema);
