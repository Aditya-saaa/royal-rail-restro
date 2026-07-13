import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { adminApi, menuApi, orderApi, reservationApi, contentApi } from '@/api/services';
import { Seo } from '@/seo/Seo';
import { PageLoader, AdminPageSkeleton } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useState } from 'react';
import { getErrorMessage } from '@/api/client';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

export function AdminDashboard() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-dash'],
    queryFn: adminApi.dashboard,
    staleTime: 60_000,
    placeholderData: (p) => p,
  });

  if (isLoading && !data) {
    return (
      <>
        <Seo title="Admin Dashboard" noindex />
        <AdminPageSkeleton />
      </>
    );
  }

  if (isError && !data) {
    return (
      <div className="card border-red-200">
        <p className="font-semibold text-red-700">Dashboard failed to load</p>
        <p className="mt-1 text-sm text-charcoal-500">{getErrorMessage(error)}</p>
        <Button className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const chartData = {
    labels: data!.revenue_series.map((d) => d.date.slice(5)),
    datasets: [
      {
        label: 'Revenue (₹)',
        data: data!.revenue_series.map((d) => d.revenue),
        borderColor: '#8B0000',
        backgroundColor: 'rgba(139,0,0,0.08)',
        fill: true,
        tension: 0.35,
      },
    ],
  };

  const cards = [
    { label: "Today's Orders", value: data!.today_orders, tone: 'royal' },
    { label: 'Total Orders', value: data!.total_orders, tone: 'charcoal' },
    { label: 'Month Revenue', value: formatCurrency(data!.month_revenue), tone: 'gold' },
    { label: 'Total Revenue', value: formatCurrency(data!.total_revenue), tone: 'gold' },
    { label: 'Customers', value: data!.total_users, tone: 'charcoal' },
    { label: 'New (7d)', value: data!.new_users_week, tone: 'royal' },
    { label: 'Pending Reservations', value: data!.pending_reservations, tone: 'amber' },
    { label: "Today's Reservations", value: data!.today_reservations, tone: 'royal' },
    { label: 'Pending Reviews', value: data!.pending_reviews, tone: 'amber' },
    { label: 'New Messages', value: data!.new_messages, tone: 'amber' },
  ];

  return (
    <>
      <Seo title="Admin Dashboard" noindex />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-charcoal-900 dark:text-cream-50">
            Dashboard
          </h1>
          <p className="text-sm text-charcoal-500">
            Live operations snapshot{isFetching ? ' · updating…' : ''}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} loading={isFetching}>
          Refresh
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-charcoal-100/80 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-charcoal-700 dark:bg-charcoal-800"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-charcoal-400">
              {c.label}
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-royal-700 dark:text-gold-400">
              {c.value}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800 lg:col-span-2">
          <h2 className="mb-4 font-display text-lg font-semibold">Revenue — last 7 days</h2>
          <div className="h-72">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } },
                  x: { grid: { display: false } },
                },
              }}
            />
          </div>
        </div>
        <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
          <h2 className="mb-4 font-display text-lg font-semibold">Orders by status</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data!.orders_by_status).map(([k, v]) => (
              <span
                key={k}
                className="rounded-full bg-charcoal-50 px-3 py-1.5 text-sm capitalize dark:bg-charcoal-900"
              >
                {k}: <strong className="text-royal-700 dark:text-gold-400">{v}</strong>
              </span>
            ))}
            {!Object.keys(data!.orders_by_status).length && (
              <p className="text-sm text-charcoal-500">No orders yet.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export function AdminOrders() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-orders'], queryFn: () => orderApi.list({ page: 1 }) });
  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => orderApi.updateStatus(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-orders'] }),
  });

  if (isLoading) return <PageLoader />;
  return (
    <>
      <Seo title="Manage Orders" noindex />
      <h1 className="mb-6 font-display text-2xl font-bold">Orders</h1>
      <div className="overflow-x-auto rounded-2xl border border-charcoal-100 bg-white dark:border-charcoal-700 dark:bg-charcoal-800">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-charcoal-50 text-xs uppercase dark:bg-charcoal-900">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((o) => (
              <tr key={o.id} className="border-b border-charcoal-50 dark:border-charcoal-700">
                <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
                <td className="px-4 py-3 capitalize">{o.order_type}</td>
                <td className="px-4 py-3">{formatCurrency(o.total_amount)}</td>
                <td className="px-4 py-3 capitalize">{o.status}</td>
                <td className="px-4 py-3">
                  <select
                    className="input py-1 text-xs"
                    value={o.status}
                    onChange={(e) => mutation.mutate({ id: o.id, status: e.target.value })}
                  >
                    {['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function AdminReservations() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-reservations'],
    queryFn: () => reservationApi.list({ page: 1 }),
  });
  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      reservationApi.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-reservations'] }),
  });

  if (isLoading) return <PageLoader />;
  return (
    <>
      <Seo title="Reservations" noindex />
      <h1 className="mb-6 font-display text-2xl font-bold">Reservations</h1>
      <div className="space-y-3">
        {data?.items.map((r) => (
          <div key={r.id} className="card flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs text-charcoal-400">{r.reservation_number}</p>
              <p className="font-semibold">{r.guest_name} · {r.guest_count} guests</p>
              <p className="text-sm text-charcoal-500">
                {formatDate(r.reservation_date)} · {String(r.reservation_time).slice(0, 5)} · {r.guest_phone}
              </p>
            </div>
            <select
              className="input w-auto py-1.5 text-sm"
              value={r.status}
              onChange={(e) => mutation.mutate({ id: r.id, status: e.target.value })}
            >
              {['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </>
  );
}

/** @deprecated Use AdminMenuManager from AdminCmsPages (routed at /admin/menu). */
export function AdminMenu() {
  return (
    <>
      <Seo title="Menu Management" noindex />
      <div className="card max-w-xl">
        <h1 className="font-display text-2xl font-bold">Menu CMS moved</h1>
        <p className="mt-2 text-sm text-charcoal-600 dark:text-charcoal-300">
          Full create / edit / delete / bulk UI is at{' '}
          <a className="font-semibold text-royal-700 underline" href="/admin/menu">
            /admin/menu
          </a>{' '}
          (component: <code>AdminMenuManager</code> in <code>AdminCmsPages.tsx</code>).
        </p>
        <p className="mt-2 text-sm text-charcoal-500">
          Media: <a className="underline" href="/admin/media">/admin/media</a> · Features:{' '}
          <a className="underline" href="/admin/features">/admin/features</a> · Home builder:{' '}
          <a className="underline" href="/admin/homepage">/admin/homepage</a>
        </p>
      </div>
    </>
  );
}

export function AdminUsers() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  // Debounce search input
  useState(() => {
    /* placeholder to keep imports stable if needed */
  });
  const onSearch = (v: string) => {
    setSearch(v);
    window.clearTimeout((onSearch as unknown as { t?: number }).t);
    (onSearch as unknown as { t?: number }).t = window.setTimeout(() => setDebounced(v), 300);
  };
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-users', debounced],
    queryFn: () => adminApi.users(1, debounced || undefined),
    staleTime: 60_000,
    placeholderData: (p) => p,
  });
  if (isLoading && !data) return <AdminPageSkeleton />;
  return (
    <>
      <Seo title="Users" noindex />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Users</h1>
        <Button variant="outline" size="sm" onClick={() => refetch()} loading={isFetching}>
          Refresh
        </Button>
      </div>
      <input
        className="input mb-4 max-w-sm"
        placeholder="Search users…"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        aria-label="Search users"
      />
      <div className="space-y-2">
        {data?.items.map((u) => (
          <div
            key={u.id}
            className="flex justify-between rounded-2xl border border-charcoal-100 bg-white p-4 text-sm shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800"
          >
            <div>
              <p className="font-semibold">{u.full_name}</p>
              <p className="text-charcoal-400">{u.email}</p>
            </div>
            <div className="text-right text-xs">
              <p>{u.roles.map((r) => r.name).join(', ') || 'customer'}</p>
              <p className={u.is_active ? 'text-green-600' : 'text-red-600'}>
                {u.is_active ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        ))}
        {!data?.items.length && (
          <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-charcoal-500">
            No users found.
          </p>
        )}
      </div>
    </>
  );
}

export function AdminGallery() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-gallery'], queryFn: () => contentApi.gallery() });
  if (isLoading) return <PageLoader />;
  return (
    <>
      <Seo title="Gallery Admin" noindex />
      <h1 className="mb-6 font-display text-2xl font-bold">Gallery</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {data?.map((g) => (
          <div key={g.id} className="overflow-hidden rounded-xl">
            <img src={g.image_url} alt={g.alt_text} className="aspect-square object-cover" />
            <p className="mt-1 text-xs">{g.title}</p>
          </div>
        ))}
      </div>
    </>
  );
}

export function AdminReviews() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: () => contentApi.reviews({ page: 1 }),
  });
  if (isLoading) return <PageLoader />;
  return (
    <>
      <Seo title="Reviews Admin" noindex />
      <h1 className="mb-6 font-display text-2xl font-bold">Reviews</h1>
      <div className="space-y-3">
        {data?.items.map((r) => (
          <div key={r.id} className="card text-sm">
            <p className="text-gold-500">{'★'.repeat(r.rating)}</p>
            <p className="font-semibold">{r.title}</p>
            <p>{r.comment}</p>
            <p className="text-charcoal-400">— {r.guest_name}</p>
          </div>
        ))}
      </div>
    </>
  );
}

