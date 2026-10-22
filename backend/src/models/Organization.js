const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['Hospital', 'Bank', 'Service Center', 'Government', 'Retail', 'Other'],
      default: 'Hospital',
    },
    address: {
      type: String,
      default: '',
    },
    contact: {
      type: String,
      default: '',
    },
    tagline: {
      type: String,
      default: '',
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

module.exports = mongoose.model('Organization', organizationSchema);
