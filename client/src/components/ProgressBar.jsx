/**
 * Animated progress bar with color coding based on percentage
 */
export default function ProgressBar({ value = 0, size = 'md', showLabel = false, className = '' }) {
  const pct = Math.min(100, Math.max(0, value));

  let colorClass = 'progress-red';
  if (pct >= 75) colorClass = 'progress-green';
  else if (pct >= 40) colorClass = 'progress-blue';
  else if (pct >= 20) colorClass = 'progress-yellow';

  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`progress-bar flex-1 ${heightClass}`}>
        <div
          className={`progress-bar-fill ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-slate-500 w-10 text-right">{pct}%</span>
      )}
    </div>
  );
}
