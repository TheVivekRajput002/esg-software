const EsgReport = require('../models/EsgReport');
const EsgData = require('../models/EsgData');
const EsgTarget = require('../models/EsgTarget');
const ReportingPeriod = require('../models/ReportingPeriod');
const Organization = require('../models/Organization');
const { logAuditAction } = require('../utils/auditLogger');

// @route   GET /api/v1/reports
const listReports = async (req, res, next) => {
  try {
    const query = {};
    if (req.organizationId) query.organizationId = req.organizationId;
    if (req.query.periodId) query.periodId = req.query.periodId;

    const reports = await EsgReport.find(query)
      .populate('periodId', 'periodName startDate endDate')
      .populate('generatedBy', 'name email')
      .populate('organizationId', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/reports/generate
const generateReport = async (req, res, next) => {
  try {
    const { reportName, reportType, periodId, sections = [], format = 'json' } = req.body;

    if (!reportName || !periodId) {
      return res.status(400).json({ success: false, message: 'Report name and reporting period are required' });
    }

    const orgId = req.organizationId || req.body.organizationId;
    const organization = await Organization.findById(orgId);
    const period = await ReportingPeriod.findById(periodId);

    if (!organization || !period) {
      return res.status(404).json({ success: false, message: 'Organization or Reporting Period not found' });
    }

    // CRITICAL: Fetch ONLY approved records for official reports!
    const approvedData = await EsgData.find({
      organizationId: orgId,
      reportingPeriodId: periodId,
      status: 'approved'
    }).populate('metricId').populate('categoryId');

    // Aggregate category summaries
    const environmentalItems = approvedData.filter(d => d.categoryId?.code === 'environmental');
    const socialItems = approvedData.filter(d => d.categoryId?.code === 'social');
    const governanceItems = approvedData.filter(d => d.categoryId?.code === 'governance');

    // Fetch targets status
    const targets = await EsgTarget.find({ organizationId: orgId }).populate('metricId', 'name unit');

    const summaryData = {
      organization: {
        name: organization.name,
        industry: organization.industry,
        country: organization.country
      },
      reportingPeriod: period.periodName,
      generatedAt: new Date().toISOString(),
      recordCounts: {
        totalApproved: approvedData.length,
        environmental: environmentalItems.length,
        social: socialItems.length,
        governance: governanceItems.length
      },
      environmentalDetails: environmentalItems.map(i => ({
        metric: i.metricId?.name,
        value: i.value,
        unit: i.unit
      })),
      socialDetails: socialItems.map(i => ({
        metric: i.metricId?.name,
        value: i.value,
        unit: i.unit
      })),
      governanceDetails: governanceItems.map(i => ({
        metric: i.metricId?.name,
        value: i.value,
        unit: i.unit
      })),
      targetsSummary: targets.map(t => ({
        targetName: t.targetName,
        metric: t.metricId?.name,
        targetValue: t.targetValue,
        currentValue: t.currentValue,
        unit: t.unit,
        progress: t.progressPercentage,
        status: t.status
      }))
    };

    const report = await EsgReport.create({
      organizationId: orgId,
      periodId,
      reportName: reportName.trim(),
      reportType: reportType || 'Comprehensive ESG',
      format,
      sections: sections.length > 0 ? sections : ['Executive Summary', 'Environmental', 'Social', 'Governance', 'Targets'],
      generatedBy: req.user._id,
      status: 'completed',
      summaryData
    });

    await logAuditAction({
      organizationId: orgId,
      actorId: req.user._id,
      resourceType: 'EsgReport',
      resourceId: report._id,
      action: 'CREATE',
      newValue: { reportName: report.reportName, recordCount: approvedData.length },
      reason: `Official ESG report generated for ${period.periodName}`
    });

    res.status(201).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/reports/:id
const getReportById = async (req, res, next) => {
  try {
    const report = await EsgReport.findById(req.params.id)
      .populate('periodId', 'periodName startDate endDate')
      .populate('generatedBy', 'name email')
      .populate('organizationId', 'name industry country');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/reports/:id/download
const downloadReport = async (req, res, next) => {
  try {
    const report = await EsgReport.findById(req.params.id)
      .populate('periodId', 'periodName')
      .populate('organizationId', 'name');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const filename = `${report.reportName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${report.periodId?.periodName || 'period'}.json`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(report.summaryData, null, 2));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listReports,
  generateReport,
  getReportById,
  downloadReport
};
