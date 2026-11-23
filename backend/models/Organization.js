const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    industry: { type: String, default: 'General Manufacturing & Services' },
    country: { type: String, default: 'United States' },
    email: { type: String, trim: true, lowercase: true },
    contactNumber: { type: String },
    address: { type: String },
    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
    code: { type: String, uppercase: true, trim: true }
  },
  { timestamps: true }
);

organizationSchema.index({ name: 1 });
organizationSchema.index({ status: 1 });

module.exports = mongoose.model('Organization', organizationSchema);
