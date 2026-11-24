import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Plus,
  Leaf,
  Users,
  ShieldCheck,
  CheckCircle,
  X,
  Search,
  Tag
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const EsgManagement = () => {
  const { role } = useAuth();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('all');
  const [search, setSearch] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    unit: '',
    description: '',
    isKPI: false,
    calculationMethod: 'sum',
    preferredDirection: 'lower'
  });

  const canConfigure = role === 'platform_admin' || role === 'org_admin';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mRes, cRes] = await Promise.all([
        api.get('/esg/metrics'),
        api.get('/esg/categories')
      ]);

      if (mRes.data.success) setMetrics(mRes.data.data);
      if (cRes.data.success) {
        setCategories(cRes.data.data);
        if (cRes.data.data.length > 0 && !formData.categoryId) {
          setFormData(prev => ({ ...prev, categoryId: cRes.data.data[0]._id }));
        }
      }
    } catch (err) {
      console.error('Failed to load ESG metadata', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateMetric = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.categoryId || !formData.unit) {
      toast.warning('Metric Name, Category, and Unit are required');
      return;
    }

    try {
      const res = await api.post('/esg/metrics', formData);
      if (res.data.success) {
        toast.success(`Metric "${formData.name}" registered successfully!`);
        setIsModalOpen(false);
        setFormData({
          name: '',
          categoryId: categories[0]?._id || '',
          unit: '',
          description: '',
          isKPI: false,
          calculationMethod: 'sum',
          preferredDirection: 'lower'
        });
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create metric');
    }
  };

  const filteredMetrics = metrics.filter(m => {
    const matchesCat = selectedCat === 'all' || m.categoryId?._id === selectedCat || m.categoryId === selectedCat;
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)]">
            ESG Categories & Metrics Directory
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Configure statutory disclosure indicators, measurement units, KPI status, and calculation rollups.
          </p>
        </div>

        {canConfigure && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-95 transition-opacity flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Configure Metric</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            onClick={() => setSelectedCat('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedCat === 'all'
                ? 'bg-[var(--primary)] text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:bg-[var(--surface-container)]'
            }`}
          >
            All Pillars
          </button>
          {categories.map((c) => (
            <button
              key={c._id}
              onClick={() => setSelectedCat(c._id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                selectedCat === c._id
                  ? 'bg-[var(--primary)] text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-container)]'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search metric name..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
      </div>

      {/* Metrics Table */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[var(--surface-container)] border-b border-[var(--border)] text-[var(--text-muted)]">
                <th className="py-3 px-4 font-semibold">Metric Name</th>
                <th className="py-3 px-4 font-semibold">Pillar</th>
                <th className="py-3 px-4 font-semibold">Unit</th>
                <th className="py-3 px-4 font-semibold">Aggregation Type</th>
                <th className="py-3 px-4 font-semibold">Preferred Direction</th>
                <th className="py-3 px-4 font-semibold">KPI Status</th>
                <th className="py-3 px-4 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredMetrics.map((m) => (
                <tr key={m._id} className="hover:bg-[var(--surface-container)]">
                  <td className="py-3 px-4 font-semibold text-[var(--text-main)]">
                    <div>{m.name}</div>
                    <div className="text-[11px] text-[var(--text-muted)] font-normal truncate max-w-xs">{m.description}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-xs text-[var(--text-muted)]">
                      {m.categoryId?.name || 'General'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-[var(--text-main)]">
                    {m.unit}
                  </td>
                  <td className="py-3 px-4 uppercase text-[11px] font-mono text-[var(--text-muted)]">
                    {m.calculationMethod}
                  </td>
                  <td className="py-3 px-4 text-[var(--text-muted)] capitalize">
                    {m.preferredDirection} is better
                  </td>
                  <td className="py-3 px-4">
                    {m.isKPI ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Corporate KPI
                      </span>
                    ) : (
                      <span className="text-[11px] text-[var(--text-muted)]">Standard</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Metric */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
              <h3 className="text-sm font-bold text-[var(--text-main)]">Configure New ESG Metric</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-muted)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMetric} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Metric Title *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Hazardous Waste Recycled"
                  className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Pillar Category *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Measurement Unit *</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="e.g. Metric Tons, MWh, %"
                    className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Aggregation Method</label>
                  <select
                    value={formData.calculationMethod}
                    onChange={(e) => setFormData({ ...formData, calculationMethod: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                  >
                    <option value="sum">Sum (Total accumulation)</option>
                    <option value="average">Average (Mean value)</option>
                    <option value="percentage">Percentage</option>
                    <option value="count">Count (Incidents/Events)</option>
                    <option value="latest">Latest Recorded Value</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Preferred Target Direction</label>
                  <select
                    value={formData.preferredDirection}
                    onChange={(e) => setFormData({ ...formData, preferredDirection: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                  >
                    <option value="lower">Lower is Better (e.g. emissions, waste)</option>
                    <option value="higher">Higher is Better (e.g. diversity, safety hours)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={formData.isKPI}
                    onChange={(e) => setFormData({ ...formData, isKPI: e.target.checked })}
                    className="rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <span className="font-semibold text-[var(--text-main)]">Mark as Core Corporate KPI</span>
                </label>
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Measurement boundary and statutory reporting guidelines..."
                  className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                />
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border text-xs font-semibold hover:bg-[var(--surface-container)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-95"
                >
                  Save Metric
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EsgManagement;
