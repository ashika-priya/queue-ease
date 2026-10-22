const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    averageServiceTime: {
      type: Number,
      required: true,
      default: 5, // in minutes
    },
    prefix: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      default: 'Q',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Service', serviceSchema);
