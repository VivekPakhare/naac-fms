import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import RoleGuard from './components/RoleGuard'
import DashboardLayout from './layouts/DashboardLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TeacherDashboard from './pages/TeacherDashboard'
import HodDashboard from './pages/HodDashboard'
import CriterionFormPage from './pages/CriterionFormPage'
import MyDocuments from './pages/MyDocuments'
import NotificationsPage from './pages/NotificationsPage'
import ProfilePage from './pages/ProfilePage'
import { NotFoundPage, ForbiddenPage, ServerErrorPage } from './pages/ErrorPages'
import './App.css'

function HomeRedirect() {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F9FF' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#003580] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500 font-medium">Loading NAAC FMS...</span>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return user.role === 'hod'
    ? <Navigate to="/dashboard/hod" replace />
    : <Navigate to="/dashboard/teacher" replace />;
}

function GuestRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F9FF' }}>
        <div className="w-10 h-10 border-4 border-[#003580] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (isAuthenticated) {
    return user.role === 'hod'
      ? <Navigate to="/dashboard/hod" replace />
      : <Navigate to="/dashboard/teacher" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Home — auto-redirect based on role */}
      <Route path="/" element={<HomeRedirect />} />

      {/* Guest-only routes */}
      <Route path="/login" element={
        <GuestRoute><LoginPage /></GuestRoute>
      } />
      <Route path="/register" element={
        <GuestRoute><RegisterPage /></GuestRoute>
      } />

      {/* Protected: Teacher routes */}
      <Route path="/dashboard/teacher" element={
        <ProtectedRoute>
          <RoleGuard roles={['teacher']}>
            <DashboardLayout />
          </RoleGuard>
        </ProtectedRoute>
      }>
        <Route index element={<TeacherDashboard />} />
        <Route path="criteria/:id" element={<CriterionFormPage />} />
        <Route path="documents" element={<MyDocuments />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Protected: HOD routes */}
      <Route path="/dashboard/hod" element={
        <ProtectedRoute>
          <RoleGuard roles={['hod']}>
            <DashboardLayout />
          </RoleGuard>
        </ProtectedRoute>
      }>
        <Route index element={<HodDashboard />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Error pages */}
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="/500" element={<ServerErrorPage />} />

      {/* 404 fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
