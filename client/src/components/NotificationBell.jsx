import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Bell, BellRing, Check, CheckCheck, AlertTriangle,
  Clock, Mail, ShieldCheck, X
} from 'lucide-react';

const ICON_MAP = {
  reminder: Mail,
  revision_request: AlertTriangle,
  verified: ShieldCheck,
  deadline: Clock,
};

const COLOR_MAP = {
  reminder: 'text-amber-400 bg-amber-500/10',
  revision_request: 'text-red-400 bg-red-500/10',
  verified: 'text-emerald-400 bg-emerald-500/10',
  deadline: 'text-orange-400 bg-orange-500/10',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const fetchCount = useCallback(async () => {
    try {
      const r = await api.get('/notifications/unread-count');
      setUnreadCount(r.data.count);
    } catch {}
  }, []);

  const fetchRecent = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/notifications/my?limit=5');
      setNotifications(r.data.data);
      setUnreadCount(r.data.unreadCount);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchCount]);

  useEffect(() => {
    if (open) fetchRecent();
  }, [open, fetchRecent]);

  // Click outside to close
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function markRead(id) {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  }

  async function markAllRead() {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  }

  return (
    <div className="relative" ref={ref}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5 text-amber-400 animate-pulse" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold bg-red-500 text-white rounded-full leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-12 w-[380px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[340px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = ICON_MAP[n.type] || Bell;
                const color = COLOR_MAP[n.type] || 'text-slate-400 bg-slate-700/50';
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.isRead && markRead(n.id)}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-slate-800/50 cursor-pointer transition-colors hover:bg-slate-800/50 ${!n.isRead ? 'bg-indigo-500/5' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-relaxed ${!n.isRead ? 'text-slate-200' : 'text-slate-400'}`}>
                        {n.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-600">{timeAgo(n.createdAt)}</span>
                        {n.sender?.fullName && (
                          <span className="text-[10px] text-slate-600">from {n.sender.fullName}</span>
                        )}
                      </div>
                    </div>
                    {!n.isRead && (
                      <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-800">
            <button
              onClick={() => { setOpen(false); navigate(`/dashboard/${user?.role === 'hod' ? 'hod' : 'teacher'}/notifications`); }}
              className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 font-medium py-1"
            >
              View All Notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
