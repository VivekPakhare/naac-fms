import { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Loader2, Download, Eye, FileText, Image, File } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const FILE_ICONS = {
  pdf: { icon: FileText, color: 'text-red-400', bg: 'bg-red-500/10' },
  jpg: { icon: Image, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  jpeg: { icon: Image, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  png: { icon: Image, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  docx: { icon: File, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
};

export default function ReviewModal({ isOpen, onClose, teacherName, subCriteria, onReviewDone }) {
  const [activeTab, setActiveTab] = useState(0);
  const [comment, setComment] = useState('');
  const [showRevisionBox, setShowRevisionBox] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !subCriteria) return null;

  const current = subCriteria[activeTab];
  const sub = current?.submission;

  async function handleVerify() {
    if (!sub) return;
    setLoading(true);
    try {
      await api.put(`/hod/review/${sub.id}`, { status: 'verified' });
      toast.success(`${current.code} marked as verified`);
      onReviewDone?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to verify');
    } finally { setLoading(false); }
  }

  async function handleRevision() {
    if (!sub || !comment.trim()) { toast.error('Please enter a comment'); return; }
    setLoading(true);
    try {
      await api.put(`/hod/review/${sub.id}`, { status: 'needs_revision', comment });
      toast.success(`Revision requested for ${current.code}`);
      setComment('');
      setShowRevisionBox(false);
      onReviewDone?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  }

  const entries = sub?.form_data?.entries || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white">Review Submission</h3>
            <p className="text-sm text-slate-400">{teacherName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-criteria tabs */}
        <div className="flex gap-1 p-3 border-b border-slate-800 overflow-x-auto shrink-0">
          {subCriteria.map((sc, i) => (
            <button key={sc.code} onClick={() => { setActiveTab(i); setShowRevisionBox(false); }}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === i ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}>
              {sc.code}
              {sc.submission && (
                <span className={`ml-1 w-1.5 h-1.5 rounded-full inline-block ${
                  sc.submission.status === 'verified' ? 'bg-emerald-400' :
                  sc.submission.status === 'submitted' ? 'bg-blue-400' :
                  sc.submission.status === 'needs_revision' ? 'bg-red-400' : 'bg-slate-600'
                }`} />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {!sub ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No submission for {current.code}</p>
            </div>
          ) : (
            <>
              {/* Status */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${
                sub.status === 'verified' ? 'bg-emerald-500/10 text-emerald-400' :
                sub.status === 'submitted' ? 'bg-blue-500/10 text-blue-400' :
                sub.status === 'needs_revision' ? 'bg-red-500/10 text-red-400' :
                'bg-slate-800 text-slate-400'
              }`}>
                Status: {sub.status.replace('_', ' ')}
                {sub.hod_comment && <span className="ml-2 text-xs opacity-70">— "{sub.hod_comment}"</span>}
              </div>

              {/* Form data entries */}
              {entries.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-300">Form Entries ({entries.length})</h4>
                  {entries.map((entry, idx) => (
                    <div key={idx} className="p-4 bg-slate-800/40 border border-slate-700/40 rounded-xl">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {Object.entries(entry).map(([key, val]) => (
                          <div key={key}>
                            <span className="text-[10px] text-slate-500 uppercase">{key.replace(/_/g, ' ')}</span>
                            <p className="text-sm text-white">{Array.isArray(val) ? val.join(', ') : val || '—'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Documents */}
              {sub.documents?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-300">Documents ({sub.documents.length})</h4>
                  {sub.documents.map((doc) => {
                    const fi = FILE_ICONS[doc.fileType] || FILE_ICONS.pdf;
                    const FI = fi.icon;
                    return (
                      <div key={doc.id} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl">
                        <div className={`w-9 h-9 rounded-lg ${fi.bg} flex items-center justify-center`}>
                          <FI className={`w-4 h-4 ${fi.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{doc.originalFilename}</p>
                          <p className="text-[11px] text-slate-500">{(doc.fileSize / 1024).toFixed(0)} KB</p>
                        </div>
                        <button onClick={() => window.open(`${api.defaults.baseURL}/upload/${doc.id}/view`, '_blank')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => window.open(`${api.defaults.baseURL}/upload/${doc.id}/download`, '_blank')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        {sub && sub.status !== 'verified' && (
          <div className="p-5 border-t border-slate-800 shrink-0 space-y-3">
            {showRevisionBox && (
              <div className="space-y-2">
                <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                  rows={2} placeholder="Enter revision comment for teacher..."
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-600 outline-none focus:border-red-500" />
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={handleVerify} disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Mark as Verified
              </button>
              {showRevisionBox ? (
                <button onClick={handleRevision} disabled={loading || !comment.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-500 transition-colors disabled:opacity-50">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                  Send Revision
                </button>
              ) : (
                <button onClick={() => setShowRevisionBox(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-red-400 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors">
                  <AlertTriangle className="w-4 h-4" /> Needs Revision
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
