const mongoose = require('mongoose');

const auditFindingSchema = new mongoose.Schema(
  {
    auditId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Audit',
      required: true
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true
    },
    dataId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EsgData'
    },
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EsgSubmission'
    },
    metricId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EsgMetric'
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['open', 'in_review', 'resolved', 'dismissed'],
      default: 'open'
    },
    correctiveAction: { type: String, default: '' },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: { type: Date }
  },
  { timestamps: true }
);

auditFindingSchema.index({ auditId: 1 });
auditFindingSchema.index({ organizationId: 1, status: 1 });

module.exports = mongoose.model('AuditFinding', auditFindingSchema);
