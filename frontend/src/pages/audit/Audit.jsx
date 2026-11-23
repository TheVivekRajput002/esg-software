import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  FileCheck2,
  AlertTriangle,
  History,
  CheckCircle,
  X,
  Edit3,
  Search,
  Plus,
  Eye,
  ArrowRight
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Audit = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState('engagements'); // 'engagements' | 'findings' | 'logs'
  const [audits, setAudits] = useState([]);
  const [findings, setFindings] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isFindingModalOpen, setIsFindingModalOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);

  // Finding Form State
  const [findingForm, setFindingForm] = useState({
    auditId: '',
    title: '',
    description: '',
    severity: 'medium',
    correctiveAction: ''
  });

  // Correction Form State
  const [correctionForm, setCorrectionForm] = useState({
    dataId: '',
    metricName: '',
    originalValue: '',
    newValue: '',
    reason: ''
  });

  const [dataItemsForCorrection, setDataItemsForCorrection] = useState([]);

  const isAuditor = role === 'auditor' || role === 'platform_admin';

  const fetchAuditsAndFindings = async () => {
    try {
      setLoading(true);
      const [audRes, logsRes] = await Promise.all([
        api.get('/audits'),
        api.get('/audits/logs')
      ]);

      if (audRes.data.success) {
        setAudits(audRes.data.data);
        if (audRes.data.data.length > 0) {
          setFindingForm(prev => ({ ...prev, auditId: audRes.data.data[0]._id }));
          // Fetch findings for first audit
          const fRes = await api.get(`/audits/${audRes.data.data[0]._id}/findings`);
          if (fRes.data.success) setFindings(fRes.data.data);
        }
      }

      if (logsRes.data.success) {
        setLogs(logsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load audit data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditsAndFindings();
  }, []);

  const handleCreateFinding = async (e) => {
    e.preventDefault();
    if (!findingForm.auditId || !findingForm.title || !findingForm.description) {
      alert('Please fill in required fields');
      return;
    }

    try {
      const res = await api.post(`/audits/${findingForm.auditId}/findings`, findingForm);
      if (res.data.success) {
        setIsFindingModalOpen(false);
        setFindingForm({ auditId: audits[0]?._id || '', title: '', description: '', severity: 'medium', correctiveAction: '' });
        fetchAuditsAndFindings();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record finding');
    }
  };

  const openCorrectionModal = async () => {
    try {
      // Fetch latest submitted / validated items eligible for audit
      const subRes = await api.get('/submissions', { params: { limit: 5 } });
      if (subRes.data.success && subRes.data.data.length > 0) {
        const firstSub = subRes.data.data[0];
        const detRes = await api.get(`/submissions/${firstSub._id}`);
        if (detRes.data.success && detRes.data.data.items?.length > 0) {
          const items = detRes.data.data.items;
          setDataItemsForCorrection(items);
          const first = items[0];
          setCorrectionForm({
            dataId: first._id,
            metricName: first.metricId?.name || 'Metric',
            originalValue: first.value,
            newValue: first.value,
            reason: ''
          });
          setIsCorrectionModalOpen(true);
        } else {
          alert('No data items found for audit adjustment.');
        }
      }
    } catch (err) {
      alert('Failed to load records for correction');
    }
  };

  const handleApplyCorrection = async (e) => {
    e.preventDefault();
    if (!correctionForm.dataId || correctionForm.newValue === '' || !correctionForm.reason.trim()) {
      alert('dataId, newValue, and a mandatory justification reason are required');
      return;
    }

    try {
      const res = await api.post('/audits/correct-data', {
        dataId: correctionForm.dataId,
        newValue: Number(correctionForm.newValue),
        reason: correctionForm.reason
      });

      if (res.data.success) {
        alert('Controlled auditor correction recorded with full non-destructive audit history!');
        setIsCorrectionModalOpen(false);
        fetchAuditsAndFindings();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Correction failed');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)]">
            Audit Assurance & Historical Traceability
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Independent audit verification, findings management, and non-destructive historical change logs.
          </p>
        </div>

        {isAuditor && (
          <div className="flex items-center gap-2">
            <button
              onClick={openCorrectionModal}
              className="px-3.5 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-main)] text-xs font-semibold hover:bg-[var(--surface-container)] transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Edit3 className="w-4 h-4 text-[var(--primary)]" />
              <span>Controlled Audit Adjustment</span>
            </button>

            <button
              onClick={() => setIsFindingModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-95 transition-opacity flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Log Audit Finding</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('engagements')}
          className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'engagements'
              ? 'bg-[var(--primary)] text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:bg-[var(--surface-container)]'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Audit Engagements ({audits.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('findings')}
          className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'findings'
              ? 'bg-[var(--primary)] text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:bg-[var(--surface-container)]'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Findings & Discrepancies ({findings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'logs'
              ? 'bg-[var(--primary)] text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:bg-[var(--surface-container)]'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Non-Destructive Audit Trail ({logs.length})</span>
        </button>
      </div>

      {/* Tab: Engagements */}
      {activeTab === 'engagements' && (
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--surface-container)] border-b border-[var(--border)] text-[var(--text-muted)]">
                  <th className="py-3 px-4 font-semibold">Audit Type</th>
                  <th className="py-3 px-4 font-semibold">Associated Batch</th>
                  <th className="py-3 px-4 font-semibold">Auditor In Charge</th>
                  <th className="py-3 px-4 font-semibold">Engagement Date</th>
                  <th className="py-3 px-4 font-semibold">Findings & Notes</th>
                  <th className="py-3 px-4 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {audits.map((a) => (
                  <tr key={a._id} className="hover:bg-[var(--surface-container)]">
                    <td className="py-3 px-4 font-bold text-[var(--text-main)]">{a.auditType}</td>
                    <td className="py-3 px-4 text-[var(--text-muted)]">{a.submissionId?.submissionName || 'Enterprise Cycle'}</td>
                    <td className="py-3 px-4 text-[var(--text-muted)]">{a.userId?.name || 'Dr. Sophia Bennett'}</td>
                    <td className="py-3 px-4 text-[var(--text-muted)]">{new Date(a.auditDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-[var(--text-muted)] truncate max-w-xs">{a.comments || 'Compliant'}</td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          a.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-blue-100 text-blue-800 border-blue-200'
                        }`}
                      >
                        {a.status?.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Findings */}
      {activeTab === 'findings' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {findings.map((f) => (
              <div key={f._id} className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-xs text-[var(--text-main)]">{f.title}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        f.severity === 'critical' || f.severity === 'high'
                          ? 'bg-red-100 text-red-800 border-red-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}
                    >
                      {f.severity?.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1.5">{f.description}</p>
                  {f.correctiveAction && (
                    <div className="mt-2.5 p-2 rounded bg-[var(--surface-container)] text-[11px]">
                      <span className="font-semibold text-emerald-700">Corrective Action Taken: </span>
                      <span className="text-[var(--text-main)]">{f.correctiveAction}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                  <span>Status: <strong className="capitalize text-[var(--text-main)]">{f.status}</strong></span>
                  <span>Recorded {new Date(f.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {findings.length === 0 && (
              <div className="col-span-2 py-8 text-center text-xs text-[var(--text-muted)] bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                No active audit findings recorded.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Non-Destructive Audit Trail */}
      {activeTab === 'logs' && (
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-container)]">
            <span className="text-xs font-bold text-[var(--text-main)]">Immutable Audit Trail</span>
            <span className="text-xs text-[var(--text-muted)]">Preserves previous value vs updated value with actor & reason</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Actor</th>
                  <th className="py-3 px-4 font-semibold">Action</th>
                  <th className="py-3 px-4 font-semibold">Resource</th>
                  <th className="py-3 px-4 font-semibold">Change Details</th>
                  <th className="py-3 px-4 font-semibold">Audit Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-[var(--surface-container)]">
                    <td className="py-3 px-4 text-[var(--text-muted)] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-sans font-medium text-[var(--text-main)] whitespace-nowrap">
                      {log.actorId?.name || 'System / Auditor'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded font-bold bg-[var(--surface-high)] text-[var(--text-main)]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-[var(--text-muted)] whitespace-nowrap">
                      {log.resourceType}
                    </td>
                    <td className="py-3 px-4 text-[var(--text-main)] max-w-xs truncate">
                      {log.previousValue ? (
                        <span>
                          <span className="text-rose-600 line-through mr-1">{JSON.stringify(log.previousValue)}</span>
                          <span className="text-emerald-600 font-bold">{JSON.stringify(log.newValue)}</span>
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium">{JSON.stringify(log.newValue)}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-sans text-[var(--text-muted)] truncate max-w-xs">
                      {log.reason || 'Verified'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Controlled Auditor Adjustment */}
      {isCorrectionModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
              <h3 className="text-sm font-bold text-[var(--text-main)]">Controlled Auditor Data Correction</h3>
              <button onClick={() => setIsCorrectionModalOpen(false)} className="text-[var(--text-muted)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)] mb-3">
              Auditor adjustments preserve the original submitted value and generate a permanent audit log entry.
            </p>

            <form onSubmit={handleApplyCorrection} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Target Line Item</label>
                <select
                  value={correctionForm.dataId}
                  onChange={(e) => {
                    const found = dataItemsForCorrection.find(it => it._id === e.target.value);
                    if (found) {
                      setCorrectionForm({
                        dataId: found._id,
                        metricName: found.metricId?.name || 'Metric',
                        originalValue: found.value,
                        newValue: found.value,
                        reason: ''
                      });
                    }
                  }}
                  className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                >
                  {dataItemsForCorrection.map((it) => (
                    <option key={it._id} value={it._id}>
                      {it.metricId?.name} (Current: {it.value} {it.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Original Recorded Value</label>
                <input
                  type="text"
                  value={correctionForm.originalValue}
                  readOnly
                  className="w-full px-3 py-2 bg-[var(--surface-high)] border border-[var(--border)] rounded-lg text-xs cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Adjusted Auditor Value *</label>
                <input
                  type="number"
                  step="any"
                  value={correctionForm.newValue}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, newValue: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Audit Justification Reason *</label>
                <textarea
                  rows={2}
                  value={correctionForm.reason}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                  placeholder="e.g. Utility reconciliation variance settled with official meter readout."
                  className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                  required
                />
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCorrectionModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border text-xs font-semibold hover:bg-[var(--surface-container)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-95"
                >
                  Confirm & Log Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log Audit Finding */}
      {isFindingModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
              <h3 className="text-sm font-bold text-[var(--text-main)]">Log Formal Audit Finding</h3>
              <button onClick={() => setIsFindingModalOpen(false)} className="text-[var(--text-muted)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFinding} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Finding Title *</label>
                <input
                  type="text"
                  value={findingForm.title}
                  onChange={(e) => setFindingForm({ ...findingForm, title: e.target.value })}
                  placeholder="e.g. Meter Telemetry Calibration Gap"
                  className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Severity</label>
                <select
                  value={findingForm.severity}
                  onChange={(e) => setFindingForm({ ...findingForm, severity: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                >
                  <option value="low">Low (Administrative discrepancy)</option>
                  <option value="medium">Medium (Requires corrective procedure)</option>
                  <option value="high">High (Material data discrepancy)</option>
                  <option value="critical">Critical (Non-compliance risk)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Detailed Description *</label>
                <textarea
                  rows={3}
                  value={findingForm.description}
                  onChange={(e) => setFindingForm({ ...findingForm, description: e.target.value })}
                  placeholder="Describe the discrepancy observed during evidence review..."
                  className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                  required
                />
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFindingModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border text-xs font-semibold hover:bg-[var(--surface-container)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-95"
                >
                  Save Finding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Audit;
