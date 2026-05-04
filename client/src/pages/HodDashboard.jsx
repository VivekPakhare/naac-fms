import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import ReviewModal from '../components/ReviewModal';
import {
  Users, FileCheck, ClipboardList, AlertTriangle, Upload, TrendingUp,
  ChevronDown, ChevronRight, Search, Download, Bell, Send, RefreshCw,
  Loader2, UserPlus, X, Eye, ToggleLeft, ToggleRight, Check
} from 'lucide-react';

const CRITERIA_CODES = ['C1','C2','C3','C4','C5','C6','C7'];
const STATUS_DOT = { not_started:'bg-slate-600', in_progress:'bg-amber-400', submitted:'bg-blue-400', verified:'bg-emerald-400', needs_revision:'bg-red-400' };

export default function HodDashboard() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [exporting, setExporting] = useState(false);
  // Review
  const [reviewData, setReviewData] = useState(null);
  const [reviewTeacher, setReviewTeacher] = useState('');
  // Audit
  const [logs, setLogs] = useState([]); const [logPage, setLogPage] = useState(1); const [logPages, setLogPages] = useState(1); const [logLoading, setLogLoading] = useState(false);
  // Teachers mgmt
  const [teachers, setTeachers] = useState([]); const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [newT, setNewT] = useState({ full_name:'', email:'', password:'', department:'', designation:'' });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([api.get('/hod/dashboard-stats'), api.get('/hod/teachers-progress')]);
      setStats(s.data.data); setProgress(p.data.data);
    } catch { toast.error('Failed to load dashboard'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Sort & filter progress
  const filtered = progress.filter(t => t.name.toLowerCase().includes(searchQ.toLowerCase()));
  const sorted = [...filtered].sort((a, b) => {
    const v = sortKey === 'name' ? a.name.localeCompare(b.name) : a.overall_percentage - b.overall_percentage;
    return sortAsc ? v : -v;
  });

  function toggleSort(key) { if (sortKey === key) setSortAsc(!sortAsc); else { setSortKey(key); setSortAsc(true); } }

  // Review
  async function openReview(teacherId, name, criteriaCode) {
    try {
      const r = await api.get(`/hod/teacher/${teacherId}/data/${criteriaCode}`);
      setReviewData(r.data.data.sub_criteria); setReviewTeacher(name);
    } catch { toast.error('Failed to load data'); }
  }

  // Remind
  async function sendRemind(teacherId, name) {
    try { await api.post(`/hod/remind/${teacherId}`, { message: `Reminder: Please complete pending NAAC submissions.` }); toast.success(`Reminder sent to ${name}`); } catch { toast.error('Failed'); }
  }
  async function sendBulk() {
    try { const r = await api.post('/hod/remind/all', {}); toast.success(r.data.message); } catch { toast.error('Failed'); }
  }

  // Audit logs
  async function fetchLogs(p = 1) {
    setLogLoading(true);
    try { const r = await api.get(`/hod/audit-logs?page=${p}&limit=25`); setLogs(r.data.data); setLogPage(r.data.pagination.page); setLogPages(r.data.pagination.pages); } catch { toast.error('Failed'); }
    finally { setLogLoading(false); }
  }

  // Teachers mgmt
  async function fetchTeachers() { try { const r = await api.get('/hod/teachers'); setTeachers(r.data.data); } catch {} }
  async function toggleActive(id, current) {
    try { await api.put(`/hod/teachers/${id}/status`, { is_active: !current }); toast.success('Updated'); fetchTeachers(); } catch { toast.error('Failed'); }
  }
  async function addTeacher() {
    if (!newT.full_name || !newT.email || !newT.password) { toast.error('Fill required fields'); return; }
    try { await api.post('/hod/teachers', newT); toast.success('Teacher created'); setShowAddTeacher(false); setNewT({ full_name:'', email:'', password:'', department:'', designation:'' }); fetchTeachers(); fetchAll(); } catch(e) { toast.error(e.response?.data?.message || 'Failed'); }
  }

  // Consolidated export
  async function exportConsolidated() {
    setExporting(true);
    try {
      const res = await api.get('/export/consolidated', { responseType: 'blob' });
      
      if (res.data.type === 'application/json') {
        const text = await res.data.text();
        const err = JSON.parse(text);
        toast.error(err.message || 'Export failed');
        return;
      }

      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NAAC_Consolidated_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Consolidated Excel exported successfully!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Export failed. Please try again.');
    }
    finally { setExporting(false); }
  }

  // Tab switch effects
  useEffect(() => { if (tab === 'audit') fetchLogs(); if (tab === 'teachers') fetchTeachers(); }, [tab]);

  if (loading) return (
    <div className="p-6 lg:p-8"><div className="animate-pulse space-y-6">
      <div className="h-8 w-64 bg-slate-800 rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_,i) => <div key={i} className="h-24 bg-slate-800 rounded-2xl" />)}</div>
      <div className="h-96 bg-slate-800 rounded-2xl" />
    </div></div>
  );

  const TABS = [
    { id:'overview', label:'Overview' }, { id:'heatmap', label:'Heatmap' },
    { id:'audit', label:'Audit Log' }, { id:'teachers', label:'Teachers' },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h2 className="text-2xl font-bold text-white">HOD Dashboard</h2>
          <p className="text-sm text-slate-400">Department-wide NAAC progress overview</p></div>
        <div className="flex gap-2">
          <button onClick={sendBulk} className="flex items-center gap-2 px-4 py-2 bg-amber-600/80 text-white rounded-xl text-sm font-medium hover:bg-amber-500 transition-colors">
            <Bell className="w-4 h-4" /> Bulk Remind
          </button>
          <button onClick={exportConsolidated} disabled={exporting} className="flex items-center gap-2 px-4 py-2 bg-emerald-600/80 text-white rounded-xl text-sm font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} {exporting ? 'Generating...' : 'Export Excel'}
          </button>
          <button onClick={fetchAll} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            { label:'Teachers', value:stats.total_teachers, icon:Users, color:'text-indigo-400 bg-indigo-500/10' },
            { label:'Started', value:stats.teachers_started, icon:TrendingUp, color:'text-cyan-400 bg-cyan-500/10' },
            { label:'Completion', value:`${stats.overall_completion}%`, icon:FileCheck, color:'text-emerald-400 bg-emerald-500/10' },
            { label:'Documents', value:stats.total_documents, icon:Upload, color:'text-blue-400 bg-blue-500/10' },
            { label:'Pending', value:stats.pending_review, icon:ClipboardList, color:'text-amber-400 bg-amber-500/10' },
            { label:'Verified', value:stats.verified, icon:Check, color:'text-emerald-400 bg-emerald-500/10' },
          ].map(s => (
            <div key={s.label} className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-9 h-9 rounded-xl ${s.color.split(' ')[1]} flex items-center justify-center`}>
                  <s.icon className={`w-4 h-4 ${s.color.split(' ')[0]}`} />
                </div>
                <span className="text-2xl font-bold text-white">{s.value}</span>
              </div>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-t-xl text-sm font-medium transition-colors ${tab === t.id ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW TAB ═══ */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search teachers..."
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-3 px-3 text-slate-400 font-medium cursor-pointer hover:text-white" onClick={() => toggleSort('name')}>
                    Teacher {sortKey==='name' && (sortAsc ? '↑' : '↓')}
                  </th>
                  {CRITERIA_CODES.map(c => <th key={c} className="text-center py-3 px-2 text-slate-400 font-medium">{c}</th>)}
                  <th className="text-center py-3 px-3 text-slate-400 font-medium cursor-pointer hover:text-white" onClick={() => toggleSort('overall')}>
                    Overall {sortKey==='overall' && (sortAsc ? '↑' : '↓')}
                  </th>
                  <th className="text-center py-3 px-3 text-slate-400 font-medium">Last Active</th>
                  <th className="text-right py-3 px-3 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(t => (
                  <tr key={t.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3">
                      <p className="text-white font-medium">{t.name}</p>
                      <p className="text-[11px] text-slate-500">{t.department || ''}</p>
                    </td>
                    {t.criteria.map(cp => (
                      <td key={cp.criteria_code} className="text-center py-3 px-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${STATUS_DOT[cp.status]}`} />
                          <span className="text-xs text-slate-300">{cp.percentage}%</span>
                        </div>
                      </td>
                    ))}
                    <td className="text-center py-3 px-3">
                      <span className={`text-sm font-bold ${t.overall_percentage >= 67 ? 'text-emerald-400' : t.overall_percentage >= 34 ? 'text-amber-400' : 'text-red-400'}`}>
                        {t.overall_percentage}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-3 text-xs text-slate-500">
                      {t.last_active ? new Date(t.last_active).toLocaleDateString('en-IN', { day:'numeric', month:'short' }) : '—'}
                    </td>
                    <td className="text-right py-3 px-3">
                      <div className="flex items-center justify-end gap-1">
                        <select onChange={e => { if (e.target.value) openReview(t.id, t.name, e.target.value); e.target.value=''; }}
                          className="bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded-lg px-2 py-1 outline-none">
                          <option value="">Review</option>
                          {CRITERIA_CODES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <button onClick={() => sendRemind(t.id, t.name)} title="Remind"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                          <Bell className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {sorted.length === 0 && <p className="text-center text-slate-500 py-8">No teachers found</p>}
        </div>
      )}

      {/* ═══ HEATMAP TAB ═══ */}
      {tab === 'heatmap' && (
        <div className="overflow-x-auto">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-xs text-slate-500">Intensity:</span>
            {[{l:'0%',c:'bg-slate-800'},{l:'1-50%',c:'bg-blue-900/40'},{l:'51-80%',c:'bg-blue-700/40'},{l:'81-100%',c:'bg-blue-500/40'}].map(i =>
              <div key={i.l} className="flex items-center gap-1"><div className={`w-4 h-4 rounded ${i.c}`} /><span className="text-[10px] text-slate-500">{i.l}</span></div>
            )}
            <div className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-400" /><span className="text-[10px] text-slate-500">Verified</span></div>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-800">
              <th className="text-left py-2 px-3 text-slate-400 font-medium">Teacher</th>
              {CRITERIA_CODES.map(c => <th key={c} className="text-center py-2 px-2 text-slate-400 font-medium">{c}</th>)}
            </tr></thead>
            <tbody>
              {progress.map(t => (
                <tr key={t.id} className="border-b border-slate-800/30">
                  <td className="py-2 px-3 text-white text-xs font-medium">{t.name}</td>
                  {t.criteria.map(cp => {
                    const bg = cp.percentage === 0 ? 'bg-slate-800/50' : cp.percentage <= 50 ? 'bg-blue-900/40' : cp.percentage <= 80 ? 'bg-blue-700/40' : 'bg-blue-500/40';
                    return (
                      <td key={cp.criteria_code} className="py-2 px-2 text-center">
                        <div className={`relative w-full py-2 rounded-lg ${bg} text-xs text-slate-300`}>
                          {cp.percentage}%
                          {cp.status === 'verified' && <Check className="absolute top-0.5 right-0.5 w-3 h-3 text-emerald-400" />}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ AUDIT LOG TAB ═══ */}
      {tab === 'audit' && (
        <div className="space-y-4">
          {logLoading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-indigo-400 animate-spin" /></div> : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-800">
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">Timestamp</th>
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">User</th>
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">Action</th>
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">Details</th>
                  </tr></thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id} className="border-b border-slate-800/30 hover:bg-slate-800/20">
                        <td className="py-2 px-3 text-xs text-slate-400">{new Date(log.createdAt).toLocaleString('en-IN')}</td>
                        <td className="py-2 px-3 text-xs text-white">{log.user?.fullName || '—'}</td>
                        <td className="py-2 px-3"><span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-indigo-400 font-medium">{log.action}</span></td>
                        <td className="py-2 px-3 text-xs text-slate-400 max-w-xs truncate">{log.description || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {logPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button onClick={() => fetchLogs(logPage - 1)} disabled={logPage <= 1}
                    className="px-3 py-1 rounded-lg text-xs bg-slate-800 text-slate-400 disabled:opacity-30">Prev</button>
                  <span className="text-xs text-slate-500">Page {logPage} of {logPages}</span>
                  <button onClick={() => fetchLogs(logPage + 1)} disabled={logPage >= logPages}
                    className="px-3 py-1 rounded-lg text-xs bg-slate-800 text-slate-400 disabled:opacity-30">Next</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══ TEACHERS TAB ═══ */}
      {tab === 'teachers' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAddTeacher(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-500 transition-colors">
              <UserPlus className="w-4 h-4" /> Add Teacher
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-800">
                <th className="text-left py-2 px-3 text-slate-400 font-medium">Name</th>
                <th className="text-left py-2 px-3 text-slate-400 font-medium">Email</th>
                <th className="text-left py-2 px-3 text-slate-400 font-medium">Department</th>
                <th className="text-center py-2 px-3 text-slate-400 font-medium">Status</th>
                <th className="text-center py-2 px-3 text-slate-400 font-medium">Last Login</th>
                <th className="text-center py-2 px-3 text-slate-400 font-medium">Registered</th>
                <th className="text-right py-2 px-3 text-slate-400 font-medium">Actions</th>
              </tr></thead>
              <tbody>
                {teachers.map(t => (
                  <tr key={t.id} className="border-b border-slate-800/30 hover:bg-slate-800/20">
                    <td className="py-2 px-3 text-white font-medium">{t.fullName}</td>
                    <td className="py-2 px-3 text-xs text-slate-400">{t.email}</td>
                    <td className="py-2 px-3 text-xs text-slate-400">{t.department || '—'}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center text-xs text-slate-500">
                      {t.lastLoginAt ? new Date(t.lastLoginAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="py-2 px-3 text-center text-xs text-slate-500">
                      {new Date(t.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button onClick={() => toggleActive(t.id, t.isActive)}
                        className={`p-1.5 rounded-lg transition-colors ${t.isActive ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-red-400 hover:bg-red-500/10'}`}
                        title={t.isActive ? 'Deactivate' : 'Activate'}>
                        {t.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Teacher Modal */}
          {showAddTeacher && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/70" onClick={() => setShowAddTeacher(false)} />
              <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4">
                <div className="flex justify-between"><h3 className="text-lg font-bold text-white">Add Teacher</h3>
                  <button onClick={() => setShowAddTeacher(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button></div>
                {['full_name','email','password','department','designation'].map(f => (
                  <input key={f} placeholder={f.replace('_',' ').replace(/\b\w/g,l=>l.toUpperCase())} value={newT[f]} onChange={e => setNewT(p => ({...p, [f]:e.target.value}))}
                    type={f==='password'?'password':'text'}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500" />
                ))}
                <button onClick={addTeacher} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-500 transition-colors">
                  Create Account
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal isOpen={!!reviewData} onClose={() => setReviewData(null)}
        teacherName={reviewTeacher} subCriteria={reviewData}
        onReviewDone={() => { setReviewData(null); fetchAll(); }} />
    </div>
  );
}
