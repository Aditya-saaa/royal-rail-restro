import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  FiHome,
  FiShoppingBag,
  FiCalendar,
  FiGrid,
  FiUsers,
  FiImage,
  FiStar,
  FiFileText,
  FiTag,
  FiSettings,
  FiLogOut,
  FiArrowLeft,
  FiToggleLeft,
  FiCamera,
  FiFlag,
  FiEdit3,
  FiDatabase,
  FiGift,
  FiCoffee,
  FiBarChart2,
  FiLayout,
  FiMenu,
  FiX,
} from 'react-icons/fi';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const groups = [
  {
    title: 'Operations',
    items: [
      { to: '/admin', label: 'Dashboard', icon: FiHome, end: true },
      { to: '/admin/kitchen', label: 'Kitchen', icon: FiCoffee },
      { to: '/admin/orders', label: 'Orders', icon: FiShoppingBag },
      { to: '/admin/calendar', label: 'Calendar', icon: FiCalendar },
      { to: '/admin/reservations', label: 'Reservations', icon: FiCalendar },
    ],
  },
  {
    title: 'Catalogue',
    items: [
      { to: '/admin/menu', label: 'Menu CMS', icon: FiGrid },
      { to: '/admin/media', label: 'Media', icon: FiCamera },
      { to: '/admin/gallery', label: 'Gallery', icon: FiImage },
    ],
  },
  {
    title: 'Content',
    items: [
      { to: '/admin/reviews', label: 'Reviews', icon: FiStar },
      { to: '/admin/blogs', label: 'Blog', icon: FiFileText },
      { to: '/admin/offers', label: 'Offers', icon: FiTag },
      { to: '/admin/events', label: 'Events', icon: FiGift },
    ],
  },
  {
    title: 'Platform',
    items: [
      { to: '/admin/users', label: 'Users', icon: FiUsers },
      { to: '/admin/features', label: 'Features', icon: FiToggleLeft },
      { to: '/admin/cms', label: 'Restaurant', icon: FiEdit3 },
      { to: '/admin/homepage', label: 'Home Builder', icon: FiLayout },
      { to: '/admin/analytics', label: 'Analytics', icon: FiBarChart2 },
      { to: '/admin/settings', label: 'Settings', icon: FiSettings },
      { to: '/admin/seed', label: 'Data & Seed', icon: FiDatabase },
    ],
  },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {groups.map((g) => (
        <div key={g.title} className="mb-4">
          <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-charcoal-400">
            {g.title}
          </p>
          <div className="space-y-0.5">
            {g.items.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-royal-700 text-white shadow-sm'
                      : 'text-charcoal-600 hover:bg-charcoal-100 dark:text-charcoal-200 dark:hover:bg-charcoal-700/80'
                  )
                }
              >
                <l.icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                {l.label}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

export function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F4F5F7] dark:bg-charcoal-900">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-charcoal-200/80 bg-white dark:border-charcoal-700 dark:bg-charcoal-800 lg:flex">
        <div className="border-b border-charcoal-100 px-5 py-5 dark:border-charcoal-700">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-royal-700 text-lg text-gold-400">
              🚂
            </span>
            <div>
              <p className="font-display text-base font-bold leading-tight text-royal-700 dark:text-gold-400">
                Royal Rail
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400">
                Admin
              </p>
            </div>
          </div>
          <p className="mt-3 truncate text-xs text-charcoal-400">{user?.email}</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3" aria-label="Admin">
          <NavItems />
        </nav>
        <div className="space-y-0.5 border-t border-charcoal-100 p-3 dark:border-charcoal-700">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-charcoal-600 hover:bg-charcoal-50 dark:text-charcoal-200"
          >
            <FiArrowLeft /> Website
          </Link>
          <Link
            to="/developer"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-charcoal-600 hover:bg-charcoal-50 dark:text-charcoal-200"
          >
            <FiFlag /> Developer
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-charcoal-200/80 bg-white/90 px-4 py-3 backdrop-blur-md dark:border-charcoal-700 dark:bg-charcoal-800/90 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-charcoal-600 hover:bg-charcoal-100 lg:hidden"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <FiMenu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-sm font-semibold text-charcoal-900 dark:text-cream-50">
                Command center
              </p>
              <p className="text-xs text-charcoal-400">Manage menu, orders & brand</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-green-800 sm:inline dark:bg-green-950 dark:text-green-200">
              Live
            </span>
            <span className="max-w-[140px] truncate text-xs text-charcoal-500 sm:max-w-none">
              {user?.full_name}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <div className="mx-auto max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-[280px] flex-col bg-white shadow-xl dark:bg-charcoal-800">
            <div className="flex items-center justify-between border-b p-4 dark:border-charcoal-700">
              <p className="font-display font-bold text-royal-700 dark:text-gold-400">Admin</p>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3">
              <NavItems onNavigate={() => setMobileOpen(false)} />
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
}
