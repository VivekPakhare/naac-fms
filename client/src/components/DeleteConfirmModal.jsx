import { AlertTriangle, X } from 'lucide-react';

/**
 * Reusable confirmation modal for delete actions.
 */
export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, title, message, loading = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <button onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors">
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>

          <h3 className="text-lg font-semibold text-white mb-2">
            {title || 'Delete Entry'}
          </h3>
          <p className="text-slate-400 text-sm mb-6">
            {message || 'Are you sure you want to delete this entry? This action cannot be undone.'}
          </p>

          <div className="flex gap-3 w-full">
            <button onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors"
              disabled={loading}>
              Cancel
            </button>
            <button onClick={onConfirm}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-500 transition-colors disabled:opacity-50"
              disabled={loading}>
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
