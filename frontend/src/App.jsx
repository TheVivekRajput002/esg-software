import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

// Layout
import MainLayout from './components/layout/MainLayout';

// Pages
import Login from './pages/auth/Login';
import CheatLogin from './pages/auth/CheatLogin';
import Dashboard from './pages/dashboard/Dashboard';
import DataCollection from './pages/data-collection/DataCollection';
import Analytics from './pages/insights/EsgInsights';
import TargetManagement from './pages/target-management/TargetManagement';
import Validation from './pages/validation/Validation';
import Audit from './pages/audit/Audit';
import Reporting from './pages/reporting/Reporting';
import EsgManagement from './pages/esg-management/EsgManagement';
import Organizations from './pages/organizations/Organizations';
import UserManagement from './pages/users/UserManagement';
import Settings from './pages/settings/Settings';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/cheat-login" element={<CheatLogin />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="submissions" element={<DataCollection />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="targets" element={<TargetManagement />} />
            <Route path="reporting" element={<Reporting />} />
            <Route path="validation" element={<Validation />} />
            <Route path="audit" element={<Audit />} />
            <Route path="esg-management" element={<EsgManagement />} />
            <Route
              path="organizations"
              element={
                <ProtectedRoute allowedRoles={['platform_admin', 'org_admin']}>
                  <Organizations />
                </ProtectedRoute>
              }
            />
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={['platform_admin', 'org_admin']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
