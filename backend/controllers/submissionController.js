const EsgSubmission = require('../models/EsgSubmission');
const EsgData = require('../models/EsgData');
const EsgMetric = require('../models/EsgMetric');
const EsgTarget = require('../models/EsgTarget');
const TargetProgress = require('../models/TargetProgress');
const ValidationResult = require('../models/ValidationResult');
const { runValidationForSubmission } = require('../services/validationService');
const { logAuditAction } = require('../utils/auditLogger');

// @route   GET /api/v1/submissions
const listSubmissions = async (req, res, next) => {
  try {
    const { status, reportingPeriodId, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (req.organizationId) {
      query.organizationId = req.organizationId;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (reportingPeriodId && reportingPeriodId !== 'all') {
      query.reportingPeriodId = reportingPeriodId;
    }

    if (search) {
      query.$or = [
        { submissionName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [submissions, total] = await Promise.all([
      EsgSubmission.find(query)
        .populate('submittedBy', 'name email profileImage')
        .populate('reportingPeriodId', 'periodName startDate endDate')
        .populate('organizationId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      EsgSubmission.countDocuments(query)
    ]);

    // Attach item count to each submission
    const submissionIds = submissions.map(s => s._id);
    const itemCounts = await EsgData.aggregate([
      { $match: { submissionId: { $in: submissionIds } } },
      { $group: { _id: '$submissionId', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    itemCounts.forEach(c => { countMap[c._id.toString()] = c.count; });

    const formatted = submissions.map(sub => ({
      ...sub.toObject(),
      recordCount: countMap[sub._id.toString()] || 0
    }));

    res.json({
      success: true,
      data: formatted,
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

// @route   GET /api/v1/submissions/:id
const getSubmissionById = async (req, res, next) => {
  try {
    const submission = await EsgSubmission.findById(req.params.id)
      .populate('submittedBy', 'name email profileImage')
      .populate('reportingPeriodId', 'periodName startDate endDate')
      .populate('approvedBy', 'name email')
      .populate('organizationId', 'name industry');

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Check organization boundary
    if (req.organizationId && submission.organizationId._id.toString() !== req.organizationId.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied to this organization resource' });
    }

    const items = await EsgData.find({ submissionId: submission._id })
      .populate('metricId')
      .populate('categoryId')
      .sort({ createdAt: 1 });

    const validationResults = await ValidationResult.find({ submissionId: submission._id })
      .populate('ruleId')
      .populate('validatedBy', 'name');

    res.json({
      success: true,
      data: {
        submission,
        items,
        validationResults
      }
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/submissions
const createSubmission = async (req, res, next) => {
  try {
    const { submissionName, reportingPeriodId, description, source, items = [], isDraft = false } = req.body;

    if (!submissionName || !reportingPeriodId) {
      return res.status(400).json({
        success: false,
        message: 'Submission name and reporting period are required'
      });
    }

    const orgId = req.organizationId || req.body.organizationId;
    if (!orgId) {
      return res.status(400).json({ success: false, message: 'Organization is required' });
    }

    const isActuallyDraft = isDraft === true || isDraft === 'true';
    const status = isActuallyDraft ? 'draft' : 'submitted';

    const submission = await EsgSubmission.create({
      organizationId: orgId,
      reportingPeriodId,
      submittedBy: req.user._id,
      submissionName,
      source: source || 'Manual Entry',
      description: description || '',
      status,
      submittedAt: isActuallyDraft ? null : new Date()
    });

    // Insert associated metric records
    if (Array.isArray(items) && items.length > 0) {
      const dataRecords = items.map(item => ({
        submissionId: submission._id,
        organizationId: orgId,
        reportingPeriodId,
        submittedBy: req.user._id,
        metricId: item.metricId,
        categoryId: item.categoryId,
        value: Number(item.value),
        unit: item.unit,
        description: item.description || '',
        evidenceFiles: item.evidenceFiles || [],
        status
      }));

      await EsgData.insertMany(dataRecords);
    }

    // Non-destructive audit log
    await logAuditAction({
      organizationId: orgId,
      actorId: req.user._id,
      resourceType: 'EsgSubmission',
      resourceId: submission._id,
      action: isActuallyDraft ? 'DRAFT_CREATED' : 'SUBMITTED',
      newValue: { submissionName, status, itemsCount: items.length },
      reason: isActuallyDraft ? 'Draft submission initialized' : 'New ESG performance submission created and queued for validation'
    });

    res.status(201).json({
      success: true,
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/v1/submissions/:id
const updateSubmission = async (req, res, next) => {
  try {
    const submission = await EsgSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Only drafts or items requiring correction can be updated directly
    if (!['draft', 'requires_correction'].includes(submission.status)) {
      return res.status(400).json({
        success: false,
        message: `Submissions with status "${submission.status}" cannot be modified directly`
      });
    }

    const { submissionName, reportingPeriodId, description, source, items, isDraft } = req.body;
    const prev = { ...submission.toObject() };

    if (submissionName) submission.submissionName = submissionName.trim();
    if (reportingPeriodId) submission.reportingPeriodId = reportingPeriodId;
    if (description !== undefined) submission.description = description;
    if (source) submission.source = source;

    const isSubmitting = isDraft === false || isDraft === 'false';
    if (isSubmitting) {
      submission.status = 'submitted';
      submission.submittedAt = new Date();
      submission.validationStatus = 'pending';
    }

    await submission.save();

    // If items are provided, synchronize line items
    if (Array.isArray(items)) {
      await EsgData.deleteMany({ submissionId: submission._id });

      const itemStatus = isSubmitting ? 'submitted' : 'draft';
      const dataRecords = items
        .filter(item => item.metricId)
        .map(item => ({
          submissionId: submission._id,
          organizationId: submission.organizationId,
          reportingPeriodId: submission.reportingPeriodId,
          submittedBy: req.user._id,
          metricId: item.metricId,
          categoryId: item.categoryId,
          value: Number(item.value) || 0,
          unit: item.unit,
          description: item.description || '',
          evidenceFiles: item.evidenceFiles || [],
          status: itemStatus
        }));

      if (dataRecords.length > 0) {
        await EsgData.insertMany(dataRecords);
      }
    }

    await logAuditAction({
      organizationId: submission.organizationId,
      actorId: req.user._id,
      resourceType: 'EsgSubmission',
      resourceId: submission._id,
      action: isSubmitting ? 'SUBMITTED' : 'UPDATE',
      previousValue: prev,
      newValue: submission.toObject(),
      reason: isSubmitting ? 'Draft finalized and submitted for validation' : 'Draft submission updated'
    });

    res.json({ success: true, data: submission });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/submissions/:id/submit
const submitForReview = async (req, res, next) => {
  try {
    const submission = await EsgSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    if (!['draft', 'requires_correction'].includes(submission.status)) {
      return res.status(400).json({
        success: false,
        message: `Submission already in "${submission.status}" state`
      });
    }

    submission.status = 'submitted';
    submission.submittedAt = new Date();
    submission.validationStatus = 'pending';
    await submission.save();

    // Update all associated data items
    await EsgData.updateMany({ submissionId: submission._id }, { status: 'submitted' });

    res.json({
      success: true,
      message: 'Submission successfully submitted and sent to validation queue',
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/submissions/:id/approve
const approveSubmission = async (req, res, next) => {
  try {
    const submission = await EsgSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Rules: Failed validation records or corrections cannot be approved
    if (submission.validationStatus === 'failed' || submission.status === 'requires_correction') {
      return res.status(400).json({
        success: false,
        message: 'Cannot approve submission: Validation has unresolved blocking errors'
      });
    }

    const prevStatus = submission.status;
    submission.status = 'approved';
    submission.approvedBy = req.user._id;
    submission.approvedAt = new Date();
    await submission.save();

    // Mark all associated items as approved so they become eligible for Analytics and Reports!
    await EsgData.updateMany({ submissionId: submission._id }, { status: 'approved' });

    // Sync with targets: update current values of targets for metrics included in this submission
    const approvedItems = await EsgData.find({ submissionId: submission._id });
    for (const item of approvedItems) {
      const target = await EsgTarget.findOne({
        organizationId: submission.organizationId,
        metricId: item.metricId
      });

      if (target) {
        target.currentValue = item.value;
        const baseline = target.baselineValue;
        const targetVal = target.targetValue;
        const current = item.value;

        // Calculate progress percentage
        let progress = 0;
        if (target.direction === 'lower_is_better') {
          if (baseline !== targetVal) {
            progress = ((baseline - current) / (baseline - targetVal)) * 100;
          }
        } else {
          if (targetVal !== baseline) {
            progress = ((current - baseline) / (targetVal - baseline)) * 100;
          }
        }

        target.progressPercentage = Math.round(progress * 10) / 10;

        // Calculate health status
        if (target.progressPercentage >= 100) {
          target.status = 'Achieved';
        } else if (new Date() > new Date(target.targetDate)) {
          target.status = 'Overdue';
        } else if (target.progressPercentage >= 60) {
          target.status = 'On Track';
        } else if (target.progressPercentage > 0) {
          target.status = 'At Risk';
        } else {
          target.status = 'Not Started';
        }

        await target.save();

        // Record target progress entry
        await TargetProgress.create({
          targetId: target._id,
          recordedValue: current,
          progressPercentage: target.progressPercentage,
          note: `Auto-updated from approved submission ${submission.submissionName}`,
          recordedBy: req.user._id,
          recordedAt: new Date()
        });
      }
    }

    await logAuditAction({
      organizationId: submission.organizationId,
      actorId: req.user._id,
      resourceType: 'EsgSubmission',
      resourceId: submission._id,
      action: 'APPROVE',
      previousValue: { status: prevStatus },
      newValue: { status: 'approved', approvedBy: req.user._id },
      reason: req.body.reason || 'Approved by authorized organization administrator'
    });

    res.json({
      success: true,
      message: 'Submission successfully approved and marked eligible for reporting/analytics',
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/submissions/:id/reject
const rejectSubmission = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, message: 'A rejection reason is required' });
    }

    const submission = await EsgSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    const prevStatus = submission.status;
    submission.status = 'requires_correction';
    submission.rejectionReason = reason;
    await submission.save();

    await EsgData.updateMany({ submissionId: submission._id }, { status: 'requires_correction' });

    await logAuditAction({
      organizationId: submission.organizationId,
      actorId: req.user._id,
      resourceType: 'EsgSubmission',
      resourceId: submission._id,
      action: 'REJECT',
      previousValue: { status: prevStatus },
      newValue: { status: 'requires_correction', rejectionReason: reason },
      reason
    });

    res.json({
      success: true,
      message: 'Submission returned for correction',
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/submissions/:id/data
const addOrUpdateDataItem = async (req, res, next) => {
  try {
    const submission = await EsgSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    const { metricId, categoryId, value, unit, description, evidenceFiles, dataId } = req.body;

    if (!metricId || value === undefined) {
      return res.status(400).json({ success: false, message: 'Metric and value are required' });
    }

    const metric = await EsgMetric.findById(metricId);
    if (!metric) {
      return res.status(404).json({ success: false, message: 'Metric not found' });
    }

    let record;
    if (dataId) {
      record = await EsgData.findById(dataId);
      if (!record) return res.status(404).json({ success: false, message: 'Data record not found' });
      record.value = Number(value);
      record.unit = unit || metric.unit;
      if (description !== undefined) record.description = description;
      if (evidenceFiles) record.evidenceFiles = evidenceFiles;
      await record.save();
    } else {
      record = await EsgData.create({
        submissionId: submission._id,
        organizationId: submission.organizationId,
        reportingPeriodId: submission.reportingPeriodId,
        submittedBy: req.user._id,
        metricId,
        categoryId: categoryId || metric.categoryId,
        value: Number(value),
        unit: unit || metric.unit,
        description: description || '',
        evidenceFiles: evidenceFiles || [],
        status: submission.status === 'approved' ? 'approved' : 'draft'
      });
    }

    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/v1/submissions/:id/data/:dataId
const deleteDataItem = async (req, res, next) => {
  try {
    const record = await EsgData.findOne({ _id: req.params.dataId, submissionId: req.params.id });
    if (!record) {
      return res.status(404).json({ success: false, message: 'Data record not found' });
    }
    await record.deleteOne();
    res.json({ success: true, message: 'Metric record removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listSubmissions,
  getSubmissionById,
  createSubmission,
  updateSubmission,
  submitForReview,
  approveSubmission,
  rejectSubmission,
  addOrUpdateDataItem,
  deleteDataItem
};
