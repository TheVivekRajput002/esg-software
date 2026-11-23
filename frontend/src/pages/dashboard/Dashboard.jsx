import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  FileCheck2,
  AlertTriangle,
  Target,
  Leaf,
  Users,
  ShieldCheck,
  ArrowRight,
  PlusCircle,
  Download,
  Calendar,
  CheckCircle2,
  Clock
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getProgressBarColor, getProgressTextColor, getProgressBadge } from '../../utils/progress';

const Dashboard = () => {
  const { user, organization, activePeriod } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/overview');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      setError('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [activePeriod]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Approved</span>;
      case 'validated':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Validated</span>;
      case 'submitted':
      case 'in_validation':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">Submitted</span>;
      case 'requires_correction':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">Correction Required</span>;
      case 'in_audit':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">In Audit</span>;
      case 'draft':
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">Draft</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-[var(--text-muted)]">Loading ESG telemetry...</span>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const catCounts = data?.categoryRecordCounts || {};
  const targets = data?.targets || [];
  const recentSubmissions = data?.recentSubmissions || [];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)]">
              ESG Overview & Performance Hub
            </h1>
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/30 font-mono">
              {data?.activePeriod || activePeriod}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Real-time environmental, social, and governance disclosures for {organization?.name || 'Enterprise'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/submissions"
            className="px-3.5 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-95 transition-opacity flex items-center gap-1.5 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Submission</span>
          </Link>

          <Link
            to="/reporting"
            className="px-3.5 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-main)] text-xs font-semibold hover:bg-[var(--surface-container)] transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-4 h-4 text-[var(--text-muted)]" />
            <span>Export Report</span>
          </Link>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Approved Records */}
        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Approved Submissions
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[var(--text-main)]">{metrics.approvedCount || 0}</div>
            <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
              <span>of {metrics.totalSubmissions || 0} total cycles</span>
              <span className="text-emerald-600 font-semibold">
                ({metrics.totalSubmissions ? Math.round((metrics.approvedCount / metrics.totalSubmissions) * 100) : 0}%)
              </span>
            </div>
          </div>
        </div>

        {/* Validation & Correction Queue */}
        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Requires Correction
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[var(--text-main)]">{metrics.correctionCount || 0}</div>
            <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
              <span>Submissions awaiting data adjustments</span>
            </div>
          </div>
        </div>

        {/* Target Health */}
        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Targets On Track
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[var(--text-main)]">
              {(metrics.targets?.onTrack || 0) + (metrics.targets?.achieved || 0)} / {metrics.targets?.total || 0}
            </div>
            <div className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 mt-0.5">
              <span>{metrics.targets?.achieved || 0} achieved, {metrics.targets?.onTrack || 0} progressing on schedule</span>
            </div>
          </div>
        </div>

        {/* Active Audit Queue */}
        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Open Audit Findings
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[var(--text-main)]">{metrics.openFindingsCount || 0}</div>
            <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
              <span>External & internal audit follow-ups</span>
            </div>
          </div>
        </div>
      </div>

      {/* ESG Pillars Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Environmental */}
        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Leaf className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[var(--text-main)]">Environmental (E)</h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {catCounts.environmental || 0} Records
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-2">
              Carbon emissions (Scope 1 & 2), electricity consumption, water withdrawal & renewable energy.
            </p>
          </div>
          <Link
            to="/analytics"
            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
          >
            <span>View Climate Analytics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Social */}
        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[var(--text-main)]">Social (S)</h3>
              </div>
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                {catCounts.social || 0} Records
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-2">
              Workforce gender diversity, employee turnover, training hours, and workplace safety incidents (LTIFR).
            </p>
          </div>
          <Link
            to="/analytics"
            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
          >
            <span>View Social Metrics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Governance */}
        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[var(--text-main)]">Governance (G)</h3>
              </div>
              <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                {catCounts.governance || 0} Records
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-2">
              Board diversity, independent directors ratio, anti-corruption training, and ethics hotline audits.
            </p>
          </div>
          <Link
            to="/analytics"
            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-purple-700 hover:underline"
          >
            <span>View Governance Metrics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Grid: Recent Submissions & Targets Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Submissions */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--border)]">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-main)]">Recent ESG Submissions</h2>
              <p className="text-[11px] text-[var(--text-muted)]">Data collection cycles and verification records</p>
            </div>
            <Link
              to="/submissions"
              className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                  <th className="py-2.5 font-semibold">Submission Name</th>
                  <th className="py-2.5 font-semibold">Period</th>
                  <th className="py-2.5 font-semibold">Status</th>
                  <th className="py-2.5 font-semibold">Submitted By</th>
                  <th className="py-2.5 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {recentSubmissions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-[var(--surface-container)] transition-colors">
                    <td className="py-3 font-medium text-[var(--text-main)] pr-2">
                      <div className="font-semibold">{sub.submissionName}</div>
                      <div className="text-[10px] text-[var(--text-muted)] truncate max-w-xs">{sub.description}</div>
                    </td>
                    <td className="py-3 text-[var(--text-muted)] whitespace-nowrap">
                      {sub.reportingPeriodId?.periodName || 'FY 2026–27'}
                    </td>
                    <td className="py-3 whitespace-nowrap">{getStatusBadge(sub.status)}</td>
                    <td className="py-3 text-[var(--text-muted)] whitespace-nowrap">
                      {sub.submittedBy?.name || 'Manager'}
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <Link
                        to="/submissions"
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-all"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
                {recentSubmissions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-xs text-[var(--text-muted)]">
                      No submissions recorded yet for this organization.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: ESG Targets Health */}
        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--border)]">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-main)]">Target Progress</h2>
              <p className="text-[11px] text-[var(--text-muted)]">Performance vs multi-year goals</p>
            </div>
            <Link
              to="/targets"
              className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {targets.map((t) => (
              <div key={t._id} className="p-3 rounded-lg bg-[var(--surface-container)] flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-main)] truncate max-w-[200px]" title={t.targetName}>
                    {t.targetName}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                      t.status === 'Achieved'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : t.status === 'On Track'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : 'bg-amber-100 text-amber-800 border-amber-200'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                  <span>Current: <strong className="text-[var(--text-main)]">{t.currentValue !== null ? t.currentValue : t.baselineValue} {t.unit}</strong></span>
                  <span>Goal: <strong className="text-[var(--text-main)]">{t.targetValue} {t.unit}</strong></span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[var(--surface-high)] rounded-full h-2 overflow-hidden mt-1">
                  <div
                    className={`${getProgressBarColor(t.progressPercentage)} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(100, Math.max(0, t.progressPercentage || 0))}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] mt-0.5">
                  <span>Progress achieved</span>
                  <span className={`font-semibold font-mono ${getProgressTextColor(t.progressPercentage)}`}>
                    {t.progressPercentage}%
                  </span>
                </div>
              </div>
            ))}

            {targets.length === 0 && (
              <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                No active targets configured.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
