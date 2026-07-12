import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { MainLayout } from '@/components/layout/MainLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { DeveloperLayout } from '@/components/layout/DeveloperLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { PageLoader } from '@/components/ui/Spinner';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useFeatureStore } from '@/store/featureStore';

const HomePage = lazy(() => import('@/pages/HomePage'));
const MenuPage = lazy(() => import('@/pages/MenuPage'));
const MenuItemPage = lazy(() => import('@/pages/MenuItemPage'));
const CartPage = lazy(() => import('@/pages/CartPage'));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'));
const ReservationPage = lazy(() => import('@/pages/ReservationPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const SignupPage = lazy(() => import('@/pages/auth/SignupPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Bootstrap() {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const darkMode = useThemeStore((s) => s.darkMode);
  const setDarkMode = useThemeStore((s) => s.setDarkMode);
  const loadFeatures = useFeatureStore((s) => s.load);

  useEffect(() => {
    setDarkMode(darkMode);
    fetchMe();
    loadFeatures();
  }, [fetchMe, darkMode, setDarkMode, loadFeatures]);

  return null;
}

function LazyAdminCms({ name }: { name: keyof typeof import('@/pages/admin/AdminCmsPages') }) {
  const Comp = lazy(async () => {
    const mod = await import('@/pages/admin/AdminCmsPages');
    return { default: mod[name] as React.ComponentType };
  });
  return (
    <S>
      <Comp />
    </S>
  );
}

function LazyAdminOps({ name }: { name: keyof typeof import('@/pages/admin/AdminOpsPages') }) {
  const Comp = lazy(async () => {
    const mod = await import('@/pages/admin/AdminOpsPages');
    return { default: mod[name] as React.ComponentType };
  });
  return (
    <S>
      <Comp />
    </S>
  );
}

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

/** Lazy-named export helper for StaticPages module */
function LazyStatic({ name }: { name: keyof typeof import('@/pages/StaticPages') }) {
  return (
    <S>
      <StaticLoader name={name} />
    </S>
  );
}

function StaticLoader({ name }: { name: keyof typeof import('@/pages/StaticPages') }) {
  const Comp = lazy(async () => {
    const mod = await import('@/pages/StaticPages');
    return { default: mod[name] as React.ComponentType };
  });
  return <Comp />;
}

function LazyAdmin({ name }: { name: keyof typeof import('@/pages/admin/AdminPages') }) {
  const Comp = lazy(async () => {
    const mod = await import('@/pages/admin/AdminPages');
    return { default: mod[name] as React.ComponentType };
  });
  return (
    <S>
      <Comp />
    </S>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Bootstrap />
          <Routes>
            <Route element={<MainLayout />}>
              <Route index element={<S><HomePage /></S>} />
              <Route path="menu" element={<S><MenuPage /></S>} />
              <Route path="menu/:slug" element={<S><MenuItemPage /></S>} />
              <Route path="cart" element={<S><CartPage /></S>} />
              <Route path="checkout" element={<S><CheckoutPage /></S>} />
              <Route path="reservation" element={<S><ReservationPage /></S>} />
              <Route path="login" element={<S><LoginPage /></S>} />
              <Route path="signup" element={<S><SignupPage /></S>} />
              <Route path="forgot-password" element={<S><ForgotPasswordPage /></S>} />
              <Route path="about" element={<LazyStatic name="AboutPage" />} />
              <Route path="our-story" element={<LazyStatic name="OurStoryPage" />} />
              <Route path="rail-special-thali" element={<LazyStatic name="RailThaliPage" />} />
              <Route path="chef-specials" element={<LazyStatic name="ChefSpecialsPage" />} />
              <Route path="gallery" element={<LazyStatic name="GalleryPage" />} />
              <Route path="reviews" element={<LazyStatic name="ReviewsPage" />} />
              <Route path="offers" element={<LazyStatic name="OffersPage" />} />
              <Route path="events" element={<LazyStatic name="EventsPage" />} />
              <Route path="blog" element={<LazyStatic name="BlogPage" />} />
              <Route path="blog/:slug" element={<LazyStatic name="BlogPostPage" />} />
              <Route path="faqs" element={<LazyStatic name="FaqsPage" />} />
              <Route path="contact" element={<LazyStatic name="ContactPage" />} />
              <Route path="privacy" element={<LazyStatic name="PrivacyPage" />} />
              <Route path="terms" element={<LazyStatic name="TermsPage" />} />
              <Route path="refund" element={<LazyStatic name="RefundPage" />} />
              <Route path="search" element={<LazyStatic name="SearchPage" />} />
              <Route path="order-success/:orderNumber" element={<LazyStatic name="OrderSuccessPage" />} />
              <Route path="track" element={<LazyStatic name="TrackOrderPage" />} />
              <Route path="track/:orderNumber" element={<LazyStatic name="TrackOrderPage" />} />
              <Route
                path="account"
                element={
                  <ProtectedRoute>
                    <LazyStatic name="AccountPage" />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<LazyStatic name="NotFoundPage" />} />
            </Route>

            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['admin', 'staff']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<LazyAdmin name="AdminDashboard" />} />
              <Route path="orders" element={<LazyAdminOps name="AdminOrdersPro" />} />
              <Route path="kitchen" element={<LazyAdminOps name="AdminKitchen" />} />
              <Route path="reservations" element={<LazyAdmin name="AdminReservations" />} />
              <Route path="calendar" element={<LazyAdminOps name="AdminReservationCalendar" />} />
              <Route path="menu" element={<LazyAdminCms name="AdminMenuManager" />} />
              <Route path="media" element={<LazyAdminCms name="AdminMediaLibrary" />} />
              <Route path="users" element={<LazyAdmin name="AdminUsers" />} />
              <Route path="gallery" element={<LazyAdminCms name="AdminGalleryManager" />} />
              <Route path="reviews" element={<LazyAdminCms name="AdminReviewsManager" />} />
              <Route path="blogs" element={<LazyAdminCms name="AdminBlogManager" />} />
              <Route path="offers" element={<LazyAdminCms name="AdminOffersManager" />} />
              <Route path="events" element={<LazyAdminCms name="AdminEventsManager" />} />
              <Route path="features" element={<LazyAdminCms name="AdminFeatureManager" />} />
              <Route path="cms" element={<LazyAdminCms name="AdminRestaurantCms" />} />
              <Route path="homepage" element={<LazyAdminOps name="AdminHomepageBuilder" />} />
              <Route path="analytics" element={<LazyAdminOps name="AdminAnalyticsPro" />} />
              <Route path="seed" element={<LazyAdminCms name="AdminSeedTools" />} />
              <Route path="settings" element={<LazyAdmin name="AdminSettings" />} />
            </Route>

            <Route
              path="/developer"
              element={
                <ProtectedRoute roles={['developer']}>
                  <DeveloperLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<LazyAdmin name="DeveloperHome" />} />
              <Route path="theme" element={<LazyAdmin name="DeveloperTheme" />} />
              <Route path="health" element={<LazyAdmin name="DeveloperHealth" />} />
              <Route path="flags" element={<LazyAdmin name="DeveloperFlags" />} />
              <Route path="logs" element={<LazyAdmin name="DeveloperLogs" />} />
            </Route>

            <Route path="/special-menu" element={<Navigate to="/menu" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
