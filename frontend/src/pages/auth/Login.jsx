import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Shield, ArrowRight, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Plain JS validation (no Zod/React-Hook-Form)
    if (!email.trim() || !password.trim()) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.message || 'Invalid credentials');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden">
        {/* Top Header */}
        <div className="p-6 md:p-8 bg-gradient-to-b from-[var(--surface-container)] to-[var(--surface)] border-b border-[var(--border)] text-center">
          <div className="w-12 h-12 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-main)]">
            ESG Enterprise Platform
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Centralized Environmental, Social & Governance Assurance
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3.5 py-2 text-sm bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:bg-[var(--surface)] transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2 text-sm bg-[var(--surface-container)] border border-[var(--border)] rounded-lg text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:bg-[var(--surface)] transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-2.5 px-4 rounded-lg bg-[var(--primary)] text-white font-semibold text-sm hover:opacity-95 transition-opacity flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Workspace'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="mt-6 pt-6 border-t border-[var(--border)]">
            {/* Cheat Login Button */}
            <Link
              to="/cheat-login"
              className="w-full py-2.5 px-4 mb-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10 border border-amber-500/40 hover:border-amber-500 text-amber-800 dark:text-amber-300 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs group"
            >
              <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>⚡ Cheat Login (Instant Role Cards)</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-3 text-center">
              Quick Role Switch (Demo Accounts)
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@abc.com')}
                className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface-container)] hover:border-[var(--primary)] text-left transition-colors flex flex-col"
              >
                <span className="font-semibold text-[var(--text-main)]">Elena Vance</span>
                <span className="text-[10px] text-emerald-600 font-medium">Org Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('manager@abc.com')}
                className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface-container)] hover:border-[var(--primary)] text-left transition-colors flex flex-col"
              >
                <span className="font-semibold text-[var(--text-main)]">Marcus Hayes</span>
                <span className="text-[10px] text-blue-600 font-medium">ESG Manager</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('auditor@auditcorp.com')}
                className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface-container)] hover:border-[var(--primary)] text-left transition-colors flex flex-col"
              >
                <span className="font-semibold text-[var(--text-main)]">Dr. Sophia B.</span>
                <span className="text-[10px] text-amber-600 font-medium">Lead Auditor</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@platform.com')}
                className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface-container)] hover:border-[var(--primary)] text-left transition-colors flex flex-col"
              >
                <span className="font-semibold text-[var(--text-main)]">Alex Wright</span>
                <span className="text-[10px] text-purple-600 font-medium">Platform Admin</span>
              </button>
            </div>
            <p className="text-[10px] text-center text-[var(--text-muted)] mt-2">
              Default password for all demo accounts: <code className="font-mono font-semibold">password123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
