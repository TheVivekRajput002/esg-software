const mongoose = require('mongoose');
const ValidationRule = require('../models/ValidationRule');
const ValidationResult = require('../models/ValidationResult');
const EsgSubmission = require('../models/EsgSubmission');
const EsgData = require('../models/EsgData');
const { logAuditAction } = require('../utils/auditLogger');
const { runValidationForSubmission } = require('../services/validationService');

// @route   GET /api/v1/validation/queue
const getValidationQueue = async (req, res, next) => {
  try {
    const { status = 'all', search = '' } = req.query;
    const orgId = req.organizationId;
    const baseQuery = {};
    if (orgId) baseQuery.organizationId = orgId;

    // Filter statuses
    if (status === 'pending') {
      baseQuery.status = { $in: ['submitted', 'in_validation'] };
    } else if (status === 'validated') {
      baseQuery.status = 'validated';
    } else if (status === 'requires_correction') {
      baseQuery.status = 'requires_correction';
    } else if (status !== 'all') {
      baseQuery.status = status;
    } else {
      // For 'all', show submissions in review cycle
      baseQuery.status = { $ne: 'draft' };
    }

    if (search) {
      baseQuery.submissionName = { $regex: search, $options: 'i' };
    }

    const submissions = await EsgSubmission.find(baseQuery)
      .populate('submittedBy', 'name email')
      .populate('validatedBy', 'name email')
      .populate('reportingPeriodId', 'periodName startDate endDate status')
      .sort({ updatedAt: -1 });

    // Aggregate counts and items for each submission
    const enriched = await Promise.all(
      submissions.map(async (sub) => {
        const items = await EsgData.find({ submissionId: sub._id })
          .populate('metricId', 'name unit')
          .populate('categoryId', 'name');
        
        const validatedItemsCount = items.filter(it => it.status === 'validated' || it.isValidated).length;

        return {
          ...sub.toObject(),
          totalItems: items.length,
          validatedItemsCount,
          items
        };
      })
    );

    // Compute overview stats for the organization
    const orgFilter = orgId ? { organizationId: orgId } : {};
    const pendingCount = await EsgSubmission.countDocuments({
      ...orgFilter,
      status: { $in: ['submitted', 'in_validation'] }
    });
    const validatedCount = await EsgSubmission.countDocuments({
      ...orgFilter,
      status: 'validated'
    });
    const correctionCount = await EsgSubmission.countDocuments({
      ...orgFilter,
      status: 'requires_correction'
    });
    const totalItemsVerified = await EsgData.countDocuments({
      ...orgFilter,
      status: { $in: ['validated', 'approved'] }
    });

    res.json({
      success: true,
      data: {
        submissions: enriched,
        stats: {
          pendingCount,
          validatedCount,
          correctionCount,
          totalItemsVerified
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/validation/submission/:id
const getSubmissionForValidation = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid submission ID format' });
    }

    const submission = await EsgSubmission.findById(req.params.id)
      .populate('submittedBy', 'name email')
      .populate('validatedBy', 'name email')
      .populate('reportingPeriodId', 'periodName startDate endDate status');

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    const items = await EsgData.find({ submissionId: submission._id })
      .populate('metricId', 'name unit code categoryId')
      .populate('categoryId', 'name code')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: {
        submission,
        items
      }
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/validation/submission/:id/confirm
const confirmSubmissionValidation = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid submission ID format' });
    }

    const submission = await EsgSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    const { validatorNotes = '', itemIds } = req.body;
    const prevStatus = submission.status;

    submission.status = 'validated';
    submission.validationStatus = 'passed';
    submission.validatedBy = req.user._id;
    submission.validatedAt = new Date();
    submission.validationNotes = validatorNotes;
    submission.rejectionReason = '';
    await submission.save();

    const itemQuery = { submissionId: submission._id };
    if (Array.isArray(itemIds) && itemIds.length > 0) {
      itemQuery._id = { $in: itemIds };
    }

    await EsgData.updateMany(itemQuery, {
      status: 'validated',
      isValidated: true,
      validatedBy: req.user._id,
      validatedAt: new Date(),
      validatorNote: validatorNotes
    });

    await logAuditAction({
      organizationId: submission.organizationId,
      actorId: req.user._id,
      resourceType: 'EsgSubmission',
      resourceId: submission._id,
      action: 'MANUAL_VALIDATION_COMPLETED',
      previousValue: { status: prevStatus },
      newValue: { status: 'validated', validatedBy: req.user._id, validatedAt: new Date() },
      reason: validatorNotes || 'All metric lines manually inspected and ticked as validated'
    });

    res.json({
      success: true,
      message: 'Submission successfully inspected and ticked as validated',
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/validation/submission/:id/flag
const flagSubmissionCorrection = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid submission ID format' });
    }

    const { reason = '' } = req.body;
    if (!reason.trim()) {
      return res.status(400).json({ success: false, message: 'Reason for flagging correction is required' });
    }

    const submission = await EsgSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    const prevStatus = submission.status;
    submission.status = 'requires_correction';
    submission.validationStatus = 'failed';
    submission.rejectionReason = reason;
    await submission.save();

    await EsgData.updateMany({ submissionId: submission._id }, { status: 'requires_correction' });

    await logAuditAction({
      organizationId: submission.organizationId,
      actorId: req.user._id,
      resourceType: 'EsgSubmission',
      resourceId: submission._id,
      action: 'VALIDATION_RETURNED_FOR_CORRECTION',
      previousValue: { status: prevStatus },
      newValue: { status: 'requires_correction', rejectionReason: reason },
      reason
    });

    res.json({
      success: true,
      message: 'Submission flagged and returned for correction',
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/validation/item/:dataId/toggle
const toggleItemValidation = async (req, res, next) => {
  try {
    const { isValidated, note } = req.body;
    const item = await EsgData.findById(req.params.dataId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Data item not found' });
    }

    item.isValidated = isValidated !== undefined ? isValidated : !item.isValidated;
    item.status = item.isValidated ? 'validated' : 'submitted';
    item.validatedBy = item.isValidated ? req.user._id : null;
    item.validatedAt = item.isValidated ? new Date() : null;
    if (note !== undefined) item.validatorNote = note;

    await item.save();

    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/validation/run
const runValidation = async (req, res, next) => {
  try {
    const { submissionId } = req.body;
    if (!submissionId) {
      return res.status(400).json({ success: false, message: 'submissionId is required' });
    }

    const submission = await EsgSubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    const result = await runValidationForSubmission(submissionId, req.user._id, submission.organizationId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/validation/results/:id
const getValidationResults = async (req, res, next) => {
  try {
    const results = await ValidationResult.find({ submissionId: req.params.id })
      .populate('ruleId')
      .populate('dataId')
      .populate('validatedBy', 'name email');

    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/validation/rules
const listValidationRules = async (req, res, next) => {
  try {
    const query = {
      $or: [{ organizationId: req.organizationId }, { organizationId: null }]
    };

    if (req.query.metricId) {
      query.metricId = req.query.metricId;
    }

    const rules = await ValidationRule.find(query)
      .populate('metricId', 'name unit')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: rules });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/validation/rules
const createValidationRule = async (req, res, next) => {
  try {
    const { metricId, name, ruleType, condition, severity, errorMessage, isActive } = req.body;

    if (!metricId || !name || !ruleType) {
      return res.status(400).json({
        success: false,
        message: 'Metric, Rule Name, and Rule Type are required'
      });
    }

    const rule = await ValidationRule.create({
      organizationId: req.organizationId || null,
      metricId,
      name,
      ruleType,
      condition: condition || {},
      severity: severity || 'error',
      errorMessage: errorMessage || '',
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/v1/validation/rules/:id
const updateValidationRule = async (req, res, next) => {
  try {
    const rule = await ValidationRule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Validation rule not found' });
    }

    const fields = ['name', 'condition', 'severity', 'errorMessage', 'isActive', 'ruleType'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) rule[f] = req.body[f];
    });

    await rule.save();
    res.json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getValidationQueue,
  getSubmissionForValidation,
  confirmSubmissionValidation,
  flagSubmissionCorrection,
  toggleItemValidation,
  runValidation,
  getValidationResults,
  listValidationRules,
  createValidationRule,
  updateValidationRule
};
