const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true
    },
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EsgSubmission'
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EsgReport'
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    auditType: {
      type: String,
      enum: ['Internal Audit', 'External Verification', 'Annual Compliance Review', 'Quarterly Spot Check'],
      default: 'Internal Audit'
    },
    auditDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'requires_followup'],
      default: 'in_progress'
    },
    comments: { type: String, default: '' },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

auditSchema.index({ organizationId: 1, status: 1 });

module.exports = mongoose.model('Audit', auditSchema);
