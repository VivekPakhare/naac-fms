import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  TrendingUp, FileText, Upload, Clock, AlertTriangle,
  ChevronRight, Download, ExternalLink, CheckCircle2,
  XCircle, RefreshCw, Loader2, FolderOpen
} from 'lucide-react';

const STATUS_CONFIG = {
  not_started: { label: 'Not Started', bg: 'bg-slate-700/50', text: 'text-slate-400', ring: 'ring-slate-600' },
  in_progress: { label: 'In Progress', bg: 'bg-amber-500/15', text: 'text-amber-400', ring: 'ring-amber-500/30' },
  submitted: { label: 'Submitted', bg: 'bg-blue-500/15', text: 'text-blue-400', ring: 'ring-blue-500/30' },
  verified: { label: 'Verified', bg: 'bg-emerald-500/15', text: 'text-emerald-400', ring: 'ring-emerald-500/30' },
  needs_revision: { label: 'Needs Revision', bg: 'bg-red-500/15', text: 'text-red-400', ring: 'ring-red-500/30' },
};

function getProgressColor(pct) {
  if (pct <= 33) return { stroke: '#ef4444', bg: '#ef444420', bar: 'bg-red-500' };
  if (pct <= 66) return { stroke: '#f59e0b', bg: '#f59e0b20', bar: 'bg-amber-500' };
  return { stroke: '#22c55e', bg: '#22c55e20', bar: 'bg-emerald-500' };
}

/* ── SVG Circular Progress ─────────────────────────────── */
function CircularProgress({ percent, size = 160, strokeWidth = 12 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const color = getProgressColor(percent);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#1e293b" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color.stroke} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-white">{percent}%</span>
        <span className="text-xs text-slate-500 mt-0.5">Complete</span>
      </div>
    </div>
  );
}

/* ── Skeleton Loaders ──────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="h-5 w-16 bg-slate-800 rounded-lg" />
        <div className="h-5 w-20 bg-slate-800 rounded-full" />
      </div>
      <div className="h-4 w-3/4 bg-slate-800 rounded mb-4" />
      <div className="h-2 w-full bg-slate-800 rounded-full mb-3" />
      <div className="flex justify-between">
        <div className="h-3 w-20 bg-slate-800 rounded" />
        <div className="h-3 w-12 bg-slate-800 rounded" />
      </div>
    </div>
  );
}

function SkeletonDashboard() {
  return (
    <div className="p-6 lg:p-8 space-y-8 animate-pulse">
      <div className="h-8 w-64 bg-slate-800 rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-48 bg-slate-900/50 border border-slate-800 rounded-2xl" />
        <div className="h-48 bg-slate-900/50 border border-slate-800 rounded-2xl lg:col-span-2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {[...Array(7)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}

/* ── Empty State ───────────────────────────────────────── */
function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-slate-600" />
      </div>
      <p className="text-slate-400 font-medium text-sm mb-1">{title}</p>
      <p className="text-slate-600 text-xs max-w-[240px]">{description}</p>
    </div>
  );
}

