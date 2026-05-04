import { useState, useRef } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

/**
 * File upload section with drag & drop, file list, and delete.
 */
export default function FileUploadSection({
  subCriteriaCode,
  files = [],
  onFilesChange,
  accept = '.pdf,.jpg,.jpeg,.png,.docx',
  label = 'Upload Document',
  required = false,
  disabled = false,
}) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  async function handleUpload(file) {
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('document', file);

      const res = await api.post(`/upload/${subCriteriaCode}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        toast.success(`Uploaded ${file.name}`);
        onFilesChange?.([...files, res.data.data]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(fileId) {
    try {
      await api.delete(`/upload/${fileId}`);
      toast.success('File deleted');
      onFilesChange?.(files.filter((f) => f.id !== fileId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  }

  function handleInputChange(e) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = '';
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }

  const fileTypeIcons = { pdf: '📄', jpg: '🖼️', jpeg: '🖼️', png: '🖼️', docx: '📝', doc: '📝', xlsx: '📊', xls: '📊' };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-300 flex items-center gap-1">
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>

      {/* Drop zone */}
      {!disabled && (
        <div
          className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
            dragActive
              ? 'border-indigo-500 bg-indigo-500/5'
              : 'border-slate-700 hover:border-slate-600 bg-slate-800/30'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept={accept} onChange={handleInputChange} className="hidden" />

          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-sm text-slate-400">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-slate-500" />
              <p className="text-sm text-slate-400">
                Drag & drop or <span className="text-indigo-400 font-medium">browse</span>
              </p>
              <p className="text-xs text-slate-600">
                Accepted: {accept.replace(/\./g, '').toUpperCase().split(',').join(', ')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl group">
              <span className="text-lg">{fileTypeIcons[file.file_type] || fileTypeIcons[file.fileType] || '📄'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{file.original_filename || file.originalFilename}</p>
                <p className="text-xs text-slate-500">{formatFileSize(file.file_size || file.fileSize)}</p>
              </div>
              {!disabled && (
                <button onClick={() => handleDelete(file.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
