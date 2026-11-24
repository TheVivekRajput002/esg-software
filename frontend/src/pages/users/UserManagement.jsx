import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  UserCheck,
  UserX,
  X,
  Mail,
  Shield,
  Building,
  Key,
  Lock,
  Unlock,
  Check,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Eye,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Settings,
  FileSpreadsheet
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const SYSTEM_MODULES = [
  {
    module: 'Dashboard',
    name: 'Executive Dashboard',
    description: 'Overview KPIs, disclosure milestones, and audit compliance summary',
    actions: ['view']
  },
  {
    module: 'DataCollection',
    name: 'Data Collection & Disclosures',
    description: 'Create batches, log metrics, upload evidence documents, and approve submissions',
    actions: ['read', 'write', 'submit', 'approve']
  },
  {
    module: 'Validation',
    name: 'Validation & Audit Integrity',
    description: 'Verify disclosures, test threshold ranges, and flag corrections',
    actions: ['read', 'write', 'validate', 'flag']
  },
  {
    module: 'TargetManagement',
    name: 'Corporate Targets & Trajectory',
    description: 'Configure multi-year decarbonization & ESG performance targets',
    actions: ['read', 'write']
  },
  {
    module: 'Analytics',
    name: 'ESG Analytics & Rollups',
    description: 'Cross-pillar breakdowns, trend analyses, and pillar completeness rollups',
    actions: ['view', 'export']
  },
  {
    module: 'Reporting',
    name: 'Official Reporting & Disclosures',
    description: 'Compile statutory reports and export disclosure packages in standard templates',
    actions: ['read', 'generate', 'export']
  },
  {
    module: 'Audit',
    name: 'Audit Trail & Compliance',
    description: 'Review tamper-evident audit ledger, log findings, and execute audited corrections',
    actions: ['read', 'write', 'correct']
  },
  {
    module: 'UserManagement',
    name: 'User Directory & Role Authorization',
    description: 'Invite members, configure custom roles, and grant module permissions',
    actions: ['read', 'write']
  },
  {
    module: 'Settings',
    name: 'Organization Profile & Settings',
    description: 'Manage tenant details, facilities, and global reporting configurations',
    actions: ['read', 'write']
  }
];

