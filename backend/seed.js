const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const connectDB = require('./config/db');

// Models
const Organization = require('./models/Organization');
const Role = require('./models/Role');
const User = require('./models/User');
const EsgCategory = require('./models/EsgCategory');
const EsgMetric = require('./models/EsgMetric');
const ReportingPeriod = require('./models/ReportingPeriod');
const EsgSubmission = require('./models/EsgSubmission');
const EsgData = require('./models/EsgData');
const ValidationRule = require('./models/ValidationRule');
const ValidationResult = require('./models/ValidationResult');
const EsgTarget = require('./models/EsgTarget');
const TargetProgress = require('./models/TargetProgress');
const EsgReport = require('./models/EsgReport');
const Audit = require('./models/Audit');
const AuditFinding = require('./models/AuditFinding');
const AuditLog = require('./models/AuditLog');
const Setting = require('./models/Setting');

const seedData = async () => {
  try {
    await connectDB();
    console.log('[Seeding]: Connected to MongoDB. Clearing existing collections...');

    // Clear existing
    await Promise.all([
      Organization.deleteMany({}),
      Role.deleteMany({}),
      User.deleteMany({}),
      EsgCategory.deleteMany({}),
      EsgMetric.deleteMany({}),
      ReportingPeriod.deleteMany({}),
      EsgSubmission.deleteMany({}),
      EsgData.deleteMany({}),
      ValidationRule.deleteMany({}),
      ValidationResult.deleteMany({}),
      EsgTarget.deleteMany({}),
      TargetProgress.deleteMany({}),
      EsgReport.deleteMany({}),
      Audit.deleteMany({}),
      AuditFinding.deleteMany({}),
      AuditLog.deleteMany({}),
      Setting.deleteMany({})
    ]);

    console.log('[Seeding]: Creating Roles...');
    const roles = await Role.insertMany([
      {
        name: 'Platform Admin',
        code: 'platform_admin',
        description: 'Super administrator with platform-wide governance and cross-tenant privileges',
        permissions: [{ module: 'All', actions: ['*'] }]
      },
      {
        name: 'Organization Admin',
        code: 'org_admin',
        description: 'Organization administrator managing users, settings, and final ESG data approvals',
        permissions: [
          { module: 'Dashboard', actions: ['view'] },
          { module: 'DataCollection', actions: ['read', 'write', 'approve'] },
          { module: 'UserManagement', actions: ['read', 'write'] },
          { module: 'Settings', actions: ['read', 'write'] }
        ]
      },
      {
        name: 'ESG Manager',
        code: 'esg_manager',
        description: 'Operations manager submitting performance data, evidence, and tracking targets',
        permissions: [
          { module: 'Dashboard', actions: ['view'] },
          { module: 'DataCollection', actions: ['read', 'write', 'submit'] },
          { module: 'TargetManagement', actions: ['read', 'write'] }
        ]
      },
      {
        name: 'Auditor',
        code: 'auditor',
        description: 'Independent compliance auditor verifying records, raising findings and logging adjustments',
        permissions: [
          { module: 'Audit', actions: ['read', 'write', 'correct'] },
          { module: 'Validation', actions: ['read'] },
          { module: 'DataCollection', actions: ['read'] }
        ]
      }
    ]);

    const roleMap = {};
    roles.forEach(r => { roleMap[r.code] = r._id; });

    console.log('[Seeding]: Creating Organizations...');
    const [orgABC, orgApex] = await Organization.insertMany([
      {
        name: 'ABC Industries Ltd.',
        industry: 'Advanced Manufacturing & Heavy Equipment',
        country: 'United States',
        email: 'esg-compliance@abc-industries.com',
        contactNumber: '+1 (555) 019-2834',
        address: '100 Industrial Parkway, Tech Valley, CA 94016',
        status: 'active',
        code: 'ABCI'
      },
      {
        name: 'Apex CleanEnergy Corp.',
        industry: 'Renewable Power & Grid Infrastructure',
        country: 'United Kingdom',
        email: 'sustainability@apexenergy.co.uk',
        contactNumber: '+44 20 7946 0912',
        address: '25 Windmill Lane, London, EC2A 4NE',
        status: 'active',
        code: 'APEX'
      }
    ]);

    console.log('[Seeding]: Creating Users with hashed passwords...');
    const passwordHash = await bcrypt.hash('password123', 10);

    const users = await User.insertMany([
      {
        name: 'Alexander Wright',
        email: 'admin@platform.com',
        passwordHash,
        roleId: roleMap['platform_admin'],
        status: 'active',
        title: 'Chief Platform Architect',
        department: 'Governance & Infrastructure'
      },
      {
        organizationId: orgABC._id,
        name: 'Elena Vance',
        email: 'admin@abc.com',
        passwordHash,
        roleId: roleMap['org_admin'],
        status: 'active',
        title: 'VP of Corporate Sustainability',
        department: 'Executive Office'
      },
      {
        organizationId: orgABC._id,
        name: 'Marcus Hayes',
        email: 'manager@abc.com',
        passwordHash,
        roleId: roleMap['esg_manager'],
        status: 'active',
        title: 'Senior ESG Operations Lead',
        department: 'Operations & Facilities'
      },
      {
        organizationId: orgABC._id,
        name: 'Dr. Sophia Bennett',
        email: 'auditor@auditcorp.com',
        passwordHash,
        roleId: roleMap['auditor'],
        status: 'active',
        title: 'Lead Compliance Auditor',
        department: 'External Assurance Bureau'
      }
    ]);

    const userMap = {};
    users.forEach(u => { userMap[u.email] = u._id; });

    console.log('[Seeding]: Creating ESG Categories...');
    const categories = await EsgCategory.insertMany([
      {
        name: 'Environmental',
        code: 'environmental',
        description: 'Climate change mitigation, greenhouse gas footprint, natural resources stewardship, and biodiversity.',
        color: '#059669',
        icon: 'leaf'
      },
      {
        name: 'Social',
        code: 'social',
        description: 'Human capital development, workplace safety, pay equity, diversity inclusion, and community relations.',
        color: '#2563eb',
        icon: 'users'
      },
      {
        name: 'Governance',
        code: 'governance',
        description: 'Board independence, executive accountability, business ethics, anti-bribery, and regulatory compliance.',
        color: '#7c3aed',
        icon: 'shield-check'
      }
    ]);

    const catMap = {};
    categories.forEach(c => { catMap[c.code] = c._id; });

    console.log('[Seeding]: Creating ESG Metrics...');
    const metrics = await EsgMetric.insertMany([
      // Environmental
      {
        categoryId: catMap['environmental'],
        name: 'Electricity Consumption',
        code: 'elec_consumption',
        description: 'Total electrical power consumed across all manufacturing plants and headquarters.',
        unit: 'MWh',
        isKPI: true,
        calculationMethod: 'sum',
        preferredDirection: 'lower'
      },
      {
        categoryId: catMap['environmental'],
        name: 'Scope 1 Direct GHG Emissions',
        code: 'scope_1_ghg',
        description: 'Direct emissions from stationary combustion, boiler systems, and enterprise fleet.',
        unit: 'MT CO2e',
        isKPI: true,
        calculationMethod: 'sum',
        preferredDirection: 'lower'
      },
      {
        categoryId: catMap['environmental'],
        name: 'Scope 2 Location-based GHG',
        code: 'scope_2_ghg',
        description: 'Indirect greenhouse gas emissions associated with purchased grid electricity.',
        unit: 'MT CO2e',
        isKPI: true,
        calculationMethod: 'sum',
        preferredDirection: 'lower'
      },
      {
        categoryId: catMap['environmental'],
        name: 'Water Withdrawal',
        code: 'water_withdrawal',
        description: 'Total municipal and groundwater withdrawn for industrial and cooling processes.',
        unit: 'm³',
        isKPI: false,
        calculationMethod: 'sum',
        preferredDirection: 'lower'
      },
      {
        categoryId: catMap['environmental'],
        name: 'Renewable Energy Share',
        code: 'renewable_energy_share',
        description: 'Percentage of total electricity derived from verified solar and on-site renewables.',
        unit: '%',
        isKPI: true,
        calculationMethod: 'average',
        preferredDirection: 'higher'
      },
      // Social
      {
        categoryId: catMap['social'],
        name: 'Workforce Gender Diversity',
        code: 'gender_diversity',
        description: 'Percentage of female-identifying personnel across all levels of employment.',
        unit: '%',
        isKPI: true,
        calculationMethod: 'average',
        preferredDirection: 'higher'
      },
      {
        categoryId: catMap['social'],
        name: 'Annual Employee Turnover Rate',
        code: 'employee_turnover',
        description: 'Voluntary and involuntary employee departures annualized.',
        unit: '%',
        isKPI: false,
        calculationMethod: 'percentage',
        preferredDirection: 'lower'
      },
      {
        categoryId: catMap['social'],
        name: 'Training Hours per Employee',
        code: 'training_hours',
        description: 'Average hours of professional, compliance, and skills training received per full-time employee.',
        unit: 'Hours',
        isKPI: true,
        calculationMethod: 'average',
        preferredDirection: 'higher'
      },
      {
        categoryId: catMap['social'],
        name: 'Lost Time Injury Frequency Rate (LTIFR)',
        code: 'ltifr',
        description: 'Number of lost-time injuries occurring per 1,000,000 hours worked in facilities.',
        unit: 'Incidents/1M hrs',
        isKPI: true,
        calculationMethod: 'average',
        preferredDirection: 'lower'
      },
      // Governance
      {
        categoryId: catMap['governance'],
        name: 'Board Gender Diversity',
        code: 'board_gender_diversity',
        description: 'Percentage of board seats held by underrepresented gender directors.',
        unit: '%',
        isKPI: true,
        calculationMethod: 'percentage',
        preferredDirection: 'higher'
      },
      {
        categoryId: catMap['governance'],
        name: 'Independent Board Directors',
        code: 'board_independence',
        description: 'Proportion of non-executive independent members on the board of directors.',
        unit: '%',
        isKPI: true,
        calculationMethod: 'percentage',
        preferredDirection: 'higher'
      },
      {
        categoryId: catMap['governance'],
        name: 'Anti-Corruption Code Training Completion',
        code: 'compliance_training_rate',
        description: 'Percentage of designated staff completing annual anti-bribery and compliance training.',
        unit: '%',
        isKPI: false,
        calculationMethod: 'percentage',
        preferredDirection: 'higher'
      },
      {
        categoryId: catMap['governance'],
        name: 'Whistleblower Concerns Investigated',
        code: 'whistleblower_reports',
        description: 'Total ethics hotline inquiries formally audited and addressed during the period.',
        unit: 'Cases',
        isKPI: false,
        calculationMethod: 'count',
        preferredDirection: 'lower'
      }
    ]);

    const metricMap = {};
    metrics.forEach(m => { metricMap[m.code] = m; });

    console.log('[Seeding]: Creating Reporting Periods...');
    const [periodCurrent, periodPrev] = await ReportingPeriod.insertMany([
      {
        organizationId: orgABC._id,
        periodName: 'FY 2026–27',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        status: 'active',
        isCurrent: true
      },
      {
        organizationId: orgABC._id,
        periodName: 'FY 2025–26',
        startDate: new Date('2025-04-01'),
        endDate: new Date('2026-03-31'),
        status: 'closed',
        isCurrent: false
      }
    ]);

    console.log('[Seeding]: Creating Validation Rules...');
    await ValidationRule.insertMany([
      {
        organizationId: null,
        metricId: metricMap['elec_consumption']._id,
        name: 'Electricity Must Be Positive',
        ruleType: 'positive_only',
        severity: 'error',
        errorMessage: 'Power consumption cannot be zero or negative.'
      },
      {
        organizationId: null,
        metricId: metricMap['scope_1_ghg']._id,
        name: 'Scope 1 Reasonable Max Threshold',
        ruleType: 'max_value',
        condition: { operator: 'lte', value: 50000 },
        severity: 'warning',
        errorMessage: 'Scope 1 direct emissions exceed historical baseline ceiling of 50,000 MT CO2e.'
      },
      {
        organizationId: null,
        metricId: metricMap['renewable_energy_share']._id,
        name: 'Renewable Share Must Be Valid Percentage',
        ruleType: 'range',
        condition: { operator: 'between', minValue: 0, maxValue: 100 },
        severity: 'error',
        errorMessage: 'Percentage must fall strictly between 0% and 100%.'
      },
      {
        organizationId: null,
        metricId: metricMap['gender_diversity']._id,
        name: 'Gender Diversity Range Check',
        ruleType: 'range',
        condition: { operator: 'between', minValue: 0, maxValue: 100 },
        severity: 'error',
        errorMessage: 'Percentage must be between 0% and 100%.'
      },
      {
        organizationId: null,
        metricId: metricMap['ltifr']._id,
        name: 'LTIFR Zero or Positive',
        ruleType: 'min_value',
        condition: { operator: 'gte', value: 0 },
        severity: 'error',
        errorMessage: 'Incident rate cannot be negative.'
      }
    ]);

    console.log('[Seeding]: Creating Submissions and ESG Data Items...');

    // Submission 1: Approved Q1 Energy & Climate Audit
    const sub1 = await EsgSubmission.create({
      organizationId: orgABC._id,
      reportingPeriodId: periodCurrent._id,
      submittedBy: userMap['manager@abc.com'],
      submissionName: 'FY26-Q1 Energy & Emission Disclosures',
      source: 'Meter Readouts & Utility Billing Archive',
      description: 'Audited utility bills for manufacturing plant A & B, plus certified diesel generator logs.',
      status: 'approved',
      validationStatus: 'passed',
      auditStatus: 'completed',
      submittedAt: new Date('2026-07-15'),
      approvedBy: userMap['admin@abc.com'],
      approvedAt: new Date('2026-07-20')
    });

    await EsgData.insertMany([
      {
        submissionId: sub1._id,
        organizationId: orgABC._id,
        reportingPeriodId: periodCurrent._id,
        submittedBy: userMap['manager@abc.com'],
        metricId: metricMap['elec_consumption']._id,
        categoryId: catMap['environmental'],
        value: 14250,
        unit: 'MWh',
        description: 'Combined electric meter intake across main fabrication facilities',
        evidenceFiles: ['utility_statement_q1_2026.pdf'],
        status: 'approved'
      },
      {
        submissionId: sub1._id,
        organizationId: orgABC._id,
        reportingPeriodId: periodCurrent._id,
        submittedBy: userMap['manager@abc.com'],
        metricId: metricMap['scope_1_ghg']._id,
        categoryId: catMap['environmental'],
        value: 4120,
        unit: 'MT CO2e',
        description: 'Fuel combustion calculated with EPA emission factors',
        evidenceFiles: ['fuel_receipts_q1.pdf'],
        status: 'approved'
      },
      {
        submissionId: sub1._id,
        organizationId: orgABC._id,
        reportingPeriodId: periodCurrent._id,
        submittedBy: userMap['manager@abc.com'],
        metricId: metricMap['renewable_energy_share']._id,
        categoryId: catMap['environmental'],
        value: 36.5,
        unit: '%',
        description: 'Verified solar rooftop generation & PPA green certificates',
        evidenceFiles: ['solar_rec_cert.pdf'],
        status: 'approved'
      }
    ]);

    // Submission 2: Approved Q2 Social & Human Capital
    const sub2 = await EsgSubmission.create({
      organizationId: orgABC._id,
      reportingPeriodId: periodCurrent._id,
      submittedBy: userMap['manager@abc.com'],
      submissionName: 'FY26-Q2 Human Capital & Diversity Report',
      source: 'Workday HRIS Master Export',
      description: 'Global workforce headcount census, safety telemetry, and training hours records.',
      status: 'approved',
      validationStatus: 'passed',
      auditStatus: 'completed',
      submittedAt: new Date('2026-10-10'),
      approvedBy: userMap['admin@abc.com'],
      approvedAt: new Date('2026-10-18')
    });

    await EsgData.insertMany([
      {
        submissionId: sub2._id,
        organizationId: orgABC._id,
        reportingPeriodId: periodCurrent._id,
        submittedBy: userMap['manager@abc.com'],
        metricId: metricMap['gender_diversity']._id,
        categoryId: catMap['social'],
        value: 41.2,
        unit: '%',
        description: 'Overall female employee representation',
        evidenceFiles: ['workday_census_q2.pdf'],
        status: 'approved'
      },
      {
        submissionId: sub2._id,
        organizationId: orgABC._id,
        reportingPeriodId: periodCurrent._id,
        submittedBy: userMap['manager@abc.com'],
        metricId: metricMap['training_hours']._id,
        categoryId: catMap['social'],
        value: 34.8,
        unit: 'Hours',
        description: 'Average verified professional training hours completed per employee',
        evidenceFiles: ['lms_completion_records.pdf'],
        status: 'approved'
      },
      {
        submissionId: sub2._id,
        organizationId: orgABC._id,
        reportingPeriodId: periodCurrent._id,
        submittedBy: userMap['manager@abc.com'],
        metricId: metricMap['ltifr']._id,
        categoryId: catMap['social'],
        value: 0.42,
        unit: 'Incidents/1M hrs',
        description: 'Two minor reportable slip/fall incidents recorded in assembly bay',
        evidenceFiles: ['osha_log_300.pdf'],
        status: 'approved'
      },
      {
        submissionId: sub2._id,
        organizationId: orgABC._id,
        reportingPeriodId: periodCurrent._id,
        submittedBy: userMap['manager@abc.com'],
        metricId: metricMap['board_gender_diversity']._id,
        categoryId: catMap['governance'],
        value: 44.4,
        unit: '%',
        description: '4 female board members out of 9 total seats',
        evidenceFiles: ['proxy_statement_2026.pdf'],
        status: 'approved'
      },
      {
        submissionId: sub2._id,
        organizationId: orgABC._id,
        reportingPeriodId: periodCurrent._id,
        submittedBy: userMap['manager@abc.com'],
        metricId: metricMap['board_independence']._id,
        categoryId: catMap['governance'],
        value: 77.8,
        unit: '%',
        description: '7 independent directors of 9 board members',
        evidenceFiles: ['proxy_statement_2026.pdf'],
        status: 'approved'
      }
    ]);

    // Submission 3: Validated Q3 In Audit Queue
    const sub3 = await EsgSubmission.create({
      organizationId: orgABC._id,
      reportingPeriodId: periodCurrent._id,
      submittedBy: userMap['manager@abc.com'],
      submissionName: 'FY26-Q3 Corporate Water & Industrial Waste Filing',
      source: 'Municipal Water Invoices & Facility Audits',
      description: 'Mid-year municipal water withdrawal figures and hazardous waste disposal manifests.',
      status: 'validated',
      validationStatus: 'passed',
      auditStatus: 'in_progress',
      submittedAt: new Date('2026-11-05')
    });

    await EsgData.insertMany([
      {
        submissionId: sub3._id,
        organizationId: orgABC._id,
        reportingPeriodId: periodCurrent._id,
        submittedBy: userMap['manager@abc.com'],
        metricId: metricMap['water_withdrawal']._id,
        categoryId: catMap['environmental'],
        value: 28400,
        unit: 'm³',
        description: 'Total city water intake for cooling tower loops',
        evidenceFiles: ['water_bills_q3.pdf'],
        status: 'validated'
      },
      {
        submissionId: sub3._id,
        organizationId: orgABC._id,
        reportingPeriodId: periodCurrent._id,
        submittedBy: userMap['manager@abc.com'],
        metricId: metricMap['compliance_training_rate']._id,
        categoryId: catMap['governance'],
        value: 98.2,
        unit: '%',
        description: 'Mandatory annual bribery and ethics course signoff',
        evidenceFiles: ['compliance_lms_audit.pdf'],
        status: 'validated'
      }
    ]);

    // Submission 4: Requires Correction
    const sub4 = await EsgSubmission.create({
      organizationId: orgABC._id,
      reportingPeriodId: periodCurrent._id,
      submittedBy: userMap['manager@abc.com'],
      submissionName: 'FY26-Q3 Fleet Scope 1 Fuel Adjustments',
      source: 'Fleet Card Telematics',
      description: 'Log of fleet gasoline and diesel consumption requiring odometer calibration review.',
      status: 'requires_correction',
      validationStatus: 'failed',
      auditStatus: 'pending',
      submittedAt: new Date('2026-11-12'),
      rejectionReason: 'Negative value detected on fuel intake line. Must be non-negative.'
    });

    const failedItem = await EsgData.create({
      submissionId: sub4._id,
      organizationId: orgABC._id,
      reportingPeriodId: periodCurrent._id,
      submittedBy: userMap['manager@abc.com'],
      metricId: metricMap['elec_consumption']._id,
      categoryId: catMap['environmental'],
      value: -150,
      unit: 'MWh',
      description: 'Erroneous negative line item entered by site dispatcher',
      status: 'requires_correction'
    });

    await ValidationResult.create({
      submissionId: sub4._id,
      dataId: failedItem._id,
      validationStatus: 'failed',
      errors: ['[Electricity Must Be Positive] Value cannot be zero or negative.'],
      validatedBy: userMap['admin@abc.com'],
      validatedAt: new Date('2026-11-12')
    });

    console.log('[Seeding]: Creating ESG Targets...');
    const targets = await EsgTarget.insertMany([
      {
        organizationId: orgABC._id,
        metricId: metricMap['scope_1_ghg']._id,
        targetName: '30% Reduction in Scope 1 GHG by 2030',
        baselineValue: 6000,
        targetValue: 4200,
        currentValue: 4120,
        progressPercentage: 104.4,
        unit: 'MT CO2e',
        direction: 'lower_is_better',
        startDate: new Date('2024-01-01'),
        targetDate: new Date('2030-12-31'),
        status: 'Achieved',
        createdBy: userMap['admin@abc.com']
      },
      {
        organizationId: orgABC._id,
        metricId: metricMap['renewable_energy_share']._id,
        targetName: '50% Clean Renewable Energy by 2028',
        baselineValue: 15.0,
        targetValue: 50.0,
        currentValue: 36.5,
        progressPercentage: 61.4,
        unit: '%',
        direction: 'higher_is_better',
        startDate: new Date('2024-01-01'),
        targetDate: new Date('2028-12-31'),
        status: 'On Track',
        createdBy: userMap['admin@abc.com']
      },
      {
        organizationId: orgABC._id,
        metricId: metricMap['gender_diversity']._id,
        targetName: '45% Gender Diversity in Workforce',
        baselineValue: 32.0,
        targetValue: 45.0,
        currentValue: 41.2,
        progressPercentage: 70.8,
        unit: '%',
        direction: 'higher_is_better',
        startDate: new Date('2025-01-01'),
        targetDate: new Date('2027-12-31'),
        status: 'On Track',
        createdBy: userMap['admin@abc.com']
      },
      {
        organizationId: orgABC._id,
        metricId: metricMap['ltifr']._id,
        targetName: 'Zero Workplace Lost Time Injuries',
        baselineValue: 1.5,
        targetValue: 0.0,
        currentValue: 0.42,
        progressPercentage: 72.0,
        unit: 'Incidents/1M hrs',
        direction: 'lower_is_better',
        startDate: new Date('2025-01-01'),
        targetDate: new Date('2026-12-31'),
        status: 'On Track',
        createdBy: userMap['admin@abc.com']
      }
    ]);

    console.log('[Seeding]: Creating Audit Record & Findings...');
    const auditEngagement = await Audit.create({
      organizationId: orgABC._id,
      submissionId: sub1._id,
      userId: userMap['auditor@auditcorp.com'],
      auditType: 'External Verification',
      auditDate: new Date('2026-08-01'),
      status: 'completed',
      comments: 'Utility invoices reconciled with electric grid meters. Minor rounding variance settled.',
      completedAt: new Date('2026-08-05')
    });

    await AuditFinding.create({
      auditId: auditEngagement._id,
      organizationId: orgABC._id,
      submissionId: sub1._id,
      metricId: metricMap['elec_consumption']._id,
      title: 'Sub-meter Metering Gap on Substation 4',
      description: 'Secondary sub-meter was calibrated 14 days late, although cumulative utility statement confirmed total balance.',
      severity: 'low',
      status: 'resolved',
      correctiveAction: 'Automated digital telemetry connected directly to utility portal.',
      resolvedAt: new Date('2026-08-04')
    });

    console.log('[Seeding]: Creating Completed ESG Report...');
    await EsgReport.create({
      organizationId: orgABC._id,
      periodId: periodCurrent._id,
      reportName: 'ABC Industries - FY 2026–27 Mid-Year ESG Performance Report',
      reportType: 'Comprehensive ESG',
      format: 'json',
      sections: ['Executive Summary', 'Environmental', 'Social', 'Governance', 'Targets'],
      generatedBy: userMap['admin@abc.com'],
      status: 'completed',
      summaryData: {
        organization: { name: 'ABC Industries Ltd.', industry: 'Advanced Manufacturing', country: 'United States' },
        reportingPeriod: 'FY 2026–27',
        generatedAt: new Date().toISOString(),
        recordCounts: { totalApproved: 7, environmental: 3, social: 3, governance: 1 }
      }
    });

    console.log('[Seeding]: Creating Audit Logs...');
    await AuditLog.insertMany([
      {
        organizationId: orgABC._id,
        actorId: userMap['admin@abc.com'],
        resourceType: 'EsgSubmission',
        resourceId: sub1._id,
        action: 'APPROVE',
        previousValue: { status: 'validated' },
        newValue: { status: 'approved' },
        reason: 'Quarterly review completed by VP of Sustainability',
        timestamp: new Date('2026-07-20')
      },
      {
        organizationId: orgABC._id,
        actorId: userMap['auditor@auditcorp.com'],
        resourceType: 'EsgData',
        resourceId: failedItem._id,
        action: 'VALIDATE',
        previousValue: { value: -150 },
        newValue: { validationStatus: 'failed' },
        reason: 'Automatic validation failed: negative consumption',
        timestamp: new Date('2026-11-12')
      }
    ]);

    console.log('[Seeding Completed Successfully]: All collections ready with realistic demo data.');
    console.log(`
      Default User Logins (Password: password123):
      - Platform Admin: admin@platform.com
      - Org Admin:      admin@abc.com
      - ESG Manager:    manager@abc.com
      - Auditor:        auditor@auditcorp.com
    `);

    process.exit(0);
  } catch (error) {
    console.error('[Seeding Error]:', error);
    process.exit(1);
  }
};

seedData();
