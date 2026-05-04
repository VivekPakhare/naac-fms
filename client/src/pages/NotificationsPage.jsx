import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  Bell, Mail, AlertTriangle, ShieldCheck, Clock,
  CheckCheck, Filter, Loader2, Inbox
} from 'lucide-react';

const TYPES = [
  { value: '', label: 'All', icon: Bell },
  { value: 'reminder', label: 'Reminders', icon: Mail },
  { value: 'revision_request', label: 'Revisions', icon: AlertTriangle },
  { value: 'verified', label: 'Verified', icon: ShieldCheck },
  { value: 'deadline', label: 'Deadlines', icon: Clock },
];

const ICON_MAP = { reminder: Mail, revision_request: AlertTriangle, verified: ShieldCheck, deadline: Clock };
const COLOR_MAP = {
  reminder: 'text-amber-400 bg-amber-500/10',
  revision_request: 'text-red-400 bg-red-500/10',
  verified: 'text-emerald-400 bg-emerald-500/10',
  deadline: 'text-orange-400 bg-orange-500/10',
};

function formatDate(d) {
  const dt = new Date(d);
  const now = new Date();
  const diff = now - dt;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1 });
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (typeFilter) params.set('type', typeFilter);
      const r = await api.get(`/notifications/my?${params}`);
      setNotifications(r.data.data);
      setPagination(r.data.pagination);
      setUnreadCount(r.data.unreadCount);
    } catch {}
    finally { setLoading(false); }
  }, [page, typeFilter]);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  async function markRead(id) {
    await api.put(`/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    await api.put('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-400" /> Notifications
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/80 text-white rounded-xl text-sm font-medium hover:bg-indigo-500 transition-colors">
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {TYPES.map((t) => (
          <button key={t.value} onClick={() => { setTypeFilter(t.value); setPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              typeFilter === t.value
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
              <Inbox className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium">No notifications</p>
            <p className="text-slate-600 text-sm">You're all caught up</p>
          </div>
        ) : (
          notifications.map((n) => {
            const Icon = ICON_MAP[n.type] || Bell;
            const color = COLOR_MAP[n.type] || 'text-slate-400 bg-slate-700/50';
            return (
              <div key={n.id}
                onClick={() => !n.isRead && markRead(n.id)}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-colors cursor-pointer ${
                  !n.isRead
                    ? 'bg-indigo-500/5 border-indigo-500/20 hover:bg-indigo-500/10'
                    : 'bg-slate-900/30 border-slate-800 hover:bg-slate-800/50'
                }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-relaxed ${!n.isRead ? 'text-white' : 'text-slate-400'}`}>
                    {n.message}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-600">{formatDate(n.createdAt)}</span>
                    {n.sender?.fullName && (
                      <span className="text-xs text-slate-600">from {n.sender.fullName}</span>
                    )}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      !n.isRead ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {n.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                {!n.isRead && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0 mt-2" />}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                page === p ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
