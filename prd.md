# Product Requirements Document (PRD)

# ESG Management Software

**Version:** 1.1  
**Status:** Initial Development Specification  
**Architecture:** MERN Stack (MongoDB, Express.js, React.js, Node.js)  
**Database:** MongoDB + Mongoose ODM  
**Frontend:** React.js (Vite) + Tailwind CSS + Lucide React + Recharts + date-fns  
**Backend:** Node.js + Express.js  
**Design Reference:** Stitch Minimalist Enterprise Dashboard UI (`/stitch_minimalist_website_clone`)

---

## 1. Product Overview

### 1.1 Product Description
The ESG Management Platform is a centralized, multi-organization enterprise web application for collecting, managing, validating, analyzing, auditing, and reporting Environmental, Social, and Governance (ESG) performance data.

The platform enables organizations to configure ESG metrics, submit periodic performance data, establish targets, upload & review evidence, execute automated validation checks, conduct audits with full historical traceability, monitor ESG performance with intuitive analytics, and generate compliance-ready reports.

### 1.2 Objectives
- **Centralize ESG Data**: Unified single-pane-of-glass for all ESG records.
- **Pillar Categorization**: Organize all metrics under Environmental, Social, and Governance pillars.
- **Metric Configuration**: Flexible KPI and metric configuration with custom units and aggregation types.
- **Reporting Period Tracking**: Capture periodic cycle data (FY quarters, annual cycles like FY 2026–27).
- **Two-Level Validation**: Input-level sanitization plus safe rule-based business validation.
- **Multi-Stage Workflow Separation**: Distinct workflows for Submission $\rightarrow$ Validation $\rightarrow$ Auditor Review $\rightarrow$ Final Approval.
- **Target Tracking**: Real-time progress computation with positive/negative direction calculations.
- **Rich Analytics**: Visualizations filtered to eligible approved records using Recharts.
- **Report Generation**: Customizable ESG disclosure reports with JSON/print/PDF export.
- **Multi-Tenant Security**: Role-Based Access Control (RBAC) and strict organization data isolation.
- **Audit Trails**: Non-destructive logging preserving previous vs new values with actor and reason.

### 1.3 The 11 Core Modules
1. **Dashboard**: High-level overview, ESG scorecards, period switcher, recent submissions, target alerts.
2. **Data Collection**: Header-level submissions and line-item metric entries with evidence attachments and draft mode.
3. **Analytics**: Pillar-specific charts (Environmental, Social, Governance), trends, and data rollups.
4. **User Management**: Organization users, invitations, role assignments, and status toggles.
5. **Settings**: Organization profiles and individual user preferences with theme controls.
6. **Reporting**: Report builder, section selectors, approved-only data compiler, and report history.
7. **Target Management**: Baseline vs target value tracking, positive/negative direction progress, and health statuses.
8. **Data Validation**: Automated execution of business validation rules with blocking errors and warnings.
9. **Organization Management**: Multi-tenant registry, org details, and tenant isolation controls.
10. **Audit**: Dedicated auditor queue, finding logger, non-destructive value adjustments, and immutable audit logs.
11. **ESG Management**: Metric directory, predefined and custom categories, KPI flags, and calculation methods.

---

## 2. Technology Stack & Constraints

### 2.1 Technology Stack
| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18+ (Vite) | High performance client-side SPA |
| **Styling** | Tailwind CSS | Utility-first styling with CSS custom properties |
| **Icons** | Lucide React | Clean, minimalist SVG icons matching enterprise dashboard |
| **Routing** | React Router v6 | Client-side routing with role-guarded routes |
| **API Client** | Axios | Configured HTTP client with JWT interceptors |
| **State Management** | React `useState`, `useContext`, `useReducer` | Native React state architecture |
| **Charts** | Recharts | Composable responsive charts for ESG metrics |
| **Date Utilities** | date-fns | Date formatting, cycle calculations, and range checking |
| **Backend** | Node.js + Express.js | Modular REST API service |
| **Database** | MongoDB + Mongoose | Document database with schemas and indexes |
| **Auth** | JWT + bcrypt | Bearer access tokens, refresh tokens, and password hashing |
| **File Handling** | Multer | Local/cloud file uploads for audit evidence and reports |

### 2.2 Explicitly Excluded Libraries
The frontend **MUST NOT** use:
- ❌ **Zustand** (use native `useContext` and `useReducer`)
- ❌ **React Hook Form** (use controlled React components with `useState`)
- ❌ **Zod** (use plain JavaScript reusable validation utility functions)
- ❌ **TanStack Table** (use semantic HTML tables with direct React sorting, pagination, and filtering)

---

## 3. UI/UX & Design System (Based on Stitch Minimalist Design)

### 3.1 Design Principles
1. **Clarity & Simplicity**: Clean visual hierarchy, uncluttered surfaces, high contrast, readable typography.
2. **Theme Adaptability via CSS Global Variables**:
   All color tokens are injected into root CSS variables (`:root`):
   - `--primary`: Brand color (`#00513c` for Forest/Emerald ESG theme or `#dc2626` for Crimson Pulse)
   - `--primary-hover`: Hover states
   - `--primary-light`: 10% opacity tints for badges and highlights
   - `--background`: Base page background (`#f8fafc` or `#ecfdf4`)
   - `--surface`: Clean white container backgrounds (`#ffffff`)
   - `--surface-variant`: Light gray/green container fills (`#f1f5f9` or `#e0f2e9`)
   - `--border`: Subdued borders (`#e2e8f0` or `#bec9c2`)
   - `--text-main`: High emphasis text (`#0f172a` or `#101e19`)
   - `--text-muted`: Medium emphasis text (`#64748b` or `#3f4944`)
   - `--status-draft`: Slate `#64748b`
   - `--status-submitted`: Blue `#2563eb`
   - `--status-validated`: Emerald `#059669`
   - `--status-approved`: Green `#16a34a`
   - `--status-rejected`: Rose `#e11d48`
   - `--status-correction`: Amber `#d97706`

