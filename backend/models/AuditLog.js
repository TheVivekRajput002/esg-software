const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    resourceType: {
      type: String,
      required: true // 'EsgData', 'EsgSubmission', 'EsgTarget', 'ValidationRule', 'User', 'Organization'
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    action: {
      type: String,
      required: true // 'CREATE', 'UPDATE', 'VALIDATE', 'AUDIT_CORRECTION', 'APPROVE', 'REJECT', 'STATUS_CHANGE'
    },
    previousValue: { type: Object, default: null },
    newValue: { type: Object, default: null },
    reason: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

auditLogSchema.index({ organizationId: 1, resourceType: 1, timestamp: -1 });
auditLogSchema.index({ resourceId: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
