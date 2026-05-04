import { Link } from 'react-router-dom';

/**
 * Breadcrumb navigation component
 */
export default function Breadcrumb({ items = [] }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span className="breadcrumb-separator">/</span>}
          {i === items.length - 1 ? (
            <span className="breadcrumb-current">{item.label}</span>
          ) : (
            <Link to={item.to}>{item.label}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}
