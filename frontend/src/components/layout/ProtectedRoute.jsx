import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, section }) {
  const { user, loading, can } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-surface)]">
        <p className="text-sm text-[var(--color-text-muted)]">Loading TransitOps…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (section && !can(section)) return <Navigate to="/" replace />;

  return children;
}
