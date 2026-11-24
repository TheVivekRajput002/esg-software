const EsgData = require('../models/EsgData');
const EsgMetric = require('../models/EsgMetric');
const EsgCategory = require('../models/EsgCategory');
const EsgTarget = require('../models/EsgTarget');
const ReportingPeriod = require('../models/ReportingPeriod');

// Helper to compute aggregation based on metric calculationMethod
const aggregateValues = (values, method = 'sum') => {
  if (!values || values.length === 0) return 0;
  switch (method) {
    case 'sum':
      return Math.round(values.reduce((acc, v) => acc + v, 0) * 100) / 100;
    case 'average':
    case 'percentage':
      return Math.round((values.reduce((acc, v) => acc + v, 0) / values.length) * 100) / 100;
    case 'count':
      return values.length;
    case 'latest':
      return values[values.length - 1];
    default:
      return Math.round(values.reduce((acc, v) => acc + v, 0) * 100) / 100;
  }
};

// @route   GET /api/v1/analytics/overview
const getAnalyticsOverview = async (req, res, next) => {
  try {
    const { reportingPeriodId } = req.query;
    const query = { status: 'approved' };

    if (req.organizationId) {
      query.organizationId = req.organizationId;
    }

    if (reportingPeriodId && reportingPeriodId !== 'all') {
      query.reportingPeriodId = reportingPeriodId;
    }

    const [approvedData, targets] = await Promise.all([
      EsgData.find(query)
        .populate('metricId')
        .populate('categoryId')
        .populate('reportingPeriodId', 'periodName startDate'),
      EsgTarget.find(req.organizationId ? { organizationId: req.organizationId } : {})
        .populate('metricId', 'name categoryId unit')
        .sort({ createdAt: -1 })
    ]);

    // Build target lookups
    const targetMapByMetricId = {};
    const targetMapByMetricName = {};
    targets.forEach(t => {
      if (t.metricId) {
        const idStr = t.metricId._id ? t.metricId._id.toString() : t.metricId.toString();
        targetMapByMetricId[idStr] = t;
        if (t.metricId.name) {
          targetMapByMetricName[t.metricId.name.toLowerCase().trim()] = t;
        }
      }
    });

    // Group by category and metric
    const categoryBreakdown = {
      environmental: { title: 'Environmental', count: 0, metrics: {} },
      social: { title: 'Social', count: 0, metrics: {} },
      governance: { title: 'Governance', count: 0, metrics: {} }
    };

    approvedData.forEach(item => {
      const catCode = item.categoryId ? item.categoryId.code : 'environmental';
      if (!categoryBreakdown[catCode]) {
        categoryBreakdown[catCode] = { title: item.categoryId?.name || catCode, count: 0, metrics: {} };
      }

      categoryBreakdown[catCode].count += 1;

      const metricName = item.metricId?.name || 'Unknown';
      if (!categoryBreakdown[catCode].metrics[metricName]) {
        categoryBreakdown[catCode].metrics[metricName] = {
          metricId: item.metricId?._id,
          name: metricName,
          unit: item.unit,
          calculationMethod: item.metricId?.calculationMethod || 'sum',
          values: []
        };
      }

      categoryBreakdown[catCode].metrics[metricName].values.push(item.value);
    });

    // Compute aggregated value for each metric and link target
    const formattedCategories = Object.keys(categoryBreakdown).map(key => {
      const cat = categoryBreakdown[key];
      const metricList = Object.values(cat.metrics).map(m => {
        const idStr = m.metricId ? m.metricId.toString() : '';
        const targetObj = (idStr && targetMapByMetricId[idStr]) || targetMapByMetricName[m.name.toLowerCase().trim()];
        const actualVal = aggregateValues(m.values, m.calculationMethod);

        return {
          name: m.name,
          unit: m.unit,
          value: actualVal,
          entries: m.values.length,
          target: targetObj ? {
            targetId: targetObj._id,
            targetName: targetObj.targetName,
            targetValue: targetObj.targetValue,
            baselineValue: targetObj.baselineValue,
            currentValue: targetObj.currentValue !== null ? targetObj.currentValue : actualVal,
            progressPercentage: targetObj.progressPercentage,
            status: targetObj.status,
            direction: targetObj.direction,
            targetDate: targetObj.targetDate
          } : null
        };
      });

      return {
        key,
        title: cat.title,
        recordCount: cat.count,
        metrics: metricList
      };
    });

    // Format targets list and health statistics
    const targetsList = targets.map(t => ({
      _id: t._id,
      targetName: t.targetName,
      metricName: t.metricId?.name || 'General Metric',
      baselineValue: t.baselineValue,
      currentValue: t.currentValue !== null ? t.currentValue : t.baselineValue,
      targetValue: t.targetValue,
      progressPercentage: t.progressPercentage || 0,
      unit: t.unit,
      status: t.status,
      direction: t.direction,
      targetDate: t.targetDate
    }));

    const targetStats = {
      total: targets.length,
      achieved: targets.filter(t => t.status === 'Achieved').length,
      onTrack: targets.filter(t => t.status === 'On Track').length,
      atRisk: targets.filter(t => t.status === 'At Risk').length,
      overdue: targets.filter(t => t.status === 'Overdue').length,
      notStarted: targets.filter(t => t.status === 'Not Started').length
    };

    // Pillar comparison for radar/bar charts
    const pillarComparison = [
      { pillar: 'Environmental', records: categoryBreakdown.environmental?.count || 0, compliance: 94 },
      { pillar: 'Social', records: categoryBreakdown.social?.count || 0, compliance: 88 },
      { pillar: 'Governance', records: categoryBreakdown.governance?.count || 0, compliance: 96 }
    ];

    res.json({
      success: true,
      data: {
        totalApprovedRecords: approvedData.length,
        categories: formattedCategories,
        pillarComparison,
        targetsList,
        targetStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/analytics/environmental
const getEnvironmentalAnalytics = async (req, res, next) => {
  try {
    const cat = await EsgCategory.findOne({ code: 'environmental' });
    if (!cat) return res.json({ success: true, data: [] });

    const query = { status: 'approved', categoryId: cat._id };
    if (req.organizationId) query.organizationId = req.organizationId;
    if (req.query.reportingPeriodId && req.query.reportingPeriodId !== 'all') {
      query.reportingPeriodId = req.query.reportingPeriodId;
    }

    const [data, targets] = await Promise.all([
      EsgData.find(query)
        .populate('metricId')
        .populate('reportingPeriodId', 'periodName startDate')
        .sort({ createdAt: 1 }),
      EsgTarget.find(req.organizationId ? { organizationId: req.organizationId } : {})
        .populate('metricId', 'name')
    ]);

    const targetMap = {};
    targets.forEach(t => {
      if (t.metricId?._id) targetMap[t.metricId._id.toString()] = t;
      if (t.metricId?.name) targetMap[t.metricId.name.toLowerCase().trim()] = t;
    });

    // Group by metric and format for Recharts
    const metricGroups = {};
    data.forEach(d => {
      const name = d.metricId?.name || 'General Metric';
      if (!metricGroups[name]) {
        metricGroups[name] = {
          metricId: d.metricId?._id,
          metric: name,
          unit: d.unit,
          calculationMethod: d.metricId?.calculationMethod || 'sum',
          values: [],
          timeline: []
        };
      }
      metricGroups[name].values.push(d.value);
      metricGroups[name].timeline.push({
        period: d.reportingPeriodId?.periodName || 'N/A',
        value: d.value
      });
    });

    const metricsSummary = Object.values(metricGroups).map(g => {
      const idStr = g.metricId ? g.metricId.toString() : '';
      const targetObj = (idStr && targetMap[idStr]) || targetMap[g.metric.toLowerCase().trim()];
      return {
        metric: g.metric,
        unit: g.unit,
        aggregatedValue: aggregateValues(g.values, g.calculationMethod),
        timeline: g.timeline,
        target: targetObj ? {
          targetId: targetObj._id,
          targetName: targetObj.targetName,
          targetValue: targetObj.targetValue,
          progressPercentage: targetObj.progressPercentage,
          status: targetObj.status,
          direction: targetObj.direction
        } : null
      };
    });

    res.json({ success: true, data: metricsSummary });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/analytics/social
const getSocialAnalytics = async (req, res, next) => {
  try {
    const cat = await EsgCategory.findOne({ code: 'social' });
    if (!cat) return res.json({ success: true, data: [] });

    const query = { status: 'approved', categoryId: cat._id };
    if (req.organizationId) query.organizationId = req.organizationId;
    if (req.query.reportingPeriodId && req.query.reportingPeriodId !== 'all') {
      query.reportingPeriodId = req.query.reportingPeriodId;
    }

    const [data, targets] = await Promise.all([
      EsgData.find(query)
        .populate('metricId')
        .populate('reportingPeriodId', 'periodName startDate')
        .sort({ createdAt: 1 }),
      EsgTarget.find(req.organizationId ? { organizationId: req.organizationId } : {})
        .populate('metricId', 'name')
    ]);

    const targetMap = {};
    targets.forEach(t => {
      if (t.metricId?._id) targetMap[t.metricId._id.toString()] = t;
      if (t.metricId?.name) targetMap[t.metricId.name.toLowerCase().trim()] = t;
    });

    const metricGroups = {};
    data.forEach(d => {
      const name = d.metricId?.name || 'General Metric';
      if (!metricGroups[name]) {
        metricGroups[name] = {
          metricId: d.metricId?._id,
          metric: name,
          unit: d.unit,
          calculationMethod: d.metricId?.calculationMethod || 'average',
          values: [],
          timeline: []
        };
      }
      metricGroups[name].values.push(d.value);
      metricGroups[name].timeline.push({
        period: d.reportingPeriodId?.periodName || 'N/A',
        value: d.value
      });
    });

    const metricsSummary = Object.values(metricGroups).map(g => {
      const idStr = g.metricId ? g.metricId.toString() : '';
      const targetObj = (idStr && targetMap[idStr]) || targetMap[g.metric.toLowerCase().trim()];
      return {
        metric: g.metric,
        unit: g.unit,
        aggregatedValue: aggregateValues(g.values, g.calculationMethod),
        timeline: g.timeline,
        target: targetObj ? {
          targetId: targetObj._id,
          targetName: targetObj.targetName,
          targetValue: targetObj.targetValue,
          progressPercentage: targetObj.progressPercentage,
          status: targetObj.status,
          direction: targetObj.direction
        } : null
      };
    });

    res.json({ success: true, data: metricsSummary });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/analytics/governance
const getGovernanceAnalytics = async (req, res, next) => {
  try {
    const cat = await EsgCategory.findOne({ code: 'governance' });
    if (!cat) return res.json({ success: true, data: [] });

    const query = { status: 'approved', categoryId: cat._id };
    if (req.organizationId) query.organizationId = req.organizationId;
    if (req.query.reportingPeriodId && req.query.reportingPeriodId !== 'all') {
      query.reportingPeriodId = req.query.reportingPeriodId;
    }

    const [data, targets] = await Promise.all([
      EsgData.find(query)
        .populate('metricId')
        .populate('reportingPeriodId', 'periodName startDate')
        .sort({ createdAt: 1 }),
      EsgTarget.find(req.organizationId ? { organizationId: req.organizationId } : {})
        .populate('metricId', 'name')
    ]);

    const targetMap = {};
    targets.forEach(t => {
      if (t.metricId?._id) targetMap[t.metricId._id.toString()] = t;
      if (t.metricId?.name) targetMap[t.metricId.name.toLowerCase().trim()] = t;
    });

    const metricGroups = {};
    data.forEach(d => {
      const name = d.metricId?.name || 'General Metric';
      if (!metricGroups[name]) {
        metricGroups[name] = {
          metricId: d.metricId?._id,
          metric: name,
          unit: d.unit,
          calculationMethod: d.metricId?.calculationMethod || 'percentage',
          values: [],
          timeline: []
        };
      }
      metricGroups[name].values.push(d.value);
      metricGroups[name].timeline.push({
        period: d.reportingPeriodId?.periodName || 'N/A',
        value: d.value
      });
    });

    const metricsSummary = Object.values(metricGroups).map(g => {
      const idStr = g.metricId ? g.metricId.toString() : '';
      const targetObj = (idStr && targetMap[idStr]) || targetMap[g.metric.toLowerCase().trim()];
      return {
        metric: g.metric,
        unit: g.unit,
        aggregatedValue: aggregateValues(g.values, g.calculationMethod),
        timeline: g.timeline,
        target: targetObj ? {
          targetId: targetObj._id,
          targetName: targetObj.targetName,
          targetValue: targetObj.targetValue,
          progressPercentage: targetObj.progressPercentage,
          status: targetObj.status,
          direction: targetObj.direction
        } : null
      };
    });

    res.json({ success: true, data: metricsSummary });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/analytics/metrics/:id/trends
const getMetricTrends = async (req, res, next) => {
  try {
    const query = { status: 'approved', metricId: req.params.id };
    if (req.organizationId) query.organizationId = req.organizationId;

    const data = await EsgData.find(query)
      .populate('reportingPeriodId', 'periodName startDate endDate')
      .populate('metricId', 'name unit calculationMethod')
      .sort({ 'reportingPeriodId.startDate': 1 });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/analytics/export
const exportAnalytics = async (req, res, next) => {
  try {
    // Generates clean CSV or JSON snapshot of approved data
    const query = { status: 'approved' };
    if (req.organizationId) query.organizationId = req.organizationId;

    const approvedData = await EsgData.find(query)
      .populate('metricId', 'name unit')
      .populate('categoryId', 'name')
      .populate('reportingPeriodId', 'periodName');

    const rows = approvedData.map(d => ({
      category: d.categoryId?.name || '',
      metric: d.metricId?.name || '',
      value: d.value,
      unit: d.unit,
      period: d.reportingPeriodId?.periodName || '',
      date: d.createdAt
    }));

    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalyticsOverview,
  getEnvironmentalAnalytics,
  getSocialAnalytics,
  getGovernanceAnalytics,
  getMetricTrends,
  exportAnalytics
};
