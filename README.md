# ESG Enterprise Management Software

**Version:** 1.1  
**Architecture:** MERN Stack (MongoDB, Express.js, React.js, Node.js)  
**Design Reference:** Minimalist Enterprise Dashboard UI (`stitch_minimalist_website_clone`)

---

## 🚀 Quick Start Guide

### 1. Database (MongoDB)
Ensure MongoDB is running locally on port `27017` (e.g. via Docker `docker run -d -p 27017:27017 mongo:7`).

### 2. Backend (Express.js)
```bash
cd backend
npm install
npm run seed     # Seeds realistic ESG demo data & accounts
npm start        # Starts server on http://localhost:5000
```

### 3. Frontend (React.js + Tailwind CSS)
```bash
cd frontend
npm install
npm run dev      # Starts Vite dev server on http://localhost:3001
```

---

## 👥 Demo User Credentials

All accounts use password: **`password123`**

| Role | Email | Capabilities |
| :--- | :--- | :--- |
| **Platform Admin** | `admin@platform.com` | Cross-tenant superuser, platform settings, manage organizations & metrics |
| **Org Admin** | `admin@abc.com` | Manages ABC Industries team, approves verified submissions, sets targets |
| **ESG Manager** | `manager@abc.com` | Submits periodic ESG metrics, uploads evidence, manages drafts & targets |
| **Auditor** | `auditor@auditcorp.com` | Inspects data, logs findings, executes controlled audit adjustments |

---

## 🎨 Theme & Global Color Variables

The UI uses dynamic CSS global variables defined in `:root` and switchable via the Navbar or Settings page:
- **Forest Emerald Theme** (`data-theme="emerald"`): Standard ESG deep green (`#00513c`)
- **Crimson Pulse Theme** (`data-theme="red_pulse"`): High-contrast red (`#dc2626`)
- **Teal & Slate Theme** (`data-theme="slate"`): Minimalist corporate teal (`#0f766e`)

---

## 📦 Architecture & Library Constraints
- **Zero Forbidden Packages**:
  - ❌ No Zustand (Uses React `useState`, `useContext`)
  - ❌ No React Hook Form (Uses native React controlled forms)
  - ❌ No Zod (Uses plain JavaScript validation utility functions)
  - ❌ No TanStack Table (Uses semantic HTML tables with direct sorting, search, pagination)
- **11 Core Modules**:
  1. Dashboard
  2. Data Collection (Submissions, Line Items, Drafts)
  3. Analytics (Pillar rollups, Recharts charts, CSV export)
  4. User Management (Roles, Status, Invitations)
  5. Settings (Profile, Org details, Color theme)
  6. Reporting (Approved-data compilation, JSON export, Print)
  7. Target Management (Baseline vs Target, positive/negative direction calculations)
  8. Data Validation (Level 1 input checks + Level 2 safe business rules engine)
  9. Organization Management (Multi-tenant directory, soft archival)
  10. Audit (Audit queue, findings, non-destructive adjustments, immutable logs)
  11. ESG Management (Categories, KPIs, calculation methods, units)