export function AdminBlogs() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-blogs'], queryFn: () => contentApi.blog() });
  if (isLoading) return <PageLoader />;
  return (
    <>
      <Seo title="Blogs Admin" noindex />
      <h1 className="mb-6 font-display text-2xl font-bold">Blog posts</h1>
      {data?.items.map((p) => (
        <div key={p.id} className="card mb-3">
          <p className="font-semibold">{p.title}</p>
          <p className="text-xs text-charcoal-400">{p.status} · {p.views} views</p>
        </div>
      ))}
    </>
  );
}

export function AdminOffers() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-offers'], queryFn: contentApi.offers });
  if (isLoading) return <PageLoader />;
  return (
    <>
      <Seo title="Offers Admin" noindex />
      <h1 className="mb-6 font-display text-2xl font-bold">Offers</h1>
      {data?.map((o) => (
        <div key={o.id} className="card mb-3 flex justify-between">
          <div>
            <p className="font-semibold">{o.title}</p>
            <p className="text-sm text-charcoal-500">{o.coupon_code}</p>
          </div>
          <span className="badge bg-gold-400 text-charcoal-900">{o.discount_label}</span>
        </div>
      ))}
    </>
  );
}

export function AdminSettings() {
  const { data, isLoading } = useQuery({ queryKey: ['site-settings'], queryFn: adminApi.siteSettings });
  if (isLoading) return <PageLoader />;
  return (
    <>
      <Seo title="Settings" noindex />
      <h1 className="mb-6 font-display text-2xl font-bold">Site Settings</h1>
      <div className="space-y-3">
        {(data as { key: string; value: string; group: string; label?: string }[] | undefined)?.map((s) => (
          <div key={s.key} className="card text-sm">
            <p className="text-xs uppercase text-charcoal-400">{s.group}</p>
            <p className="font-semibold">{s.label || s.key}</p>
            <p className="text-charcoal-600 dark:text-charcoal-300">{s.value}</p>
          </div>
        ))}
      </div>
    </>
  );
}

