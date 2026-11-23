import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('esg_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('esg_token') || null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('esg_theme');
    return (saved && saved !== 'emerald') ? saved : 'red_pulse';
  });
  const [activePeriod, setActivePeriod] = useState('FY 2026–27');
  const [currentOrg, setCurrentOrg] = useState(() => {
    const saved = localStorage.getItem('esg_current_org');
    return saved ? JSON.parse(saved) : null;
  });

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('esg_theme', theme);
  }, [theme]);

  // Fetch current user on startup if token exists
  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.data);
            localStorage.setItem('esg_user', JSON.stringify(res.data.data));
            if (res.data.data.organization && !currentOrg) {
              setCurrentOrg(res.data.data.organization);
              localStorage.setItem('esg_current_org', JSON.stringify(res.data.data.organization));
            }
          }
        } catch (err) {
          console.error('Session verification failed', err);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token: newToken, user: userData } = res.data.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('esg_token', newToken);
      localStorage.setItem('esg_user', JSON.stringify(userData));
      if (userData.organization) {
        setCurrentOrg(userData.organization);
        localStorage.setItem('esg_current_org', JSON.stringify(userData.organization));
      }
      return { success: true };
    }
    return { success: false, message: res.data.message };
  };

  const logout = () => {
    localStorage.removeItem('esg_token');
    localStorage.removeItem('esg_user');
    localStorage.removeItem('esg_selected_org');
    localStorage.removeItem('esg_current_org');
    setToken(null);
    setUser(null);
    setCurrentOrg(null);
  };

  const switchTheme = (newTheme) => {
    setTheme(newTheme);
  };

  const switchOrganization = (org) => {
    setCurrentOrg(org);
    if (org && org.id) {
      localStorage.setItem('esg_selected_org', org.id);
      localStorage.setItem('esg_current_org', JSON.stringify(org));
    } else {
      localStorage.removeItem('esg_selected_org');
      localStorage.removeItem('esg_current_org');
    }
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    organization: currentOrg || user?.organization || null,
    loading,
    theme,
    activePeriod,
    setActivePeriod,
    switchTheme,
    switchOrganization,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
