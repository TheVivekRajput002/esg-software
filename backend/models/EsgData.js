const mongoose = require('mongoose');

const esgDataSchema = new mongoose.Schema(
  {
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EsgSubmission',
      required: true
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true
    },
    metricId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EsgMetric',
      required: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EsgCategory'
    },
    reportingPeriodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ReportingPeriod',
      required: true
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    value: { type: Number, required: true },
    unit: { type: String, required: true },
    description: { type: String, default: '' },
    evidenceFiles: [{ type: String }],
    status: {
      type: String,
      enum: [
        'draft',
        'submitted',
        'validated',
        'requires_correction',
        'audited',
        'approved',
        'rejected'
      ],
      default: 'draft'
    },
    originalValue: { type: Number },
    auditNote: { type: String, default: '' },
    isValidated: { type: Boolean, default: false },
    validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    validatedAt: { type: Date },
    validatorNote: { type: String, default: '' }
  },
  { timestamps: true }
);

esgDataSchema.index({ organizationId: 1, metricId: 1, reportingPeriodId: 1 });
esgDataSchema.index({ submissionId: 1 });
esgDataSchema.index({ status: 1 });

module.exports = mongoose.model('EsgData', esgDataSchema);
