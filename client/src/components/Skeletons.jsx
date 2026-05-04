/**
 * Reusable loading skeleton components for dashboard cards
 */

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`card p-6 ${className}`}>
      <div className="skeleton h-4 w-24 mb-3" />
      <div className="skeleton h-8 w-16 mb-2" />
      <div className="skeleton h-3 w-32" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-slate-100">
      <div className="skeleton h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-48" />
        <div className="skeleton h-3 w-32" />
      </div>
      <div className="skeleton h-6 w-20 rounded-full" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <div className="skeleton h-5 w-40" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="page-enter space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      {/* Table */}
      <SkeletonTable rows={4} />
    </div>
  );
}
