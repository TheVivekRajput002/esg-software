const EsgReport = require('../models/EsgReport');
const EsgData = require('../models/EsgData');
const EsgTarget = require('../models/EsgTarget');
const ReportingPeriod = require('../models/ReportingPeriod');
const Organization = require('../models/Organization');
const { logAuditAction } = require('../utils/auditLogger');

// Helper to construct exact formatted Markdown report
const buildMarkdownReport = ({
  organization,
  period,
  user,
  environmentalItems = [],
  socialItems = [],
  governanceItems = [],
  targets = [],
  reportName
}) => {
  const currentYear = period?.periodName?.match(/\d{4}/)?.[0] || '2026';
  const nextYear = String(parseInt(currentYear, 10) + 1);
  const orgName = organization?.name || '[Company Name]';
  const authorName = user?.name || 'Vivek Rajput';
  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const findMetric = (items, keywords) => {
    return items.find(it => {
      const name = (it.metric || it.metricId?.name || '').toLowerCase();
      const code = (it.metricCode || it.metricId?.code || '').toLowerCase();
      return keywords.some(k => name.includes(k) || code.includes(k));
    });
  };

  // Environmental Metrics
  const scope1 = findMetric(environmentalItems, ['scope 1', 'scope1']);
  const scope2 = findMetric(environmentalItems, ['scope 2', 'scope2']);
  const energy = findMetric(environmentalItems, ['energy', 'electricity']);
  const renewable = findMetric(environmentalItems, ['renewable']);
  const water = findMetric(environmentalItems, ['water']);
  const waste = findMetric(environmentalItems, ['waste']);

  // Social Metrics
  const employees = findMetric(socialItems, ['total employee', 'employee', 'headcount', 'workforce']);
  const womenWorkforce = findMetric(socialItems, ['gender diversity', 'women in workforce', 'workforce gender', 'ladli behna']);
  const womenLeadership = findMetric(socialItems, ['women in leadership', 'board gender', 'leadership']);
  const injuryRate = findMetric(socialItems, ['injury', 'ltifr', 'lost-time']);
  const trainingHours = findMetric(socialItems, ['training', 'training hours']);
  const community = findMetric(socialItems, ['community', 'csr']);

  // Governance Metrics
  const independentDirectors = findMetric(governanceItems, ['independent', 'board independence']);
  const whistleblower = findMetric(governanceItems, ['whistleblower', 'incident', 'cases']);

  // Targets
  const envTarget = targets.find(t => {
    const tName = (t.targetName || t.metric || t.metricId?.name || '').toLowerCase();
    return tName.includes('emission') || tName.includes('energy') || tName.includes('ghg');
  });

  const socialTarget = targets.find(t => {
    const tName = (t.targetName || t.metric || t.metricId?.name || '').toLowerCase();
    return tName.includes('women') || tName.includes('injury') || tName.includes('diversity') || tName.includes('ladki');
  });

  const govTarget = targets.find(t => {
    const tName = (t.targetName || t.metric || t.metricId?.name || '').toLowerCase();
    return tName.includes('training') || tName.includes('ethics') || tName.includes('governance');
  });

  const envTargetText = envTarget
    ? `Reduce Scope 1 and 2 emissions by ${envTarget.targetValue}% against ${currentYear}`
    : `Reduce Scope 1 and 2 emissions by [x]% against ${currentYear}`;

  const socialTargetText = socialTarget
    ? `Reach ${socialTarget.targetValue}${socialTarget.unit || '%'} women in leadership roles; hold lost-time injury rate below [x]`
    : `Reach [x]% women in leadership roles; hold lost-time injury rate below [x]`;

  const govTargetText = govTarget
    ? `Complete ${govTarget.targetValue}${govTarget.unit || '%'} of ethics training; add external assurance for key metrics`
    : `Complete 100% of ethics training; add external assurance for key metrics`;

  return `${reportName || `ESG Report ${currentYear}`}
${formattedDate} · @${authorName}

Executive Summary
${orgName} made steady progress on environmental, social and governance priorities in ${currentYear}, with the largest gains in energy efficiency and workforce safety. This report summarises our performance, the standards we followed and the goals we are setting for ${nextYear}.
Environmental: lower energy use and emissions per unit of output, with a growing share of renewable power.
Social: a safer workplace, broader representation and more community investment.
Governance: stronger board oversight, ethics training and data protection.
Figures in this report are placeholders; replace the bracketed values with your own data before publishing.

About This Report
This report covers ${orgName}'s operations for the calendar year January to December ${currentYear}, including all owned facilities and our direct subsidiaries.
Reporting period: 1 January ${currentYear} to 31 December ${currentYear}
Frameworks referenced: GRI Standards, SASB and the TCFD recommendations
Emissions method: GHG Protocol, Scopes 1 and 2 (Scope 3 to be added in ${nextYear})
Assurance: internal review; no external assurance this year

ESG Team
A cross-functional team led by the Head of Sustainability prepared this report and owns our ESG programme.
| Team member   | Role   | Responsibility   |
| [Name]   | Chief Sustainability Officer   | Overall ESG strategy and board reporting   |
| [Name]   | ESG Program Manager   | Day-to-day coordination and report production   |
| [Name]   | Environmental Lead   | Emissions, energy, water and waste data   |
| [Name]   | HR and Social Impact Lead   | Workforce, safety, diversity and community programmes   |
| [Name]   | Compliance and Governance Lead   | Ethics, risk, policies and assurance   |
| [Name]   | Data and Reporting Analyst   | Data collection, validation and metrics tracking   |
The ESG team reports to the executive leadership and presents progress to the board each quarter.

Environmental
We cut energy and emissions intensity in ${currentYear} and are moving steadily toward renewable power.
| Metric   | 2025   | ${currentYear}   | Change   |
| Scope 1 emissions (tCO2e)   | [x]   | ${scope1 ? scope1.value : '[x]'}   | [x]%   |
| Scope 2 emissions (tCO2e)   | [x]   | ${scope2 ? scope2.value : '[x]'}   | [x]%   |
| Energy consumption (MWh)   | [x]   | ${energy ? energy.value : '[x]'}   | [x]%   |
| Renewable energy share (%)   | [x]   | ${renewable ? renewable.value : '[x]'}   | [x] pts   |
| Water withdrawal (m³)   | [x]   | ${water ? water.value : '[x]'}   | [x]%   |
| Waste diverted from landfill (%)   | [x]   | ${waste ? waste.value : '[x]'}   | [x] pts   |
Key actions this year: LED and efficiency upgrades at [sites], a renewable power purchase agreement and a supplier waste-reduction programme.

Social
People come first: we focused on safety, fair opportunity and the communities where we operate.
| Metric   | 2025   | ${currentYear}   |
| Total employees   | [x]   | ${employees ? employees.value : '[x]'}   |
| Women in workforce (%)   | [x]   | ${womenWorkforce ? womenWorkforce.value : '[x]'}   |
| Women in leadership roles (%)   | [x]   | ${womenLeadership ? womenLeadership.value : '[x]'}   |
| Lost-time injury rate (per 200,000 hours)   | [x]   | ${injuryRate ? injuryRate.value : '[x]'}   |
| Average training hours per employee   | [x]   | ${trainingHours ? trainingHours.value : '[x]'}   |
| Community investment (INR)   | [x]   | ${community ? community.value : '[x]'}   |
Health and safety: monthly site audits and mandatory safety induction for all staff and contractors.
Diversity and inclusion: structured hiring practices and mentoring for early-career employees.
Community: volunteering days and local education and skills programmes.

Governance
Strong oversight and clear ethics rules underpin everything above.
Board oversight: the board reviews ESG performance [quarterly]; ${independentDirectors ? independentDirectors.value : '[x]'}% of directors are independent.
Ethics and compliance: all employees complete annual code-of-conduct training; a confidential whistleblower channel is open to staff and suppliers.
Risk management: climate and supply-chain risks are tracked in the enterprise risk register.
Data privacy and security: an information security policy is in place, with ${whistleblower ? whistleblower.value : '[x]'} reportable incidents in ${currentYear}.
Supplier standards: a supplier code of conduct covers labour, environmental and anti-corruption requirements.

Targets and Next Steps
For ${nextYear} we are focusing on three measurable goals and on widening the scope of our reporting.
| Area   | ${nextYear} target   |
| Environmental   | ${envTargetText}   |
| Social   | ${socialTargetText}   |
| Governance   | ${govTargetText}   |
Next steps: begin Scope 3 measurement, set a science-based net-zero pathway and publish quarterly ESG updates.`;
};

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
    const { reportName, reportType, periodId, sections = [], format = 'markdown' } = req.body;

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

    // Generate formatted markdown report matching exact template
    const markdownReport = buildMarkdownReport({
      organization,
      period,
      user: req.user,
      environmentalItems,
      socialItems,
      governanceItems,
      targets,
      reportName: reportName.trim()
    });

    const summaryData = {
      organization: {
        name: organization.name,
        industry: organization.industry,
        country: organization.country
      },
      reportingPeriod: period.periodName,
      generatedAt: new Date().toISOString(),
      markdownReport,
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
      .populate('organizationId', 'name')
      .populate('generatedBy', 'name');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const requestedFormat = (req.query.format || report.format || 'markdown').toLowerCase();
    const cleanTitle = (report.reportName || 'ESG_Report').replace(/[^a-zA-Z0-9_-]/g, '_');

    if (requestedFormat === 'json') {
      res.setHeader('Content-Disposition', `attachment; filename="${cleanTitle}.json"`);
      res.setHeader('Content-Type', 'application/json');
      return res.send(JSON.stringify(report.summaryData, null, 2));
    }

    const markdownText = report.summaryData?.markdownReport || buildMarkdownReport({
      organization: report.organizationId,
      period: report.periodId,
      user: report.generatedBy,
      environmentalItems: report.summaryData?.environmentalDetails || [],
      socialItems: report.summaryData?.socialDetails || [],
      governanceItems: report.summaryData?.governanceDetails || [],
      targets: report.summaryData?.targetsSummary || [],
      reportName: report.reportName
    });

    const ext = requestedFormat === 'txt' ? 'txt' : 'md';
    res.setHeader('Content-Disposition', `attachment; filename="${cleanTitle}.${ext}"`);
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.send(markdownText);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listReports,
  generateReport,
  getReportById,
  downloadReport,
  buildMarkdownReport
};