3. **Enterprise Layout Shell**:
   - Fixed left sidebar ($w-64$ / $w-72$) grouped by section:
     - **Workspace**: Dashboard, Data Collection (Submissions, New Entry), Analytics
     - **Performance**: Target Management, Reporting
     - **Compliance**: Data Validation, Audit Queue & Logs
     - **Configuration**: ESG Management (Categories & Metrics)
     - **Administration**: Organizations, User Management
     - **Preferences**: Settings
   - Fixed top appbar ($h-16$) with:
     - Sidebar toggle
     - Current Organization selector & Fiscal Cycle badge (e.g., `FY 2026–27 Active Cycle`)
     - Global search bar with `/` keyboard shortcut
     - Notifications bell with unread count pill
     - Theme selector (Emerald Forest vs Red Pulse)
     - Current user profile dropdown with role badge and logout action
   - Main content viewport with standard padding and responsive cards.

---

## 4. User Roles & Permission Matrix

1. **Platform Admin**: Cross-organizational access, platform configurations, global categories/metrics.
2. **Organization Admin**: Manages own organization, invites/manages users, configures organizational targets and settings.
3. **ESG Manager**: Creates/edits draft submissions, uploads evidence, resubmits records returned for correction, monitors targets and analytics.
4. **Auditor**: Reviews submitted and validated data, inspects evidence files, records audit findings, applies non-destructive value adjustments with reasons, and signs off on audits.

| Module | Platform Admin | Org Admin | ESG Manager | Auditor |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard** | Platform-wide | Own Org | Own Org | Own Org |
| **Data Collection** | Full | Full | Full | Read-Only |
| **Analytics** | Platform-wide | Full | Read-Only | Read-Only |
| **User Management** | Full | Own Org | None | None |
| **Settings** | Platform-wide | Own Org | Profile | Profile |
| **Reporting** | Full | Full | Full | Read-Only |
| **Target Management** | Full | Full | Full | Read-Only |
| **Data Validation** | Full | Full | Submit / Correct | Review Rules & Results |
| **Organization Mgmt** | Full | Own Org View | None | None |
| **Audit** | Full | View Findings | View Findings | Full Audit & Findings |
| **ESG Management** | Full | Configure Permitted | Read-Only | Read-Only |

---

## 5. End-to-End Workflow Architecture

```text
[ Data Entry / Draft ]
       │
       ▼
 [ Submitted ] ────────► [ Level 1 Input Validation (Payload / Range / Types) ]
       │                                     │
       │                                     ▼
       │                    [ Level 2 Business Rules Engine ]
       │                                     │
       │                       ┌─────────────┴─────────────┐
       │                       ▼                           ▼
       │                    [ Failed ]                  [ Passed ]
       │                       │                           │
       │                       ▼                           ▼
       │              [ Needs Correction ]           [ Validated ]
       │                       ▲                           │
       │                       │                           ▼
       │                (Resubmission)               [ Auditor Review ]
       │                       │                     (Inspect evidence /
       │                       │                      log findings)
       │                       │                           │
       │                       ├────── [ Auditor Return ] ─┤
       │                       │                           ▼
       │                       │                   [ Audit Signed Off ]
       │                       │                           │
       │                       │                           ▼
       │                       │                    [ Org Admin Approval ]
       │                       │                           │
       │                       └────── [ Rejected ] ───────┤
       │                                                   ▼
       ▼                                             [ APPROVED ]
(Audit Logged)                                             │
                                                           ▼
                                                [ Analytics & Reports ]
```

---

## 6. Database Collections & Relationships

1. `organizations`: Tenant metadata (name, industry, country, status).
2. `users`: Credentials (`passwordHash`), role, organization link, profile.
3. `roles`: Role definitions and permission sets.
4. `esgCategories`: Environmental, Social, Governance root pillars.
5. `esgMetrics`: Measured metrics (unit, isKPI, calculation method, category).
6. `reportingPeriods`: Organization-scoped reporting cycles (e.g. FY 2026-27).
7. `esgSubmissions`: Header document for a submission batch.
8. `esgData`: Metric-level data entries with values, evidence files, and statuses.
9. `validationRules`: Business rules attached to metrics (min, max, integer, format).
10. `validationResults`: Audit trail of rule execution against submissions.
11. `verifications`: Intermediate verification notes and checkmarks.
12. `esgTargets`: Baseline, target value, target date, and directionality.
13. `targetProgress`: Historical records of progress toward targets.
14. `esgReports`: Generated report metadata, summary metrics, and export links.
15. `audits`: Formal audit engagements and cycles.
16. `auditFindings`: Specific issues discovered during audit reviews.
17. `auditLogs`: Non-destructive mutation logs (`previousValue`, `newValue`, `actor`, `reason`).
18. `notifications`: In-app alerts for validation failures, assignments, and approvals.
19. `settings`: System and organization configuration parameters.

---

## 7. Acceptance Criteria
- [x] Secure JWT-based authentication with user roles & permissions.
- [x] Multi-tenant data isolation on all database queries.
- [x] All 11 core modules functional and accessible based on role.
- [x] Native React state without forbidden packages (Zustand, React Hook Form, Zod, TanStack Table).
- [x] Stitch-inspired minimalist design system with global CSS color variables.
- [x] Full submission, validation, audit finding, and approval lifecycle.
- [x] Non-destructive audit history with actor and change reason tracking.
- [x] Report generation using strictly approved ESG data records.
- [x] Seed data script with realistic ESG demo records and default users for all 4 roles.
