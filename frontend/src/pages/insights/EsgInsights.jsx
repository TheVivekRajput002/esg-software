import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  BarChart3,
  Leaf,
  Users,
  ShieldCheck,
  Download,
  Filter,
  TrendingDown,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Analytics = () => {
  const { activePeriod } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'environmental' | 'social' | 'governance'
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState(null);
  const [envData, setEnvData] = useState([]);
  const [socData, setSocData] = useState([]);
  const [govData, setGovData] = useState([]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [overRes, envRes, socRes, govRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/analytics/environmental'),
        api.get('/analytics/social'),
        api.get('/analytics/governance')
      ]);

      if (overRes.data.success) setOverviewData(overRes.data.data);
      if (envRes.data.success) setEnvData(envRes.data.data);
      if (socRes.data.success) setSocData(socRes.data.data);
      if (govRes.data.success) setGovData(govRes.data.data);
    } catch (err) {
      console.error('Analytics loading error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [activePeriod]);

  const handleExportCSV = async () => {
    try {
      const res = await api.post('/analytics/export');
      if (res.data.success) {
        const rows = res.data.data;
        const csvContent =
          'data:text/csv;charset=utf-8,' +
          ['Category,Metric,Value,Unit,Period,Date']
            .concat(rows.map(r => `"${r.category}","${r.metric}",${r.value},"${r.unit}","${r.period}","${r.date}"`))
            .join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `esg_analytics_approved_data_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      alert('Export failed');
    }
  };

  const PILLAR_COLORS = ['#059669', '#2563eb', '#7c3aed'];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)]">
              ESG Performance Analytics & Disclosures
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Approved Records Only
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Aggregated corporate telemetry according to each ESG metric's configured calculation method.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-main)] text-xs font-semibold hover:bg-[var(--surface-container)] transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Download className="w-4 h-4 text-[var(--text-muted)]" />
          <span>Export Approved Dataset (CSV)</span>
        </button>
      </div>

      {/* Navigation Pillar Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'overview'
              ? 'bg-[var(--primary)] text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:bg-[var(--surface-container)]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Cross-Pillar Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('environmental')}
          className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'environmental'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:bg-[var(--surface-container)]'
          }`}
        >
          <Leaf className="w-4 h-4" />
          <span>Environmental (E)</span>
        </button>

        <button
          onClick={() => setActiveTab('social')}
          className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'social'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:bg-[var(--surface-container)]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Social (S)</span>
        </button>

        <button
          onClick={() => setActiveTab('governance')}
          className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'governance'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:bg-[var(--surface-container)]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Governance (G)</span>
        </button>
      </div>

      {/* Tab: Cross-Pillar Overview */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart: Records per Pillar */}
            <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
              <h3 className="text-sm font-bold text-[var(--text-main)] mb-1">
                Approved Data Records Across ESG Pillars
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] mb-4">
                Verified metric entries validated by audits and approved for reporting
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overviewData?.pillarComparison || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="pillar" textAnchor="end" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="records" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pillar Compliance Ratings */}
            <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-main)] mb-1">
                  Pillar Completeness & Audit Verification
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] mb-4">
                  Assessment of submitted vs required statutory disclosure indicators
                </p>

                <div className="flex flex-col gap-4 mt-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-emerald-700">
                        <Leaf className="w-3.5 h-3.5" /> Environmental Completeness
                      </span>
                      <span>94%</span>
                    </div>
                    <div className="w-full bg-[var(--surface-container)] rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '94%' }}></div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-blue-700">
                        <Users className="w-3.5 h-3.5" /> Social Assurance
                      </span>
                      <span>88%</span>
                    </div>
                    <div className="w-full bg-[var(--surface-container)] rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '88%' }}></div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-purple-700">
                        <ShieldCheck className="w-3.5 h-3.5" /> Governance Rigor
                      </span>
                      <span>96%</span>
                    </div>
                    <div className="w-full bg-[var(--surface-container)] rounded-full h-2 overflow-hidden">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '96%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-[var(--surface-container)] text-xs text-[var(--text-muted)] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--primary)] shrink-0" />
                <span>
                  All aggregation computations are strictly isolated by organization tenant boundary.
                </span>
              </div>
            </div>
          </div>

          {/* Aggregated Metrics Cards Table */}
          <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
            <h3 className="text-sm font-bold text-[var(--text-main)] mb-3">
              Configured ESG Metrics Aggregation Rollup
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {overviewData?.categories?.map((cat) => (
                <div key={cat.key} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-container)] flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                    <span className="font-bold text-xs text-[var(--text-main)] capitalize">{cat.title}</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--text-muted)]">
                      {cat.metrics?.length || 0} Metrics
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {cat.metrics?.map((m, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-[var(--border)]/50 last:border-0">
                        <span className="text-[var(--text-muted)] truncate max-w-[170px]" title={m.name}>
                          {m.name}
                        </span>
                        <span className="font-bold font-mono text-[var(--text-main)]">
                          {m.value} {m.unit}
                        </span>
                      </div>
                    ))}
                    {cat.metrics?.length === 0 && (
                      <span className="text-[11px] text-[var(--text-muted)] py-2 text-center">No approved data in this cycle.</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Environmental */}
      {activeTab === 'environmental' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {envData.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-[var(--text-muted)]">{item.metric}</span>
                  <div className="text-xl font-bold text-[var(--text-main)] font-mono mt-1">
                    {item.aggregatedValue} <span className="text-xs font-normal text-[var(--text-muted)]">{item.unit}</span>
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-emerald-700 font-medium">
                  {item.timeline?.length || 0} periods recorded
                </div>
              </div>
            ))}
          </div>

          {/* Environmental Chart */}
          <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
            <h3 className="text-sm font-bold text-[var(--text-main)] mb-1">
              Environmental Metrics Aggregation
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] mb-4">
              Energy consumption and Greenhouse Gas footprint
            </p>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={envData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="metric" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="aggregatedValue" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Social */}
      {activeTab === 'social' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {socData.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-[var(--text-muted)]">{item.metric}</span>
                  <div className="text-xl font-bold text-[var(--text-main)] font-mono mt-1">
                    {item.aggregatedValue} <span className="text-xs font-normal text-[var(--text-muted)]">{item.unit}</span>
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-blue-700 font-medium">
                  Calculation: Average
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
            <h3 className="text-sm font-bold text-[var(--text-main)] mb-1">
              Social Disclosures & Human Capital Metrics
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] mb-4">
              Workforce diversity, training hours, and workplace safety incident frequency
            </p>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={socData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="metric" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="aggregatedValue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Governance */}
      {activeTab === 'governance' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {govData.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-[var(--text-muted)]">{item.metric}</span>
                  <div className="text-xl font-bold text-[var(--text-main)] font-mono mt-1">
                    {item.aggregatedValue} <span className="text-xs font-normal text-[var(--text-muted)]">{item.unit}</span>
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-purple-700 font-medium">
                  Statutory corporate governance indicator
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
            <h3 className="text-sm font-bold text-[var(--text-main)] mb-1">
              Governance & Board Structure
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] mb-4">
              Board diversity, independent directorship, and ethics compliance training completion
            </p>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={govData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="metric" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="aggregatedValue" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
