import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  Calendar,
  Bell,
  LogOut,
  ChevronDown,
  User as UserIcon,
  Zap,
  ShieldCheck,
  PlusCircle,
  Send,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const formatTimeAgo = (isoString) => {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const Navbar = ({ onToggleSidebar }) => {
  const { user, role, activePeriod, logout } = useAuth();
  const {
    notifications,
    unreadCount,
    totalCount,
    markAsRead,
    markAllAsRead,
    clearAllNotifications
  } = useToast();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notifFilter, setNotifFilter] = useState('all'); // 'all' | 'verified' | 'created' | 'submitted' | 'success' | 'error'

  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  const filteredNotifications = notifications.filter((n) => {
    if (notifFilter === 'all') return true;
    return n.category === notifFilter;
  });

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

        {/* Total Notifications Dropdown */}
        <div ref={notificationRef} className="relative">
          <button
            onClick={() => setShowNotificationModal((prev) => !prev)}
            className="relative p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-container)] hover:text-[var(--text-main)] transition-colors"
            title="Total Notifications"
          >
            <Bell className="w-4 h-4" />
            {totalCount > 0 && (
              <span className={`absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full text-white text-[9px] font-bold shadow-xs ${
                unreadCount > 0 ? 'bg-[var(--primary)] animate-pulse' : 'bg-slate-500'
              }`}>
                {unreadCount > 0 ? unreadCount : totalCount}
              </span>
            )}
          </button>

          {showNotificationModal && (
            <div className="absolute right-0 top-12 w-80 sm:w-96 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-4 z-50 flex flex-col gap-3">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--text-main)]">Total Notifications</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[var(--primary)]/10 text-[var(--primary)]">
                      {totalCount} Total
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[var(--primary)] font-semibold hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                  {totalCount > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-[var(--text-muted)] hover:text-red-600 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-semibold border-b border-[var(--border)]/60">
                {['all', 'verified', 'created', 'submitted', 'success', 'error'].map((cat) => {
                  const count = cat === 'all'
                    ? totalCount
                    : notifications.filter((n) => n.category === cat).length;

                  return (
                    <button
                      key={cat}
                      onClick={() => setNotifFilter(cat)}
                      className={`px-2 py-0.5 rounded capitalize whitespace-nowrap transition-colors ${
                        notifFilter === cat
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-[var(--surface-container)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Notification List */}
              <div className="flex flex-col gap-2 max-h-80 overflow-y-auto text-xs pr-0.5">
                {filteredNotifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-1.5">
                    <Bell className="w-6 h-6 opacity-40 text-[var(--text-muted)]" />
                    <span>No notifications matching selected filter.</span>
                  </div>
                ) : (
                  filteredNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                        n.read
                          ? 'bg-[var(--surface-container)]/40 border-[var(--border)] opacity-75'
                          : 'bg-[var(--surface-container)] border-[var(--border)] shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {n.category === 'verified' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                          {n.category === 'created' && <PlusCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                          {n.category === 'submitted' && <Send className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                          {n.category === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                          {n.category === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                          {n.category === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />}

                          <span className="font-bold text-xs text-[var(--text-main)] truncate">{n.title}</span>
                          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                            n.category === 'verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            n.category === 'created' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            n.category === 'submitted' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                            n.category === 'success' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                            n.category === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {n.category}
                          </span>
                        </div>

                        <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap shrink-0">
                          {formatTimeAgo(n.timestamp)}
                        </span>
                      </div>

                      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed pl-5">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
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