const UserManagement = () => {
  const { user: currentUser, role, organization } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'roles'

  // Modals
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);

  // User Permissions draft state
  const [draftPermissions, setDraftPermissions] = useState([]);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [permissionSuccess, setPermissionSuccess] = useState('');

  // Forms
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    password: 'password123',
    roleId: '',
    roleCode: 'esg_manager',
    title: '',
    department: ''
  });

  const [roleForm, setRoleForm] = useState({
    name: '',
    code: '',
    description: '',
    permissions: [
      { module: 'Dashboard', actions: ['view'] },
      { module: 'DataCollection', actions: ['read', 'write'] }
    ]
  });

  const isPlatformAdmin = role === 'platform_admin';
  const isOrgAdmin = role === 'org_admin';
  const canManageRolesAndPermissions = isPlatformAdmin || isOrgAdmin;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [uRes, rRes] = await Promise.all([
        api.get('/users'),
        api.get('/roles')
      ]);

      if (uRes.data.success) setUsers(uRes.data.data);
      if (rRes.data.success) {
        setRoles(rRes.data.data);
        if (rRes.data.data.length > 0 && !inviteForm.roleId) {
          const defaultRole = rRes.data.data.find(r => r.code === 'esg_manager') || rRes.data.data[0];
          setInviteForm(prev => ({
            ...prev,
            roleId: defaultRole._id,
            roleCode: defaultRole.code
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load user and role data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Open User Detail & Permission Modal
  const handleOpenUserDetail = (u) => {
    setSelectedUser(u);
    setPermissionSuccess('');

    // Determine initial permissions: customPermissions if present and non-empty, otherwise base role permissions
    if (u.customPermissions && u.customPermissions.length > 0) {
      setDraftPermissions(JSON.parse(JSON.stringify(u.customPermissions)));
    } else if (u.roleId?.permissions && u.roleId.permissions.length > 0) {
      // If role has All / *, expand to all system modules
      const isSuper = u.roleId.permissions.some(p => p.module === 'All' && p.actions.includes('*'));
      if (isSuper) {
        setDraftPermissions(SYSTEM_MODULES.map(m => ({ module: m.module, actions: [...m.actions] })));
      } else {
        setDraftPermissions(JSON.parse(JSON.stringify(u.roleId.permissions)));
      }
    } else {
      setDraftPermissions([]);
    }

    setIsUserDetailOpen(true);
  };

  // Toggle permission check in draft state
  const isPermissionGranted = (moduleName, actionName) => {
    const perm = draftPermissions.find(p => p.module === moduleName || p.module === 'All');
    if (!perm) return false;
    return perm.actions.includes('*') || perm.actions.includes(actionName);
  };

  const handleToggleAction = (moduleName, actionName) => {
    if (!canManageRolesAndPermissions) return;

    setDraftPermissions(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const modIndex = copy.findIndex(p => p.module === moduleName);

      if (modIndex === -1) {
        copy.push({ module: moduleName, actions: [actionName] });
        return copy;
      }

      const mod = copy[modIndex];
      // If module has '*', expand it to all actions excluding the one being unselected
      if (mod.actions.includes('*')) {
        const fullMod = SYSTEM_MODULES.find(m => m.module === moduleName);
        mod.actions = fullMod ? fullMod.actions.filter(a => a !== actionName) : [];
      } else if (mod.actions.includes(actionName)) {
        mod.actions = mod.actions.filter(a => a !== actionName);
      } else {
        mod.actions.push(actionName);
      }

      if (mod.actions.length === 0) {
        copy.splice(modIndex, 1);
      }

      return copy;
    });
  };

  const handleToggleAllInModule = (moduleName, actions) => {
    if (!canManageRolesAndPermissions) return;

    setDraftPermissions(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const modIndex = copy.findIndex(p => p.module === moduleName);
      const allSelected = actions.every(a => isPermissionGranted(moduleName, a));

      if (allSelected) {
        if (modIndex !== -1) copy.splice(modIndex, 1);
      } else {
        if (modIndex !== -1) {
          copy[modIndex].actions = [...actions];
        } else {
          copy.push({ module: moduleName, actions: [...actions] });
        }
      }
      return copy;
    });
  };

  const handleResetToRole = () => {
    if (!selectedUser?.roleId) return;
    const isSuper = selectedUser.roleId.permissions?.some(p => p.module === 'All' && p.actions.includes('*'));
    if (isSuper) {
      setDraftPermissions(SYSTEM_MODULES.map(m => ({ module: m.module, actions: [...m.actions] })));
    } else {
      setDraftPermissions(JSON.parse(JSON.stringify(selectedUser.roleId.permissions || [])));
    }
  };

  const handleGrantAll = () => {
    setDraftPermissions(SYSTEM_MODULES.map(m => ({ module: m.module, actions: [...m.actions] })));
  };

  const handleRevokeAll = () => {
    setDraftPermissions([]);
  };

  // Save Permissions to Backend
  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    try {
      setSavingPermissions(true);
      const res = await api.patch(`/users/${selectedUser._id}/permissions`, {
        customPermissions: draftPermissions
      });
      if (res.data.success) {
        setPermissionSuccess(`Permissions successfully updated for ${selectedUser.name}!`);
        setSelectedUser(res.data.data);
        setUsers(prev => prev.map(u => (u._id === selectedUser._id ? res.data.data : u)));
        setTimeout(() => setPermissionSuccess(''), 3500);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update permissions');
    } finally {
      setSavingPermissions(false);
    }
  };

  // Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.email || !inviteForm.password || !inviteForm.roleId) {
      alert('Please fill in required fields');
      return;
    }

    try {
      const res = await api.post('/users', inviteForm);
      if (res.data.success) {
        setIsInviteModalOpen(false);
        setInviteForm(prev => ({
          ...prev,
          name: '',
          email: '',
          title: '',
          department: '',
          password: 'password123'
        }));
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create user');
    }
  };

  // Create Role
  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!roleForm.name.trim()) {
      alert('Role Name is required');
      return;
    }

    try {
      const res = await api.post('/roles', roleForm);
      if (res.data.success) {
        setIsCreateRoleOpen(false);
        setRoleForm({
          name: '',
          code: '',
          description: '',
          permissions: [
            { module: 'Dashboard', actions: ['view'] },
            { module: 'DataCollection', actions: ['read', 'write'] }
          ]
        });
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create role');
    }
  };

  const handleToggleRolePermission = (moduleName, actionName) => {
    setRoleForm(prev => {
      const copy = JSON.parse(JSON.stringify(prev.permissions));
      const modIndex = copy.findIndex(p => p.module === moduleName);

      if (modIndex === -1) {
        copy.push({ module: moduleName, actions: [actionName] });
      } else {
        const mod = copy[modIndex];
        if (mod.actions.includes(actionName)) {
          mod.actions = mod.actions.filter(a => a !== actionName);
          if (mod.actions.length === 0) copy.splice(modIndex, 1);
        } else {
          mod.actions.push(actionName);
        }
      }
      return { ...prev, permissions: copy };
    });
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this custom role?')) return;
    try {
      const res = await api.delete(`/roles/${roleId}`);
      if (res.data.success) {
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete role');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await api.patch(`/users/${userId}/status`, { status: newStatus });
      if (res.data.success) {
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed');
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.roleId?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)]">
            User Directory & Access Control
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Manage organization team members, configure custom roles, and tailor granular module authorizations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canManageRolesAndPermissions && (
            <button
              onClick={() => setIsCreateRoleOpen(true)}
              className="px-3.5 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-main)] text-xs font-semibold hover:border-[var(--primary)] hover:text-[var(--primary)] flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Shield className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Add Custom Role</span>
            </button>
          )}

          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-95 transition-opacity flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Invite Team Member</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
            activeTab === 'users'
              ? 'bg-[var(--primary)] text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--surface-container)]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team Members ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
            activeTab === 'roles'
              ? 'bg-[var(--primary)] text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--surface-container)]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Configured Roles & Permissions ({roles.length})</span>
        </button>
      </div>

      {/* TAB 1: USERS LIST */}
      {activeTab === 'users' && (
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search team member by name, email, or role..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
            <span className="text-xs text-[var(--text-muted)] font-medium">
              Click any user row to view details & modify permissions
            </span>
          </div>

          {/* Users Table */}
          <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--surface-container)] border-b border-[var(--border)] text-[var(--text-muted)]">
                    <th className="py-3 px-4 font-semibold">User Member</th>
                    <th className="py-3 px-4 font-semibold">Email</th>
                    <th className="py-3 px-4 font-semibold">Assigned Role</th>
                    <th className="py-3 px-4 font-semibold">Custom Permissions</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-[var(--text-muted)]">
                        Loading directory members...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-[var(--text-muted)]">
                        No team members found matching search.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr
                        key={u._id}
                        onClick={() => handleOpenUserDetail(u)}
                        className="hover:bg-[var(--surface-container)] cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-[var(--text-main)] flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/30 flex items-center justify-center font-bold text-xs shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {currentUser?.id === u._id && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--primary)]/10 text-[var(--primary)] font-bold">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)]">
                              {u.title || 'Staff Member'} · {u.department || 'Operations'}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[var(--text-muted)] font-mono">{u.email}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              u.roleId?.code === 'platform_admin'
                                ? 'bg-purple-100 text-purple-800 border-purple-200'
                                : u.roleId?.code === 'org_admin'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : u.roleId?.code === 'esg_manager'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : u.roleId?.code === 'auditor'
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : 'bg-slate-100 text-slate-800 border-slate-200'
                            }`}
                          >
                            {u.roleId?.name || 'User'}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {u.customPermissions && u.customPermissions.length > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1 w-fit">
                              <Key className="w-3 h-3 text-indigo-600" />
                              Custom Grants ({u.customPermissions.length} modules)
                            </span>
                          ) : (
                            <span className="text-[11px] text-[var(--text-muted)]">
                              Inherited from Role
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              u.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : 'bg-rose-100 text-rose-800 border-rose-200'
                            }`}
                          >
                            {u.status?.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenUserDetail(u)}
                              className="px-2.5 py-1 rounded-md text-[11px] font-semibold border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] flex items-center gap-1 transition-colors"
                            >
                              <Shield className="w-3 h-3" />
                              <span>Permissions</span>
                            </button>

                            {currentUser?.id !== u._id && (
                              <button
                                onClick={() => handleToggleStatus(u._id, u.status)}
                                className="px-2 py-1 rounded-md text-[11px] font-semibold border border-[var(--border)] hover:bg-[var(--surface-container)] text-[var(--text-muted)]"
                              >
                                {u.status === 'active' ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROLES & PERMISSIONS SECTION */}
      {activeTab === 'roles' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-main)]">
                Organization Roles & Privilege Catalog
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Pre-configured system profiles and custom organizational roles controlling functional authorizations.
              </p>
            </div>
            {canManageRolesAndPermissions && (
              <button
                onClick={() => setIsCreateRoleOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-95 flex items-center gap-1.5 shadow-sm whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Role</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((r) => {
              const assignedCount = users.filter(u => u.roleId?._id === r._id || u.roleId?.code === r.code).length;
              const isSuper = r.permissions?.some(p => p.module === 'All' && p.actions.includes('*'));

              return (
                <div
                  key={r._id}
                  className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between gap-4"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2 border-b border-[var(--border)] pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-[var(--text-main)]">{r.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                              r.isSystemRole
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {r.isSystemRole ? 'System Profile' : 'Custom Org Role'}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-[var(--text-muted)] block mt-0.5">
                          code: {r.code}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-[var(--text-muted)] px-2 py-0.5 rounded bg-[var(--surface-container)] border border-[var(--border)]">
                          {assignedCount} Member{assignedCount !== 1 ? 's' : ''}
                        </span>
                        {!r.isSystemRole && canManageRolesAndPermissions && assignedCount === 0 && (
                          <button
                            onClick={() => handleDeleteRole(r._id)}
                            className="p-1 text-red-500 hover:text-red-700 rounded hover:bg-red-50"
                            title="Delete custom role"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      {r.description || 'No description provided for this role profile.'}
                    </p>
                  </div>

                  {/* Permissions Summary Badges */}
                  <div>
                    <span className="text-[11px] font-bold text-[var(--text-main)] block mb-1.5">
                      Granted Authorizations:
                    </span>
                    {isSuper ? (
                      <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 text-xs font-semibold flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span>Platform Superuser: Full unrestricted access across all modules.</span>
                      </div>
                    ) : r.permissions && r.permissions.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {r.permissions.map((p, idx) => (
                          <div
                            key={idx}
                            className="px-2 py-1 rounded bg-[var(--surface-container)] border border-[var(--border)] text-[11px] flex items-center gap-1"
                          >
                            <span className="font-semibold text-[var(--text-main)]">{p.module}:</span>
                            <span className="text-[var(--text-muted)] font-mono">
                              [{p.actions.join(', ')}]
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)] italic">No explicit permissions assigned.</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: USER DETAILS & PERMISSIONS INSPECTOR ("when I click on the user it should show details & enable/disable permissions") */}
      {isUserDetailOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Header */}
            <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-container)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/30 flex items-center justify-center font-bold text-sm shrink-0">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
                    <span>{selectedUser.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        selectedUser.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border-rose-200'
                      }`}
                    >
                      {selectedUser.status?.toUpperCase()}
                    </span>
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    {selectedUser.email} · Role:{' '}
                    <strong className="text-[var(--text-main)]">{selectedUser.roleId?.name || 'User'}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsUserDetailOpen(false)}
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-lg hover:bg-[var(--surface-high)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification Alert if Saved */}
            {permissionSuccess && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-2 text-xs font-semibold shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{permissionSuccess}</span>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 text-xs">
              {/* User Overview Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[var(--surface-container)] border border-[var(--border)]">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block font-medium">Job Title</span>
                  <span className="font-semibold text-[var(--text-main)]">{selectedUser.title || 'Staff Member'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block font-medium">Department</span>
                  <span className="font-semibold text-[var(--text-main)]">{selectedUser.department || 'Operations'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block font-medium">Organization</span>
                  <span className="font-semibold text-[var(--text-main)]">
                    {selectedUser.organizationId?.name || organization?.name || 'Corporate'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block font-medium">Member Since</span>
                  <span className="font-semibold text-[var(--text-main)]">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Granular Permission Control */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-2">
                  <div>
                    <h4 className="font-bold text-sm text-[var(--text-main)] flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-[var(--primary)]" />
                      <span>Module Authorizations & Privileges</span>
                    </h4>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      As Org Admin, you can individually enable or disable (able / unable) specific permissions for this user.
                    </p>
                  </div>

                  {canManageRolesAndPermissions && (
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        onClick={handleResetToRole}
                        type="button"
                        className="px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[10px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)]"
                        title="Revert to base role privileges"
                      >
                        Reset to Role
                      </button>
                      <button
                        onClick={handleGrantAll}
                        type="button"
                        className="px-2.5 py-1 rounded-md border border-emerald-300 bg-emerald-50 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-100"
                      >
                        Grant All
                      </button>
                      <button
                        onClick={handleRevokeAll}
                        type="button"
                        className="px-2.5 py-1 rounded-md border border-red-300 bg-red-50 text-[10px] font-semibold text-red-800 hover:bg-red-100"
                      >
                        Revoke All
                      </button>
                    </div>
                  )}
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 gap-3">
                  {SYSTEM_MODULES.map((mod) => {
                    const allSelected = mod.actions.every(a => isPermissionGranted(mod.module, a));
                    const someSelected = mod.actions.some(a => isPermissionGranted(mod.module, a));

                    return (
                      <div
                        key={mod.module}
                        className={`p-3.5 rounded-xl border transition-all ${
                          someSelected
                            ? 'bg-[var(--surface)] border-[var(--border)] shadow-xs'
                            : 'bg-[var(--surface-container)]/50 border-[var(--border)] opacity-70'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-[var(--border)]/60">
                          <div>
                            <span className="font-bold text-xs text-[var(--text-main)]">{mod.name}</span>
                            <span className="text-[10px] text-[var(--text-muted)] block">{mod.description}</span>
                          </div>

                          {canManageRolesAndPermissions && (
                            <button
                              type="button"
                              onClick={() => handleToggleAllInModule(mod.module, mod.actions)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${
                                allSelected
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-main)]'
                              }`}
                            >
                              {allSelected ? 'All Enabled' : 'Select All'}
                            </button>
                          )}
                        </div>

                        {/* Action Checkbox Pills */}
                        <div className="flex flex-wrap gap-2">
                          {mod.actions.map((act) => {
                            const granted = isPermissionGranted(mod.module, act);

                            return (
                              <button
                                key={act}
                                type="button"
                                disabled={!canManageRolesAndPermissions}
                                onClick={() => handleToggleAction(mod.module, act)}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                  granted
                                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                    : 'bg-[var(--surface-container)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--text-main)]'
                                } disabled:cursor-not-allowed`}
                              >
                                {granted ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <Lock className="w-3.5 h-3.5 opacity-60" />
                                )}
                                <span className="capitalize">{act}</span>
                                <span className="text-[9px] opacity-80 uppercase ml-0.5">
                                  {granted ? 'Enabled' : 'Disabled'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-container)] flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-muted)]">
                Changes apply immediately across all ESG audit and data workflows.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsUserDetailOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border text-xs font-semibold hover:bg-[var(--surface-high)]"
                >
                  Close
                </button>

                {canManageRolesAndPermissions && (
                  <button
                    type="button"
                    onClick={handleSavePermissions}
                    disabled={savingPermissions}
                    className="px-4 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-95 flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{savingPermissions ? 'Saving...' : 'Save Permissions'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD ROLE MODAL ("add a section of adding roles - where it will add roles and assign them permissions") */}
      {isCreateRoleOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-container)]">
              <div>
                <h3 className="text-base font-bold text-[var(--text-main)]">Add New Custom Role</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Define an organizational role title and assign functional module authorizations.
                </p>
              </div>
              <button onClick={() => setIsCreateRoleOpen(false)} className="text-[var(--text-muted)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-[var(--text-main)]">Role Title *</label>
                  <input
                    type="text"
                    value={roleForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                      setRoleForm({ ...roleForm, name, code: slug });
                    }}
                    placeholder="e.g. Sustainability Officer"
                    className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[var(--text-main)]">Role Code Identifier</label>
                  <input
                    type="text"
                    value={roleForm.code}
                    onChange={(e) => setRoleForm({ ...roleForm, code: e.target.value })}
                    placeholder="e.g. sustainability_officer"
                    className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[var(--text-main)]">Role Description</label>
                <textarea
                  rows={2}
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  placeholder="Outline the operational responsibilities and governance boundaries for this role..."
                  className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                />
              </div>

              {/* Module Permissions Checklist */}
              <div>
                <label className="block font-semibold mb-2 text-[var(--text-main)]">
                  Assign Module Authorizations & Permissions *
                </label>
                <div className="grid grid-cols-1 gap-2.5 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-container)]/50">
                  {SYSTEM_MODULES.map((mod) => (
                    <div
                      key={mod.module}
                      className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <span className="font-bold text-xs text-[var(--text-main)]">{mod.name}</span>
                        <span className="text-[10px] text-[var(--text-muted)] block">{mod.description}</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {mod.actions.map((act) => {
                          const isChecked = roleForm.permissions.some(
                            p => p.module === mod.module && p.actions.includes(act)
                          );

                          return (
                            <button
                              key={act}
                              type="button"
                              onClick={() => handleToggleRolePermission(mod.module, act)}
                              className={`px-2.5 py-1 rounded text-[11px] font-semibold border flex items-center gap-1 transition-colors ${
                                isChecked
                                  ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                                  : 'bg-[var(--surface-container)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-main)]'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3" />}
                              <span className="capitalize">{act}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateRoleOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border text-xs font-semibold hover:bg-[var(--surface-container)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-95 shadow-sm"
                >
                  Create & Register Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: INVITE TEAM MEMBER */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
              <h3 className="text-sm font-bold text-[var(--text-main)]">Invite Team Member</h3>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-[var(--text-muted)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  placeholder="e.g. Jordan Smith"
                  className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Corporate Email Address *</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="jordan.smith@company.com"
                  className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Assigned Role Profile *</label>
                <select
                  value={inviteForm.roleId}
                  onChange={(e) => {
                    const rId = e.target.value;
                    const selected = roles.find(r => r._id === rId);
                    setInviteForm({
                      ...inviteForm,
                      roleId: rId,
                      roleCode: selected ? selected.code : 'esg_manager'
                    });
                  }}
                  className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                  required
                >
                  {roles.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name} {r.isSystemRole ? '(Standard)' : '(Custom Role)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Job Title</label>
                  <input
                    type="text"
                    value={inviteForm.title}
                    onChange={(e) => setInviteForm({ ...inviteForm, title: e.target.value })}
                    placeholder="e.g. Sustainability Lead"
                    className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    value={inviteForm.department}
                    onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })}
                    placeholder="e.g. Environmental Health"
                    className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Initial Password</label>
                <input
                  type="text"
                  value={inviteForm.password}
                  onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs font-mono"
                  required
                />
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border text-xs font-semibold hover:bg-[var(--surface-container)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-95 shadow-sm"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
