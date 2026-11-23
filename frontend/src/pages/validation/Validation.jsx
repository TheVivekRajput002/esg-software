import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  FileCheck2,
  Check,
  X,
  FileText,
  Calendar,
  User,
  ShieldCheck,
  CheckSquare,
  Square,
  RefreshCw,
  ArrowRight,
  Eye,
  Send
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getProgressBarColor, getProgressTextColor } from '../../utils/progress';

const Validation = () => {
  const { user, role, activePeriod } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({
    pendingCount: 0,
    validatedCount: 0,
    correctionCount: 0,
    totalItemsVerified: 0
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [search, setSearch] = useState('');

  // Manual Review & Validation Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [lineItems, setLineItems] = useState([]);
  const [checkedItemIds, setCheckedItemIds] = useState(new Set());
  const [validatorNotes, setValidatorNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Return for Correction Modal
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('');

  const canValidate = role === 'platform_admin' || role === 'org_admin' || role === 'esg_manager';

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await api.get('/validation/queue', {
        params: { status: statusFilter, search }
      });
      if (res.data.success) {
        setSubmissions(res.data.data.submissions);
        setStats(res.data.data.stats);
      }
    } catch (err) {
      console.error('Failed to load validation queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [statusFilter, search]);

  // Open inspection modal for a submission
  const handleOpenReview = async (subId) => {
    try {
      setProcessing(true);
      const res = await api.get(`/validation/submission/${subId}`);
      if (res.data.success) {
        const { submission, items } = res.data.data;
        setActiveSubmission(submission);
        setLineItems(items);
        setValidatorNotes(submission.validationNotes || '');

        // Pre-check items that are already marked validated, or all if none yet
        const preChecked = new Set();
        items.forEach((it) => {
          if (it.status === 'validated' || it.isValidated || submission.status === 'submitted') {
            preChecked.add(it._id);
          }
        });
        setCheckedItemIds(preChecked);
        setIsModalOpen(true);
      }
    } catch (err) {
      alert('Failed to load submission data for validation');
    } finally {
      setProcessing(false);
    }
  };

  // Toggle individual line item checkbox
  const toggleItemCheck = (itemId) => {
    const updated = new Set(checkedItemIds);
    if (updated.has(itemId)) {
      updated.delete(itemId);
    } else {
      updated.add(itemId);
    }
    setCheckedItemIds(updated);
  };

  // Select all or deselect all items
  const toggleSelectAll = () => {
    if (checkedItemIds.size === lineItems.length) {
      setCheckedItemIds(new Set());
    } else {
      setCheckedItemIds(new Set(lineItems.map((it) => it._id)));
    }
  };

  // Confirm Manual Validation & Tick Submission as Validated
  const handleConfirmValidation = async (subId) => {
    if (!subId) return;
    try {
      setProcessing(true);
      const res = await api.post(`/validation/submission/${subId}/confirm`, {
        validatorNotes,
        itemIds: Array.from(checkedItemIds)
      });
      if (res.data.success) {
        setIsModalOpen(false);
        setActiveSubmission(null);
        fetchQueue();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm validation');
    } finally {
      setProcessing(false);
    }
  };

  // Flag and return submission for correction
  const handleFlagForCorrection = async () => {
    if (!activeSubmission || !flagReason.trim()) {
      alert('Please enter a reason or note explaining why correction is required.');
      return;
    }

    try {
      setProcessing(true);
      const res = await api.post(`/validation/submission/${activeSubmission._id}/flag`, {
        reason: flagReason
      });
      if (res.data.success) {
        setIsFlagModalOpen(false);
        setIsModalOpen(false);
        setFlagReason('');
        setActiveSubmission(null);
        fetchQueue();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to flag submission');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'validated':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Validated
          </span>
        );
      case 'submitted':
      case 'in_validation':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-600" /> Pending Check
          </span>
        );
      case 'requires_correction':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Requires Correction
          </span>
        );
      case 'approved':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" /> Approved
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)]">
            Data Validation & Verification Console
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Human-in-the-loop assurance: Review submitted ESG records, cross-check supporting evidence, and manually tick data as validated.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchQueue}
            className="px-3.5 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-main)] text-xs font-semibold hover:bg-[var(--surface-container)] transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending */}
        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Pending Manual Review
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[var(--text-main)]">{stats.pendingCount}</div>
            <span className="text-[11px] text-blue-600 font-semibold mt-0.5 block">
              Batches awaiting validator signoff
            </span>
          </div>
        </div>

        {/* Validated */}
        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Validated & Verified
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[var(--text-main)]">{stats.validatedCount}</div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
              Checked & ready for audit / approval
            </span>
          </div>
        </div>

        {/* Flagged */}
        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Flagged for Correction
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[var(--text-main)]">{stats.correctionCount}</div>
            <span className="text-[11px] text-amber-600 font-semibold mt-0.5 block">
              Returned to submitter with notes
            </span>
          </div>
        </div>

        {/* Total Line Items Verified */}
        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Verified Metric Items
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[var(--text-main)]">{stats.totalItemsVerified}</div>
            <span className="text-[11px] text-purple-600 font-semibold mt-0.5 block">
              Individual data points validated
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--surface-container)] border border-[var(--border)] text-xs overflow-x-auto">
          {[
            { id: 'pending', label: 'Pending Validation' },
            { id: 'validated', label: 'Validated' },
            { id: 'requires_correction', label: 'Requires Correction' },
            { id: 'all', label: 'All Submissions' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-[var(--surface)] text-[var(--text-main)] shadow-xs border border-[var(--border)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search batches by title..."
            className="w-full pl-9 pr-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
      </div>

      {/* Submissions Validation Queue Table */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[var(--surface-container)] border-b border-[var(--border)] text-[var(--text-muted)]">
                <th className="py-3 px-4 font-semibold">Submission Batch</th>
                <th className="py-3 px-4 font-semibold">Reporting Cycle</th>
                <th className="py-3 px-4 font-semibold">Submitted By</th>
                <th className="py-3 px-4 font-semibold">Metric Items</th>
                <th className="py-3 px-4 font-semibold">Validation Status</th>
                <th className="py-3 px-4 font-semibold">Validator</th>
                <th className="py-3 px-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[var(--text-muted)]">
                    Loading validation queue...
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[var(--text-muted)]">
                    No submissions currently found in this queue.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => {
                  const validationPercent = sub.totalItems > 0
                    ? Math.round((sub.validatedItemsCount / sub.totalItems) * 100)
                    : 0;

                  return (
                    <tr key={sub._id} className="hover:bg-[var(--surface-container)]/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-[var(--text-main)]">{sub.submissionName}</span>
                          <span className="text-[11px] text-[var(--text-muted)] truncate max-w-xs">
                            Source: {sub.source || 'Manual Entry'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--text-main)]">
                          <Calendar className="w-3 h-3 text-[var(--primary)]" />
                          {sub.reportingPeriodId?.periodName || 'Active Cycle'}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[var(--surface-high)] text-[var(--text-main)] flex items-center justify-center font-bold text-[10px]">
                            {sub.submittedBy?.name?.charAt(0) || 'U'}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-[var(--text-main)] text-[11px]">
                              {sub.submittedBy?.name || 'Submitter'}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)]">
                              {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'Recent'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 min-w-[120px]">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-[var(--text-main)]">
                              {sub.validatedItemsCount} / {sub.totalItems} items
                            </span>
                            <span className={`font-mono font-bold ${getProgressTextColor(validationPercent)}`}>
                              {validationPercent}%
                            </span>
                          </div>
                          <div className="w-full bg-[var(--surface-high)] rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`${getProgressBarColor(validationPercent)} h-1.5 rounded-full`}
                              style={{ width: `${validationPercent}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">{getStatusBadge(sub.status)}</td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {sub.validatedBy ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-emerald-700 text-[11px] flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              {sub.validatedBy.name}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)]">
                              {sub.validatedAt ? new Date(sub.validatedAt).toLocaleDateString() : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[var(--text-muted)] italic">Unverified</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenReview(sub._id)}
                          className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] text-xs font-semibold transition-all inline-flex items-center gap-1.5 shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect & Validate</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Manual Inspection & Item-Level Validation */}
      {isModalOpen && activeSubmission && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-container)]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[var(--text-main)]">
                    Manual Data Verification: {activeSubmission.submissionName}
                  </h3>
                  {getStatusBadge(activeSubmission.status)}
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Reporting Cycle: {activeSubmission.reportingPeriodId?.periodName} · Source: {activeSubmission.source} · Submitted by: {activeSubmission.submittedBy?.name}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-high)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4 text-xs">
              {/* Methodology Notes */}
              {activeSubmission.description && (
                <div className="p-3 rounded-xl bg-[var(--surface-container)] border border-[var(--border)]">
                  <span className="font-semibold text-[var(--text-main)] block mb-0.5">
                    Submitter Context & Methodology Notes:
                  </span>
                  <p className="text-[var(--text-muted)]">{activeSubmission.description}</p>
                </div>
              )}

              {/* Items Table with Checkboxes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-[var(--text-main)] text-sm">
                      Reported Line Items ({lineItems.length})
                    </h4>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      Tick items to mark as verified accurate
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface-container)] text-xs font-semibold hover:border-[var(--primary)] transition-colors flex items-center gap-1.5"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-[var(--primary)]" />
                    <span>
                      {checkedItemIds.size === lineItems.length ? 'Deselect All' : 'Tick All Items'}
                    </span>
                  </button>
                </div>

                <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[var(--surface-container)] border-b border-[var(--border)] text-[var(--text-muted)]">
                        <th className="py-2.5 px-3 w-10 text-center font-semibold">Tick</th>
                        <th className="py-2.5 px-3 font-semibold">Metric Name</th>
                        <th className="py-2.5 px-3 font-semibold">Pillar</th>
                        <th className="py-2.5 px-3 font-semibold">Value</th>
                        <th className="py-2.5 px-3 font-semibold">Unit</th>
                        <th className="py-2.5 px-3 font-semibold">Evidence Attachment</th>
                        <th className="py-2.5 px-3 font-semibold">Line Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {lineItems.map((item) => {
                        const isChecked = checkedItemIds.has(item._id);

                        return (
                          <tr
                            key={item._id}
                            className={`transition-colors cursor-pointer ${
                              isChecked ? 'bg-emerald-50/30 hover:bg-emerald-50/50' : 'hover:bg-[var(--surface-container)]'
                            }`}
                            onClick={() => toggleItemCheck(item._id)}
                          >
                            <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleItemCheck(item._id)}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                            </td>

                            <td className="py-2.5 px-3 font-semibold text-[var(--text-main)]">
                              {item.metricId?.name || 'ESG Metric'}
                            </td>

                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--surface-container)] border border-[var(--border)]">
                                {item.categoryId?.name || 'Environmental'}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 font-mono font-bold text-sm text-[var(--text-main)]">
                              {item.value}
                            </td>

                            <td className="py-2.5 px-3 text-[var(--text-muted)]">{item.unit}</td>

                            <td className="py-2.5 px-3">
                              {item.evidenceFiles && item.evidenceFiles.length > 0 ? (
                                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  <FileText className="w-3.5 h-3.5" />
                                  {item.evidenceFiles[0]}
                                </span>
                              ) : (
                                <span className="text-[var(--text-muted)] italic">No file attached</span>
                              )}
                            </td>

                            <td className="py-2.5 px-3">
                              {isChecked ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <Check className="w-3 h-3" /> Validated
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                  Pending Tick
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Validator Notes & Signoff */}
              <div className="flex flex-col gap-1.5 mt-2">
                <label className="font-semibold text-[var(--text-main)]">
                  Validator Verification Notes & Quality Signoff:
                </label>
                <textarea
                  rows={2}
                  value={validatorNotes}
                  onChange={(e) => setValidatorNotes(e.target.value)}
                  placeholder="Record cross-checking details, invoice references, or verification remarks..."
                  className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              {/* Display if already validated */}
              {activeSubmission.validatedBy && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold">Validated by: {activeSubmission.validatedBy?.name}</span>
                    <span className="block text-[11px] text-emerald-700">
                      Timestamp: {new Date(activeSubmission.validatedAt).toLocaleString()}
                    </span>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3">
              {canValidate ? (
                <button
                  type="button"
                  onClick={() => setIsFlagModalOpen(true)}
                  className="px-3.5 py-2 rounded-lg border border-red-300 bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition-colors flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Flag for Correction</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[var(--border)] text-xs font-semibold hover:bg-[var(--surface-container)]"
                >
                  Close
                </button>

                {canValidate && (
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => handleConfirmValidation(activeSubmission._id)}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {processing ? 'Saving...' : `Tick & Mark as Validated (${checkedItemIds.size}/${lineItems.length})`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flag / Return for Correction Modal */}
      {isFlagModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-60">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
              <h3 className="text-sm font-bold text-red-700 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Return Submission for Correction
              </h3>
              <button onClick={() => setIsFlagModalOpen(false)} className="text-[var(--text-muted)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)] mb-3">
              Describe what was identified as incorrect, incomplete, or missing in this submission. The submitter will be notified to revise the data.
            </p>

            <textarea
              rows={4}
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="e.g. Invoiced kWh in line item #2 does not match the attached utility statement PDF. Please verify and re-enter."
              className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs focus:outline-none focus:border-red-500 mb-4"
              required
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsFlagModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border text-xs font-semibold hover:bg-[var(--surface-container)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={handleFlagForCorrection}
                className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
              >
                {processing ? 'Flagging...' : 'Send for Correction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Validation;
