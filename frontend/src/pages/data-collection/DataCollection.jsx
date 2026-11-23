import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  X,
  Trash2,
  Check,
  Send,
  Eye,
  RefreshCw,
  FileCheck,
  ShieldCheck,
  Pencil
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DataCollection = () => {
  const { user, role, activePeriod } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [periods, setPeriods] = useState([]);

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingSubmissionId, setEditingSubmissionId] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [submissionDetails, setSubmissionDetails] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [actionReason, setActionReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // New Submission Form State (Controlled with useState)
  const [formHeader, setFormHeader] = useState({
    submissionName: '',
    reportingPeriodId: '',
    source: 'Manual Entry',
    description: '',
    isDraft: false
  });

  const [formItems, setFormItems] = useState([
    { metricId: '', categoryId: '', value: '', unit: '', description: '', evidenceFiles: [] }
  ]);
  const [formErrors, setFormErrors] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canApprove = role === 'platform_admin' || role === 'org_admin';
  const canSubmit = role === 'platform_admin' || role === 'org_admin' || role === 'esg_manager';
  const canAudit = role === 'platform_admin' || role === 'auditor';

  // Load submissions list
  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/submissions', {
        params: { status: statusFilter, search }
      });
      if (res.data.success) {
        setSubmissions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load submissions', err);
    } finally {
      setLoading(false);
    }
  };

  // Load categories, metrics & periods for form dropdowns
  const fetchMetadata = async () => {
    try {
      const [catRes, metRes, perRes] = await Promise.all([
        api.get('/esg/categories'),
        api.get('/esg/metrics'),
        api.get('/reporting-periods')
      ]);
      if (catRes.data.success) setCategories(catRes.data.data);
      if (metRes.data.success) setMetrics(metRes.data.data);
      if (perRes.data.success) {
        setPeriods(perRes.data.data);
        if (perRes.data.data.length > 0 && !formHeader.reportingPeriodId) {
          const current = perRes.data.data.find(p => p.isCurrent) || perRes.data.data[0];
          setFormHeader(prev => ({ ...prev, reportingPeriodId: current._id }));
        }
      }
    } catch (err) {
      console.error('Failed to load metadata', err);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter, search]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const openDetails = async (subId) => {
    try {
      const res = await api.get(`/submissions/${subId}`);
      if (res.data.success) {
        setSubmissionDetails(res.data.data);
        setIsDetailsOpen(true);
      }
    } catch (err) {
      alert('Failed to load submission details');
    }
  };

  const handleMetricSelect = (index, metricId) => {
    const selected = metrics.find(m => m._id === metricId);
    const updated = [...formItems];
    updated[index].metricId = metricId;
    if (selected) {
      updated[index].unit = selected.unit;
      updated[index].categoryId = selected.categoryId?._id || selected.categoryId;
    }
    setFormItems(updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...formItems];
    updated[index][field] = value;
    setFormItems(updated);
  };

  const addFormRow = () => {
    setFormItems([...formItems, { metricId: '', categoryId: '', value: '', unit: '', description: '', evidenceFiles: [] }]);
  };

  const removeFormRow = (index) => {
    if (formItems.length > 1) {
      setFormItems(formItems.filter((_, i) => i !== index));
    }
  };

  const handleOpenNewModal = () => {
    setEditingSubmissionId(null);
    setFormHeader({
      submissionName: '',
      reportingPeriodId: periods.find(p => p.isCurrent)?._id || (periods[0]?._id || ''),
      source: 'Manual Entry',
      description: '',
      isDraft: false
    });
    setFormItems([{ metricId: '', categoryId: '', value: '', unit: '', description: '', evidenceFiles: [] }]);
    setFormErrors('');
    setIsNewModalOpen(true);
  };

  const handleOpenEditDraft = async (subId) => {
    try {
      const res = await api.get(`/submissions/${subId}`);
      if (res.data.success) {
        const sub = res.data.data.submission;
        const items = res.data.data.items || [];
        setEditingSubmissionId(sub._id);
        setFormHeader({
          submissionName: sub.submissionName || '',
          reportingPeriodId: sub.reportingPeriodId?._id || sub.reportingPeriodId || '',
          source: sub.source || 'Manual Entry',
          description: sub.description || '',
          isDraft: true
        });
        if (items.length > 0) {
          setFormItems(
            items.map((it) => ({
              metricId: it.metricId?._id || it.metricId || '',
              categoryId: it.categoryId?._id || it.categoryId || it.metricId?.categoryId?._id || it.metricId?.categoryId || '',
              value: it.value !== undefined && it.value !== null ? String(it.value) : '',
              unit: it.unit || it.metricId?.unit || '',
              description: it.description || '',
              evidenceFiles: Array.isArray(it.evidenceFiles) ? it.evidenceFiles : []
            }))
          );
        } else {
          setFormItems([{ metricId: '', categoryId: '', value: '', unit: '', description: '', evidenceFiles: [] }]);
        }
        setFormErrors('');
        setIsDetailsOpen(false);
        setIsNewModalOpen(true);
      }
    } catch (err) {
      alert('Failed to load draft submission for editing');
    }
  };

  // Plain JS validation before submit
  const handleCreateSubmission = async (e, asDraft = false) => {
    if (e && e.preventDefault) e.preventDefault();
    setFormErrors('');

    const isSavingAsDraft = Boolean(asDraft);

    if (!formHeader.submissionName.trim()) {
      setFormErrors('Submission name is required.');
      return;
    }

    if (!formHeader.reportingPeriodId) {
      setFormErrors('Please select a reporting period.');
      return;
    }

    // When submitting for validation (not saving as draft), validate all metric items
    if (!isSavingAsDraft) {
      if (formItems.length === 0 || !formItems.some(it => it.metricId)) {
        setFormErrors('Please select at least one metric line item before submitting.');
        return;
      }
      for (let i = 0; i < formItems.length; i++) {
        const it = formItems[i];
        if (!it.metricId) {
          setFormErrors(`Item #${i + 1} is missing a selected metric.`);
          return;
        }
        if (it.value === '' || isNaN(Number(it.value))) {
          setFormErrors(`Item #${i + 1} has an invalid or missing numeric value.`);
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        submissionName: formHeader.submissionName,
        reportingPeriodId: formHeader.reportingPeriodId,
        source: formHeader.source,
        description: formHeader.description,
        isDraft: isSavingAsDraft,
        items: formItems
          .filter(it => it.metricId)
          .map(it => ({
            ...it,
            value: it.value !== '' ? Number(it.value) : 0
          }))
      };

      let res;
      if (editingSubmissionId) {
        res = await api.patch(`/submissions/${editingSubmissionId}`, payload);
      } else {
        res = await api.post('/submissions', payload);
      }

      if (res.data.success) {
        setIsNewModalOpen(false);
        setEditingSubmissionId(null);
        // Reset form
        setFormHeader({
          submissionName: '',
          reportingPeriodId: periods.find(p => p.isCurrent)?._id || '',
          source: 'Manual Entry',
          description: '',
          isDraft: false
        });
        setFormItems([{ metricId: '', categoryId: '', value: '', unit: '', description: '', evidenceFiles: [] }]);
        fetchSubmissions();
      }
    } catch (err) {
      setFormErrors(err.response?.data?.message || (editingSubmissionId ? 'Failed to update draft submission' : 'Failed to create submission'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    handleCreateSubmission(e, true);
  };

  const handleSubmitFinal = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    handleCreateSubmission(e, false);
  };

  // Actions
  const handleApprove = async (subId) => {
    if (!window.confirm('Are you sure you want to approve this submission? Approved data will become eligible for analytics and official reporting.')) return;
    try {
      const res = await api.post(`/submissions/${subId}/approve`, { reason: 'Admin approval' });
      if (res.data.success) {
        alert('Submission approved successfully!');
        setIsDetailsOpen(false);
        fetchSubmissions();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Approval failed');
    }
  };

  const handleReject = async () => {
    if (!actionReason.trim()) {
      alert('Please state a reason for returning this submission for correction.');
      return;
    }
    try {
      const res = await api.post(`/submissions/${selectedSubmission._id}/reject`, { reason: actionReason });
      if (res.data.success) {
        alert('Submission returned for correction.');
        setIsRejectModalOpen(false);
        setIsDetailsOpen(false);
        setActionReason('');
        fetchSubmissions();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Rejection failed');
    }
  };

  const handleSubmitForReview = async (subId) => {
    try {
      const res = await api.post(`/submissions/${subId}/submit`);
      if (res.data.success) {
        alert('Submission submitted and validated!');
        setIsDetailsOpen(false);
        fetchSubmissions();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Submission failed');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1"><Check className="w-3 h-3" /> Approved</span>;
      case 'validated':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Validated</span>;
      case 'submitted':
      case 'in_validation':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1"><Clock className="w-3 h-3" /> Submitted</span>;
      case 'requires_correction':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Correction Needed</span>;
      case 'in_audit':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> In Audit</span>;
      case 'draft':
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1"><FileText className="w-3 h-3" /> Draft</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)]">
            ESG Submissions
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Submit, track, validate, and audit periodic environmental, social, and governance disclosures.
          </p>
        </div>

        {canSubmit && (
          <button
            onClick={handleOpenNewModal}
            className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-95 transition-opacity flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Submission</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs">
          {['all', 'draft', 'submitted', 'validated', 'requires_correction', 'in_audit', 'approved'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-medium capitalize whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-[var(--primary)] text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-container)] hover:text-[var(--text-main)]'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search submission batch..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
      </div>

      {/* Submissions Table (Semantic HTML with plain React state) */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[var(--surface-container)] border-b border-[var(--border)] text-[var(--text-muted)]">
                <th className="py-3 px-4 font-semibold">Submission Name</th>
                <th className="py-3 px-4 font-semibold">Reporting Period</th>
                <th className="py-3 px-4 font-semibold">Records</th>
                <th className="py-3 px-4 font-semibold">Source</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Submitted By</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[var(--text-muted)]">
                    Loading submissions records...
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[var(--text-muted)]">
                    No submissions found matching criteria.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-[var(--surface-container)] transition-colors">
                    <td className="py-3 px-4 font-medium text-[var(--text-main)]">
                      <div className="font-semibold">{sub.submissionName}</div>
                      <div className="text-[11px] text-[var(--text-muted)] truncate max-w-xs">{sub.description}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-[var(--text-muted)]">
                      {sub.reportingPeriodId?.periodName || 'N/A'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono">
                      <span className="px-2 py-0.5 rounded bg-[var(--surface-high)] text-[var(--text-main)] text-[11px]">
                        {sub.recordCount || 0} metrics
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-[var(--text-muted)]">
                      {sub.source}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(sub.status)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-[var(--text-muted)]">
                      {sub.submittedBy?.name || 'Staff'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {['draft', 'requires_correction'].includes(sub.status) && canSubmit && (
                          <button
                            onClick={() => handleOpenEditDraft(sub._id)}
                            title="Edit Draft"
                            className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit Draft</span>
                          </button>
                        )}
                        <button
                          onClick={() => openDetails(sub._id)}
                          className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] hover:border-[var(--primary)] text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create New Submission */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-container)]">
              <div>
                <h3 className="text-base font-bold text-[var(--text-main)]">
                  {editingSubmissionId ? 'Edit Draft ESG Submission' : 'New ESG Data Submission Batch'}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {editingSubmissionId
                    ? 'Modify header and line items in this draft before submitting for validation.'
                    : 'Enter header and metric line items with supporting evidence.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsNewModalOpen(false);
                  setEditingSubmissionId(null);
                }}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-high)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitFinal} className="p-5 overflow-y-auto flex-1 flex flex-col gap-4 text-xs">
              {formErrors && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formErrors}</span>
                </div>
              )}

              {/* Header Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-main)] mb-1">
                    Submission Batch Title *
                  </label>
                  <input
                    type="text"
                    value={formHeader.submissionName}
                    onChange={(e) => setFormHeader({ ...formHeader, submissionName: e.target.value })}
                    placeholder="e.g. FY26-Q3 Facility Energy & Climate Ledger"
                    className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-main)] mb-1">
                    Reporting Cycle *
                  </label>
                  <select
                    value={formHeader.reportingPeriodId}
                    onChange={(e) => setFormHeader({ ...formHeader, reportingPeriodId: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)]"
                    required
                  >
                    <option value="">Select Cycle...</option>
                    {periods.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.periodName} ({p.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[var(--text-main)] mb-1">
                    Data Source
                  </label>
                  <input
                    type="text"
                    value={formHeader.source}
                    onChange={(e) => setFormHeader({ ...formHeader, source: e.target.value })}
                    placeholder="e.g. SCADA Meters, Utility Invoices, HRIS"
                    className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[var(--text-main)] mb-1">
                    Description & Methodology Notes
                  </label>
                  <textarea
                    rows={2}
                    value={formHeader.description}
                    onChange={(e) => setFormHeader({ ...formHeader, description: e.target.value })}
                    placeholder="Provide context regarding metering assumptions, site coverage or calculation methods..."
                    className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              {/* Line Items Section */}
              <div className="mt-2 pt-4 border-t border-[var(--border)]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-[var(--text-main)]">Measured ESG Metrics Line Items</h4>
                  <button
                    type="button"
                    onClick={addFormRow}
                    className="px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface-container)] hover:border-[var(--primary)] text-[var(--primary)] text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Metric Item</span>
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {formItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-container)] flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-muted)]">
                        <span>Metric Line #{idx + 1}</span>
                        {formItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFormRow(idx)}
                            className="text-red-600 hover:text-red-700 p-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        {/* Metric Selector */}
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-[var(--text-muted)] font-medium mb-0.5">
                            Metric *
                          </label>
                          <select
                            value={item.metricId}
                            onChange={(e) => handleMetricSelect(idx, e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs"
                            required
                          >
                            <option value="">Select Metric...</option>
                            {metrics.map((m) => (
                              <option key={m._id} value={m._id}>
                                [{m.categoryId?.name?.charAt(0) || 'E'}] {m.name} ({m.unit})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Numeric Value */}
                        <div>
                          <label className="block text-[10px] text-[var(--text-muted)] font-medium mb-0.5">
                            Actual Value *
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={item.value}
                            onChange={(e) => handleItemChange(idx, 'value', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2.5 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs"
                            required
                          />
                        </div>

                        {/* Unit */}
                        <div>
                          <label className="block text-[10px] text-[var(--text-muted)] font-medium mb-0.5">
                            Unit
                          </label>
                          <input
                            type="text"
                            value={item.unit}
                            readOnly
                            className="w-full px-2.5 py-1.5 bg-[var(--surface-high)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-muted)] cursor-not-allowed"
                          />
                        </div>

                        {/* Description / Evidence File */}
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] text-[var(--text-muted)] font-medium mb-0.5">
                            Line Item Notes
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                            placeholder="Facility location, billing meter reference..."
                            className="w-full px-2.5 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-[var(--text-muted)] font-medium mb-0.5">
                            Evidence Attachment
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. statement_q3.pdf"
                            onChange={(e) => handleItemChange(idx, 'evidenceFiles', [e.target.value])}
                            className="w-full px-2.5 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewModalOpen(false);
                    setEditingSubmissionId(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-[var(--border)] text-xs font-semibold hover:bg-[var(--surface-container)] text-[var(--text-muted)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSaveDraft}
                  className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-container)] text-[var(--text-main)] text-xs font-semibold hover:bg-[var(--surface-high)] hover:border-[var(--text-muted)] transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span>{submitting ? 'Saving...' : editingSubmissionId ? 'Update Draft' : 'Save Draft'}</span>
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-95 transition-opacity flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting...' : 'Submit for Validation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Submission Details, Validation Results, and Approval Controls */}
      {isDetailsOpen && submissionDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Header */}
            <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-container)]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[var(--text-main)]">
                    {submissionDetails.submission.submissionName}
                  </h3>
                  {getStatusBadge(submissionDetails.submission.status)}
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Cycle: {submissionDetails.submission.reportingPeriodId?.periodName} · Source: {submissionDetails.submission.source} · Submitted by: {submissionDetails.submission.submittedBy?.name}
                </p>
              </div>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-high)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-5 text-xs">
              {/* Validation Status Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  submissionDetails.submission.validationStatus === 'passed'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : submissionDetails.submission.validationStatus === 'failed'
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}
              >
                {submissionDetails.submission.validationStatus === 'passed' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold">
                    Validation Status: {submissionDetails.submission.validationStatus?.toUpperCase() || 'PENDING'}
                  </h4>
                  <p className="text-[11px] mt-0.5 opacity-90">
                    {submissionDetails.submission.validationStatus === 'passed'
                      ? 'All blocking input and business validation rules passed successfully.'
                      : 'One or more line items violated business validation rules. Corrections must be made before approval.'}
                  </p>
                  {submissionDetails.submission.rejectionReason && (
                    <div className="mt-2 p-2 rounded bg-white/70 border border-red-300 font-semibold text-red-800">
                      Reason noted: {submissionDetails.submission.rejectionReason}
                    </div>
                  )}
                </div>
              </div>

              {/* Data Items Table */}
              <div>
                <h4 className="font-bold text-[var(--text-main)] mb-2">Submitted ESG Data Line Items</h4>
                <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[var(--surface-container)] border-b border-[var(--border)] text-[var(--text-muted)]">
                        <th className="py-2.5 px-3 font-semibold">Metric</th>
                        <th className="py-2.5 px-3 font-semibold">Pillar</th>
                        <th className="py-2.5 px-3 font-semibold">Value</th>
                        <th className="py-2.5 px-3 font-semibold">Unit</th>
                        <th className="py-2.5 px-3 font-semibold">Evidence</th>
                        <th className="py-2.5 px-3 font-semibold">Line Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {submissionDetails.items.map((it) => (
                        <tr key={it._id} className="hover:bg-[var(--surface-container)]">
                          <td className="py-2.5 px-3 font-medium text-[var(--text-main)]">
                            {it.metricId?.name || 'Metric'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="capitalize text-[11px] font-semibold text-[var(--text-muted)]">
                              {it.categoryId?.name || 'General'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-bold font-mono text-[var(--text-main)]">
                            {it.value}
                          </td>
                          <td className="py-2.5 px-3 text-[var(--text-muted)]">{it.unit}</td>
                          <td className="py-2.5 px-3 text-[var(--text-muted)]">
                            {it.evidenceFiles && it.evidenceFiles.length > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[var(--primary)] font-medium">
                                <FileText className="w-3.5 h-3.5" />
                                {it.evidenceFiles[0]}
                              </span>
                            ) : (
                              'None'
                            )}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                it.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  : it.status === 'requires_correction'
                                  ? 'bg-red-100 text-red-800 border-red-200'
                                  : 'bg-blue-100 text-blue-800 border-blue-200'
                              }`}
                            >
                              {it.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Validation Results Log */}
              {submissionDetails.validationResults?.length > 0 && (
                <div>
                  <h4 className="font-bold text-[var(--text-main)] mb-2">Automated Rule Engine Execution Log</h4>
                  <div className="flex flex-col gap-2">
                    {submissionDetails.validationResults.map((vr) => (
                      <div
                        key={vr._id}
                        className={`p-3 rounded-lg border text-xs flex flex-col gap-1 ${
                          vr.validationStatus === 'passed'
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : 'bg-red-50/50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[var(--text-main)]">
                            Status: {vr.validationStatus.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            Executed {new Date(vr.validatedAt).toLocaleString()}
                          </span>
                        </div>
                        {vr.errors?.map((err, i) => (
                          <span key={i} className="text-red-700 font-medium">• {err}</span>
                        ))}
                        {vr.warnings?.map((wrn, i) => (
                          <span key={i} className="text-amber-700 font-medium">• {wrn}</span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Workflow Action Buttons */}
            <div className="p-4 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3 bg-[var(--surface-container)]">
              <span className="text-[11px] text-[var(--text-muted)]">
                Workflow stage: <strong className="text-[var(--text-main)] capitalize">{submissionDetails.submission.status.replace('_', ' ')}</strong>
              </span>

              <div className="flex items-center gap-2">
                {/* Edit Draft button (if draft or correction) */}
                {['draft', 'requires_correction'].includes(submissionDetails.submission.status) && canSubmit && (
                  <button
                    onClick={() => handleOpenEditDraft(submissionDetails.submission._id)}
                    className="px-3.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Draft</span>
                  </button>
                )}

                {/* Submit for review button (if draft or correction) */}
                {['draft', 'requires_correction'].includes(submissionDetails.submission.status) && canSubmit && (
                  <button
                    onClick={() => handleSubmitForReview(submissionDetails.submission._id)}
                    className="px-3.5 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-95 flex items-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit for Validation</span>
                  </button>
                )}

                {/* Reject / Return for Correction button (Org Admin & Auditor) */}
                {(canApprove || canAudit) && submissionDetails.submission.status !== 'approved' && (
                  <button
                    onClick={() => {
                      setSelectedSubmission(submissionDetails.submission);
                      setIsRejectModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-lg border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Return for Correction</span>
                  </button>
                )}

                {/* Final Org Admin Approval button */}
                {canApprove && submissionDetails.submission.status !== 'approved' && (
                  <button
                    onClick={() => handleApprove(submissionDetails.submission._id)}
                    disabled={submissionDetails.submission.validationStatus === 'failed'}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Submission</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Return For Correction Reason */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-60">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl w-full max-w-md p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-[var(--text-main)] mb-1">Return for Correction</h3>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              State the specific reason or telemetry discrepancy for returning this submission to the submitter.
            </p>
            <textarea
              rows={3}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="e.g. Scope 1 fuel logs require odometer confirmation and reconciliation."
              className="w-full px-3 py-2 text-xs bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] mb-3"
              required
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-[var(--surface-container)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
              >
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataCollection;
