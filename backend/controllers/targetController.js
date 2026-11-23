const EsgTarget = require('../models/EsgTarget');
const TargetProgress = require('../models/TargetProgress');
const EsgMetric = require('../models/EsgMetric');
const { logAuditAction } = require('../utils/auditLogger');

// Helper to calculate progress percentage and health status
const calculateTargetHealth = (baseline, target, current, direction, targetDate) => {
  let progress = 0;
  if (current !== null && current !== undefined) {
    if (direction === 'lower_is_better') {
      if (baseline !== target) {
        progress = ((baseline - current) / (baseline - target)) * 100;
      }
    } else {
      if (target !== baseline) {
        progress = ((current - baseline) / (target - baseline)) * 100;
      }
    }
  }

  const rounded = Math.round(progress * 10) / 10;

  let status = 'Not Started';
  if (current === null || current === undefined) {
    status = 'Not Started';
  } else if (rounded >= 100) {
    status = 'Achieved';
  } else if (new Date() > new Date(targetDate)) {
    status = 'Overdue';
  } else if (rounded >= 60) {
    status = 'On Track';
  } else if (rounded > 0) {
    status = 'At Risk';
  }

  return { progressPercentage: rounded, status };
};

// @route   GET /api/v1/targets
const listTargets = async (req, res, next) => {
  try {
    const { status, metricId } = req.query;
    const query = {};

    if (req.organizationId) query.organizationId = req.organizationId;
    if (status && status !== 'all') query.status = status;
    if (metricId && metricId !== 'all') query.metricId = metricId;

    const targets = await EsgTarget.find(query)
      .populate('metricId', 'name unit categoryId')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: targets });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/targets/:id
const getTargetById = async (req, res, next) => {
  try {
    const target = await EsgTarget.findById(req.params.id)
      .populate({
        path: 'metricId',
        populate: { path: 'categoryId', select: 'name code color' }
      })
      .populate('createdBy', 'name email');

    if (!target) {
      return res.status(404).json({ success: false, message: 'Target not found' });
    }

    const progressHistory = await TargetProgress.find({ targetId: target._id })
      .populate('recordedBy', 'name email')
      .sort({ recordedAt: -1 });

    res.json({
      success: true,
      data: {
        target,
        progressHistory
      }
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/targets
const createTarget = async (req, res, next) => {
  try {
    const { metricId, targetName, baselineValue, targetValue, unit, direction, startDate, targetDate } = req.body;

    if (!metricId || !targetName || baselineValue === undefined || targetValue === undefined || !targetDate) {
      return res.status(400).json({
        success: false,
        message: 'Metric, Target Name, Baseline Value, Target Value, and Target Date are required'
      });
    }

    const metric = await EsgMetric.findById(metricId);
    if (!metric) {
      return res.status(404).json({ success: false, message: 'Metric not found' });
    }

    const orgId = req.organizationId || req.body.organizationId;
    const effectiveStartDate = startDate ? new Date(startDate) : new Date();

    const target = await EsgTarget.create({
      organizationId: orgId,
      metricId,
      targetName: targetName.trim(),
      baselineValue: Number(baselineValue),
      targetValue: Number(targetValue),
      currentValue: Number(baselineValue),
      progressPercentage: 0,
      unit: unit || metric.unit,
      direction: direction || (metric.preferredDirection === 'higher' ? 'higher_is_better' : 'lower_is_better'),
      startDate: effectiveStartDate,
      targetDate: new Date(targetDate),
      status: 'Not Started',
      createdBy: req.user._id
    });

    await logAuditAction({
      organizationId: orgId,
      actorId: req.user._id,
      resourceType: 'EsgTarget',
      resourceId: target._id,
      action: 'CREATE',
      newValue: target.toObject(),
      reason: `Target "${target.targetName}" created`
    });

    res.status(201).json({ success: true, data: target });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/v1/targets/:id
const updateTarget = async (req, res, next) => {
  try {
    const target = await EsgTarget.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Target not found' });
    }

    const prev = { ...target.toObject() };
    const allowed = ['targetName', 'targetValue', 'baselineValue', 'targetDate', 'startDate', 'direction'];
    allowed.forEach(f => {
      if (req.body[f] !== undefined) target[f] = req.body[f];
    });

    // Recompute health with updated values
    const health = calculateTargetHealth(
      target.baselineValue,
      target.targetValue,
      target.currentValue,
      target.direction,
      target.targetDate
    );
    target.progressPercentage = health.progressPercentage;
    target.status = health.status;

    await target.save();

    await logAuditAction({
      organizationId: target.organizationId,
      actorId: req.user._id,
      resourceType: 'EsgTarget',
      resourceId: target._id,
      action: 'UPDATE',
      previousValue: prev,
      newValue: target.toObject(),
      reason: 'Target parameters updated'
    });

    res.json({ success: true, data: target });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/targets/:id/progress
const recordTargetProgress = async (req, res, next) => {
  try {
    const { recordedValue, note } = req.body;
    if (recordedValue === undefined) {
      return res.status(400).json({ success: false, message: 'Recorded value is required' });
    }

    const target = await EsgTarget.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Target not found' });
    }

    const numValue = Number(recordedValue);
    target.currentValue = numValue;

    const health = calculateTargetHealth(
      target.baselineValue,
      target.targetValue,
      numValue,
      target.direction,
      target.targetDate
    );

    target.progressPercentage = health.progressPercentage;
    target.status = health.status;
    await target.save();

    const progressEntry = await TargetProgress.create({
      targetId: target._id,
      recordedValue: numValue,
      progressPercentage: health.progressPercentage,
      note: note || '',
      recordedBy: req.user._id,
      recordedAt: new Date()
    });

    res.status(201).json({
      success: true,
      data: {
        target,
        progressEntry
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listTargets,
  getTargetById,
  createTarget,
  updateTarget,
  recordTargetProgress
};
