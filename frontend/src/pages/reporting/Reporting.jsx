import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Plus,
  Calendar,
  CheckCircle,
  FileText,
  Eye,
  X,
  Building,
  Printer
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Reporting = () => {
  const { user, organization, role } = useAuth();
  const [reports, setReports] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // Report Generator Form State
  const [reportForm, setReportForm] = useState({
    reportName: '',
    reportType: 'Comprehensive ESG',
    periodId: '',
    sections: ['Executive Summary', 'Environmental', 'Social', 'Governance', 'Targets'],
    format: 'json'
  });
  const [generating, setGenerating] = useState(false);

  const availableSections = [
    'Executive Summary',
    'Environmental',
    'Social',
    'Governance',
    'Targets',
    'KPI Summaries',
    'Methodology Notes'
  ];

  const fetchReportsAndPeriods = async () => {
    try {
      setLoading(true);
      const [rRes, pRes] = await Promise.all([
        api.get('/reports'),
        api.get('/reporting-periods')
      ]);

      if (rRes.data.success) setReports(rRes.data.data);
      if (pRes.data.success) {
        setPeriods(pRes.data.data);
        if (pRes.data.data.length > 0) {
          const current = pRes.data.data.find(p => p.isCurrent) || pRes.data.data[0];
          setReportForm(prev => ({
            ...prev,
            periodId: current._id,
            reportName: `${organization?.name || 'Enterprise'} - ${current.periodName} Annual ESG Report`
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsAndPeriods();
  }, []);

  const handleToggleSection = (sectionName) => {
    setReportForm(prev => {
      const exists = prev.sections.includes(sectionName);
      return {
        ...prev,
        sections: exists ? prev.sections.filter(s => s !== sectionName) : [...prev.sections, sectionName]
      };
    });
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!reportForm.reportName || !reportForm.periodId) {
      alert('Please fill in required fields');
      return;
    }

    try {
      setGenerating(true);
      const res = await api.post('/reports/generate', reportForm);
      if (res.data.success) {
        setIsGenerateOpen(false);
        fetchReportsAndPeriods();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Report generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const downloadReportFile = (rep) => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(rep.summaryData, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `${rep.reportName.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)]">
              Official ESG Reporting & Disclosures
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Audit-Approved Data Exclusively
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Build, generate, and export compliant ESG disclosure packages for stakeholders and rating agencies.
          </p>
        </div>

        <button
          onClick={() => setIsGenerateOpen(true)}
          className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-95 transition-opacity flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Report</span>
        </button>
      </div>

      {/* Reports Directory Table */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-container)]">
          <span className="text-xs font-bold text-[var(--text-main)]">Generated Reports Archive</span>
          <span className="text-xs text-[var(--text-muted)]">{reports.length} official reports available</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                <th className="py-3 px-4 font-semibold">Report Document Title</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Reporting Cycle</th>
                <th className="py-3 px-4 font-semibold">Approved Items</th>
                <th className="py-3 px-4 font-semibold">Generated On</th>
                <th className="py-3 px-4 font-semibold">Compiler</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[var(--text-muted)]">
                    Loading reports...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[var(--text-muted)]">
                    No official reports generated yet. Click "Generate New Report" to create your first report.
                  </td>
                </tr>
              ) : (
                reports.map((rep) => (
                  <tr key={rep._id} className="hover:bg-[var(--surface-container)]">
                    <td className="py-3 px-4 font-bold text-[var(--text-main)] flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-[var(--primary)] shrink-0" />
                      <span>{rep.reportName}</span>
                    </td>
                    <td className="py-3 px-4 text-[var(--text-muted)] whitespace-nowrap">
                      {rep.reportType}
                    </td>
                    <td className="py-3 px-4 text-[var(--text-muted)] whitespace-nowrap">
                      {rep.periodId?.periodName || 'N/A'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[11px] font-bold border border-emerald-200">
                        {rep.summaryData?.recordCounts?.totalApproved || 0} approved records
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[var(--text-muted)] whitespace-nowrap">
                      {new Date(rep.generatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-[var(--text-muted)] whitespace-nowrap">
                      {rep.generatedBy?.name || 'Admin'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedReport(rep);
                            setIsViewOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)] text-xs font-semibold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>

                        <button
                          onClick={() => downloadReportFile(rep)}
                          className="px-2.5 py-1 rounded-md bg-[var(--primary)] text-white hover:opacity-90 text-xs font-semibold flex items-center gap-1"
                          title="Download Report JSON"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export</span>
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

      {/* Modal: Generate Report */}
      {isGenerateOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg p-6 shadow-2xl my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
              <h3 className="text-sm font-bold text-[var(--text-main)]">Generate Official ESG Report</h3>
              <button onClick={() => setIsGenerateOpen(false)} className="text-[var(--text-muted)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)] mb-3">
              Official reports automatically extract and aggregate approved data entries for the selected cycle.
            </p>

            <form onSubmit={handleGenerate} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Report Document Title *</label>
                <input
                  type="text"
                  value={reportForm.reportName}
                  onChange={(e) => setReportForm({ ...reportForm, reportName: e.target.value })}
                  placeholder="e.g. FY 2026-27 Corporate Sustainability Report"
                  className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Reporting Cycle *</label>
                  <select
                    value={reportForm.periodId}
                    onChange={(e) => setReportForm({ ...reportForm, periodId: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                    required
                  >
                    {periods.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.periodName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Report Type</label>
                  <select
                    value={reportForm.reportType}
                    onChange={(e) => setReportForm({ ...reportForm, reportType: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                  >
                    <option value="Comprehensive ESG">Comprehensive ESG</option>
                    <option value="Environmental Focus">Environmental Focus</option>
                    <option value="Social Responsibility">Social Responsibility</option>
                    <option value="Corporate Governance">Corporate Governance</option>
                    <option value="Executive Summary">Executive Summary</option>
                  </select>
                </div>
              </div>

              {/* Sections Checklist */}
              <div>
                <label className="block font-semibold mb-1.5">Include Report Sections</label>
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-container)]">
                  {availableSections.map((sec) => (
                    <label key={sec} className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={reportForm.sections.includes(sec)}
                        onChange={() => handleToggleSection(sec)}
                        className="rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                      />
                      <span>{sec}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGenerateOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border text-xs font-semibold hover:bg-[var(--surface-container)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-4 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-95 flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{generating ? 'Compiling Report...' : 'Compile & Generate'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Generated Report Details */}
      {isViewOpen && selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-container)]">
              <div>
                <h3 className="text-base font-bold text-[var(--text-main)]">{selectedReport.reportName}</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {selectedReport.organizationId?.name} · {selectedReport.periodId?.periodName} · Status: Completed
                </p>
              </div>
              <button onClick={() => setIsViewOpen(false)} className="text-[var(--text-muted)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5 text-xs">
              {/* Executive Summary Card */}
              <div className="p-4 rounded-xl bg-[var(--surface-container)] border border-[var(--border)] flex flex-col gap-2">
                <h4 className="font-bold text-sm text-[var(--text-main)]">Executive Disclosure Summary</h4>
                <div className="grid grid-cols-4 gap-3 text-center mt-1">
                  <div className="p-2 rounded bg-[var(--surface)]">
                    <span className="text-[10px] text-[var(--text-muted)] block">Approved Records</span>
                    <span className="font-bold font-mono text-emerald-700 text-sm">
                      {selectedReport.summaryData?.recordCounts?.totalApproved || 0}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-[var(--surface)]">
                    <span className="text-[10px] text-[var(--text-muted)] block">Environmental</span>
                    <span className="font-bold font-mono text-emerald-700 text-sm">
                      {selectedReport.summaryData?.recordCounts?.environmental || 0}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-[var(--surface)]">
                    <span className="text-[10px] text-[var(--text-muted)] block">Social</span>
                    <span className="font-bold font-mono text-blue-700 text-sm">
                      {selectedReport.summaryData?.recordCounts?.social || 0}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-[var(--surface)]">
                    <span className="text-[10px] text-[var(--text-muted)] block">Governance</span>
                    <span className="font-bold font-mono text-purple-700 text-sm">
                      {selectedReport.summaryData?.recordCounts?.governance || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Environmental Details */}
              {selectedReport.summaryData?.environmentalDetails?.length > 0 && (
                <div>
                  <h4 className="font-bold text-[var(--text-main)] mb-2">Environmental Performance (Approved)</h4>
                  <div className="rounded-lg border border-[var(--border)] overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[var(--surface-container)] text-[var(--text-muted)]">
                        <tr>
                          <th className="py-2 px-3">Metric Name</th>
                          <th className="py-2 px-3">Verified Value</th>
                          <th className="py-2 px-3">Unit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {selectedReport.summaryData.environmentalDetails.map((it, i) => (
                          <tr key={i}>
                            <td className="py-2 px-3 font-medium text-[var(--text-main)]">{it.metric}</td>
                            <td className="py-2 px-3 font-mono font-bold text-[var(--text-main)]">{it.value}</td>
                            <td className="py-2 px-3 text-[var(--text-muted)]">{it.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Social Details */}
              {selectedReport.summaryData?.socialDetails?.length > 0 && (
                <div>
                  <h4 className="font-bold text-[var(--text-main)] mb-2">Social Indicators (Approved)</h4>
                  <div className="rounded-lg border border-[var(--border)] overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[var(--surface-container)] text-[var(--text-muted)]">
                        <tr>
                          <th className="py-2 px-3">Metric Name</th>
                          <th className="py-2 px-3">Verified Value</th>
                          <th className="py-2 px-3">Unit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {selectedReport.summaryData.socialDetails.map((it, i) => (
                          <tr key={i}>
                            <td className="py-2 px-3 font-medium text-[var(--text-main)]">{it.metric}</td>
                            <td className="py-2 px-3 font-mono font-bold text-[var(--text-main)]">{it.value}</td>
                            <td className="py-2 px-3 text-[var(--text-muted)]">{it.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Governance Details */}
              {selectedReport.summaryData?.governanceDetails?.length > 0 && (
                <div>
                  <h4 className="font-bold text-[var(--text-main)] mb-2">Governance Indicators (Approved)</h4>
                  <div className="rounded-lg border border-[var(--border)] overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[var(--surface-container)] text-[var(--text-muted)]">
                        <tr>
                          <th className="py-2 px-3">Metric Name</th>
                          <th className="py-2 px-3">Verified Value</th>
                          <th className="py-2 px-3">Unit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {selectedReport.summaryData.governanceDetails.map((it, i) => (
                          <tr key={i}>
                            <td className="py-2 px-3 font-medium text-[var(--text-main)]">{it.metric}</td>
                            <td className="py-2 px-3 font-mono font-bold text-[var(--text-main)]">{it.value}</td>
                            <td className="py-2 px-3 text-[var(--text-muted)]">{it.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-container)] flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-muted)]">
                Compiled on {new Date(selectedReport.generatedAt).toLocaleString()}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>

                <button
                  onClick={() => downloadReportFile(selectedReport)}
                  className="px-3.5 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JSON Export</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reporting;
