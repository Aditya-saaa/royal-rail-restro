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
} from 'react-icons/fi';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const links = [
  { to: '/admin', label: 'Dashboard', icon: FiHome, end: true },
  { to: '/admin/kitchen', label: 'Kitchen', icon: FiCoffee },
  { to: '/admin/orders', label: 'Orders', icon: FiShoppingBag },
  { to: '/admin/calendar', label: 'Res. Calendar', icon: FiCalendar },
  { to: '/admin/reservations', label: 'Reservations', icon: FiCalendar },
  { to: '/admin/menu', label: 'Menu CMS', icon: FiGrid },
  { to: '/admin/media', label: 'Media', icon: FiCamera },
  { to: '/admin/gallery', label: 'Gallery', icon: FiImage },
  { to: '/admin/reviews', label: 'Reviews', icon: FiStar },
  { to: '/admin/blogs', label: 'Blog CMS', icon: FiFileText },
  { to: '/admin/offers', label: 'Offers', icon: FiTag },
  { to: '/admin/events', label: 'Events', icon: FiGift },
  { to: '/admin/users', label: 'Users', icon: FiUsers },
  { to: '/admin/features', label: 'Features', icon: FiToggleLeft },
  { to: '/admin/cms', label: 'Restaurant CMS', icon: FiEdit3 },
  { to: '/admin/homepage', label: 'Home Builder', icon: FiLayout },
  { to: '/admin/analytics', label: 'Analytics', icon: FiBarChart2 },
  { to: '/admin/settings', label: 'Settings', icon: FiSettings },
  { to: '/admin/seed', label: 'Data & Seed', icon: FiDatabase },
];

export function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex min-h-screen bg-charcoal-50 dark:bg-charcoal-900">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-charcoal-200 bg-white dark:border-charcoal-700 dark:bg-charcoal-800 lg:flex">
        <div className="border-b border-charcoal-100 p-5 dark:border-charcoal-700">
          <p className="font-display text-lg font-bold text-royal-700 dark:text-gold-400">
            Admin Panel
          </p>
          <p className="truncate text-xs text-charcoal-400">{user?.email}</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Admin">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-royal-700 text-white shadow-royal'
                    : 'text-charcoal-600 hover:bg-charcoal-50 dark:text-charcoal-200 dark:hover:bg-charcoal-700'
                )
              }
            >
              <l.icon className="h-4 w-4" aria-hidden />
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-1 border-t border-charcoal-100 p-3 dark:border-charcoal-700">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-charcoal-600 hover:bg-charcoal-50 dark:text-charcoal-200"
          >
            <FiArrowLeft /> Website
          </Link>
          <Link
            to="/developer"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-charcoal-600 hover:bg-charcoal-50 dark:text-charcoal-200"
          >
            <FiFlag /> Developer
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
          >
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-charcoal-200 bg-white px-4 py-3 dark:border-charcoal-700 dark:bg-charcoal-800 lg:px-8">
          <h1 className="font-display text-lg font-semibold text-charcoal-900 dark:text-cream-50">
            Royal Rail Restro
          </h1>
          <div className="flex max-w-[60vw] gap-2 overflow-x-auto lg:hidden">
            {links.slice(0, 8).map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className="whitespace-nowrap rounded-lg bg-charcoal-100 px-3 py-1.5 text-xs font-medium dark:bg-charcoal-700"
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
