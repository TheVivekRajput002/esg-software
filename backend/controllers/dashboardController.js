const EsgSubmission = require('../models/EsgSubmission');
const EsgData = require('../models/EsgData');
const EsgTarget = require('../models/EsgTarget');
const AuditFinding = require('../models/AuditFinding');
const ReportingPeriod = require('../models/ReportingPeriod');
const Organization = require('../models/Organization');

// @route   GET /api/v1/dashboard/overview
const getDashboardOverview = async (req, res, next) => {
  try {
    const orgFilter = req.organizationId ? { organizationId: req.organizationId } : {};

    // Get current/active reporting period
    const currentPeriod = await ReportingPeriod.findOne({
      ...orgFilter,
      isCurrent: true
    }) || await ReportingPeriod.findOne({ ...orgFilter }).sort({ startDate: -1 });

    const periodFilter = currentPeriod ? { reportingPeriodId: currentPeriod._id } : {};

    // 1. Submissions breakdown
    const [totalSubmissions, approvedCount, pendingCount, correctionCount] = await Promise.all([
      EsgSubmission.countDocuments({ ...orgFilter }),
      EsgSubmission.countDocuments({ ...orgFilter, status: 'approved' }),
      EsgSubmission.countDocuments({ ...orgFilter, status: { $in: ['submitted', 'in_validation', 'validated', 'in_audit'] } }),
      EsgSubmission.countDocuments({ ...orgFilter, status: 'requires_correction' })
    ]);

    // 2. Targets overview
    const [totalTargets, onTrackTargets, atRiskTargets, achievedTargets] = await Promise.all([
      EsgTarget.countDocuments({ ...orgFilter }),
      EsgTarget.countDocuments({ ...orgFilter, status: 'On Track' }),
      EsgTarget.countDocuments({ ...orgFilter, status: 'At Risk' }),
      EsgTarget.countDocuments({ ...orgFilter, status: 'Achieved' })
    ]);

    // 3. Open Audit Findings
    const openFindingsCount = await AuditFinding.countDocuments({
      ...orgFilter,
      status: { $in: ['open', 'in_review'] }
    });

    // 4. Recent Submissions
    const recentSubmissions = await EsgSubmission.find({ ...orgFilter })
      .populate('submittedBy', 'name email')
      .populate('reportingPeriodId', 'periodName')
      .sort({ createdAt: -1 })
      .limit(5);

    // 5. Approved ESG Metrics Highlights for current period
    const approvedData = await EsgData.find({
      ...orgFilter,
      ...periodFilter,
      status: 'approved'
    }).populate('metricId').populate('categoryId');

    // Aggregate category totals
    const categoryTotals = {
      environmental: 0,
      social: 0,
      governance: 0
    };

    approvedData.forEach(item => {
      if (item.categoryId && item.categoryId.code) {
        categoryTotals[item.categoryId.code] = (categoryTotals[item.categoryId.code] || 0) + 1;
      }
    });

    // Recent Targets summary
    const targets = await EsgTarget.find({ ...orgFilter })
      .populate('metricId', 'name unit')
      .sort({ updatedAt: -1 })
      .limit(4);

    res.json({
      success: true,
      data: {
        activePeriod: currentPeriod ? currentPeriod.periodName : 'FY 2026–27',
        metrics: {
          totalSubmissions,
          approvedCount,
          pendingCount,
          correctionCount,
          targets: {
            total: totalTargets,
            onTrack: onTrackTargets,
            atRisk: atRiskTargets,
            achieved: achievedTargets
          },
          openFindingsCount
        },
        categoryRecordCounts: categoryTotals,
        recentSubmissions,
        targets
      }
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/dashboard/trends
const getDashboardTrends = async (req, res, next) => {
  try {
    const orgFilter = req.organizationId ? { organizationId: req.organizationId } : {};

    // Trend of approved submissions over recent months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const submissionsTrend = await EsgSubmission.aggregate([
      { $match: { ...orgFilter, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          total: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          corrections: { $sum: { $cond: [{ $eq: ['$status', 'requires_correction'] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: submissionsTrend
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardOverview,
  getDashboardTrends
};
