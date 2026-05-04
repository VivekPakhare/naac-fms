import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Shield, Users, FileCheck, ClipboardList, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HodDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully.');
    navigate('/login', { replace: true });
  };

  const stats = [
    { label: 'Total Teachers', value: '3', icon: Users, color: 'from-indigo-500 to-purple-500', bgColor: 'bg-indigo-500/10', textColor: 'text-indigo-400' },
    { label: 'Submissions', value: '0', icon: ClipboardList, color: 'from-emerald-500 to-teal-500', bgColor: 'bg-emerald-500/10', textColor: 'text-emerald-400' },
    { label: 'Verified', value: '0', icon: FileCheck, color: 'from-cyan-500 to-blue-500', bgColor: 'bg-cyan-500/10', textColor: 'text-cyan-400' },
    { label: 'Needs Revision', value: '0', icon: AlertTriangle, color: 'from-amber-500 to-orange-500', bgColor: 'bg-amber-500/10', textColor: 'text-amber-400' },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <div>
              <h1 className="text-white font-semibold text-sm">NAAC FMS</h1>
              <p className="text-slate-500 text-xs">HOD Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-900 rounded-xl border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-amber-400" />
              </div>
              <div className="hidden sm:block">
                <p className="text-white text-sm font-medium">{user?.fullName}</p>
                <p className="text-amber-400 text-xs font-medium">Super User</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-1">
            HOD Dashboard 🛡️
          </h2>
          <p className="text-slate-400">
            Overview of all teacher submissions and NAAC documentation progress.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="group p-5 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
                </div>
                <span className="text-3xl font-bold text-white">{stat.value}</span>
              </div>
              <p className="text-slate-400 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* 7 Criteria Progress Overview */}
        <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-5">NAAC Criteria Progress</h3>
          <div className="space-y-4">
            {[
              { code: 'C1', name: 'Curricular Aspects', progress: 0 },
              { code: 'C2', name: 'Teaching-Learning and Evaluation', progress: 0 },
              { code: 'C3', name: 'Research, Innovations and Extension', progress: 0 },
              { code: 'C4', name: 'Infrastructure and Learning Resources', progress: 0 },
              { code: 'C5', name: 'Student Support and Progression', progress: 0 },
              { code: 'C6', name: 'Governance, Leadership and Management', progress: 0 },
              { code: 'C7', name: 'Institutional Values and Best Practices', progress: 0 },
            ].map((criteria) => (
              <div key={criteria.code} className="flex items-center gap-4">
                <span className="text-indigo-400 font-mono text-sm font-bold w-8">{criteria.code}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-300 text-sm">{criteria.name}</span>
                    <span className="text-slate-500 text-xs">{criteria.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${criteria.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
