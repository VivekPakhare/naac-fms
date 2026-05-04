/**
 * Status badge pill component
 */
const STATUS_CONFIG = {
  draft: { label: 'Draft', class: 'badge-draft', dot: 'bg-slate-400' },
  submitted: { label: 'Submitted', class: 'badge-submitted', dot: 'bg-sky-500' },
  verified: { label: 'Verified', class: 'badge-verified', dot: 'bg-green-500' },
  needs_revision: { label: 'Needs Revision', class: 'badge-needs-revision', dot: 'bg-amber-500' },
  not_started: { label: 'Not Started', class: 'badge-not-started', dot: 'bg-slate-300' },
  in_progress: { label: 'In Progress', class: 'badge-submitted', dot: 'bg-blue-400' },
  pending: { label: 'Pending', class: 'badge-draft', dot: 'bg-slate-400' },
  uploaded: { label: 'Uploaded', class: 'badge-submitted', dot: 'bg-sky-500' },
};

export default function StatusBadge({ status, size = 'md' }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
  const sizeClass = size === 'sm' ? 'text-[0.65rem] px-2 py-0.5' : '';

  return (
    <span className={`badge ${cfg.class} ${sizeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
