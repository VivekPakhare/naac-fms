import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #F8F9FF 0%, #E8F0FE 100%)' }}>
      <div className="text-center max-w-md">
        <div className="relative mb-8">
          <span className="text-[10rem] font-black leading-none" style={{ color: '#E2E8F0' }}>404</span>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-24 h-24 text-[#003580] opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Page Not Found</h1>
        <p className="text-slate-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />
          </svg>
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #F8F9FF 0%, #FEF3C7 100%)' }}>
      <div className="text-center max-w-md">
        <div className="relative mb-8">
          <span className="text-[10rem] font-black leading-none" style={{ color: '#FDE68A' }}>403</span>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-24 h-24 text-amber-600 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
        <p className="text-slate-500 mb-8">You don't have permission to access this page. Please contact your HOD or system administrator.</p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Go Back
        </Link>
      </div>
    </div>
  );
}

export function ServerErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #F8F9FF 0%, #FEE2E2 100%)' }}>
      <div className="text-center max-w-md">
        <div className="relative mb-8">
          <span className="text-[10rem] font-black leading-none" style={{ color: '#FECACA' }}>500</span>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-24 h-24 text-red-500 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Server Error</h1>
        <p className="text-slate-500 mb-8">Something went wrong on our end. Please try again later or contact support.</p>
        <button onClick={() => window.location.reload()} className="btn-primary inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Retry
        </button>
      </div>
    </div>
  );
}
