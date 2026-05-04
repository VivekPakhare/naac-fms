import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  ChevronDown, ChevronRight, FileText, Image, File,
  Download, Eye, Trash2, Loader2, FolderOpen,
  CheckCircle2, Clock, ShieldCheck, RefreshCw, Search
} from 'lucide-react';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const FILE_ICONS = {
  pdf: { icon: FileText, color: 'text-red-400', bg: 'bg-red-500/10' },
  jpg: { icon: Image, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  jpeg: { icon: Image, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  png: { icon: Image, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  docx: { icon: File, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
};

const STATUS_CONFIG = {
  pending: { label: 'Pending', icon: Clock, color: 'text-amber-400 bg-amber-500/10' },
  uploaded: { label: 'Uploaded', icon: CheckCircle2, color: 'text-blue-400 bg-blue-500/10' },
  verified: { label: 'Verified', icon: ShieldCheck, color: 'text-emerald-400 bg-emerald-500/10' },
};

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function MyDocuments() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCriteria, setExpandedCriteria] = useState({});
  const [expandedSub, setExpandedSub] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/upload/all');
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
      // Auto-expand first criterion
      if (res.data.data?.length > 0) {
        setExpandedCriteria({ [res.data.data[0].criteria_code]: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }

  function toggleCriteria(code) {
    setExpandedCriteria((prev) => ({ ...prev, [code]: !prev[code] }));
  }

  function toggleSub(code) {
    setExpandedSub((prev) => ({ ...prev, [code]: !prev[code] }));
  }

  function handleView(fileId) {
    window.open(`${api.defaults.baseURL}/upload/${fileId}/view`, '_blank');
  }

  function handleDownload(fileId) {
    window.open(`${api.defaults.baseURL}/upload/${fileId}/download`, '_blank');
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/upload/${deleteTarget}`);
      toast.success('Document deleted');
      // Remove from local state
      setData((prev) =>
        prev.map((c) => ({
          ...c,
          sub_criteria: c.sub_criteria.map((sc) => ({
            ...sc,
            documents: sc.documents.filter((d) => d.id !== deleteTarget),
          })),
        })).filter((c) => c.sub_criteria.some((sc) => sc.documents.length > 0))
      );
      setTotal((prev) => prev - 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  // Filter documents by search query
  function filterData() {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data
      .map((c) => ({
        ...c,
        sub_criteria: c.sub_criteria
          .map((sc) => ({
            ...sc,
            documents: sc.documents.filter((d) =>
              d.original_filename.toLowerCase().includes(q) ||
              sc.code.includes(q) ||
              sc.name.toLowerCase().includes(q)
            ),
          }))
          .filter((sc) => sc.documents.length > 0),
      }))
      .filter((c) => c.sub_criteria.length > 0);
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-slate-800 rounded-lg" />
          <div className="h-12 w-full bg-slate-800 rounded-xl" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-900/50 border border-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-md mx-auto text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Failed to load documents</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <button onClick={fetchDocuments}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 transition-colors inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const filteredData = filterData();

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">My Documents</h2>
          <p className="text-sm text-slate-400 mt-1">
            {total} document{total !== 1 ? 's' : ''} uploaded across all criteria
          </p>
        </div>
        <button onClick={fetchDocuments}
          className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search documents by filename, sub-criterion code or name..."
          className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
        />
      </div>

      {/* Empty state */}
      {filteredData.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400 font-medium mb-1">
            {searchQuery ? 'No documents match your search' : 'No documents uploaded yet'}
          </p>
          <p className="text-slate-600 text-sm">
            {searchQuery
              ? 'Try a different search term'
              : 'Upload documents from the criteria form pages'}
          </p>
        </div>
      )}

      {/* Accordion */}
      <div className="space-y-3">
        {filteredData.map((criterion) => {
          const isExpanded = expandedCriteria[criterion.criteria_code];
          const docCount = criterion.sub_criteria.reduce((sum, sc) => sum + sc.documents.length, 0);

          return (
            <div key={criterion.criteria_code}
              className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
              {/* Criterion header */}
              <button
                onClick={() => toggleCriteria(criterion.criteria_code)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg">
                    {criterion.criteria_code}
                  </span>
                  <span className="text-sm font-medium text-white">{criterion.criteria_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">{docCount} files</span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </button>

              {/* Sub-criteria accordion */}
              {isExpanded && (
                <div className="border-t border-slate-800">
                  {criterion.sub_criteria.map((sc) => {
                    const isSubExpanded = expandedSub[sc.code] !== false; // default expanded

                    return (
                      <div key={sc.code} className="border-b border-slate-800/50 last:border-0">
                        {/* Sub-criterion header */}
                        <button
                          onClick={() => toggleSub(sc.code)}
                          className="w-full flex items-center justify-between px-6 py-3 text-left hover:bg-slate-800/20 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-400">{sc.code}</span>
                            <span className="text-sm text-slate-300">{sc.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-600">{sc.documents.length} files</span>
                            {isSubExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                            )}
                          </div>
                        </button>

                        {/* Document list */}
                        {isSubExpanded && (
                          <div className="px-6 pb-3 space-y-2">
                            {sc.documents.map((doc) => {
                              const fileType = doc.file_type || 'pdf';
                              const fileInfo = FILE_ICONS[fileType] || FILE_ICONS.pdf;
                              const FileIcon = fileInfo.icon;
                              const status = STATUS_CONFIG[doc.upload_status] || STATUS_CONFIG.uploaded;
                              const StatusIcon = status.icon;
                              const isVerified = doc.upload_status === 'verified' || doc.submission_status === 'verified';

                              return (
                                <div key={doc.id}
                                  className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl group hover:bg-slate-800/50 transition-colors">
                                  <div className={`w-9 h-9 rounded-lg ${fileInfo.bg} flex items-center justify-center shrink-0`}>
                                    <FileIcon className={`w-4 h-4 ${fileInfo.color}`} />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white truncate">{doc.original_filename}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[11px] text-slate-500">{formatFileSize(doc.file_size)}</span>
                                      <span className="text-slate-700">•</span>
                                      <span className="text-[11px] text-slate-500">{formatDate(doc.uploaded_at)}</span>
                                    </div>
                                  </div>

                                  <div className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${status.color}`}>
                                    <StatusIcon className="w-3 h-3" />
                                    {status.label}
                                  </div>

                                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => handleView(doc.id)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                      title="View">
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDownload(doc.id)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                      title="Download">
                                      <Download className="w-3.5 h-3.5" />
                                    </button>
                                    {!isVerified && (
                                      <button
                                        onClick={() => setDeleteTarget(doc.id)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                        title="Delete">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete confirmation */}
      <DeleteConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Document"
        message="Are you sure you want to delete this document? This action cannot be undone."
        loading={deleting}
      />
    </div>
  );
}