/* ── Main Dashboard ────────────────────────────────────── */
export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(null);

  // Configurable deadline
  const DEADLINE = new Date('2026-07-31T23:59:59');

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/dashboard/teacher');
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }

  function getDeadlineInfo() {
    const now = new Date();
    const diff = DEADLINE - now;
    if (diff <= 0) return { text: 'Deadline passed', urgent: true, days: 0 };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return {
      text: `${days}d ${hours}h remaining`,
      urgent: days < 7,
      days,
    };
  }

  async function handleExport(type) {
    setExporting(type);
    try {
      const res = await api.get(`/export/${type}`, { responseType: 'blob' });
      
      // Check if the response is actually an error (JSON instead of binary)
      if (res.data.type === 'application/json') {
        const text = await res.data.text();
        const err = JSON.parse(text);
        toast.error(err.message || 'Export failed');
        return;
      }

      const mimeType = type === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const ext = type === 'pdf' ? 'pdf' : 'xlsx';
      const blob = new Blob([res.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NAAC_Report_${new Date().toISOString().split('T')[0]}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(`${type.toUpperCase()} exported successfully!`);
    } catch (err) {
      toast.error(err?.response?.data?.message || `${type.toUpperCase()} export failed. Please try again.`);
    }
    finally { setExporting(null); }
  }

  if (loading) return <SkeletonDashboard />;

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-md mx-auto text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Failed to load dashboard</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <button onClick={fetchDashboard}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 transition-colors inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const deadline = getDeadlineInfo();

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">
            Welcome back, {user?.fullName?.split(' ')[0]} 👋
          </h2>
          <p className="text-slate-400 text-sm">
            {user?.designation || 'Teacher'} • {user?.department || 'Department'} •
            NAAC Accreditation Portal
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('pdf')} disabled={!!exporting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/80 text-white rounded-xl text-sm font-medium hover:bg-red-500 transition-colors disabled:opacity-50">
            {exporting === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Export PDF
          </button>
          <button onClick={() => handleExport('excel')} disabled={!!exporting}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600/80 text-white rounded-xl text-sm font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50">
            {exporting === 'excel' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export Excel
          </button>
        </div>
      </div>

      {/* ── Progress + Stats Row ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Circular Progress */}
        <div className="lg:col-span-4 p-6 bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col items-center justify-center">
          <CircularProgress percent={data.overall_progress} />
          <p className="text-slate-400 text-sm mt-4">Overall Progress</p>
          <p className="text-slate-600 text-xs mt-1">
            {data.total_files_uploaded} files uploaded / {data.total_files_required} sub-criteria
          </p>
        </div>

        {/* Stats cards */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{data.criteria_progress.filter(c => c.status === 'verified').length}/7</p>
            <p className="text-slate-500 text-sm mt-1">Criteria Verified</p>
          </div>

          <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Upload className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{data.total_files_uploaded}</p>
            <p className="text-slate-500 text-sm mt-1">Files Uploaded</p>
          </div>

          <div className={`p-5 border rounded-2xl ${deadline.urgent ? 'bg-red-500/5 border-red-500/20' : 'bg-slate-900/50 border-slate-800'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${deadline.urgent ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                <Clock className={`w-5 h-5 ${deadline.urgent ? 'text-red-400' : 'text-amber-400'}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${deadline.urgent ? 'text-red-400' : 'text-white'}`}>{deadline.days}d</p>
            <p className={`text-sm mt-1 ${deadline.urgent ? 'text-red-400/70' : 'text-slate-500'}`}>{deadline.text}</p>
          </div>

          {/* Export Buttons */}
          <div className="sm:col-span-3 flex flex-wrap gap-3">
            <button onClick={() => handleExport('pdf')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-xl text-sm font-medium hover:bg-indigo-600/20 transition-colors">
              <Download className="w-4 h-4" /> Export PDF Report
            </button>
            <button onClick={() => handleExport('excel')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-600/20 transition-colors">
              <Download className="w-4 h-4" /> Export Excel Report
            </button>
          </div>
        </div>
      </div>

      {/* ── Criteria Grid ───────────────────────────────── */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">NAAC Criteria</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {data.criteria_progress.map((criterion) => {
            const color = getProgressColor(criterion.completion_pct);
            const status = STATUS_CONFIG[criterion.status] || STATUS_CONFIG.not_started;

            return (
              <div key={criterion.criteria_id}
                className="group p-5 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-slate-700 hover:bg-slate-900/80 transition-all duration-300">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg">
                    {criterion.code}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ${status.bg} ${status.text} ${status.ring}`}>
                    {status.label}
                  </span>
                </div>

                {/* Name + Marks */}
                <h4 className="text-sm font-medium text-white mb-1 leading-snug line-clamp-2">
                  {criterion.name}
                </h4>
                <p className="text-xs text-slate-500 mb-4">Max Marks: {criterion.max_marks}</p>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ease-out ${color.bar}`}
                      style={{ width: `${criterion.completion_pct}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs mb-4">
                  <span className="text-slate-500">
                    {criterion.completed_sub_criteria}/{criterion.sub_criteria_count} sub-criteria
                  </span>
                  <span className="text-white font-semibold">{criterion.completion_pct}%</span>
                </div>

                {/* Open Button */}
                <button
                  onClick={() => navigate(`criteria/${criterion.criteria_id}`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600/10 text-indigo-400 rounded-xl text-sm font-medium hover:bg-indigo-600/20 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                  <ExternalLink className="w-3.5 h-3.5" /> Open
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Activity + Pending ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" /> Recent Activity
          </h3>
          {data.recent_activity.length === 0 ? (
            <EmptyState icon={FileText} title="No activity yet" description="Your recent actions will appear here once you start working on criteria." />
          ) : (
            <div className="space-y-3">
              {data.recent_activity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    {activity.action.includes('UPLOAD') ? (
                      <Upload className="w-4 h-4 text-indigo-400" />
                    ) : activity.action.includes('SUBMIT') ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <FileText className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">{activity.description || activity.action}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(activity.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Items */}
        <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Pending Items
          </h3>
          {data.pending_items.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="All caught up!" description="No pending items. All sub-criteria have submissions." />
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {data.pending_items.slice(0, 10).map((item, idx) => (
                <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl ${item.type === 'revision' ? 'bg-red-500/5 border border-red-500/10' : 'bg-slate-800/30'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${item.type === 'revision' ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                    {item.type === 'revision' ? (
                      <XCircle className="w-4 h-4 text-red-400" />
                    ) : (
                      <FolderOpen className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white">
                      <span className="text-indigo-400 font-medium">{item.criteria_code} / {item.sub_criteria_code}</span>
                      {' — '}{item.sub_criteria_name}
                    </p>
                    <p className={`text-xs mt-0.5 ${item.type === 'revision' ? 'text-red-400/70' : 'text-slate-500'}`}>
                      {item.message}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 mt-1" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
