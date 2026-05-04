import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, BookOpen, FileText, User, Bell, LogOut, ChevronDown, ChevronRight,
  X, GraduationCap
} from 'lucide-react';
import toast from 'react-hot-toast';

const CRITERIA = [
  { code: 'C1', name: 'Curriculum Aspects', subs: ['1.1', '1.2', '1.3'] },
  { code: 'C2', name: 'Teaching-Learning & Evaluation', subs: ['2.1', '2.2', '2.3', '2.4'] },
  { code: 'C3', name: 'Research & Innovation', subs: ['3.1', '3.2', '3.3'] },
  { code: 'C4', name: 'Infrastructure & Resources', subs: ['4.1', '4.2', '4.3'] },
  { code: 'C5', name: 'Student Support', subs: ['5.1', '5.2'] },
  { code: 'C6', name: 'Governance & Management', subs: ['6.1', '6.2', '6.3'] },
  { code: 'C7', name: 'Values & Best Practices', subs: ['7.1', '7.2'] },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [expandedCriteria, setExpandedCriteria] = useState(null);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully.');
    navigate('/login', { replace: true });
  };

  const toggleCriteria = (code) => {
    setExpandedCriteria(expandedCriteria === code ? null : code);
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-indigo-500/15 text-indigo-400'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
    }`;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-slate-950 border-r border-slate-800/80 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-sm tracking-tight">NAAC FMS</h1>
              <p className="text-slate-500 text-[10px]">File Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <NavLink to="/dashboard/teacher" end className={linkClass} onClick={onClose}>
            <LayoutDashboard className="w-[18px] h-[18px]" />
            Dashboard
          </NavLink>

          {/* Criteria — collapsible */}
          <div className="pt-3 pb-1">
            <p className="px-4 text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2">
              Criteria
            </p>
          </div>

          {CRITERIA.map((c) => (
            <div key={c.code}>
              <button
                onClick={() => toggleCriteria(c.code)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <span className="w-[18px] text-center text-xs font-bold text-indigo-400/70">
                    {c.code.replace('C', '')}
                  </span>
                  <span className="truncate text-left">{c.name}</span>
                </div>
                {expandedCriteria === c.code ? (
                  <ChevronDown className="w-4 h-4 text-slate-600 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                )}
              </button>

              {/* Sub-criteria links */}
              {expandedCriteria === c.code && (
                <div className="ml-8 mt-1 space-y-0.5 border-l border-slate-800 pl-3">
                  {c.subs.map((sub) => (
                    <button
                      key={sub}
                      onClick={onClose}
                      className="block w-full text-left px-3 py-1.5 text-xs text-slate-500 hover:text-indigo-400 rounded-lg hover:bg-slate-800/40 transition-colors"
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Other nav items */}
          <div className="pt-3 pb-1">
            <p className="px-4 text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2">
              Account
            </p>
          </div>

          <NavLink to="/dashboard/teacher/documents" className={linkClass} onClick={onClose}>
            <FileText className="w-[18px] h-[18px]" />
            My Documents
          </NavLink>

          <NavLink to="/dashboard/teacher/profile" className={linkClass} onClick={onClose}>
            <User className="w-[18px] h-[18px]" />
            My Profile
          </NavLink>

          <NavLink to="/dashboard/teacher/notifications" className={linkClass} onClick={onClose}>
            <Bell className="w-[18px] h-[18px]" />
            Notifications
          </NavLink>
        </nav>

        {/* User card + Logout */}
        <div className="p-3 border-t border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-2 bg-slate-900/60 rounded-xl">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.fullName}</p>
              <p className="text-slate-500 text-[11px] truncate">{user?.department || 'Teacher'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
