# Enterprise ESG Management Platform — Complete User Guide

Welcome to the **Enterprise ESG (Environmental, Social, and Governance) Management Platform**. This platform is a multi-tenant corporate sustainability management system designed to streamline ESG metric governance, audit-grade disclosure submissions, target trajectory tracking, and automated statutory report compilation.

---

## Table of Contents
1. [Platform Architecture & Core Features](#1-platform-architecture--core-features)
2. [Role-Based Access Control & Permissions](#2-role-based-access-control--permissions)
3. [End-to-End Workflows](#3-end-to-end-workflows)
   - [Workflow 1: How to Add a KPI / Metric](#workflow-1-how-to-add-a-kpi--metric)
   - [Workflow 2: How to Add & Track Multi-Year Targets](#workflow-2-how-to-add--track-multi-year-targets)
   - [Workflow 3: How to Submit ESG Data (Data Collection)](#workflow-3-how-to-submit-esg-data-data-collection)
   - [Workflow 4: How to Validate, Verify & Approve Data](#workflow-4-how-to-validate-verify--approve-data)
   - [Workflow 5: How to Generate, Review & Export Reports](#workflow-5-how-to-generate-review--export-reports)
   - [Workflow 6: How to Add Roles & Manage User Permissions](#workflow-6-how-to-add-roles--manage-user-permissions)
4. [Audit Trail & Governance Integrity](#4-audit-trail--governance-integrity)
5. [Reporting Frameworks & Standards](#5-reporting-frameworks--standards)
6. [Quick Troubleshooting & FAQ](#6-quick-troubleshooting--faq)

---

## 1. Platform Architecture & Core Features

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Enterprise ESG Platform                         │
├───────────────┬────────────────────────┬───────────────────────────────┤
│ Data Input    │ Verification & Audit   │ Analytics & Disclosure        │
├───────────────┼────────────────────────┼───────────────────────────────┤
│ • KPI Config  │ • Rule Validation      │ • Executive Dashboard         │
│ • Submissions │ • Anomaly Flagging     │ • Cross-Pillar Analytics      │
│ • Evidence    │ • Human Verification   │ • Trajectory Projections      │
│ • Targets     │ • Immutable Audit Log  │ • Official PDF Report Export  │
└───────────────┴────────────────────────┴───────────────────────────────┘
```

### Core Features at a Glance:
1. **Executive Dashboard (`/dashboard`)**:
   - Executive KPIs: Total Disclosed Metrics, Audit Verification % Rate, Pillar Completeness % (Environmental, Social, Governance), and Active Submissions count.
   - Live cycle switcher for dynamic historical comparisons.
2. **Data Collection & Submissions (`/submissions`)**:
   - Structured batch submission for facilities, business units, and ESG pillars.
   - Support for baseline values, current readings, measurement units, notes, and evidence document uploads.
   - Workflow statuses: `Draft` ➔ `Submitted` ➔ `Under Review` ➔ `Approved` (or `Rejected`).
3. **Data Validation & Verification (`/validation`)**:
   - Automated threshold checking and variance alerts against previous years.
   - Verification status toggling (`Pending`, `Under Review`, `Verified`, `Flagged`).
4. **Target Management & Trajectory (`/targets`)**:
   - Multi-year decarbonization, diversity, and governance targets.
   - Real-time progress bar tracking against baseline and goal values.
   - **Automated Trajectory Updates**: Approving submissions linked to a target metric automatically calculates and advances progress towards the target deadline.
5. **ESG Insights & Analytics (`/analytics`)**:
   - Completeness metrics across E, S, and G pillars.
   - Audit-readiness score, disclosure depth, and YoY trajectory charts.
6. **Official ESG Reporting & Disclosures (`/reporting`)**:
   - Compiles official disclosure reports using **audit-approved data records exclusively**.
   - Generates structured sections: Executive Summary, About This Report, ESG Team, Environmental Matrix, Social Matrix, Governance Oversight & Metrics Table, and Target Performance Summary.
   - **High-Resolution Vector PDF Export**: Download reports directly as publication-ready `.pdf` files or print directly via the browser print dialog.
7. **Tamper-Evident Audit Ledger (`/audit`)**:
   - Immutable audit log capturing user IDs, timestamps, previous vs. updated values, and IP/session metadata.
   - Audit findings register with corrective action tracking.
8. **ESG KPI & Category Management (`/esg-management`)**:
   - Manage standard ESG categories (e.g., Scope 1, Scope 2, Water, Diversity, Ethics) and custom KPIs with framework alignment (GRI, SASB, TCFD, BRSR).
9. **User Management & Role Authorization (`/users`)**:
   - Tenant-level user directory, team invitation, and status management (`active`, `inactive`, `suspended`).
   - Custom Role Builder with granular module-level permissions.
   - User detail inspection and individual user permission overrides.

---

## 2. Role-Based Access Control & Permissions

The platform enforces strict multi-tenant data isolation. Each organization has its own roles, users, metrics, and disclosure data.

### System Roles:
- **Platform Admin (`platform_admin`)**: Global system superuser; manages all tenant organizations and root configurations.
- **Organization Admin (`org_admin`)**: Full control over tenant organization: manages users, configures roles, assigns permissions, approves submissions, and compiles official reports.
- **Sustainability Manager (`manager`)**: Manages reporting cycles, creates targets, coordinates data collection, and submits disclosure packages.
- **Data Contributor / Analyst (`analyst`)**: Enters facility readings, uploads evidence files, logs progress, and submits batches for review.
- **Compliance Auditor (`auditor`)**: Read-only validation access, review evidence, verify data accuracy, and log formal audit findings.

### Permissions Matrix:
Permissions are structured across **9 Core Modules** with specific actions:

| Module | Available Actions | Description |
| :--- | :--- | :--- |
| **Executive Dashboard** | `view` | View executive summary, high-level metrics, and progress dials |
| **Data Collection** | `read`, `write`, `submit`, `approve` | Enter metric readings, upload evidence, submit batches, and give final disclosure approval |
| **Validation** | `read`, `write`, `validate`, `flag` | Execute range tests, verify evidence attachments, and flag anomalies |
| **Target Management**| `read`, `write` | Create multi-year ESG targets, set baseline/goals, and monitor trajectories |
| **Analytics** | `view`, `export` | Access deep analytics charts, pillar completeness, and breakdown rollups |
| **Reporting** | `read`, `generate`, `export` | Access generated reports, trigger new compilations, and export official PDFs |
| **Audit Trail** | `read`, `write`, `correct` | Inspect the immutable audit ledger and log corrective audit findings |
| **User Management** | `read`, `write` | Create custom roles, invite team members, and modify authorization permissions |
| **Settings** | `read`, `write` | Configure organization profile, facilities, and active reporting periods |

---

## 3. End-to-End Workflows

---

### Workflow 1: How to Add a KPI / Metric

KPIs define the standardized parameters (e.g., GHG emissions, water consumption, board diversity) that your organization measures.

```
Navigate to ESG Management ➔ Click "Create Metric" ➔ Fill Details ➔ Assign Category & Framework ➔ Save
```

1. Navigate to **ESG Management** (`/esg-management`) in the sidebar.
2. Select the **Metrics** tab.
3. Click the **"+ Add New Metric"** button in the top right.
4. Fill in the required fields:
   - **Metric Name**: e.g., `Scope 1 Direct GHG Emissions`.
   - **Metric Code**: Unique identifier, e.g., `ENV-GHG-S1`.
   - **Pillar**: Choose `Environmental`, `Social`, or `Governance`.
   - **Category**: Select the relevant category (e.g., `Emissions & Energy`).
   - **Unit of Measurement**: e.g., `MT CO2e`, `MWh`, `%`, or `Count`.
   - **Reporting Frameworks**: Select applicable standards (e.g., `GRI 305-1`, `SASB EM-MM-110a.1`, `TCFD`).
   - **Calculation Method / Guidance**: Optional calculation instructions for data contributors.
5. Click **Save Metric**. The KPI is now active and immediately available in submission forms and target configurations.

---

### Workflow 2: How to Add & Track Multi-Year Targets

Targets define long-term statutory and voluntary ESG commitments (e.g., net-zero emissions, renewable energy share).

```
Navigate to Targets ➔ Click "Create Target" ➔ Select Linked KPI ➔ Define Baseline & Goal ➔ Save Target
```

1. Navigate to **Target Management** (`/targets`) in the sidebar.
2. Click the **"+ Create Target"** button.
3. Fill in the Target Specification:
   - **Target Title**: e.g., `50% Clean Renewable Energy by 2028`.
   - **Pillar**: `Environmental`, `Social`, or `Governance`.
   - **Linked Metric**: Select the metric created in Workflow 1 (e.g., `Renewable Energy Share`).
   - **Baseline Value**: The starting value (e.g., `15`).
   - **Target Value (Goal)**: The target value to achieve (e.g., `50`).
   - **Unit**: Inherited from metric or custom (e.g., `%`).
   - **Deadline Date**: The target completion date (e.g., `12/31/2028`).
   - **Strategy / Action Plan**: Summary of corporate initiatives to hit the milestone.
4. Click **Create Target**.
5. **How Target Progress Updates**:
   - The platform calculates progress automatically:
     $$\text{Progress \%} = \frac{\text{Current Value} - \text{Baseline Value}}{\text{Target Value} - \text{Baseline Value}} \times 100$$
   - Whenever an official data submission containing this metric is **Approved**, the target's current value and progress percentage update automatically in real-time.

---

### Workflow 3: How to Submit ESG Data (Data Collection)

Data contributors log operational data batches for facilities and reporting periods.

```
Navigate to Data Collection ➔ "New Submission Batch" ➔ Add Metric Entries ➔ Attach Evidence ➔ Submit
```

1. Navigate to **Data Collection** (`/submissions`).
2. Click **"+ New Submission"**.
3. Configure the Batch Header:
   - **Batch Title**: e.g., `Q3 FY26 Manufacturing Facility Power & Gas`.
   - **Reporting Period**: Choose current active cycle (e.g., `FY 2025–26`).
   - **Pillar**: `Environmental`, `Social`, or `Governance`.
   - **Facility / Site**: Choose facility (e.g., `Headquarters - Building A` or `Plant 1`).
4. Enter Metric Readings:
   - Select KPI/Metric.
   - Input **Numerical Value** (e.g., `4115`).
   - Provide **Baseline Comparison** or period notes.
   - Upload **Evidence Documentation**: Invoices, meter readings, utility receipts, or third-party laboratory reports (`.pdf`, `.xlsx`, `.png`).
5. Choose Submission Action:
   - Click **Save as Draft** if data entry is still in progress.
   - Click **Submit for Approval** when data is finalized. Status transitions to `Submitted`.

---

### Workflow 4: How to Validate, Verify & Approve Data

To ensure reports only contain audit-grade information, submitted data must undergo review and approval.

```
Navigate to Validation ➔ Inspect Evidence & Thresholds ➔ Mark "Verified" ➔ Admin "Approve" ➔ Disclosed
```

1. **Validation & Integrity Review (`/validation`)**:
   - Review submitted batches with automated variance checks (e.g., warning if current energy use spikes > 25% from baseline).
   - Check attached evidence files.
   - Change verification status to **Verified** if evidence matches the entered value, or **Flagged** if revisions are required.
2. **Final Approval (`/submissions`)**:
   - An Org Admin or Sustainability Manager reviews the verified submission.
   - Click **Approve Submission**.
   - **What happens on approval?**:
     1. The submission status changes to `Approved`.
     2. The data entries become part of the official corporate disclosures repository.
     3. Linked targets automatically re-evaluate their current value and progress.
     4. An immutable log entry is registered in the **Audit Trail**.
     5. The data is now unlocked and included in official report generation.

---

### Workflow 5: How to Generate, Review & Export Reports

Official disclosure reports compile approved data into an executive document for rating agencies, regulators, and stakeholders.

```
Navigate to Reporting ➔ "Generate New Report" ➔ Select Cycle & Sections ➔ Review Document ➔ Export PDF
```

1. Navigate to **Reporting** (`/reporting`) in the sidebar.
2. Click **"Generate New Report"**.
3. In the report compilation modal:
   - **Report Document Title**: e.g., `FY 2025–26 Corporate ESG Disclosure Report`.
   - **Reporting Cycle**: Select the active or historical period (e.g., `FY 2025–26`).
   - **Report Type**: `Comprehensive ESG`, `Environmental Focus`, `Social Responsibility`, or `Corporate Governance`.
   - **Include Sections**: Check desired sections:
     - `Executive Summary`
     - `About This Report`
     - `ESG Team`
     - `Environmental` (Emissions, Energy, Water, Waste metrics table)
     - `Social` (Workforce diversity, Safety, Training metrics table)
     - `Governance` (Board diversity, Ethics training, Compliance incidents table)
     - `Targets and Next Steps` (Target matrix with explicit `Achieved (Goal Met)` and `Not Achieved` progress breakdown)
4. Click **Compile & Generate**.
   - The platform aggregates all approved disclosures for the period, builds the metrics tables, checks target goal achievement, and registers the report in the archive.
5. **Reviewing the Report**:
   - In the reports archive table, click **View** on the generated report.
   - The report displays in the high-fidelity **Document View** with clear headers, tables, and status pills.
6. **Exporting as PDF**:
   - **From the Reports Table**: Click the **"Export PDF"** button directly on the report row.
   - **From the View Modal**:
     - Click **"Download PDF (.pdf)"** for a crisp multi-page PDF document file.
     - Click **"Print / Save PDF"** to open the browser's native print preview dialog (select "Save as PDF" for vector resolution).

---

### Workflow 6: How to Add Roles & Manage User Permissions

Org Admins can design custom roles with tailored responsibilities and toggle individual member privileges.

```
Navigate to Users ➔ Switch to "Roles" Tab ➔ "Create Custom Role" ➔ Configure Permissions ➔ Assign to User
```

#### Step A: Creating a Custom Role
1. Navigate to **Users & Permissions** (`/users`) in the sidebar.
2. Click on the **"Roles & Authorization"** tab.
3. Click the **"+ Create Custom Role"** button.
4. Fill in:
   - **Role Name**: e.g., `Regional Facility Auditor`.
   - **Role Code**: Unique identifier, e.g., `regional_auditor`.
   - **Description**: e.g., `Conducts on-site verification and evidence reviews for European plants`.
5. Check the exact permissions required across modules (e.g., `DataCollection: read`, `Validation: read, validate, flag`, `Audit: read`).
6. Click **Create Role**.

#### Step B: Inviting a User & Assigning a Role
1. Switch to the **"User Directory"** tab.
2. Click **"+ Add User"**.
3. Enter Name, Email, Temporary Password, and select the newly created Role.
4. Click **Create User**.

#### Step C: Inspecting & Overriding Permissions per User
1. Click on any user row in the **User Directory**.
2. A detailed side drawer opens showing:
   - User profile details (email, role, department, status).
   - The user's effective permissions based on their assigned role.
3. **Custom Permission Overrides**:
   - An Org Admin can check or uncheck individual permission pills directly on the user's card to grant extra actions or revoke specific capabilities.
   - Click **Save Permissions**. Changes take effect immediately on the user's next session.

---

## 4. Audit Trail & Governance Integrity

All actions across the platform are subject to cryptographic and tamper-evident audit logging (`/audit`).

- **What is Logged?**:
  - Metric creation, edits, and deletions.
  - Submission status changes (draft ➔ submit ➔ verify ➔ approve).
  - Target creation and milestone completions.
  - Report compilations and exports.
  - Role modifications and permission alterations.
- **Audit Findings**:
  - Auditors can log findings (`Minor Non-Conformance`, `Major Non-Conformance`, or `Observation`) against any disclosure record.
  - Findings require corrective action plans and administrative sign-off before closure.

---

## 5. Reporting Frameworks & Standards

The platform supports mapping to international statutory and voluntary standards:

| Framework | Coverage in Platform |
| :--- | :--- |
| **GRI Standards** | Full environmental (300 series), social (400 series), and governance (200 series) metric indexing. |
| **SASB** | Sector-specific sustainability accounting standards and metric code mapping. |
| **TCFD** | Climate-related financial disclosures: Governance, Strategy, Risk Management, and Metrics/Targets. |
| **GHG Protocol** | Scope 1 direct emissions and Scope 2 market/location-based indirect electricity tracking. |

---

## 6. Quick Troubleshooting & FAQ

#### Q1: Why are my submitted metrics not appearing in the official ESG Report?
> **Answer**: Official reports compile **Approved** disclosures exclusively to protect data integrity. Ensure your submission has been reviewed and approved by an authorized user in the Data Collection module.

#### Q2: How does a target know when it has been achieved?
> **Answer**: When a submission containing the target's linked metric is approved, the platform compares the metric's new value against the `Target Value` and `Baseline Value`. If the goal is met or surpassed, the target automatically switches to `Achieved (Goal Met)` and reflects as Achieved in the Next Steps section of reports.

#### Q3: Can I export raw Markdown or edit reports after compilation?
> **Answer**: Official reports are immutable compiled snapshots for audit consistency. To present official disclosures, reports export directly to standard `.pdf` format. If data changes, simply generate a new version with the updated data.

#### Q4: What happens if an organization user needs permission to view reports but not generate them?
> **Answer**: In **User Management** ➔ Click on the user ➔ Under `Reporting`, ensure only `read` is selected and uncheck `generate` and `export`. Save permissions.

---

*Enterprise ESG Platform · Documentation Version 2.4 · Audit-Grade Sustainability Governance*
