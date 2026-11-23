import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  BarChart3,
  Target,
  FileSpreadsheet,
  CheckCircle2,
  ShieldAlert,
  Sliders,
  Building2,
  Users,
  Settings,
  Lock,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, role, organization, activePeriod, theme } = useAuth();

  const isPlatformAdmin = role === 'platform_admin';
  const isOrgAdmin = role === 'org_admin';
  const hasAdminAccess = isPlatformAdmin || isOrgAdmin;

  const navSectionClass = "px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]";
  
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-[var(--primary)] text-white shadow-sm'
        : 'text-[var(--text-muted)] hover:bg-[var(--surface-container)] hover:text-[var(--text-main)]'
    }`;

  return (
    <aside
      className={`fixed left-0 top-0 h-screen w-64 md:w-72 bg-[var(--surface)] border-r border-[var(--border)] z-50 flex flex-col justify-between transition-transform duration-200 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      <div className="flex flex-col h-full overflow-y-auto">
        {/* Company Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-lg bg-[var(--primary-light)] border border-[var(--primary)]/30 flex items-center justify-center text-[var(--primary)] shrink-0 shadow-sm">
              <Building2 className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-bold text-[var(--text-main)] tracking-tight leading-tight truncate" title={organization?.name || 'ABC Industries Ltd.'}>
                {organization?.name || 'ABC Industries Ltd.'}
              </span>
              <span className="text-[10px] tracking-wider uppercase text-[var(--text-muted)] font-mono truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span>{organization?.code || 'ENTERPRISE'} · ESG Platform</span>
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Groups */}
        <nav className="flex flex-col px-3 py-3 gap-1">
          {/* Workspace */}
          <div className={navSectionClass}>Workspace</div>
          <NavLink to="/dashboard" className={linkClass} onClick={onClose}>
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span className="flex-1">Dashboard</span>
          </NavLink>

          <NavLink to="/submissions" className={linkClass} onClick={onClose}>
            <UploadCloud className="w-4 h-4 shrink-0" />
            <span className="flex-1">Submission</span>
          </NavLink>

          <NavLink to="/analytics" className={linkClass} onClick={onClose}>
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span className="flex-1">Analytics</span>
          </NavLink>

          {/* Performance */}
          <div className={navSectionClass}>Performance</div>
          <NavLink to="/targets" className={linkClass} onClick={onClose}>
            <Target className="w-4 h-4 shrink-0" />
            <span className="flex-1">Target Management</span>
          </NavLink>

          <NavLink to="/reporting" className={linkClass} onClick={onClose}>
            <FileSpreadsheet className="w-4 h-4 shrink-0" />
            <span className="flex-1">Reporting</span>
          </NavLink>

          {/* Compliance */}
          <div className={navSectionClass}>Compliance</div>
          <NavLink to="/validation" className={linkClass} onClick={onClose}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="flex-1">Data Validation</span>
          </NavLink>

          <NavLink to="/audit" className={linkClass} onClick={onClose}>
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span className="flex-1">Audit Queue & Logs</span>
          </NavLink>

          {/* Configuration */}
          <div className={navSectionClass}>Configuration</div>
          <NavLink to="/esg-management" className={linkClass} onClick={onClose}>
            <Sliders className="w-4 h-4 shrink-0" />
            <span className="flex-1">ESG Management</span>
          </NavLink>

          {/* Administration */}
          {hasAdminAccess && (
            <>
              <div className={navSectionClass}>Administration</div>
              {isPlatformAdmin && (
                <NavLink to="/organizations" className={linkClass} onClick={onClose}>
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span className="flex-1">Organizations</span>
                </NavLink>
              )}

              <NavLink to="/users" className={linkClass} onClick={onClose}>
                <Users className="w-4 h-4 shrink-0" />
                <span className="flex-1">User Management</span>
              </NavLink>
            </>
          )}

          {/* Preferences */}
          <div className={navSectionClass}>Preferences</div>
          <NavLink to="/settings" className={linkClass} onClick={onClose}>
            <Settings className="w-4 h-4 shrink-0" />
            <span className="flex-1">Settings</span>
          </NavLink>
        </nav>
      </div>

      {/* Bottom Fiscal Active Cycle Pill */}
      <div className="p-3 m-3 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse shrink-0"></span>
          <span className="text-xs text-[var(--text-main)] font-medium truncate">
            {activePeriod} Active Cycle
          </span>
        </div>
        <Lock className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
      </div>
    </aside>
  );
};

export default Sidebar;
