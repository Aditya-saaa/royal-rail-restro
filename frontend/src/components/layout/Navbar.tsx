import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiShoppingBag, FiUser, FiMoon, FiSun, FiSearch } from 'react-icons/fi';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useThemeStore } from '@/store/themeStore';
import { useFeatureStore } from '@/store/featureStore';
import { cn } from '@/lib/utils';

const allNavLinks = [
  { to: '/', label: 'Home', feature: null as string | null },
  { to: '/menu', label: 'Menu', feature: 'menu' },
  { to: '/rail-special-thali', label: 'Rail Thali', feature: 'home_rail_specials' },
  { to: '/reservation', label: 'Reserve', feature: 'table_reservation' },
  { to: '/offers', label: 'Offers', feature: 'offers' },
  { to: '/gallery', label: 'Gallery', feature: 'gallery' },
  { to: '/blog', label: 'Blog', feature: 'blog' },
  { to: '/events', label: 'Events', feature: 'events' },
  { to: '/about', label: 'About', feature: null },
  { to: '/contact', label: 'Contact', feature: 'contact_form' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const itemCount = useCartStore((s) => s.itemCount());
  const { darkMode, toggleDarkMode } = useThemeStore();
  const isVisible = useFeatureStore((s) => s.isVisible);
  const orderingOn = useFeatureStore((s) => s.isEnabled('online_ordering'));
  const darkModeOn = useFeatureStore((s) => s.isVisible('dark_mode'));
  const searchOn = useFeatureStore((s) => s.isVisible('search'));

  const navLinks = allNavLinks.filter((l) => {
    if (!l.feature) return true;
    return isVisible(l.feature);
  });

  return (
    <header className="sticky top-0 z-50 border-b border-charcoal-100/80 bg-white/85 backdrop-blur-xl dark:border-charcoal-700 dark:bg-charcoal-900/85">
      <div className="container-rrr flex h-16 items-center justify-between gap-4 lg:h-20">
        <Link to="/" className="flex items-center gap-2" aria-label="Royal Rail Restro home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-royal-700 text-lg text-gold-400 shadow-royal">
            🚂
          </span>
          <span className="hidden sm:block">
            <span className="block font-display text-lg font-bold leading-tight text-royal-700 dark:text-gold-400">
              Royal Rail
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal-400">
              Restro · Gaya
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-royal-700/10 text-royal-700 dark:bg-gold-400/10 dark:text-gold-400'
                    : 'text-charcoal-600 hover:bg-charcoal-50 hover:text-royal-700 dark:text-charcoal-200 dark:hover:bg-charcoal-800'
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          {searchOn && (
            <button
              type="button"
              className="btn-ghost rounded-full p-2"
              aria-label="Search"
              onClick={() => navigate('/search')}
            >
              <FiSearch className="h-5 w-5" />
            </button>
          )}
          {darkModeOn && (
            <button
              type="button"
              className="btn-ghost rounded-full p-2"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggleDarkMode}
            >
              {darkMode ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
            </button>
          )}
          {orderingOn && (
            <Link to="/cart" className="btn-ghost relative rounded-full p-2" aria-label={`Cart, ${itemCount} items`}>
              <FiShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-royal-700 px-1 text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </Link>
          )}
          {user ? (
            <Link
              to={isAdmin() ? '/admin' : '/account'}
              className="btn-ghost hidden items-center gap-2 rounded-full px-3 py-2 sm:inline-flex"
            >
              <FiUser className="h-5 w-5" />
              <span className="max-w-[100px] truncate text-sm">{user.full_name.split(' ')[0]}</span>
            </Link>
          ) : (
            <Link to="/login" className="btn-primary hidden sm:inline-flex">
              Sign in
            </Link>
          )}
          <button
            type="button"
            className="btn-ghost rounded-full p-2 lg:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-charcoal-100 bg-white px-4 py-4 dark:border-charcoal-700 dark:bg-charcoal-900 lg:hidden" aria-label="Mobile">
          <ul className="space-y-1">
            {navLinks.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-xl px-4 py-3 text-sm font-medium',
                      isActive ? 'bg-royal-700 text-white' : 'text-charcoal-700 dark:text-cream-100'
                    )
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
            <li>
              <Link to={user ? '/account' : '/login'} onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-medium text-royal-700">
                {user ? 'My Account' : 'Sign in'}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