// Developer pages
export function DeveloperHome() {
  return (
    <>
      <Seo title="Developer Panel" noindex />
      <h1 className="mb-2 font-display text-3xl font-bold text-gold-400">Developer Console</h1>
      <p className="mb-8 text-charcoal-300">Theme, health, feature flags & platform tooling for Royal Rail Restro.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { t: 'Theme Builder', d: 'Colors, typography, radius' },
          { t: 'System Health', d: 'API, DB, Redis, Cloudinary' },
          { t: 'Feature Flags', d: 'Toggle platform features' },
          { t: 'Activity Logs', d: 'Audit trail' },
          { t: 'Website Builder', d: 'Homepage structure (API-driven)' },
          { t: 'Environment', d: 'Non-secret runtime config' },
        ].map((c) => (
          <div key={c.t} className="rounded-2xl border border-charcoal-700 bg-charcoal-800 p-5">
            <p className="font-semibold text-cream-50">{c.t}</p>
            <p className="mt-1 text-sm text-charcoal-400">{c.d}</p>
          </div>
        ))}
      </div>
    </>
  );
}

export function DeveloperTheme() {
  const { data, isLoading } = useQuery({ queryKey: ['theme'], queryFn: adminApi.theme });
  const [key, setKey] = useState('primary');
  const [value, setValue] = useState('#8B0000');
  const [msg, setMsg] = useState('');
  const qc = useQueryClient();

  const save = async () => {
    try {
      await adminApi.updateTheme(key, value);
      setMsg('Theme key updated');
      qc.invalidateQueries({ queryKey: ['theme'] });
    } catch (e) {
      setMsg(getErrorMessage(e));
    }
  };

  if (isLoading) return <PageLoader />;
  return (
    <>
      <Seo title="Theme Builder" noindex />
      <h1 className="mb-6 font-display text-2xl font-bold text-gold-400">Theme Builder</h1>
      <div className="mb-6 grid gap-2 sm:grid-cols-2">
        {Object.entries(data || {}).map(([k, v]) => (
          <div key={k} className="flex items-center gap-3 rounded-xl border border-charcoal-700 p-3">
            {String(v).startsWith('#') && (
              <span className="h-8 w-8 rounded-lg border border-white/10" style={{ background: String(v) }} />
            )}
            <div>
              <p className="text-xs text-charcoal-400">{k}</p>
              <p className="font-mono text-sm">{v}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <input className="input max-w-[140px]" value={key} onChange={(e) => setKey(e.target.value)} placeholder="key" />
        <input className="input max-w-[160px]" value={value} onChange={(e) => setValue(e.target.value)} placeholder="value" />
        <Button variant="gold" onClick={save}>Save</Button>
      </div>
      {msg && <p className="mt-3 text-sm text-charcoal-300">{msg}</p>}
    </>
  );
}

export function DeveloperHealth() {
  const { data, isLoading, refetch } = useQuery({ queryKey: ['dev-health'], queryFn: adminApi.health });
  if (isLoading) return <PageLoader />;
  const d = data as Record<string, string>;
  return (
    <>
      <Seo title="System Health" noindex />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gold-400">System Health</h1>
        <Button variant="outline" onClick={() => refetch()}>Refresh</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {['status', 'database', 'redis', 'cloudinary', 'env', 'version'].map((k) => (
          <div key={k} className="rounded-2xl border border-charcoal-700 bg-charcoal-800 p-5">
            <p className="text-xs uppercase text-charcoal-400">{k}</p>
            <p className="mt-1 font-mono text-lg text-cream-50">{String(d?.[k] ?? '—')}</p>
          </div>
        ))}
      </div>
    </>
  );
}

export function DeveloperFlags() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['flags'], queryFn: adminApi.featureFlags });
  const toggle = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) => adminApi.toggleFlag(key, enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['flags'] }),
  });
  if (isLoading) return <PageLoader />;
  return (
    <>
      <Seo title="Feature Flags" noindex />
      <h1 className="mb-6 font-display text-2xl font-bold text-gold-400">Feature Flags</h1>
      <div className="space-y-3">
        {(data as { key: string; enabled: boolean; description?: string }[] | undefined)?.map((f) => (
          <div key={f.key} className="flex items-center justify-between rounded-xl border border-charcoal-700 p-4">
            <div>
              <p className="font-mono text-sm text-cream-50">{f.key}</p>
              <p className="text-xs text-charcoal-400">{f.description}</p>
            </div>
            <button
              type="button"
              className={`rounded-full px-4 py-1.5 text-xs font-bold ${f.enabled ? 'bg-green-600 text-white' : 'bg-charcoal-600 text-charcoal-200'}`}
              onClick={() => toggle.mutate({ key: f.key, enabled: !f.enabled })}
            >
              {f.enabled ? 'ON' : 'OFF'}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

export function DeveloperLogs() {
  const { data, isLoading } = useQuery({ queryKey: ['logs'], queryFn: () => adminApi.activityLogs(1) });
  if (isLoading) return <PageLoader />;
  const items = (data as { items: { id: string; action: string; entity_type?: string; status: string; created_at?: string }[] })?.items || [];
  return (
    <>
      <Seo title="Activity Logs" noindex />
      <h1 className="mb-6 font-display text-2xl font-bold text-gold-400">Activity Logs</h1>
      {items.length === 0 && <p className="text-charcoal-400">No activity logged yet.</p>}
      <div className="space-y-2">
        {items.map((l) => (
          <div key={l.id} className="rounded-lg border border-charcoal-700 px-4 py-3 font-mono text-xs">
            <span className="text-gold-400">{l.action}</span> · {l.entity_type} · {l.status}
          </div>
        ))}
      </div>
    </>
  );
}
