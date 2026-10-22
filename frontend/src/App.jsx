import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';

import DemoRoleBar from './components/common/DemoRoleBar';
import Navbar from './components/common/Navbar';
import Toast from './components/common/Toast';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import JoinQueuePage from './pages/customer/JoinQueuePage';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import QRJoinPage from './pages/customer/QRJoinPage';
import StaffDashboard from './pages/staff/StaffDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import QRCodeManagementPage from './pages/admin/QRCodeManagementPage';
import PublicDisplayPage from './pages/PublicDisplayPage';

// Protected Route Guard
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Layout wrapper to conditionally hide navbar on public TV display
function Layout({ children }) {
  const location = useLocation();
  const isDisplay = location.pathname.startsWith('/display');
  const isQR = location.pathname.startsWith('/join/');

  return (
    <div className="min-h-screen flex flex-col bg-[#0B132B]">
      {!isDisplay && <DemoRoleBar />}
      {!isDisplay && !isQR && <Navbar />}
      <main className="flex-1">{children}</main>
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <Router>
            <Layout>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/join" element={<JoinQueuePage />} />
                <Route path="/join/:orgId" element={<QRJoinPage />} />
                <Route path="/join/:orgId/:serviceId" element={<QRJoinPage />} />
                <Route path="/display" element={<PublicDisplayPage />} />

                {/* Customer Routes */}
                <Route path="/customer" element={<CustomerDashboard />} />
                <Route path="/my-tickets" element={<CustomerDashboard />} />

                {/* Staff Routes */}
                <Route
                  path="/staff"
                  element={
                    <ProtectedRoute allowedRoles={['staff', 'admin']}>
                      <StaffDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/analytics"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AnalyticsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/qr"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <QRCodeManagementPage />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </Router>
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
