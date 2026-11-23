import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-[var(--text-muted)]">Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="p-8 text-center bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-md mx-auto my-12">
        <h2 className="text-lg font-bold text-red-600 mb-1">Access Restricted</h2>
        <p className="text-xs text-[var(--text-muted)]">
          Your assigned role [{role}] does not have permission to view this module.
        </p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
