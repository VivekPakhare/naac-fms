import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import RoleGuard from './components/RoleGuard'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TeacherDashboard from './pages/TeacherDashboard'
import HodDashboard from './pages/HodDashboard'
import './App.css'

/**
 * HomeRedirect — sends authenticated users to their role-specific dashboard,
 * unauthenticated users to /login.
 */
function HomeRedirect() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return user.role === 'hod'
    ? <Navigate to="/dashboard/hod" replace />
    : <Navigate to="/dashboard/teacher" replace />;
}

/**
 * GuestRoute — redirects authenticated users away from login/register.
 */
function GuestRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
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

      {/* Protected: Teacher Dashboard */}
      <Route path="/dashboard/teacher" element={
        <ProtectedRoute>
          <RoleGuard roles={['teacher']}>
            <TeacherDashboard />
          </RoleGuard>
        </ProtectedRoute>
      } />

      {/* Protected: HOD Dashboard */}
      <Route path="/dashboard/hod" element={
        <ProtectedRoute>
          <RoleGuard roles={['hod']}>
            <HodDashboard />
          </RoleGuard>
        </ProtectedRoute>
      } />

      {/* 404 fallback */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
          <div className="text-center">
            <h1 className="text-6xl font-black text-slate-700 mb-4">404</h1>
            <p className="text-slate-400 mb-6">Page not found</p>
            <a href="/" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 transition-colors">
              Go Home
            </a>
          </div>
        </div>
      } />
    </Routes>
  )
}
