import { useState } from 'react';
import { Plus, Pencil, Trash2, Save, Check } from 'lucide-react';
import DeleteConfirmModal from './DeleteConfirmModal';

/**
 * Dynamic form renderer for a sub-criterion.
 * Supports multi-record entries with add/edit/delete.
 */
export default function SubCriterionForm({
  config,
  entries = [],
  onEntriesChange,
  disabled = false,
}) {
  const [currentEntry, setCurrentEntry] = useState({});
  const [editingIndex, setEditingIndex] = useState(null);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  function getEmptyEntry() {
    const entry = {};
    config.fields.forEach((f) => {
      if (f.type === 'checkbox') entry[f.name] = false;
      else if (f.type === 'multiselect') entry[f.name] = [];
      else entry[f.name] = '';
    });
    return entry;
  }

  function validateEntry(entry) {
    const errs = {};
    config.fields.forEach((f) => {
      if (f.required) {
        const val = entry[f.name];
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          errs[f.name] = `${f.label} is required`;
        }
      }
      if (f.type === 'number' && entry[f.name] !== '' && entry[f.name] !== undefined) {
        const num = Number(entry[f.name]);
        if (f.min !== undefined && num < f.min) errs[f.name] = `Min value: ${f.min}`;
        if (f.max !== undefined && num > f.max) errs[f.name] = `Max value: ${f.max}`;
      }
      if (f.type === 'textarea' && f.maxLength && entry[f.name]?.length > f.maxLength) {
        errs[f.name] = `Max ${f.maxLength} characters`;
      }
      if (f.type === 'text' && f.maxLength && entry[f.name]?.length > f.maxLength) {
        errs[f.name] = `Max ${f.maxLength} characters`;
      }
    });
    return errs;
  }

  function handleAddEntry() {
    const errs = validateEntry(currentEntry);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    if (editingIndex !== null) {
      const updated = [...entries];
      updated[editingIndex] = { ...currentEntry };
      onEntriesChange(updated);
      setEditingIndex(null);
    } else {
      onEntriesChange([...entries, { ...currentEntry }]);
    }
    setCurrentEntry(getEmptyEntry());
  }

  function handleEdit(idx) {
    setCurrentEntry({ ...entries[idx] });
    setEditingIndex(idx);
    setErrors({});
  }

  function handleDeleteConfirm() {
    if (deleteTarget !== null) {
      const updated = entries.filter((_, i) => i !== deleteTarget);
      onEntriesChange(updated);
      setDeleteTarget(null);
      if (editingIndex === deleteTarget) {
        setEditingIndex(null);
        setCurrentEntry(getEmptyEntry());
      }
    }
  }

  function handleFieldChange(name, value) {
    setCurrentEntry((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  function handleMultiSelectToggle(name, option) {
    setCurrentEntry((prev) => {
      const arr = prev[name] || [];
      return {
        ...prev,
        [name]: arr.includes(option) ? arr.filter((o) => o !== option) : [...arr, option],
      };
    });
  }

  // Initialize empty entry on first render
  if (Object.keys(currentEntry).length === 0 && config.fields.length > 0) {
    setCurrentEntry(getEmptyEntry());
  }

  return (
    <div className="space-y-6">
      {/* ── Form Fields ─────────────────────────────── */}
      {!disabled && (
        <div className="p-5 bg-slate-800/30 border border-slate-700/50 rounded-2xl space-y-4">
          <h4 className="text-sm font-semibold text-slate-300 mb-2">
            {editingIndex !== null ? '✏️ Edit Entry' : '➕ New Entry'}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {config.fields.map((field) => (
              <div key={field.name} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  {field.label}
                  {field.required && <span className="text-red-400 ml-0.5">*</span>}
                </label>

                {/* Text */}
                {field.type === 'text' && (
                  <input type="text" value={currentEntry[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    maxLength={field.maxLength}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                    placeholder={field.placeholder || field.label} />
                )}

                {/* Number */}
                {field.type === 'number' && (
                  <input type="number" value={currentEntry[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    min={field.min} max={field.max} step={field.step || 1}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                    placeholder={field.label} />
                )}

                {/* Dropdown */}
                {field.type === 'dropdown' && (
                  <select value={currentEntry[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors">
                    <option value="" className="text-slate-600">Select {field.label}</option>
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}

                {/* Date */}
                {field.type === 'date' && (
                  <input type="date" value={currentEntry[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors" />
                )}

                {/* Radio */}
                {field.type === 'radio' && (
                  <div className="flex gap-4 mt-1">
                    {field.options.map((opt) => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name={field.name}
                          checked={currentEntry[field.name] === opt}
                          onChange={() => handleFieldChange(field.name, opt)}
                          className="w-4 h-4 text-indigo-500 bg-slate-900 border-slate-700 focus:ring-indigo-500" />
                        <span className="text-sm text-slate-300">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Checkbox */}
                {field.type === 'checkbox' && (
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <input type="checkbox" checked={!!currentEntry[field.name]}
                      onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-500 bg-slate-900 border-slate-700 focus:ring-indigo-500" />
                    <span className="text-sm text-slate-300">Yes</span>
                  </label>
                )}

                {/* Textarea */}
                {field.type === 'textarea' && (
                  <div>
                    <textarea value={currentEntry[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      rows={3} maxLength={field.maxLength}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors resize-none"
                      placeholder={field.placeholder || field.label} />
                    {field.maxLength && (
                      <p className="text-xs text-slate-600 mt-1 text-right">
                        {(currentEntry[field.name] || '').length}/{field.maxLength}
                      </p>
                    )}
                  </div>
                )}

                {/* MultiSelect */}
                {field.type === 'multiselect' && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {field.options.map((opt) => {
                      const selected = (currentEntry[field.name] || []).includes(opt);
                      return (
                        <button key={opt} type="button"
                          onClick={() => handleMultiSelectToggle(field.name, opt)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            selected
                              ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Error */}
                {errors[field.name] && (
                  <p className="text-xs text-red-400 mt-1">{errors[field.name]}</p>
                )}
              </div>
            ))}
          </div>

          {/* Add/Update button */}
          <button onClick={handleAddEntry}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-500 transition-colors">
            {editingIndex !== null ? (
              <><Check className="w-4 h-4" /> Update Entry</>
            ) : (
              <><Plus className="w-4 h-4" /> Add Entry</>
            )}
          </button>
        </div>
      )}

      {/* ── Entries List ────────────────────────────── */}
      {entries.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-300">
            Entries ({entries.length})
          </h4>

          {entries.map((entry, idx) => (
            <div key={idx}
              className={`p-4 bg-slate-800/40 border rounded-xl ${
                editingIndex === idx ? 'border-indigo-500/50' : 'border-slate-700/50'
              }`}>
              <div className="flex items-start justify-between">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 flex-1">
                  {config.fields.slice(0, 4).map((field) => (
                    <div key={field.name}>
                      <span className="text-[10px] text-slate-500 uppercase">{field.label}</span>
                      <p className="text-sm text-white truncate">
                        {Array.isArray(entry[field.name])
                          ? entry[field.name].join(', ')
                          : entry[field.name] || '—'}
                      </p>
                    </div>
                  ))}
                </div>

                {!disabled && (
                  <div className="flex gap-1 shrink-0 ml-4">
                    <button onClick={() => handleEdit(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Entry"
        message="Are you sure you want to delete this entry? This action cannot be undone."
      />
    </div>
  );
}
