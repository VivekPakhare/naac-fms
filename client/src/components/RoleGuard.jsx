import { useAuth } from '../context/AuthContext';
import { ShieldX } from 'lucide-react';

/**
 * RoleGuard — shows a 403 Forbidden page if the user's role
 * is not in the allowed list.
 *
 * Usage: <RoleGuard roles={['hod']}><HodDashboard /></RoleGuard>
 */
export default function RoleGuard({ roles, children }) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="text-center max-w-md">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
            <ShieldX className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">403 — Forbidden</h1>
          <p className="text-slate-400 mb-6">
            You don't have permission to access this page. 
            Required role: <span className="text-red-400 font-semibold">{roles.join(' or ')}</span>.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 transition-colors"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  return children;
}
