import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, BookOpen, FileText, Upload, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully.');
    navigate('/login', { replace: true });
  };

  const stats = [
    { label: 'Forms Submitted', value: '0', icon: FileText, color: 'indigo' },
    { label: 'Documents Uploaded', value: '0', icon: Upload, color: 'emerald' },
    { label: 'Pending Reviews', value: '0', icon: BarChart3, color: 'amber' },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <div>
              <h1 className="text-white font-semibold text-sm">NAAC FMS</h1>
              <p className="text-slate-500 text-xs">Teacher Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-900 rounded-xl border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <User className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="hidden sm:block">
                <p className="text-white text-sm font-medium">{user?.fullName}</p>
                <p className="text-slate-500 text-xs">{user?.department || 'Teacher'}</p>
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
            Welcome, {user?.fullName?.split(' ')[0]} 👋
          </h2>
          <p className="text-slate-400">
            Your NAAC documentation dashboard. Submit forms and upload documents for accreditation.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                </div>
                <span className="text-3xl font-bold text-white">{stat.value}</span>
              </div>
              <p className="text-slate-400 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Profile Card */}
        <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Your Profile
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Full Name', value: user?.fullName },
              { label: 'Email', value: user?.email },
              { label: 'Role', value: user?.role === 'teacher' ? 'Teacher' : 'HOD' },
              { label: 'Department', value: user?.department || '—' },
              { label: 'Designation', value: user?.designation || '—' },
              { label: 'Subjects', value: user?.subjectsTaught || '—' },
            ].map((item) => (
              <div key={item.label} className="p-3 bg-slate-800/50 rounded-xl">
                <p className="text-slate-500 text-xs mb-1">{item.label}</p>
                <p className="text-white text-sm font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
