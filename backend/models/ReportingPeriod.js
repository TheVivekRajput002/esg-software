const mongoose = require('mongoose');

const reportingPeriodSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null // null means shared/global cycle
    },
    periodName: { type: String, required: true }, // e.g. "FY 2026–27", "Q1 2026", "CY 2025"
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['active', 'upcoming', 'closed', 'archived'],
      default: 'active'
    },
    isCurrent: { type: Boolean, default: false }
  },
  { timestamps: true }
);

reportingPeriodSchema.index({ organizationId: 1, periodName: 1 });

module.exports = mongoose.model('ReportingPeriod', reportingPeriodSchema);
