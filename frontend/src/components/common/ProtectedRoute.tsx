import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { PageLoader } from '@/components/ui/Spinner';

interface Props {
  children: React.ReactNode;
  roles?: ('admin' | 'staff' | 'developer' | 'customer')[];
}

export function ProtectedRoute({ children, roles }: Props) {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const isStaff = useAuthStore((s) => s.isStaff);
  const isDeveloper = useAuthStore((s) => s.isDeveloper);
  const location = useLocation();

  if (isLoading) return <PageLoader />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role gate: require ANY of the listed roles (not all)
  if (roles && roles.length > 0) {
    const allowed =
      (roles.includes('admin') && isAdmin()) ||
      (roles.includes('staff') && isStaff()) ||
      (roles.includes('developer') && isDeveloper()) ||
      (roles.includes('customer') && !!user) ||
      user.is_superuser;
    if (!allowed) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
