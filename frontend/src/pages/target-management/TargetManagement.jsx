import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Clock,
  Calendar,
  X,
  History,
  ArrowRight
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getProgressBarColor, getProgressTextColor, getProgressBadge } from '../../utils/progress';

const TargetManagement = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [targets, setTargets] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null);

  // Form State for new target
  const [formData, setFormData] = useState({
    metricId: '',
    targetName: '',
    baselineValue: '',
    targetValue: '',
    unit: '',
    direction: 'lower_is_better',
    startDate: new Date().toISOString().split('T')[0],
    targetDate: ''
  });

  // Progress update state
  const [progressForm, setProgressForm] = useState({
    recordedValue: '',
    note: ''
  });

  const [formError, setFormError] = useState('');
  const canManage = role === 'platform_admin' || role === 'org_admin' || role === 'esg_manager';

  const fetchTargets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/targets', { params: { status: statusFilter } });
      if (res.data.success) {
        setTargets(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load targets', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await api.get('/esg/metrics');
      if (res.data.success) {
        setMetrics(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load metrics', err);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, [statusFilter]);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleMetricSelect = (metricId) => {
    const met = metrics.find(m => m._id === metricId);
    setFormData(prev => ({
      ...prev,
      metricId,
      unit: met ? met.unit : '',
      direction: met && met.preferredDirection === 'higher' ? 'higher_is_better' : 'lower_is_better'
    }));
  };

  const handleCreateTarget = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.metricId || !formData.targetName || formData.baselineValue === '' || formData.targetValue === '' || !formData.targetDate) {
      setFormError('Please fill in all mandatory target fields.');
      return;
    }

    try {
      const res = await api.post('/targets', {
        ...formData,
        startDate: formData.startDate || new Date().toISOString().split('T')[0],
        baselineValue: Number(formData.baselineValue),
        targetValue: Number(formData.targetValue)
      });
      if (res.data.success) {
        toast.success(`Target "${formData.targetName}" created successfully!`);
        setIsCreateOpen(false);
        setFormData({
          metricId: '',
          targetName: '',
          baselineValue: '',
          targetValue: '',
          unit: '',
          direction: 'lower_is_better',
          startDate: new Date().toISOString().split('T')[0],
          targetDate: ''
        });
        fetchTargets();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create target');
    }
  };

  const handleRecordProgress = async (e) => {
    e.preventDefault();
    if (!selectedTarget || progressForm.recordedValue === '') return;

    try {
      const res = await api.post(`/targets/${selectedTarget._id}/progress`, {
        recordedValue: Number(progressForm.recordedValue),
        note: progressForm.note
      });
      if (res.data.success) {
        toast.success('Progress entry recorded successfully!');
        setIsProgressOpen(false);
        setProgressForm({ recordedValue: '', note: '' });
        fetchTargets();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record progress');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Achieved':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Achieved</span>;
      case 'On Track':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">On Track</span>;
      case 'At Risk':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">At Risk</span>;
      case 'Overdue':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Overdue</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">Not Started</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)]">
            ESG Targets & Decarbonization Trajectory
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Establish, monitor, and calculate real-time progress toward corporate sustainability commitments.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-95 transition-opacity flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Target</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {['all', 'On Track', 'Achieved', 'At Risk', 'Overdue', 'Not Started'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              statusFilter === st
                ? 'bg-[var(--primary)] text-white shadow-xs'
                : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-container)]'
            }`}
          >
            {st === 'all' ? 'All Targets' : st}
          </button>
        ))}
      </div>

      {/* Targets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-xs text-[var(--text-muted)]">
            Loading ESG targets...
          </div>
        ) : targets.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-xs text-[var(--text-muted)] bg-[var(--surface)] rounded-xl border border-[var(--border)]">
            No targets found. Click "Create New Target" to define multi-year goals.
          </div>
        ) : (
          targets.map((t) => (
            <div
              key={t._id}
              className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-[var(--text-main)]">{t.targetName}</h3>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      Metric: {t.metricId?.name || 'ESG Metric'}
                    </span>
                  </div>
                  {getStatusBadge(t.status)}
                </div>

                {/* Trajectory Details */}
                <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-lg bg-[var(--surface-container)] text-center text-xs">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Baseline</span>
                    <span className="font-mono font-bold text-[var(--text-main)]">
                      {t.baselineValue} {t.unit}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Current Level</span>
                    <span className="font-mono font-bold text-[var(--text-main)]">
                      {t.currentValue !== null ? t.currentValue : t.baselineValue} {t.unit}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Target Goal</span>
                    <span className="font-mono font-bold text-[var(--text-main)]">
                      {t.targetValue} {t.unit}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                      {t.direction === 'higher_is_better' ? (
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-blue-600" />
                      )}
                      <span>Direction: {t.direction === 'higher_is_better' ? 'Higher is better' : 'Lower is better'}</span>
                    </span>
                    <span className={`font-mono font-bold ${getProgressTextColor(t.progressPercentage)}`}>
                      {t.progressPercentage}%
                    </span>
                  </div>

                  <div className="w-full bg-[var(--surface-high)] rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`${getProgressBarColor(t.progressPercentage)} h-2.5 rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(100, Math.max(0, t.progressPercentage || 0))}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1 text-[11px]">
                  <Calendar className="w-3.5 h-3.5" />
                  Due: {new Date(t.targetDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Create New Target */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
              <h3 className="text-sm font-bold text-[var(--text-main)]">Create Multi-Year ESG Target</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateTarget} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Target Name *</label>
                <input
                  type="text"
                  value={formData.targetName}
                  onChange={(e) => setFormData({ ...formData, targetName: e.target.value })}
                  placeholder="e.g. 50% Reduction in Water Withdrawal"
                  className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Tracked Metric *</label>
                <select
                  value={formData.metricId}
                  onChange={(e) => handleMetricSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                  required
                >
                  <option value="">Select Metric...</option>
                  {metrics.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    Baseline Value {formData.unit ? `(${formData.unit})` : ''} *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.baselineValue}
                    onChange={(e) => setFormData({ ...formData, baselineValue: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    Target Goal Value {formData.unit ? `(${formData.unit})` : ''} *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.targetValue}
                    onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Trajectory Direction</label>
                <select
                  value={formData.direction}
                  onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                >
                  <option value="lower_is_better">Lower is Better (e.g. emissions reduction, energy reduction)</option>
                  <option value="higher_is_better">Higher is Better (e.g. renewable share, gender diversity)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Start / Baseline Date *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Target Deadline *</label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border text-xs font-semibold hover:bg-[var(--surface-container)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-95"
                >
                  Save Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log Progress Entry */}
      {isProgressOpen && selectedTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
              <h3 className="text-sm font-bold text-[var(--text-main)]">Record Target Progress</h3>
              <button onClick={() => setIsProgressOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)] mb-3">
              Target: <strong className="text-[var(--text-main)]">{selectedTarget.targetName}</strong> ({selectedTarget.unit})
            </p>

            <form onSubmit={handleRecordProgress} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Newly Recorded Level ({selectedTarget.unit}) *</label>
                <input
                  type="number"
                  step="any"
                  value={progressForm.recordedValue}
                  onChange={(e) => setProgressForm({ ...progressForm, recordedValue: e.target.value })}
                  placeholder="e.g. 42.5"
                  className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Progress Notes / Supporting Context</label>
                <input
                  type="text"
                  value={progressForm.note}
                  onChange={(e) => setProgressForm({ ...progressForm, note: e.target.value })}
                  placeholder="Mid-cycle telemetry check, energy efficiency retrofits completed..."
                  className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                />
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProgressOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border text-xs font-semibold hover:bg-[var(--surface-container)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-95"
                >
                  Update & Recompute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TargetManagement;
