import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SkeletonCard } from '../lucian/SkeletonCard';

export function RequireAuth() {
  const { configured, user, loading } = useAuth();
  const location = useLocation();

  if (!configured) {
    return <Outlet />;
  }

  if (loading) {
    return <SkeletonCard variant="route" />;
  }

  if (!user) {
    const target = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(target)}`} replace />;
  }

  return <Outlet />;
}
