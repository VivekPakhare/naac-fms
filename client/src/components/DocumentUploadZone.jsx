import { useState, useRef, useCallback } from 'react';
import {
  Upload, X, FileText, Image, File, Loader2,
  Download, Eye, Trash2, CheckCircle2, Clock, ShieldCheck
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import DeleteConfirmModal from './DeleteConfirmModal';

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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ACCEPTED_TYPES = {
  pdf: ['application/pdf'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function truncateFilename(name, maxLen = 28) {
  if (name.length <= maxLen) return name;
  const ext = name.split('.').pop();
  const base = name.slice(0, maxLen - ext.length - 4);
  return `${base}...${ext}`;
}

/**
 * Reusable document upload zone with drag-and-drop, progress bar,
 * file list with view/download/delete actions.
 */
export default function DocumentUploadZone({
  subCriteriaCode,
  label = 'Upload Document',
  acceptedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'docx'],
  maxFiles = 10,
  required = false,
  files = [],
  onFilesChange,
  disabled = false,
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef(null);

  // Build accept string for file input
  const acceptString = acceptedTypes
    .map((t) => `.${t}`)
    .join(',');

  // Client-side validation
  function validateFile(file) {
    // Check size
    if (file.size > MAX_FILE_SIZE) {
      return 'File too large (max 10MB)';
    }

    // Check extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(ext)) {
      return `Invalid file type. Accepted: ${acceptedTypes.map(t => t.toUpperCase()).join(', ')}`;
    }

    // Check MIME type
    const validMimes = ACCEPTED_TYPES[ext] || [];
    if (validMimes.length > 0 && !validMimes.includes(file.type)) {
      return `File MIME type mismatch for .${ext}`;
    }

    // Check max files
    if (files.length >= maxFiles) {
      return `Maximum ${maxFiles} files allowed`;
    }

    return null;
  }

  async function handleUpload(file) {
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('document', file);

      const res = await api.post(`/upload/${subCriteriaCode}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded / (e.total || 1)) * 100);
          setUploadProgress(pct);
        },
      });

      if (res.data.success) {
        toast.success(`Uploaded ${file.name}`);
        onFilesChange?.([...files, res.data.data]);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed';
      toast.error(msg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      await api.delete(`/upload/${deleteTarget}`);
      toast.success('File deleted');
      onFilesChange?.(files.filter((f) => f.id !== deleteTarget));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  function handleView(fileId) {
    window.open(`${api.defaults.baseURL}/upload/${fileId}/view`, '_blank');
  }

  function handleDownload(fileId) {
    window.open(`${api.defaults.baseURL}/upload/${fileId}/download`, '_blank');
  }

  function handleInputChange(e) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = '';
  }

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }, [files]);

  const getFileInfo = (type) => {
    return FILE_ICONS[type?.toLowerCase()] || FILE_ICONS.pdf;
  };

  return (
    <div className="space-y-4">
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-1">
          {label}
          {required && <span className="text-red-400">*</span>}
        </label>
        <span className="text-xs text-slate-500">
          {files.length}/{maxFiles} files
        </span>
      </div>

      {/* Drop zone */}
      {!disabled && files.length < maxFiles && (
        <div
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer ${
            dragActive
              ? 'border-indigo-500 bg-indigo-500/5 scale-[1.01]'
              : 'border-slate-700 hover:border-slate-600 bg-slate-800/20'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={acceptString}
            onChange={handleInputChange}
            className="hidden"
          />

          {uploading ? (
            <div className="space-y-3">
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
              <p className="text-sm text-slate-400">Uploading...</p>
              {/* Progress bar */}
              <div className="max-w-xs mx-auto">
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-indigo-400 mt-1.5 font-medium">{uploadProgress}%</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto">
                <Upload className="w-7 h-7 text-slate-500" />
              </div>
              <p className="text-sm text-slate-400">
                Drag & drop or{' '}
                <span className="text-indigo-400 font-medium hover:text-indigo-300 transition-colors">
                  browse files
                </span>
              </p>
              <p className="text-xs text-slate-600">
                {acceptedTypes.map((t) => t.toUpperCase()).join(', ')} • Max 10MB
              </p>
            </div>
          )}
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => {
            const fileType = file.file_type || file.fileType || 'pdf';
            const fileInfo = getFileInfo(fileType);
            const FileIcon = fileInfo.icon;
            const status = STATUS_CONFIG[file.upload_status || file.uploadStatus] || STATUS_CONFIG.uploaded;
            const StatusIcon = status.icon;
            const isVerified = (file.upload_status || file.uploadStatus) === 'verified';
            const fileName = file.original_filename || file.originalFilename || 'Unknown';
            const fileSize = file.file_size || file.fileSize || 0;
            const uploadDate = file.uploaded_at || file.uploadedAt;

            return (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 bg-slate-800/40 border border-slate-700/40 rounded-xl group hover:bg-slate-800/60 transition-colors"
              >
                {/* File icon */}
                <div className={`w-10 h-10 rounded-xl ${fileInfo.bg} flex items-center justify-center shrink-0`}>
                  <FileIcon className={`w-5 h-5 ${fileInfo.color}`} />
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate" title={fileName}>
                    {truncateFilename(fileName)}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-slate-500">{formatFileSize(fileSize)}</span>
                    {uploadDate && (
                      <>
                        <span className="text-slate-700">•</span>
                        <span className="text-[11px] text-slate-500">{formatDate(uploadDate)}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <div className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${status.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {status.label}
                </div>

                {/* Actions */}
                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleView(file.id); }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                    title="View"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDownload(file.id); }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  {!disabled && !isVerified && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(file.id); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
