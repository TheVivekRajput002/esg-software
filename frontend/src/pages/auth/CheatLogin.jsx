import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle2,
  Building2,
  Users,
  FileCheck2,
  Check,
  ArrowLeft,
  Crown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CheatLogin = () => {
  const navigate = useNavigate();
  const { login, user: currentUser } = useAuth();
  const [loadingRole, setLoadingRole] = useState(null);
  const [error, setError] = useState('');

  const roles = [
    {
      roleCode: 'org_admin',
      roleTitle: 'Organization Admin',
      name: 'Elena Vance',
      email: 'admin@abc.com',
      title: 'VP of Corporate Sustainability',
      organization: 'ABC Industries Ltd.',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      accentColor: 'hover:border-emerald-500 hover:shadow-emerald-500/10',
      icon: Building2,
      iconBg: 'bg-emerald-100 text-emerald-700',
      description: 'Owns ABC Industries tenant. Responsible for final approval of validated submissions, managing organizational targets, and inviting team members.',
      capabilities: [
        'Approve or return submissions for correction',
        'Configure and manage organizational targets',
        'Invite & manage team user accounts',
        'Export verified corporate ESG reports'
      ]
    },
    {
      roleCode: 'esg_manager',
      roleTitle: 'ESG Manager',
      name: 'Marcus Hayes',
      email: 'manager@abc.com',
      title: 'Senior ESG Operations Lead',
      organization: 'ABC Industries Ltd.',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      accentColor: 'hover:border-blue-500 hover:shadow-blue-500/10',
      icon: Users,
      iconBg: 'bg-blue-100 text-blue-700',
      description: 'Operational manager on the ground. Collects environmental, social, and governance telemetry, attaches audit evidence, and manages draft batches.',
      capabilities: [
        'Create and edit draft submissions',
        'Input metric actuals & attach evidence files',
        'Submit batches for automated validation',
        'Log target progress telemetry'
      ]
    },
    {
      roleCode: 'auditor',
      roleTitle: 'Lead Auditor',
      name: 'Dr. Sophia Bennett',
      email: 'auditor@auditcorp.com',
      title: 'External Compliance Auditor',
      organization: 'Assurance Bureau (Auditing ABC Industries)',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      accentColor: 'hover:border-amber-500 hover:shadow-amber-500/10',
      icon: FileCheck2,
      iconBg: 'bg-amber-100 text-amber-700',
      description: 'Independent compliance auditor. Inspects evidence documents, performs non-destructive controlled value adjustments with mandatory justifications, and logs findings.',
      capabilities: [
        'Review submitted & validated ESG records',
        'Execute controlled data corrections with justifications',
        'Preserve non-destructive audit trail logs',
        'Log and resolve formal audit findings'
      ]
    },
    {
      roleCode: 'platform_admin',
      roleTitle: 'Platform Admin',
      name: 'Alexander Wright',
      email: 'admin@platform.com',
      title: 'Chief Platform Architect',
      organization: 'Platform-Wide (Cross-Tenant)',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
      accentColor: 'hover:border-purple-500 hover:shadow-purple-500/10',
      icon: Crown,
      iconBg: 'bg-purple-100 text-purple-700',
      description: 'Super administrator with platform-wide governance. Can manage multiple organizations, configure global ESG metrics and categories, and view all activity.',
      capabilities: [
        'Cross-tenant multi-organization access',
        'Register and archive tenant organizations',
        'Configure global ESG categories & KPI metrics',
        'Inspect system-wide audit activity'
      ]
    }
  ];

  const handleQuickLogin = async (roleEmail, roleCode) => {
    try {
      setLoadingRole(roleCode);
      setError('');
      const res = await login(roleEmail, 'password123');
      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.message || 'Auto-login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Auto-login failed');
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-start p-4 sm:p-8">
      <div className="w-full max-w-5xl flex flex-col gap-6">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Standard Login</span>
          </Link>

          {currentUser && (
            <div className="flex items-center gap-2 text-xs bg-[var(--surface-container)] px-3 py-1.5 rounded-lg border border-[var(--border)]">
              <span className="text-[var(--text-muted)]">Current session:</span>
              <span className="font-semibold text-[var(--text-main)]">{currentUser.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--primary-light)] text-[var(--primary)] font-bold uppercase">
                {currentUser.role}
              </span>
            </div>
          )}
        </div>

        {/* Page Banner */}
        <div className="text-center max-w-2xl mx-auto flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/30 flex items-center justify-center mb-3 shadow-xs">
            <Zap className="w-6 h-6 fill-amber-500 text-amber-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-main)] flex items-center gap-2">
            Cheat Login & Role Switcher
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1.5">
            Click any role card below to instantly authenticate and switch into that account without typing credentials or manually logging out.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs text-center max-w-md mx-auto">
            {error}
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
          {roles.map((r) => {
            const Icon = r.icon;
            const isCurrentActive = currentUser?.email === r.email;
            const isLoading = loadingRole === r.roleCode;

            return (
              <div
                key={r.roleCode}
                onClick={() => !isLoading && handleQuickLogin(r.email, r.roleCode)}
                className={`p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between group ${r.accentColor} ${
                  isCurrentActive ? 'ring-2 ring-[var(--primary)]' : ''
                }`}
              >
                <div>
                  {/* Card Top: Icon, Role Badge, Active Marker */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${r.iconBg}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${r.badgeColor}`}>
                          {r.roleTitle}
                        </span>
                        <h2 className="text-base font-bold text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors mt-1">
                          {r.name}
                        </h2>
                      </div>
                    </div>

                    {isCurrentActive && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Active Now
                      </span>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="mt-3 flex flex-col gap-0.5 text-xs">
                    <span className="text-[var(--text-muted)] font-medium">{r.title}</span>
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">{r.email}</span>
                    <span className="text-[11px] text-[var(--text-muted)] font-semibold mt-0.5">
                      {r.organization}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-muted)] mt-3 leading-relaxed border-t border-[var(--border)]/70 pt-3">
                    {r.description}
                  </p>

                  {/* Capabilities Checklist */}
                  <div className="mt-4 flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Key Permissions
                    </span>
                    {r.capabilities.map((cap, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-[var(--text-main)]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instant Login Action Button */}
                <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">
                    Password: <strong className="text-[var(--text-main)]">password123</strong>
                  </span>

                  <button
                    type="button"
                    disabled={isLoading}
                    className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold group-hover:opacity-95 transition-opacity flex items-center gap-2 shadow-sm"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Switching...</span>
                      </span>
                    ) : (
                      <>
                        <span>Login as {r.roleTitle}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="text-center text-xs text-[var(--text-muted)] py-4">
          All demo roles are isolated and authorized according to the PRD Role-Based Access Control matrix.
        </div>
      </div>
    </div>
  );
};

export default CheatLogin;
