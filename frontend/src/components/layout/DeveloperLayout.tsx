import { NavLink, Outlet, Link } from 'react-router-dom';
import { FiActivity, FiAperture, FiCode, FiDatabase, FiFlag, FiHome, FiArrowLeft } from 'react-icons/fi';
import { cn } from '@/lib/utils';

const links = [
  { to: '/developer', label: 'Overview', icon: FiHome, end: true },
  { to: '/developer/theme', label: 'Theme Builder', icon: FiAperture },
  { to: '/developer/health', label: 'System Health', icon: FiActivity },
  { to: '/developer/flags', label: 'Feature Flags', icon: FiFlag },
  { to: '/developer/logs', label: 'Activity Logs', icon: FiDatabase },
];

export function DeveloperLayout() {
  return (
    <div className="flex min-h-screen bg-charcoal-900 text-cream-50">
      <aside className="hidden w-60 shrink-0 border-r border-charcoal-700 bg-charcoal-950 p-4 lg:block">
        <p className="mb-6 font-display text-lg font-bold text-gold-400">
          <FiCode className="mr-2 inline" /> Developer
        </p>
        <nav className="space-y-1" aria-label="Developer">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
                  isActive ? 'bg-gold-400/20 text-gold-400' : 'text-charcoal-300 hover:bg-charcoal-800'
                )
              }
            >
              <l.icon /> {l.label}
            </NavLink>
          ))}
        </nav>
        <Link to="/admin" className="mt-8 flex items-center gap-2 px-3 text-sm text-charcoal-400 hover:text-white">
          <FiArrowLeft /> Admin
        </Link>
      </aside>
      <main className="flex-1 p-4 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
