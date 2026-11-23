const AuditLog = require('../models/AuditLog');

const logAuditAction = async ({
  organizationId,
  actorId,
  resourceType,
  resourceId,
  action,
  previousValue = null,
  newValue = null,
  reason = '',
  req = null
}) => {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') : '';
    await AuditLog.create({
      organizationId,
      actorId,
      resourceType,
      resourceId,
      action,
      previousValue,
      newValue,
      reason,
      ipAddress,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('[AuditLog Error]: Failed to create audit log', err.message);
  }
};

module.exports = { logAuditAction };
