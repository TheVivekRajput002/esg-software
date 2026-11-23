import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  Calendar,
  Bell,
  LogOut,
  ChevronDown,
  User as UserIcon,
  Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ onToggleSidebar }) => {
  const { user, role, activePeriod, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotificationModal(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const getRoleBadge = (roleCode) => {
    switch (roleCode) {
      case 'platform_admin':
        return { label: 'Platform Admin', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'org_admin':
        return { label: 'Org Admin', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'esg_manager':
        return { label: 'ESG Manager', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'auditor':
        return { label: 'Auditor', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
      default:
        return { label: 'User', bg: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const roleInfo = getRoleBadge(role);

  return (
    <header className="fixed top-0 left-0 md:left-64 lg:left-72 right-0 h-16 bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--border)] z-40 flex items-center justify-between px-4 lg:px-6 gap-3 shadow-xs">
      {/* Left controls */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar"
          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-container)] hover:text-[var(--text-main)] transition-colors md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Fiscal Period Badge */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--surface-container)] border border-[var(--border)] text-[var(--text-main)] shadow-xs">
          <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
          <span className="text-xs font-semibold">{activePeriod}</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Cheat Login Button */}
        <Link
          to="/cheat-login"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-bold hover:border-amber-500 transition-colors shadow-xs"
          title="Instant Role Switcher / Cheat Login"
        >
          <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          <span className="hidden sm:inline">Cheat Login</span>
        </Link>

        {/* Notifications */}
        <div ref={notificationRef} className="relative">
          <button
            onClick={() => setShowNotificationModal((prev) => !prev)}
            className="relative p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-container)] hover:text-[var(--text-main)] transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--primary)] text-white text-[9px] font-bold">
              2
            </span>
          </button>

          {showNotificationModal && (
            <div className="absolute right-0 top-12 w-80 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)] mb-2">
                <span className="text-xs font-bold text-[var(--text-main)]">System Alerts</span>
                <span className="text-[10px] text-[var(--primary)] font-medium">All caught up</span>
              </div>
              <div className="flex flex-col gap-2 text-xs">
                <div className="p-2 rounded-lg bg-[var(--surface-container)] flex flex-col gap-0.5">
                  <span className="font-semibold text-emerald-700">Audit Signoff Completed</span>
                  <span className="text-[var(--text-muted)] text-[11px]">FY26-Q1 Energy disclosure successfully audited.</span>
                </div>
                <div className="p-2 rounded-lg bg-[var(--surface-container)] flex flex-col gap-0.5">
                  <span className="font-semibold text-amber-700">Action Required</span>
                  <span className="text-[var(--text-muted)] text-[11px]">1 metric entry flagged for correction in Q3 submission.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-[var(--border)] hidden sm:block"></div>

        {/* Profile Pill & Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setShowProfileMenu((prev) => !prev)}
            className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-lg hover:bg-[var(--surface-container)] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/30 flex items-center justify-center font-bold text-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-[var(--text-main)] leading-tight truncate max-w-[120px]">
                {user?.name || 'User'}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] leading-tight truncate">
                {roleInfo.label}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-12 w-56 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl py-2 z-50">
              <div className="px-3 py-2 border-b border-[var(--border)] flex flex-col">
                <span className="text-xs font-semibold text-[var(--text-main)]">{user?.name}</span>
                <span className="text-[11px] text-[var(--text-muted)] truncate">{user?.email}</span>
                <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border ${roleInfo.bg}`}>
                  {roleInfo.label}
                </span>
              </div>
              <Link
                to="/cheat-login"
                onClick={() => setShowProfileMenu(false)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-colors border-b border-[var(--border)]"
              >
                <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                Cheat Login / Switch Role
              </Link>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;