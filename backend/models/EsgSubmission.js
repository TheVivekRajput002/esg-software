const mongoose = require('mongoose');

const esgSubmissionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true
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
    submissionName: { type: String, required: true },
    source: { type: String, default: 'Manual Entry' },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: [
        'draft',
        'submitted',
        'in_validation',
        'validated',
        'requires_correction',
        'in_audit',
        'audit_completed',
        'approved',
        'rejected'
      ],
      default: 'draft'
    },
    validationStatus: {
      type: String,
      enum: ['pending', 'passed', 'failed', 'warnings'],
      default: 'pending'
    },
    auditStatus: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'findings_reported'],
      default: 'pending'
    },
    submittedAt: { type: Date },
    validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    validatedAt: { type: Date },
    validationNotes: { type: String, default: '' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String, default: '' }
  },
  { timestamps: true }
);

esgSubmissionSchema.index({ organizationId: 1, reportingPeriodId: 1, status: 1 });

module.exports = mongoose.model('EsgSubmission', esgSubmissionSchema);
