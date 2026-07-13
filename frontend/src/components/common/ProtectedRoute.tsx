import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { PageLoader } from '@/components/ui/Spinner';

interface Props {
  children: React.ReactNode;
  roles?: ('admin' | 'staff' | 'developer' | 'customer')[];
}

/**
 * Auth gate. Uses isBootstrapping (session restore), NOT login isLoading,
 * so Sign-in page and public pages never hang on a stuck global flag.
 * Hard max wait: 12s then treat as logged out.
 */
export function ProtectedRoute({ children, roles }: Props) {
  const user = useAuthStore((s) => s.user);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const isStaff = useAuthStore((s) => s.isStaff);
  const isDeveloper = useAuthStore((s) => s.isDeveloper);
  const location = useLocation();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!isBootstrapping) {
      setTimedOut(false);
      return;
    }
    const t = window.setTimeout(() => setTimedOut(true), 12000);
    return () => window.clearTimeout(t);
  }, [isBootstrapping]);

  // Only block while restoring session — never forever
  if (isBootstrapping && !timedOut && !user) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && roles.length > 0) {
    const allowed =
      user.is_superuser ||
      (roles.includes('admin') && isAdmin()) ||
      (roles.includes('staff') && isStaff()) ||
      (roles.includes('developer') && isDeveloper()) ||
      roles.includes('customer');
    if (!allowed) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
