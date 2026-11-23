const Audit = require('../models/Audit');
const AuditFinding = require('../models/AuditFinding');
const AuditLog = require('../models/AuditLog');
const EsgData = require('../models/EsgData');
const EsgSubmission = require('../models/EsgSubmission');
const { logAuditAction } = require('../utils/auditLogger');

// @route   GET /api/v1/audits
const listAudits = async (req, res, next) => {
  try {
    const query = {};
    if (req.organizationId) query.organizationId = req.organizationId;
    if (req.query.status && req.query.status !== 'all') query.status = req.query.status;

    const audits = await Audit.find(query)
      .populate('userId', 'name email')
      .populate('submissionId', 'submissionName status')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: audits });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/audits/:id
const getAuditById = async (req, res, next) => {
  try {
    const audit = await Audit.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('submissionId');

    if (!audit) {
      return res.status(404).json({ success: false, message: 'Audit not found' });
    }

    const findings = await AuditFinding.find({ auditId: audit._id })
      .populate('metricId', 'name unit')
      .populate('dataId')
      .populate('assignedTo', 'name email');

    res.json({ success: true, data: { audit, findings } });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/audits
const createAudit = async (req, res, next) => {
  try {
    const { submissionId, reportId, auditType, comments } = req.body;
    const orgId = req.organizationId || req.body.organizationId;

    const audit = await Audit.create({
      organizationId: orgId,
      submissionId: submissionId || null,
      reportId: reportId || null,
      userId: req.user._id,
      auditType: auditType || 'Internal Audit',
      auditDate: new Date(),
      status: 'in_progress',
      comments: comments || ''
    });

    if (submissionId) {
      await EsgSubmission.findByIdAndUpdate(submissionId, { status: 'in_audit', auditStatus: 'in_progress' });
    }

    await logAuditAction({
      organizationId: orgId,
      actorId: req.user._id,
      resourceType: 'Audit',
      resourceId: audit._id,
      action: 'CREATE',
      newValue: audit.toObject(),
      reason: `Audit engagement started: ${audit.auditType}`
    });

    res.status(201).json({ success: true, data: audit });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/v1/audits/:id
const updateAudit = async (req, res, next) => {
  try {
    const audit = await Audit.findById(req.params.id);
    if (!audit) {
      return res.status(404).json({ success: false, message: 'Audit not found' });
    }

    const { status, comments } = req.body;
    if (status) {
      audit.status = status;
      if (status === 'completed') {
        audit.completedAt = new Date();
        if (audit.submissionId) {
          await EsgSubmission.findByIdAndUpdate(audit.submissionId, {
            status: 'audit_completed',
            auditStatus: 'completed'
          });
        }
      }
    }
    if (comments !== undefined) audit.comments = comments;

    await audit.save();
    res.json({ success: true, data: audit });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/audits/:id/findings
const getAuditFindings = async (req, res, next) => {
  try {
    const findings = await AuditFinding.find({ auditId: req.params.id })
      .populate('metricId', 'name unit')
      .populate('dataId')
      .populate('assignedTo', 'name email');

    res.json({ success: true, data: findings });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/audits/:id/findings
const createAuditFinding = async (req, res, next) => {
  try {
    const { dataId, submissionId, metricId, title, description, severity, correctiveAction, assignedTo } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }

    const audit = await Audit.findById(req.params.id);
    if (!audit) {
      return res.status(404).json({ success: false, message: 'Audit not found' });
    }

    const finding = await AuditFinding.create({
      auditId: audit._id,
      organizationId: audit.organizationId,
      dataId: dataId || null,
      submissionId: submissionId || audit.submissionId || null,
      metricId: metricId || null,
      title,
      description,
      severity: severity || 'medium',
      status: 'open',
      correctiveAction: correctiveAction || '',
      assignedTo: assignedTo || null
    });

    await logAuditAction({
      organizationId: audit.organizationId,
      actorId: req.user._id,
      resourceType: 'AuditFinding',
      resourceId: finding._id,
      action: 'CREATE',
      newValue: finding.toObject(),
      reason: `Audit finding recorded: [${severity}] ${title}`
    });

    res.status(201).json({ success: true, data: finding });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/v1/audits/findings/:findingId
const updateAuditFinding = async (req, res, next) => {
  try {
    const finding = await AuditFinding.findById(req.params.findingId);
    if (!finding) {
      return res.status(404).json({ success: false, message: 'Finding not found' });
    }

    const allowed = ['status', 'correctiveAction', 'assignedTo', 'severity', 'description'];
    allowed.forEach(f => {
      if (req.body[f] !== undefined) finding[f] = req.body[f];
    });

    if (req.body.status === 'resolved') {
      finding.resolvedAt = new Date();
    }

    await finding.save();
    res.json({ success: true, data: finding });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/audits/correct-data (Controlled Auditor Correction)
const correctDataByAuditor = async (req, res, next) => {
  try {
    const { dataId, newValue, reason } = req.body;

    if (!dataId || newValue === undefined || !reason) {
      return res.status(400).json({
        success: false,
        message: 'dataId, newValue, and a mandatory justification reason are required'
      });
    }

    const record = await EsgData.findById(dataId).populate('metricId', 'name unit');
    if (!record) {
      return res.status(404).json({ success: false, message: 'ESG Data record not found' });
    }

    const prevValue = record.value;
    if (record.originalValue === undefined || record.originalValue === null) {
      record.originalValue = prevValue;
    }

    record.value = Number(newValue);
    record.auditNote = `Adjusted from ${prevValue} to ${newValue} by auditor. Reason: ${reason}`;
    record.status = 'audited';
    await record.save();

    // Preserve non-destructive historical log
    await logAuditAction({
      organizationId: record.organizationId,
      actorId: req.user._id,
      resourceType: 'EsgData',
      resourceId: record._id,
      action: 'AUDIT_CORRECTION',
      previousValue: { value: prevValue, unit: record.unit },
      newValue: { value: Number(newValue), unit: record.unit },
      reason,
      req
    });

    res.json({
      success: true,
      message: 'Controlled audit adjustment recorded with non-destructive audit history',
      data: record
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/audit-logs
const getAuditLogs = async (req, res, next) => {
  try {
    const { resourceType, resourceId, page = 1, limit = 20 } = req.query;
    const query = {};

    if (req.organizationId) query.organizationId = req.organizationId;
    if (resourceType) query.resourceType = resourceType;
    if (resourceId) query.resourceId = resourceId;

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('actorId', 'name email roleId')
        .populate('organizationId', 'name')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listAudits,
  getAuditById,
  createAudit,
  updateAudit,
  getAuditFindings,
  createAuditFinding,
  updateAuditFinding,
  correctDataByAuditor,
  getAuditLogs
};
