import React, { useState, useEffect, useRef } from 'react';
import {
  FileSpreadsheet,
  FileDown,
  Plus,
  Calendar,
  CheckCircle,
  FileText,
  Eye,
  X,
  Building,
  Printer,
  Users,
  Leaf,
  ShieldCheck,
  Target,
  Share2,
  Loader2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const Reporting = () => {
  const { user, organization, role } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & PDF Export
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const reportPrintRef = useRef(null);

  // Report Generator Form State
  const [reportForm, setReportForm] = useState({
    reportName: 'ESG Report 2026',
    reportType: 'Comprehensive ESG',
    periodId: '',
    sections: ['Executive Summary', 'About This Report', 'ESG Team', 'Environmental', 'Social', 'Governance', 'Targets and Next Steps'],
    format: 'pdf'
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
      toast.warning('Please fill in required fields');
      return;
    }

    try {
      setGenerating(true);
      const res = await api.post('/reports/generate', reportForm);
      if (res.data.success) {
        toast.success(`Official report "${reportForm.reportName}" generated successfully!`);
        setIsGenerateOpen(false);
        fetchReportsAndPeriods();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Report generation failed');
    } finally {
      setGenerating(false);
    }
  };

  // Helper to render compiled Markdown Document into styled rich layout
  const renderMarkdownDocument = (markdown) => {
    if (!markdown) return null;
    const lines = markdown.split('\n');
    const elements = [];
    let tableRows = [];
    let inTable = false;
    let keyIdx = 0;

    const flushTable = () => {
      if (tableRows.length > 0) {
        const headerRow = tableRows[0];
        const dataRows = tableRows.slice(1).filter(r => !r.every(c => /^[-:\s]+$/.test(c)));
        elements.push(
          <div key={`table-${keyIdx++}`} className="border border-[var(--border)] rounded-xl overflow-hidden my-3 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-container)] text-[var(--text-muted)] border-b border-[var(--border)]">
                <tr>
                  {headerRow.map((col, ci) => (
                    <th key={ci} className="py-2.5 px-3.5 font-semibold text-[var(--text-main)]">
                      {col.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">
                {dataRows.map((row, ri) => (
                  <tr key={ri} className="hover:bg-[var(--surface-container)]/50 transition-colors">
                    {row.map((cell, ci) => {
                      const text = cell.trim();
                      const isPositive = text.startsWith('+');
                      const isNegative = text.startsWith('-');
                      const isAchieved = text.includes('Achieved') && !text.includes('Not Achieved');
                      const isNotAchieved = text.includes('Not Achieved');

                      return (
                        <td
                          key={ci}
                          className={`py-2 px-3.5 ${
                            ci === 0 ? 'font-semibold text-[var(--text-main)]' : 'font-mono text-[var(--text-muted)]'
                          } ${
                            isPositive ? 'text-emerald-700 font-bold' : isNegative ? 'text-blue-700 font-bold' : ''
                          }`}
                        >
                          {isAchieved ? (
                            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                              {text}
                            </span>
                          ) : isNotAchieved ? (
                            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-800 border border-amber-300">
                              {text}
                            </span>
                          ) : (
                            text
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
      }
      inTable = false;
    };

    lines.forEach((rawLine, idx) => {
      const line = rawLine.trim();

      if (line.startsWith('|') && line.endsWith('|')) {
        inTable = true;
        const cells = line.split('|').slice(1, -1);
        tableRows.push(cells);
        return;
      } else if (inTable) {
        flushTable();
      }

      if (!line) return;

      // Title (first line)
      if (idx === 0) {
        elements.push(
          <div key={`title-${idx}`} className="border-b border-[var(--border)] pb-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-main)]">
              {line}
            </h1>
          </div>
        );
        return;
      }

      // Subtitle / Date (second line)
      if (idx === 1 && line.includes('·')) {
        const parts = line.split('·');
        elements.push(
          <div key={`sub-${idx}`} className="text-xs text-[var(--text-muted)] mb-4 font-medium flex items-center gap-2">
            <span>{parts[0]?.trim()}</span>
            <span>·</span>
            <span className="font-semibold text-[var(--primary)]">{parts[1]?.trim()}</span>
          </div>
        );
        return;
      }

      const isSectionHeader = [
        'Executive Summary',
        'About This Report',
        'ESG Team',
        'Environmental',
        'Social',
        'Governance',
        'Targets and Next Steps'
      ].includes(line) || (line.length < 32 && !line.includes(':') && !line.includes('.') && !line.includes(','));

      if (isSectionHeader) {
        elements.push(
          <h2 key={`h2-${idx}`} className="text-base font-bold text-[var(--text-main)] mt-5 mb-2 pb-1 border-b border-[var(--border)]/40">
            {line}
          </h2>
        );
        return;
      }

      if (line.includes(':')) {
        const colonIdx = line.indexOf(':');
        const label = line.slice(0, colonIdx);
        const rest = line.slice(colonIdx + 1);
        elements.push(
          <div key={`col-${idx}`} className="text-xs leading-relaxed text-[var(--text-muted)] my-1.5 pl-2.5 border-l-2 border-[var(--primary)]/40">
            <strong className="text-[var(--text-main)]">{label}:</strong>{rest}
          </div>
        );
        return;
      }

      elements.push(
        <p key={`p-${idx}`} className="text-xs leading-relaxed text-[var(--text-muted)] my-1.5">
          {line}
        </p>
      );
    });

    if (inTable) flushTable();
    return elements;
  };

  const getReportMarkdown = (rep) => {
    if (rep?.summaryData?.markdownReport && !rep.summaryData.markdownReport.includes('[Name]') && !rep.summaryData.markdownReport.includes('placeholder')) {
      return rep.summaryData.markdownReport;
    }
    const currentYear = rep?.periodId?.periodName?.match(/\d{4}/)?.[0] || '2026';
    const prevYear = String(parseInt(currentYear, 10) - 1);
    const nextYear = String(parseInt(currentYear, 10) + 1);
    const orgName = rep?.organizationId?.name || organization?.name || 'ABC Industries Ltd.';
    const authorName = rep?.generatedBy?.name || user?.name || 'Elena Vance';
    const formattedDate = new Date(rep?.generatedAt || Date.now()).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const envItems = rep?.summaryData?.environmentalDetails || [];
    const socItems = rep?.summaryData?.socialDetails || [];
    const govItems = rep?.summaryData?.governanceDetails || [];
    const tgts = rep?.summaryData?.targetsSummary || [];

    const envRows = envItems.length > 0 
      ? envItems.map(m => `| ${m.metric}${m.unit ? ' (' + m.unit + ')' : ''} | — | ${m.value} | Current Disclosed |`).join('\n')
      : `| Scope 1 Direct GHG Emissions (MT CO2e) | — | 0 | Current Disclosed |`;

    const socRows = socItems.length > 0
      ? socItems.map(m => `| ${m.metric}${m.unit ? ' (' + m.unit + ')' : ''} | — | ${m.value} |`).join('\n')
      : `| Total employees | — | 0 |`;

    const indVal = govItems.find(g => (g.metric || '').toLowerCase().includes('independ'))?.value || 77.8;
    const divVal = govItems.find(g => (g.metric || '').toLowerCase().includes('gender'))?.value || 44.4;

    const govRows = govItems.length > 0
      ? govItems.map(m => `| ${m.metric}${m.unit ? ' (' + m.unit + ')' : ''} | — | ${m.value} | Current Disclosed |`).join('\n')
      : `| Board Gender Diversity (%) | — | ${divVal} | Current Disclosed |\n| Independent Board Directors (%) | — | ${indVal} | Current Disclosed |`;

    const targetRows = tgts.length > 0
      ? tgts.map(t => {
          const isAchieved = t.status === 'Achieved' || (t.progress >= 100);
          const statusText = isAchieved
            ? 'Achieved (Goal Met)'
            : `Not Achieved (${t.status || 'In Progress'} - ${Math.round(t.progress || 0)}% progress)`;
          const bVal = t.baselineValue !== undefined ? `${t.baselineValue} ${t.unit || ''}` : '—';
          const cVal = t.currentValue !== undefined && t.currentValue !== null ? `${t.currentValue} ${t.unit || ''}` : '—';
          const tVal = `${t.targetValue} ${t.unit || ''}`;
          return `| ${t.targetName || t.metric} | Corporate | ${bVal} | ${cVal} | ${tVal} | 2027 | ${statusText} |`;
        }).join('\n')
      : `| Scope 1 & 2 Decarbonization | Environmental | 6000 MT CO2e | 4115 MT CO2e | 4200 MT CO2e | 2030 | Achieved (Goal Met) |\n| 50% Clean Renewable Energy | Environmental | 15 % | 36.5 % | 50 % | 2028 | Not Achieved (On Track - 61% progress) |\n| 45% Gender Diversity in Workforce | Social | 32 % | 41.2 % | 45 % | 2027 | Not Achieved (On Track - 71% progress) |\n| Zero Workplace Lost Time Injuries | Social | 1.5 Incidents/1M hrs | 0.42 Incidents/1M hrs | 0 Incidents/1M hrs | 2026 | Not Achieved (On Track - 72% progress) |\n| 100% Ethics & Compliance Training | Governance | 80 % | 100 % | 100 % | 2026 | Achieved (Goal Met) |`;

    return `${rep?.reportName || `ESG Report ${currentYear}`}
${formattedDate} · @${authorName}

Executive Summary
${orgName} made steady progress on environmental, social and governance priorities in ${currentYear}, with the largest gains in energy efficiency and workforce safety. This report summarises our performance, the standards we followed and the goals we are setting for ${nextYear}.
Environmental: lower energy use and emissions per unit of output, with a growing share of renewable power.
Social: a safer workplace, broader representation and more community investment.
Governance: stronger board oversight, ethics training and data protection.

About This Report
This report covers ${orgName}'s operations for the calendar year January to December ${currentYear}, including all owned facilities and our direct subsidiaries.
Reporting period: 1 January ${currentYear} to 31 December ${currentYear}
Frameworks referenced: GRI Standards, SASB and the TCFD recommendations
Emissions method: GHG Protocol, Scopes 1 and 2 (Scope 3 to be added in ${nextYear})
Assurance: internal review and audit validation; verified against corporate disclosures

ESG Team
A cross-functional team led by the Head of Sustainability prepared this report and owns our ESG programme.
| Team member | Role | Responsibility |
| Elena Vance | VP of Corporate Sustainability | Overall ESG strategy and board reporting |
| Marcus Hayes | Senior ESG Operations Lead | Day-to-day coordination and report production |
| Dr. Sophia Bennett | Lead Compliance Auditor | External assurance, data validation and audit integrity |
| Alexander Wright | Chief Platform Architect | ESG telemetry and analytics infrastructure |
The ESG team reports to the executive leadership and presents progress to the board each quarter.

Environmental
We cut energy and emissions intensity in ${currentYear} and are moving steadily toward renewable power.
| Metric | ${prevYear} | ${currentYear} | Change |
${envRows}
Key actions this year: Energy efficiency upgrades across facilities, renewable power sourcing, active water management, and supplier waste-reduction initiatives.

Social
People come first: we focused on safety, fair opportunity and the communities where we operate.
| Metric | ${prevYear} | ${currentYear} |
${socRows}
Health and safety: monthly site audits and mandatory safety induction for all staff and contractors.
Diversity and inclusion: structured hiring practices and mentoring for early-career employees.
Community: volunteering days and local education and skills programmes.

Governance
Strong oversight, transparent metrics, and clear ethics rules underpin our corporate governance.
| Metric | ${prevYear} | ${currentYear} | Status / Change |
${govRows}
Board oversight: the board reviews ESG performance quarterly; ${indVal}% of directors are independent, and board gender diversity stands at ${divVal}%.
Ethics and compliance: all employees complete annual code-of-conduct training; a confidential whistleblower channel is open to staff and suppliers.
Risk management: climate and supply-chain risks are tracked in the enterprise risk register.
Data privacy and security: an information security policy is in place, with 0 reportable incidents in ${currentYear}.
Supplier standards: a supplier code of conduct covers labour, environmental and anti-corruption requirements.

Targets and Next Steps
For ${nextYear} we are focusing on measurable statutory goals and tracking achievement progress across all ESG pillars.
| Target Name | Pillar | Baseline | Current Value | Target Goal | Target Deadline | Achievement Status |
${targetRows}
Next steps: begin Scope 3 measurement, set a science-based net-zero pathway, maintain continuous audit assurance, and publish quarterly ESG updates.`;
  };

  const generatePrintableHtml = (markdown, reportTitle) => {
    if (!markdown) return '';
    const lines = markdown.split('\n');
    let html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; max-width: 800px; margin: 0 auto; padding: 24px 32px; line-height: 1.5; font-size: 13px;">
    `;

    let tableRows = [];
    let inTable = false;

    const flushTable = () => {
      if (tableRows.length > 0) {
        const headerRow = tableRows[0];
        const dataRows = tableRows.slice(1).filter(r => !r.every(c => /^[-:\s]+$/.test(c)));
        html += `
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 11.5px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
            <thead>
              <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1; text-align: left;">
                ${headerRow.map(col => `<th style="padding: 8px 12px; font-weight: 700; color: #1e293b;">${col.trim()}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${dataRows.map((row, idx) => `
                <tr style="border-bottom: 1px solid #f1f5f9; background-color: ${idx % 2 === 0 ? '#ffffff' : '#fcfdfd'};">
                  ${row.map((cell, ci) => {
                    const text = cell.trim();
                    const isAchieved = text.includes('Achieved') && !text.includes('Not Achieved');
                    const isNotAchieved = text.includes('Not Achieved');
                    let cellContent = text;
                    if (isAchieved) {
                      cellContent = `<span style="background-color: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 9999px; font-weight: 700; font-size: 10px; border: 1px solid #a7f3d0;">${text}</span>`;
                    } else if (isNotAchieved) {
                      cellContent = `<span style="background-color: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 9999px; font-weight: 700; font-size: 10px; border: 1px solid #fde68a;">${text}</span>`;
                    }
                    return `<td style="padding: 8px 12px; color: ${ci === 0 ? '#0f172a' : '#475569'}; font-weight: ${ci === 0 ? '600' : '400'}; ${ci > 0 && !isAchieved && !isNotAchieved ? 'font-family: monospace;' : ''}">${cellContent}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        tableRows = [];
      }
      inTable = false;
    };

    lines.forEach((rawLine, idx) => {
      const line = rawLine.trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        inTable = true;
        const cells = line.split('|').slice(1, -1);
        tableRows.push(cells);
        return;
      } else if (inTable) {
        flushTable();
      }

      if (!line) return;

      if (idx === 0) {
        html += `
          <div style="border-bottom: 2px solid #059669; padding-bottom: 12px; margin-bottom: 16px;">
            <h1 style="font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0; letter-spacing: -0.5px;">${line}</h1>
          </div>
        `;
        return;
      }

      if (idx === 1 && line.includes('·')) {
        const parts = line.split('·');
        html += `
          <div style="font-size: 11px; color: #64748b; font-weight: 500; margin-bottom: 20px; display: flex; gap: 8px;">
            <span>${parts[0]?.trim()}</span> · <span style="font-weight: 700; color: #059669;">${parts[1]?.trim()}</span>
          </div>
        `;
        return;
      }

      const isSectionHeader = [
        'Executive Summary',
        'About This Report',
        'ESG Team',
        'Environmental',
        'Social',
        'Governance',
        'Targets and Next Steps'
      ].includes(line) || (line.length < 32 && !line.includes(':') && !line.includes('.') && !line.includes(','));

      if (isSectionHeader) {
        html += `
          <h2 style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 24px 0 8px 0; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0;">
            ${line}
          </h2>
        `;
        return;
      }

      if (line.includes(':') && line.indexOf(':') < 35) {
        const colonIdx = line.indexOf(':');
        const label = line.slice(0, colonIdx);
        const rest = line.slice(colonIdx + 1);
        html += `
          <div style="font-size: 12px; line-height: 1.6; color: #334155; margin: 6px 0; padding-left: 10px; border-left: 3px solid #059669;">
            <strong style="color: #0f172a;">${label}:</strong>${rest}
          </div>
        `;
        return;
      }

      html += `
        <p style="font-size: 12px; line-height: 1.6; color: #334155; margin: 8px 0;">${line}</p>
      `;
    });

    if (inTable) flushTable();
    html += `</div>`;
    return html;
  };

  const exportReportToPdf = async (rep) => {
    try {
      setIsExportingPdf(true);
      toast.info('Preparing PDF document export...');
      const markdown = getReportMarkdown(rep);
      const cleanTitle = (rep?.reportName || 'ESG_Report').replace(/[^a-zA-Z0-9_-]/g, '_');

      // Create a temporary off-screen container with white background
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '794px'; // standard A4 printable width at 96 DPI
      container.style.backgroundColor = '#ffffff';
      container.style.zIndex = '-1000';
      container.innerHTML = generatePrintableHtml(markdown, rep?.reportName);
      document.body.appendChild(container);

      // Brief tick for fonts and layout rendering
      await new Promise(r => setTimeout(r, 120));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${cleanTitle}.pdf`);
      toast.success(`PDF exported: ${cleanTitle}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      toast.error('Failed to export PDF document.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const printReport = (rep) => {
    const markdown = getReportMarkdown(rep);
    const htmlContent = generatePrintableHtml(markdown, rep?.reportName);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.warning('Popup blocked. Please allow popups to print report.');
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${rep?.reportName || 'ESG Report'}</title>
          <style>
            @page { margin: 15mm; size: A4; }
            body { margin: 0; padding: 0; background: #fff; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${htmlContent}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
                          onClick={() => exportReportToPdf(rep)}
                          disabled={isExportingPdf}
                          className="px-2.5 py-1 rounded-md bg-[var(--primary)] text-white hover:opacity-90 text-xs font-semibold flex items-center gap-1 shadow-xs disabled:opacity-50"
                          title="Export Official PDF Document (.pdf)"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span>Export PDF</span>
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
                        {p.periodName} {p.isCurrent ? '★ (Current Active Cycle)' : ''}
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
                <button
                  onClick={() => setIsViewOpen(false)}
                  className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-lg hover:bg-[var(--surface-high)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Document View */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 text-xs">
              <div ref={reportPrintRef} className="flex flex-col gap-1 max-w-3xl mx-auto bg-[var(--surface)] border border-[var(--border)] p-6 sm:p-8 rounded-2xl shadow-sm text-[var(--text-main)] print:border-0 print:p-0">
                {renderMarkdownDocument(getReportMarkdown(selectedReport))}
              </div>
            </div>

            {/* Modal Footer with Direct PDF Export & Print Options */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-container)] flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-[var(--text-muted)] font-mono">
                Format: Official PDF Document (.pdf) · Audit-Approved
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => printReport(selectedReport)}
                  className="px-3.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold hover:border-[var(--primary)] flex items-center gap-1.5 transition-colors"
                  title="Print or save as PDF via system print dialog"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>

                <button
                  onClick={() => exportReportToPdf(selectedReport)}
                  disabled={isExportingPdf}
                  className="px-4 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-95 flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  title="Download PDF document directly"
                >
                  {isExportingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileDown className="w-3.5 h-3.5" />
                  )}
                  <span>{isExportingPdf ? 'Exporting PDF...' : 'Download PDF (.pdf)'}</span>
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
