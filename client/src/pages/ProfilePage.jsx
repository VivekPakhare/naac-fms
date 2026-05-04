import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    full_name: '',
    department: '',
    designation: '',
    subjects_taught: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || user.fullName || '',
        department: user.department || '',
        designation: user.designation || '',
        subjects_taught: user.subjects_taught || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', form);
      if (res.data?.success) {
        toast.success('Profile updated successfully');
        if (setUser) setUser({ ...user, ...form });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-enter max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">My Profile</h1>
      <p className="text-slate-500 text-sm mb-8">Manage your account information</p>

      <div className="card p-8">
        {/* Avatar */}
        <div className="flex items-center gap-5 mb-8 pb-8 border-b border-slate-100">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: 'linear-gradient(135deg, #003580, #0066CC)' }}>
            {(user?.full_name || user?.fullName || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">{user?.full_name || user?.fullName}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className="badge badge-submitted mt-1 text-[0.65rem]">
              {user?.role === 'hod' ? 'Head of Department' : 'Teacher'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department</label>
            <input
              type="text"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Designation</label>
            <input
              type="text"
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 transition-all"
              placeholder="e.g., Assistant Professor"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subjects Taught</label>
            <textarea
              value={form.subjects_taught}
              onChange={(e) => setForm({ ...form, subjects_taught: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 transition-all resize-none"
              placeholder="e.g., Data Structures, Machine Learning"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
