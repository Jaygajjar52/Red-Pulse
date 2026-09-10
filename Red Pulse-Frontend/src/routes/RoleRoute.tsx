import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types';
import { PageSpinner } from '@/components/loading/PageSpinner';

export function RoleRoute({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  if (loading) return <PageSpinner />;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/forbidden" replace />;
  return children;
}
