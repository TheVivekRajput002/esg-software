import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  CheckCircle,
  Archive,
  X,
  Mail,
  Phone,
  MapPin,
  ExternalLink
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Organizations = () => {
  const { role, switchOrganization } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    name: '',
    industry: 'Advanced Manufacturing & Heavy Equipment',
    country: 'United States',
    email: '',
    contactNumber: '',
    address: '',
    code: ''
  });

  const isPlatformAdmin = role === 'platform_admin';

  const fetchOrgs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/organizations');
      if (res.data.success) {
        setOrganizations(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load organizations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Organization name is required');
      return;
    }

    try {
      const res = await api.post('/organizations', form);
      if (res.data.success) {
        setIsCreateOpen(false);
        setForm({
          name: '',
          industry: 'Manufacturing & Services',
          country: 'United States',
          email: '',
          contactNumber: '',
          address: '',
          code: ''
        });
        fetchOrgs();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Creation failed');
    }
  };

  const handleArchive = async (orgId) => {
    if (!window.confirm('Are you sure you want to archive this organization? Existing historical records will be preserved.')) return;
    try {
      const res = await api.delete(`/organizations/${orgId}`);
      if (res.data.success) {
        fetchOrgs();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Archive failed');
    }
  };

  const filtered = organizations.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    (o.industry && o.industry.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)]">
            Multi-Tenant Organization Directory
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Enterprise tenants, isolated data spaces, and organizational profile administration.
          </p>
        </div>

        {isPlatformAdmin && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-95 transition-opacity flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Organization</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenant name or industry..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((org) => (
          <div
            key={org._id}
            className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-[var(--text-main)]">{org.name}</h3>
                  <span className="text-[11px] text-[var(--text-muted)]">{org.industry}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    org.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  {org.status?.toUpperCase()}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 mt-3 text-xs text-[var(--text-muted)]">
                {org.email && (
                  <span className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 shrink-0" /> {org.email}
                  </span>
                )}
                {org.country && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" /> {org.country}
                  </span>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs">
              <span className="font-mono text-[10px] text-[var(--text-muted)]">Code: {org.code || 'ABCI'}</span>
              
              <div className="flex items-center gap-2">
                {isPlatformAdmin && (
                  <>
                    <button
                      onClick={() => switchOrganization({ id: org._id, name: org.name })}
                      className="px-2.5 py-1 rounded-md text-[11px] font-semibold border border-[var(--border)] hover:border-[var(--primary)] text-[var(--primary)]"
                    >
                      Scope View
                    </button>
                    {org.status !== 'archived' && (
                      <button
                        onClick={() => handleArchive(org._id)}
                        className="p-1 rounded-md text-red-600 hover:bg-red-50"
                        title="Archive tenant"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Create Organization */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
              <h3 className="text-sm font-bold text-[var(--text-main)]">Register Enterprise Tenant</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-[var(--text-muted)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Organization Legal Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Apex CleanEnergy Corp."
                  className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Industry Sector</label>
                <input
                  type="text"
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  placeholder="e.g. Renewable Energy, Automotive"
                  className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Country</label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Tenant Code</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. APEX"
                    className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Compliance Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="sustainability@company.com"
                  className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                />
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
                  Register Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Organizations;
