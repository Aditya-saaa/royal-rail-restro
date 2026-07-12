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

  if (roles?.includes('admin') && !isAdmin()) {
    return <Navigate to="/" replace />;
  }
  if (roles?.includes('staff') && !isStaff()) {
    return <Navigate to="/" replace />;
  }
  if (roles?.includes('developer') && !isDeveloper()) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
