import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { getFormConfig, getSubCriteriaForCriterion } from '../config/formConfigs';
import SubCriterionForm from '../components/SubCriterionForm';
import DocumentUploadZone from '../components/DocumentUploadZone';
import {
  ArrowLeft, Save, SendHorizonal, Loader2, CheckCircle2,
  AlertCircle, Clock, Lock
} from 'lucide-react';

const STATUS_LABELS = {
  draft: { label: 'Draft', icon: Clock, color: 'text-amber-400 bg-amber-500/10' },
  submitted: { label: 'Submitted', icon: Lock, color: 'text-blue-400 bg-blue-500/10' },
  verified: { label: 'Verified', icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10' },
  needs_revision: { label: 'Needs Revision', icon: AlertCircle, color: 'text-red-400 bg-red-500/10' },
};

export default function CriterionFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const criterionId = parseInt(id, 10);

  const [criterion, setCriterion] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [formDataMap, setFormDataMap] = useState({});
  const [submissionMap, setSubmissionMap] = useState({});
  const [filesMap, setFilesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const autoSaveTimer = useRef(null);
  const lastSavedRef = useRef({});

  const subCodes = getSubCriteriaForCriterion(criterionId);

  // ── Fetch criterion data ─────────────────────────────
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await api.get(`/criteria/${criterionId}`);
        setCriterion(res.data.data);

        // Fetch form data for each sub-criterion
        const dataMap = {};
        const subMap = {};
        const fMap = {};

        for (const code of subCodes) {
          try {
            const formRes = await api.get(`/forms/${code}`);
            const sub = formRes.data.data;
            if (sub.submission) {
              dataMap[code] = sub.submission.form_data?.entries || [];
              subMap[code] = sub.submission;
              fMap[code] = sub.submission.documents || [];
            } else {
              dataMap[code] = [];
              subMap[code] = null;
              fMap[code] = [];
            }
          } catch {
            dataMap[code] = [];
            subMap[code] = null;
            fMap[code] = [];
          }
        }

        setFormDataMap(dataMap);
        setSubmissionMap(subMap);
        setFilesMap(fMap);
        lastSavedRef.current = JSON.parse(JSON.stringify(dataMap));

        if (subCodes.length > 0) setActiveTab(subCodes[0]);
      } catch (err) {
        toast.error('Failed to load criterion data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    return () => {
      if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
    };
  }, [criterionId]);

  // ── Auto-save every 30 seconds ───────────────────────
  const autoSave = useCallback(async () => {
    if (!activeTab) return;
    const sub = submissionMap[activeTab];
    if (sub && (sub.status === 'submitted' || sub.status === 'verified')) return;

    const currentData = formDataMap[activeTab] || [];
    const lastData = lastSavedRef.current[activeTab] || [];

    if (JSON.stringify(currentData) === JSON.stringify(lastData)) return;
    if (currentData.length === 0) return;

    try {
      await api.post(`/forms/submit/${activeTab}`, {
        form_data: { entries: currentData },
        action: 'draft',
      });
      lastSavedRef.current[activeTab] = JSON.parse(JSON.stringify(currentData));
    } catch {
      // Silent fail for auto-save
    }
  }, [activeTab, formDataMap, submissionMap]);

  useEffect(() => {
    if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
    autoSaveTimer.current = setInterval(autoSave, 30000);
    return () => clearInterval(autoSaveTimer.current);
  }, [autoSave]);

  // ── Handlers ─────────────────────────────────────────
  function handleEntriesChange(code, entries) {
    setFormDataMap((prev) => ({ ...prev, [code]: entries }));
  }

  function handleFilesChange(code, files) {
    setFilesMap((prev) => ({ ...prev, [code]: files }));
  }

  async function handleSaveDraft() {
    if (!activeTab) return;
    setSaving(true);

    try {
      const entries = formDataMap[activeTab] || [];
      const res = await api.post(`/forms/submit/${activeTab}`, {
        form_data: { entries },
        action: 'draft',
      });

      setSubmissionMap((prev) => ({ ...prev, [activeTab]: res.data.data }));
      lastSavedRef.current[activeTab] = JSON.parse(JSON.stringify(entries));
      toast.success('Draft saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    if (!activeTab) return;
    const config = getFormConfig(activeTab);
    const entries = formDataMap[activeTab] || [];

    const minRequired = config?.minEntries || 1;
    if (entries.length < minRequired) {
      toast.error(
        config?.minEntriesMessage ||
        `Please add at least ${minRequired} ${minRequired === 1 ? 'entry' : 'entries'} before submitting`
      );
      return;
    }

    // Check required file uploads
    if (config?.fileUpload?.required && (filesMap[activeTab] || []).length === 0) {
      toast.error(`Please upload: ${config.fileUpload.label}`);
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.post(`/forms/submit/${activeTab}`, {
        form_data: { entries },
        action: 'submit',
      });

      setSubmissionMap((prev) => ({ ...prev, [activeTab]: res.data.data }));
      toast.success('Form submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }

  function isTabComplete(code) {
    const entries = formDataMap[code] || [];
    return entries.length > 0;
  }

  function isTabLocked(code) {
    const sub = submissionMap[code];
    return sub && (sub.status === 'submitted' || sub.status === 'verified');
  }

  // ── Loading State ────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-slate-800 rounded-lg" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 w-24 bg-slate-800 rounded-xl" />
            ))}
          </div>
          <div className="h-96 bg-slate-900/50 border border-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!criterion) {
    return (
      <div className="p-6 lg:p-8 text-center py-20">
        <p className="text-slate-400">Criterion not found or no form configuration available.</p>
        <button onClick={() => navigate('/dashboard/teacher')}
          className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-500 transition-colors">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const activeConfig = activeTab ? getFormConfig(activeTab) : null;
  const activeSub = activeTab ? submissionMap[activeTab] : null;
  const locked = activeTab && isTabLocked(activeTab);
  const statusInfo = activeSub ? STATUS_LABELS[activeSub.status] : null;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* ── Header ──────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard/teacher')}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">
              <span className="text-indigo-400">{criterion.code}</span> — {criterion.name}
            </h2>
            <p className="text-sm text-slate-500">Max Marks: {criterion.max_marks}</p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          {subCodes.map((code) => {
            const complete = isTabComplete(code);
            const locked = isTabLocked(code);
            return (
              <div key={code}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                  locked
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : complete
                    ? 'bg-indigo-500/15 text-indigo-400'
                    : 'bg-slate-800 text-slate-500'
                }`}
                title={`${code} — ${locked ? 'Submitted' : complete ? 'Has entries' : 'Empty'}`}>
                {code.split('.')[1]}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {subCodes.map((code) => {
          const config = getFormConfig(code);
          const isActive = activeTab === code;
          const complete = isTabComplete(code);

          return (
            <button key={code}
              onClick={() => setActiveTab(code)}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : complete
                  ? 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/15'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-300 hover:bg-slate-800'
              }`}>
              {code}
              {config && (
                <span className="ml-1.5 hidden sm:inline text-xs opacity-70">
                  {config.label.length > 20 ? config.label.slice(0, 20) + '…' : config.label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Active Tab Content ──────────────────────── */}
      {activeTab && activeConfig ? (
        <div className="space-y-6">
          {/* Status bar */}
          {statusInfo && (
            <div className={`flex items-center gap-3 p-3 rounded-xl ${statusInfo.color}`}>
              <statusInfo.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{statusInfo.label}</span>
              {activeSub?.hod_comment && (
                <span className="text-xs opacity-70 ml-2">
                  HOD: "{activeSub.hod_comment}"
                </span>
              )}
            </div>
          )}

          {/* Locked notice */}
          {locked && (
            <div className="flex items-center gap-3 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
              <Lock className="w-5 h-5 text-slate-500" />
              <p className="text-sm text-slate-400">
                This form has been submitted and is locked for editing.
              </p>
            </div>
          )}

          {/* Sub-criterion description */}
          {criterion.sub_criteria && (
            <div className="text-sm text-slate-400 bg-slate-800/30 p-4 rounded-xl border border-slate-700/30">
              <strong className="text-slate-300">{activeTab} — {activeConfig.label}</strong>
              <p className="mt-1">
                {criterion.sub_criteria.find((s) => s.code === activeTab)?.description || ''}
              </p>
            </div>
          )}

          {/* Form */}
          <SubCriterionForm
            config={activeConfig}
            entries={formDataMap[activeTab] || []}
            onEntriesChange={(entries) => handleEntriesChange(activeTab, entries)}
            disabled={locked}
          />

          {/* File Upload */}
          {activeConfig.fileUpload && (
            <DocumentUploadZone
              subCriteriaCode={activeTab}
              files={filesMap[activeTab] || []}
              onFilesChange={(files) => handleFilesChange(activeTab, files)}
              acceptedTypes={activeConfig.fileUpload.accept.replace(/\./g, '').split(',')}
              label={activeConfig.fileUpload.label}
              required={activeConfig.fileUpload.required}
              disabled={locked}
            />
          )}

          {/* Min entries indicator */}
          {activeConfig.minEntries && (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
              (formDataMap[activeTab] || []).length >= activeConfig.minEntries
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-amber-500/10 text-amber-400'
            }`}>
              {(formDataMap[activeTab] || []).length >= activeConfig.minEntries ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {(formDataMap[activeTab] || []).length}/{activeConfig.minEntries} {activeConfig.label || 'entries'} added
              {(formDataMap[activeTab] || []).length >= activeConfig.minEntries
                ? ' ✓'
                : ` — add ${activeConfig.minEntries - (formDataMap[activeTab] || []).length} more`}
            </div>
          )}

          {/* Action buttons */}
          {!locked && (
            <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-800">
              <button onClick={handleSaveDraft} disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Draft
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-500 transition-colors disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizonal className="w-4 h-4" />}
                Submit
              </button>
            </div>
          )}
        </div>
      ) : activeTab ? (
        <div className="text-center py-16">
          <p className="text-slate-400">No form configuration found for {activeTab}.</p>
          <p className="text-xs text-slate-600 mt-1">This sub-criterion does not have a form template yet.</p>
        </div>
      ) : null}
    </div>
  );
}
