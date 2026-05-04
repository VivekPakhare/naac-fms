/**
 * Empty state component with icon and CTA
 */
export default function EmptyState({ icon, title, message, action, actionLabel }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {icon || (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>
      <p className="empty-state-title">{title || 'No data yet'}</p>
      <p className="empty-state-text">{message || 'Get started by adding your first entry.'}</p>
      {action && (
        <button onClick={action} className="btn-primary mt-4 text-sm">
          {actionLabel || 'Get Started'}
        </button>
      )}
    </div>
  );
}
