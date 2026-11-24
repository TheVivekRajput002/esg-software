import React, { useState } from 'react';
import {
  Building,
  User,
  Save,
  Check
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const Settings = () => {
  const { user, organization, role } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [savedMessage, setSavedMessage] = useState('');

  // User form
  const [userName, setUserName] = useState(user?.name || '');
  const [userTitle, setUserTitle] = useState(user?.title || '');

  // Org form
  const [orgName, setOrgName] = useState(organization?.name || '');
  const [orgIndustry, setOrgIndustry] = useState(organization?.industry || '');
  const [orgCountry, setOrgCountry] = useState(organization?.country || '');

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      const res = await api.patch(`/users/${user.id}`, {
        name: userName,
        title: userTitle
      });
      if (res.data.success) {
        toast.success('Profile settings updated successfully!');
      }
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  const handleSaveOrg = async (e) => {
    e.preventDefault();
    if (!organization?.id) return;
    try {
      const res = await api.patch(`/organizations/${organization.id}`, {
        name: orgName,
        industry: orgIndustry,
        country: orgCountry
      });
      if (res.data.success) {
        toast.success('Organization settings updated successfully!');
      }
    } catch (err) {
      toast.error('Failed to update organization');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)]">
            System & Workspace Settings
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Manage user profile credentials, designated titles, and organizational enterprise parameters.
          </p>
        </div>

        {savedMessage && (
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{savedMessage}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'profile'
              ? 'bg-[var(--primary)] text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:bg-[var(--surface-container)]'
          }`}
        >
          <User className="w-4 h-4" />
          <span>User Profile</span>
        </button>

        {(role === 'platform_admin' || role === 'org_admin') && (
          <button
            onClick={() => setActiveTab('organization')}
            className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'organization'
                ? 'bg-[var(--primary)] text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:bg-[var(--surface-container)]'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Organization Parameters</span>
          </button>
        )}
      </div>

      {/* Tab: User Profile */}
      {activeTab === 'profile' && (
        <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs max-w-xl">
          <h3 className="text-sm font-bold text-[var(--text-main)] mb-1">Personal Account Details</h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Update your profile metadata and contact information.
          </p>

          <form onSubmit={handleSaveUser} className="flex flex-col gap-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">Full Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className="w-full px-3 py-2 bg-[var(--surface-high)] border border-[var(--border)] rounded-lg text-xs cursor-not-allowed font-mono text-[var(--text-muted)]"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Designated Title</label>
              <input
                type="text"
                value={userTitle}
                onChange={(e) => setUserTitle(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
              />
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--border)] flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-95 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: Organization Parameters */}
      {activeTab === 'organization' && (
        <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs max-w-xl">
          <h3 className="text-sm font-bold text-[var(--text-main)] mb-1">Organization Profile</h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Manage organization legal name, industry, and reporting jurisdiction.
          </p>

          <form onSubmit={handleSaveOrg} className="flex flex-col gap-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">Organization Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Industry Sector</label>
              <input
                type="text"
                value={orgIndustry}
                onChange={(e) => setOrgIndustry(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Country Jurisdiction</label>
              <input
                type="text"
                value={orgCountry}
                onChange={(e) => setOrgCountry(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-xs"
              />
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--border)] flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-95 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Organization Settings</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Settings;
