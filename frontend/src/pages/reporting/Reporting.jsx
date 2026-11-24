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
  Printer,
  Copy,
  Check,
  Code,
  Users,
  Leaf,
  ShieldCheck,
  Target,
  Share2
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
  const [viewMode, setViewMode] = useState('document'); // 'document' | 'markdown'
  const [copied, setCopied] = useState(false);

  // Report Generator Form State
  const [reportForm, setReportForm] = useState({
    reportName: 'ESG Report 2026',
    reportType: 'Comprehensive ESG',
    periodId: '',
    sections: ['Executive Summary', 'About This Report', 'ESG Team', 'Environmental', 'Social', 'Governance', 'Targets and Next Steps'],
    format: 'markdown'
  });
  const [generating, setGenerating] = useState(false);

  const availableSections = [
    'Executive Summary',
    'About This Report',
    'ESG Team',
    'Environmental',
    'Social',
    'Governance',
    'Targets and Next Steps'
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
          const year = current.periodName?.match(/\d{4}/)?.[0] || '2026';
          setReportForm(prev => ({
            ...prev,
            periodId: current._id,
            reportName: `ESG Report ${year}`
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

  const getReportMarkdown = (rep) => {
    if (rep?.summaryData?.markdownReport) {
      return rep.summaryData.markdownReport;
    }
    const currentYear = rep?.periodId?.periodName?.match(/\d{4}/)?.[0] || '2026';
    const nextYear = String(parseInt(currentYear, 10) + 1);
    const orgName = rep?.organizationId?.name || organization?.name || '[Company Name]';
    const authorName = rep?.generatedBy?.name || user?.name || 'Vivek Rajput';
    const formattedDate = new Date(rep?.generatedAt || Date.now()).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const envItems = rep?.summaryData?.environmentalDetails || [];
    const socItems = rep?.summaryData?.socialDetails || [];
    const govItems = rep?.summaryData?.governanceDetails || [];
    const tgts = rep?.summaryData?.targetsSummary || [];

    const findMetric = (items, keywords) => {
      const match = items.find(it => {
        const name = (it.metric || '').toLowerCase();
        return keywords.some(k => name.includes(k));
      });
      return match ? match.value : '[x]';
    };

    const s1 = findMetric(envItems, ['scope 1', 'scope1']);
    const s2 = findMetric(envItems, ['scope 2', 'scope2']);
    const eng = findMetric(envItems, ['energy', 'electricity']);
    const ren = findMetric(envItems, ['renewable']);
    const wat = findMetric(envItems, ['water']);
    const wst = findMetric(envItems, ['waste']);

    const emp = findMetric(socItems, ['employee', 'headcount', 'workforce']);
    const wom = findMetric(socItems, ['women in workforce', 'gender diversity', 'diversity', 'ladli behna']);
    const lead = findMetric(socItems, ['leadership', 'board gender']);
    const inj = findMetric(socItems, ['injury', 'ltifr']);
    const trn = findMetric(socItems, ['training']);
    const com = findMetric(socItems, ['community', 'csr']);

    const ind = findMetric(govItems, ['independent', 'independence']);
    const whs = findMetric(govItems, ['whistleblower', 'cases', 'incident']);

    const envT = tgts.find(t => (t.metric || t.targetName || '').toLowerCase().includes('emission') || (t.metric || t.targetName || '').toLowerCase().includes('energy'));
    const socT = tgts.find(t => (t.metric || t.targetName || '').toLowerCase().includes('women') || (t.metric || t.targetName || '').toLowerCase().includes('injury') || (t.targetName || '').toLowerCase().includes('ladki'));
    const govT = tgts.find(t => (t.metric || t.targetName || '').toLowerCase().includes('training') || (t.metric || t.targetName || '').toLowerCase().includes('ethics'));

    return `${rep?.reportName || `ESG Report ${currentYear}`}
${formattedDate} · @${authorName}

Executive Summary
${orgName} made steady progress on environmental, social and governance priorities in ${currentYear}, with the largest gains in energy efficiency and workforce safety. This report summarises our performance, the standards we followed and the goals we are setting for ${nextYear}.
Environmental: lower energy use and emissions per unit of output, with a growing share of renewable power.
Social: a safer workplace, broader representation and more community investment.
Governance: stronger board oversight, ethics training and data protection.
Figures in this report are placeholders; replace the bracketed values with your own data before publishing.

About This Report
This report covers ${orgName}'s operations for the calendar year January to December ${currentYear}, including all owned facilities and our direct subsidiaries.
Reporting period: 1 January ${currentYear} to 31 December ${currentYear}
Frameworks referenced: GRI Standards, SASB and the TCFD recommendations
Emissions method: GHG Protocol, Scopes 1 and 2 (Scope 3 to be added in ${nextYear})
Assurance: internal review; no external assurance this year

ESG Team
A cross-functional team led by the Head of Sustainability prepared this report and owns our ESG programme.
| Team member   | Role   | Responsibility   |
| [Name]   | Chief Sustainability Officer   | Overall ESG strategy and board reporting   |
| [Name]   | ESG Program Manager   | Day-to-day coordination and report production   |
| [Name]   | Environmental Lead   | Emissions, energy, water and waste data   |
| [Name]   | HR and Social Impact Lead   | Workforce, safety, diversity and community programmes   |
| [Name]   | Compliance and Governance Lead   | Ethics, risk, policies and assurance   |
| [Name]   | Data and Reporting Analyst   | Data collection, validation and metrics tracking   |
The ESG team reports to the executive leadership and presents progress to the board each quarter.

Environmental
We cut energy and emissions intensity in ${currentYear} and are moving steadily toward renewable power.
| Metric   | 2025   | ${currentYear}   | Change   |
| Scope 1 emissions (tCO2e)   | [x]   | ${s1}   | [x]%   |
| Scope 2 emissions (tCO2e)   | [x]   | ${s2}   | [x]%   |
| Energy consumption (MWh)   | [x]   | ${eng}   | [x]%   |
| Renewable energy share (%)   | [x]   | ${ren}   | [x] pts   |
| Water withdrawal (m³)   | [x]   | ${wat}   | [x]%   |
| Waste diverted from landfill (%)   | [x]   | ${wst}   | [x] pts   |
Key actions this year: LED and efficiency upgrades at [sites], a renewable power purchase agreement and a supplier waste-reduction programme.

Social
People come first: we focused on safety, fair opportunity and the communities where we operate.
| Metric   | 2025   | ${currentYear}   |
| Total employees   | [x]   | ${emp}   |
| Women in workforce (%)   | [x]   | ${wom}   |
| Women in leadership roles (%)   | [x]   | ${lead}   |
| Lost-time injury rate (per 200,000 hours)   | [x]   | ${inj}   |
| Average training hours per employee   | [x]   | ${trn}   |
| Community investment (INR)   | [x]   | ${com}   |
Health and safety: monthly site audits and mandatory safety induction for all staff and contractors.
Diversity and inclusion: structured hiring practices and mentoring for early-career employees.
Community: volunteering days and local education and skills programmes.

Governance
Strong oversight and clear ethics rules underpin everything above.
Board oversight: the board reviews ESG performance [quarterly]; ${ind}% of directors are independent.
Ethics and compliance: all employees complete annual code-of-conduct training; a confidential whistleblower channel is open to staff and suppliers.
Risk management: climate and supply-chain risks are tracked in the enterprise risk register.
Data privacy and security: an information security policy is in place, with ${whs} reportable incidents in ${currentYear}.
Supplier standards: a supplier code of conduct covers labour, environmental and anti-corruption requirements.

Targets and Next Steps
For ${nextYear} we are focusing on three measurable goals and on widening the scope of our reporting.
| Area   | ${nextYear} target   |
| Environmental   | ${envT ? `Reduce Scope 1 and 2 emissions by ${envT.targetValue}% against ${currentYear}` : `Reduce Scope 1 and 2 emissions by [x]% against ${currentYear}`}   |
| Social   | ${socT ? `Reach ${socT.targetValue}${socT.unit || '%'} women in leadership roles; hold lost-time injury rate below [x]` : `Reach [x]% women in leadership roles; hold lost-time injury rate below [x]`}   |
| Governance   | ${govT ? `Complete ${govT.targetValue}${govT.unit || '%'} of ethics training; add external assurance for key metrics` : `Complete 100% of ethics training; add external assurance for key metrics`}   |
Next steps: begin Scope 3 measurement, set a science-based net-zero pathway and publish quarterly ESG updates.`;
  };

  const handleCopyMarkdown = (rep) => {
    const text = getReportMarkdown(rep);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadReportFile = (rep, format = 'markdown') => {
    const cleanTitle = (rep.reportName || 'ESG_Report').replace(/[^a-zA-Z0-9_-]/g, '_');
    if (format === 'json') {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(rep.summaryData, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `${cleanTitle}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      return;
    }

    const mdContent = getReportMarkdown(rep);
    const ext = format === 'txt' ? 'txt' : 'md';
    const mime = format === 'txt' ? 'text/plain' : 'text/markdown';
    const blob = new Blob([mdContent], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `${cleanTitle}.${ext}`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
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
                          onClick={() => downloadReportFile(rep, 'markdown')}
                          className="px-2.5 py-1 rounded-md bg-[var(--primary)] text-white hover:opacity-90 text-xs font-semibold flex items-center gap-1 shadow-xs"
                          title="Export Markdown Document (.md)"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export (.md)</span>
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

      {/* Modal: View Generated Report Details in Requested Format */}
      {isViewOpen && selectedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-container)]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-main)]">
                    {selectedReport.reportName}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    {selectedReport.organizationId?.name || organization?.name} · {selectedReport.periodId?.periodName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Mode Switcher */}
                <div className="flex items-center bg-[var(--surface)] border border-[var(--border)] rounded-lg p-0.5 text-xs">
                  <button
                    onClick={() => setViewMode('document')}
                    className={`px-3 py-1 rounded-md font-semibold transition-all ${
                      viewMode === 'document'
                        ? 'bg-[var(--primary)] text-white shadow-xs'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    Document View
                  </button>
                  <button
                    onClick={() => setViewMode('markdown')}
                    className={`px-3 py-1 rounded-md font-semibold transition-all ${
                      viewMode === 'markdown'
                        ? 'bg-[var(--primary)] text-white shadow-xs'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    Raw Markdown
                  </button>
                </div>

                <button
                  onClick={() => setIsViewOpen(false)}
                  className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-lg hover:bg-[var(--surface-high)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 text-xs">
              {viewMode === 'markdown' ? (
                <div className="relative">
                  <button
                    onClick={() => handleCopyMarkdown(selectedReport)}
                    className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-[var(--surface-high)] border border-[var(--border)] text-xs font-semibold hover:bg-[var(--primary)] hover:text-white flex items-center gap-1.5 shadow-xs transition-colors z-10"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied Markdown!' : 'Copy Markdown'}</span>
                  </button>
                  <pre className="font-mono text-xs leading-relaxed bg-[var(--surface-container)] p-5 rounded-xl border border-[var(--border)] overflow-x-auto text-[var(--text-main)] whitespace-pre-wrap selection:bg-[var(--primary)] selection:text-white">
                    {getReportMarkdown(selectedReport)}
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col gap-6 max-w-3xl mx-auto bg-[var(--surface)] border border-[var(--border)] p-6 sm:p-8 rounded-2xl shadow-sm text-[var(--text-main)] print:border-0 print:p-0">
                  {/* Title & Metadata */}
                  <div className="border-b border-[var(--border)] pb-4">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-main)]">
                      {selectedReport.reportName || `ESG Report 2026`}
                    </h1>
                    <div className="text-xs text-[var(--text-muted)] mt-1.5 font-medium flex items-center gap-2">
                      <span>
                        {new Date(selectedReport.generatedAt || Date.now()).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <span>·</span>
                      <span className="font-semibold text-[var(--primary)]">
                        @{selectedReport.generatedBy?.name || user?.name || 'Vivek Rajput'}
                      </span>
                    </div>
                  </div>

                  {/* Executive Summary */}
                  <div className="flex flex-col gap-2.5">
                    <h2 className="text-base font-bold text-[var(--text-main)]">Executive Summary</h2>
                    <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                      {selectedReport.organizationId?.name || organization?.name || '[Company Name]'} made steady progress on environmental, social and governance priorities in 2026, with the largest gains in energy efficiency and workforce safety. This report summarises our performance, the standards we followed and the goals we are setting for 2027.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-xs text-[var(--text-muted)] pl-1">
                      <li><strong className="text-[var(--text-main)]">Environmental:</strong> lower energy use and emissions per unit of output, with a growing share of renewable power.</li>
                      <li><strong className="text-[var(--text-main)]">Social:</strong> a safer workplace, broader representation and more community investment.</li>
                      <li><strong className="text-[var(--text-main)]">Governance:</strong> stronger board oversight, ethics training and data protection.</li>
                    </ul>
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] italic mt-1">
                      Figures in this report are placeholders; replace the bracketed values with your own data before publishing.
                    </div>
                  </div>

                  {/* About This Report */}
                  <div className="flex flex-col gap-2.5">
                    <h2 className="text-base font-bold text-[var(--text-main)]">About This Report</h2>
                    <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                      This report covers {selectedReport.organizationId?.name || organization?.name || '[Company Name]'}'s operations for the calendar year January to December 2026, including all owned facilities and our direct subsidiaries.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-[var(--surface-container)] p-3.5 rounded-xl border border-[var(--border)]">
                      <div><span className="font-semibold text-[var(--text-main)]">Reporting period:</span> 1 January 2026 to 31 December 2026</div>
                      <div><span className="font-semibold text-[var(--text-main)]">Frameworks referenced:</span> GRI Standards, SASB and the TCFD recommendations</div>
                      <div><span className="font-semibold text-[var(--text-main)]">Emissions method:</span> GHG Protocol, Scopes 1 and 2 (Scope 3 to be added in 2027)</div>
                      <div><span className="font-semibold text-[var(--text-main)]">Assurance:</span> internal review; no external assurance this year</div>
                    </div>
                  </div>

                  {/* ESG Team */}
                  <div className="flex flex-col gap-2.5">
                    <h2 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
                      <Users className="w-4 h-4 text-[var(--primary)]" />
                      <span>ESG Team</span>
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      A cross-functional team led by the Head of Sustainability prepared this report and owns our ESG programme.
                    </p>
                    <div className="border border-[var(--border)] rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[var(--surface-container)] text-[var(--text-muted)] border-b border-[var(--border)]">
                          <tr>
                            <th className="py-2.5 px-3.5 font-semibold">Team member</th>
                            <th className="py-2.5 px-3.5 font-semibold">Role</th>
                            <th className="py-2.5 px-3.5 font-semibold">Responsibility</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {[
                            { member: '[Name]', role: 'Chief Sustainability Officer', resp: 'Overall ESG strategy and board reporting' },
                            { member: '[Name]', role: 'ESG Program Manager', resp: 'Day-to-day coordination and report production' },
                            { member: '[Name]', role: 'Environmental Lead', resp: 'Emissions, energy, water and waste data' },
                            { member: '[Name]', role: 'HR and Social Impact Lead', resp: 'Workforce, safety, diversity and community programmes' },
                            { member: '[Name]', role: 'Compliance and Governance Lead', resp: 'Ethics, risk, policies and assurance' },
                            { member: '[Name]', role: 'Data and Reporting Analyst', resp: 'Data collection, validation and metrics tracking' }
                          ].map((row, i) => (
                            <tr key={i} className="hover:bg-[var(--surface-container)]/50">
                              <td className="py-2 px-3.5 font-medium text-[var(--text-muted)]">{row.member}</td>
                              <td className="py-2 px-3.5 font-semibold text-[var(--text-main)]">{row.role}</td>
                              <td className="py-2 px-3.5 text-[var(--text-muted)]">{row.resp}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] italic">
                      The ESG team reports to the executive leadership and presents progress to the board each quarter.
                    </p>
                  </div>

                  {/* Environmental */}
                  <div className="flex flex-col gap-2.5">
                    <h2 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-emerald-600" />
                      <span>Environmental</span>
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      We cut energy and emissions intensity in 2026 and are moving steadily toward renewable power.
                    </p>
                    <div className="border border-[var(--border)] rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[var(--surface-container)] text-[var(--text-muted)] border-b border-[var(--border)]">
                          <tr>
                            <th className="py-2.5 px-3.5 font-semibold">Metric</th>
                            <th className="py-2.5 px-3.5 font-semibold">2025</th>
                            <th className="py-2.5 px-3.5 font-semibold">2026</th>
                            <th className="py-2.5 px-3.5 font-semibold">Change</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {[
                            { metric: 'Scope 1 emissions (tCO2e)', val25: '[x]', val26: selectedReport.summaryData?.environmentalDetails?.find(i => (i.metric||'').toLowerCase().includes('scope 1'))?.value || '[x]', change: '[x]%' },
                            { metric: 'Scope 2 emissions (tCO2e)', val25: '[x]', val26: selectedReport.summaryData?.environmentalDetails?.find(i => (i.metric||'').toLowerCase().includes('scope 2'))?.value || '[x]', change: '[x]%' },
                            { metric: 'Energy consumption (MWh)', val25: '[x]', val26: selectedReport.summaryData?.environmentalDetails?.find(i => (i.metric||'').toLowerCase().includes('energy') || (i.metric||'').toLowerCase().includes('electricity'))?.value || '[x]', change: '[x]%' },
                            { metric: 'Renewable energy share (%)', val25: '[x]', val26: selectedReport.summaryData?.environmentalDetails?.find(i => (i.metric||'').toLowerCase().includes('renewable'))?.value || '[x]', change: '[x] pts' },
                            { metric: 'Water withdrawal (m³)', val25: '[x]', val26: selectedReport.summaryData?.environmentalDetails?.find(i => (i.metric||'').toLowerCase().includes('water'))?.value || '[x]', change: '[x]%' },
                            { metric: 'Waste diverted from landfill (%)', val25: '[x]', val26: selectedReport.summaryData?.environmentalDetails?.find(i => (i.metric||'').toLowerCase().includes('waste'))?.value || '[x]', change: '[x] pts' }
                          ].map((row, i) => (
                            <tr key={i} className="hover:bg-[var(--surface-container)]/50">
                              <td className="py-2 px-3.5 font-medium text-[var(--text-main)]">{row.metric}</td>
                              <td className="py-2 px-3.5 font-mono text-[var(--text-muted)]">{row.val25}</td>
                              <td className="py-2 px-3.5 font-mono font-bold text-emerald-700">{row.val26}</td>
                              <td className="py-2 px-3.5 font-mono text-[var(--text-muted)]">{row.change}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      <strong className="text-[var(--text-main)]">Key actions this year:</strong> LED and efficiency upgrades at sites, a renewable power purchase agreement and a supplier waste-reduction programme.
                    </p>
                  </div>

                  {/* Social */}
                  <div className="flex flex-col gap-2.5">
                    <h2 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>Social</span>
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      People come first: we focused on safety, fair opportunity and the communities where we operate.
                    </p>
                    <div className="border border-[var(--border)] rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[var(--surface-container)] text-[var(--text-muted)] border-b border-[var(--border)]">
                          <tr>
                            <th className="py-2.5 px-3.5 font-semibold">Metric</th>
                            <th className="py-2.5 px-3.5 font-semibold">2025</th>
                            <th className="py-2.5 px-3.5 font-semibold">2026</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {[
                            { metric: 'Total employees', val25: '[x]', val26: selectedReport.summaryData?.socialDetails?.find(i => (i.metric||'').toLowerCase().includes('employee'))?.value || '[x]' },
                            { metric: 'Women in workforce (%)', val25: '[x]', val26: selectedReport.summaryData?.socialDetails?.find(i => (i.metric||'').toLowerCase().includes('women') || (i.metric||'').toLowerCase().includes('gender') || (i.metric||'').toLowerCase().includes('ladli'))?.value || '[x]' },
                            { metric: 'Women in leadership roles (%)', val25: '[x]', val26: selectedReport.summaryData?.socialDetails?.find(i => (i.metric||'').toLowerCase().includes('leadership'))?.value || '[x]' },
                            { metric: 'Lost-time injury rate (per 200,000 hours)', val25: '[x]', val26: selectedReport.summaryData?.socialDetails?.find(i => (i.metric||'').toLowerCase().includes('injury') || (i.metric||'').toLowerCase().includes('ltifr'))?.value || '[x]' },
                            { metric: 'Average training hours per employee', val25: '[x]', val26: selectedReport.summaryData?.socialDetails?.find(i => (i.metric||'').toLowerCase().includes('training'))?.value || '[x]' },
                            { metric: 'Community investment (INR)', val25: '[x]', val26: selectedReport.summaryData?.socialDetails?.find(i => (i.metric||'').toLowerCase().includes('community') || (i.metric||'').toLowerCase().includes('csr'))?.value || '[x]' }
                          ].map((row, i) => (
                            <tr key={i} className="hover:bg-[var(--surface-container)]/50">
                              <td className="py-2 px-3.5 font-medium text-[var(--text-main)]">{row.metric}</td>
                              <td className="py-2 px-3.5 font-mono text-[var(--text-muted)]">{row.val25}</td>
                              <td className="py-2 px-3.5 font-mono font-bold text-blue-700">{row.val26}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-xs text-[var(--text-muted)] pl-1">
                      <li><strong className="text-[var(--text-main)]">Health and safety:</strong> monthly site audits and mandatory safety induction for all staff and contractors.</li>
                      <li><strong className="text-[var(--text-main)]">Diversity and inclusion:</strong> structured hiring practices and mentoring for early-career employees.</li>
                      <li><strong className="text-[var(--text-main)]">Community:</strong> volunteering days and local education and skills programmes.</li>
                    </ul>
                  </div>

                  {/* Governance */}
                  <div className="flex flex-col gap-2.5">
                    <h2 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <span>Governance</span>
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      Strong oversight and clear ethics rules underpin everything above.
                    </p>
                    <ul className="list-disc list-inside space-y-1.5 text-xs text-[var(--text-muted)] pl-1">
                      <li>
                        <strong className="text-[var(--text-main)]">Board oversight:</strong> the board reviews ESG performance quarterly;{' '}
                        <strong className="text-purple-700 font-mono">
                          {selectedReport.summaryData?.governanceDetails?.find(i => (i.metric||'').toLowerCase().includes('independent'))?.value || '[x]'}%
                        </strong>{' '}
                        of directors are independent.
                      </li>
                      <li><strong className="text-[var(--text-main)]">Ethics and compliance:</strong> all employees complete annual code-of-conduct training; a confidential whistleblower channel is open to staff and suppliers.</li>
                      <li><strong className="text-[var(--text-main)]">Risk management:</strong> climate and supply-chain risks are tracked in the enterprise risk register.</li>
                      <li>
                        <strong className="text-[var(--text-main)]">Data privacy and security:</strong> an information security policy is in place, with{' '}
                        <strong className="font-mono text-[var(--text-main)]">
                          {selectedReport.summaryData?.governanceDetails?.find(i => (i.metric||'').toLowerCase().includes('whistleblower') || (i.metric||'').toLowerCase().includes('cases'))?.value || '[x]'}
                        </strong>{' '}
                        reportable incidents in 2026.
                      </li>
                      <li><strong className="text-[var(--text-main)]">Supplier standards:</strong> a supplier code of conduct covers labour, environmental and anti-corruption requirements.</li>
                    </ul>
                  </div>

                  {/* Targets and Next Steps */}
                  <div className="flex flex-col gap-2.5">
                    <h2 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
                      <Target className="w-4 h-4 text-[var(--primary)]" />
                      <span>Targets and Next Steps</span>
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      For 2027 we are focusing on three measurable goals and on widening the scope of our reporting.
                    </p>
                    <div className="border border-[var(--border)] rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[var(--surface-container)] text-[var(--text-muted)] border-b border-[var(--border)]">
                          <tr>
                            <th className="py-2.5 px-3.5 font-semibold w-1/4">Area</th>
                            <th className="py-2.5 px-3.5 font-semibold">2027 target</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          <tr className="hover:bg-[var(--surface-container)]/50">
                            <td className="py-2 px-3.5 font-semibold text-emerald-700">Environmental</td>
                            <td className="py-2 px-3.5 text-[var(--text-main)]">
                              {selectedReport.summaryData?.targetsSummary?.find(t => (t.metric||t.targetName||'').toLowerCase().includes('emission'))
                                ? `Reduce Scope 1 and 2 emissions by ${selectedReport.summaryData.targetsSummary.find(t => (t.metric||t.targetName||'').toLowerCase().includes('emission')).targetValue}% against 2026`
                                : 'Reduce Scope 1 and 2 emissions by [x]% against 2026'}
                            </td>
                          </tr>
                          <tr className="hover:bg-[var(--surface-container)]/50">
                            <td className="py-2 px-3.5 font-semibold text-blue-700">Social</td>
                            <td className="py-2 px-3.5 text-[var(--text-main)]">
                              {selectedReport.summaryData?.targetsSummary?.find(t => (t.metric||t.targetName||'').toLowerCase().includes('women') || (t.metric||t.targetName||'').toLowerCase().includes('ladki'))
                                ? `Reach ${selectedReport.summaryData.targetsSummary.find(t => (t.metric||t.targetName||'').toLowerCase().includes('women') || (t.metric||t.targetName||'').toLowerCase().includes('ladki')).targetValue} in leadership roles; hold lost-time injury rate below [x]`
                                : 'Reach [x]% women in leadership roles; hold lost-time injury rate below [x]'}
                            </td>
                          </tr>
                          <tr className="hover:bg-[var(--surface-container)]/50">
                            <td className="py-2 px-3.5 font-semibold text-purple-700">Governance</td>
                            <td className="py-2 px-3.5 text-[var(--text-main)]">
                              Complete 100% of ethics training; add external assurance for key metrics
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] italic">
                      <strong className="text-[var(--text-main)]">Next steps:</strong> begin Scope 3 measurement, set a science-based net-zero pathway and publish quarterly ESG updates.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer with Direct Export Options */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-container)] flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-[var(--text-muted)] font-mono">
                Format: Markdown Document (.md) · Audit-Approved
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyMarkdown(selectedReport)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold hover:border-[var(--primary)] flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied Markdown!' : 'Copy'}</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold hover:border-[var(--primary)] flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>

                <button
                  onClick={() => downloadReportFile(selectedReport, 'markdown')}
                  className="px-3.5 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-95 flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export (.md)</span>
                </button>

                <button
                  onClick={() => downloadReportFile(selectedReport, 'txt')}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold hover:border-[var(--primary)] flex items-center gap-1.5"
                  title="Download as Plain Text Document"
                >
                  <span>.txt</span>
                </button>

                <button
                  onClick={() => downloadReportFile(selectedReport, 'json')}
                  className="px-3.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold hover:border-[var(--primary)] flex items-center gap-1.5"
                  title="Download JSON Payload"
                >
                  <span>.json</span>
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
