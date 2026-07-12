/**
 * Operations: Kitchen, Reservation Calendar, Homepage Builder, Analytics exports
 */
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, API_BASE, getErrorMessage } from '@/api/client';
import { orderApi, reservationApi } from '@/api/services';
import { Seo } from '@/seo/Seo';
import { PageLoader } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency, formatDate } from '@/lib/utils';

function authHeaders(): Record<string, string> {
  const t = localStorage.getItem('rrr_access_token');

  if (!t) {
    return {};
  }

  return {
    Authorization: `Bearer ${t}`,
  };
}

/* -------------------- Kitchen -------------------- */
export function AdminKitchen() {
  const qc = useQueryClient();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['kitchen'],
    queryFn: () => api.get('/ops/kitchen').then((r) => r.data),
    refetchInterval: 15000,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      orderApi.updateStatus(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kitchen'] });
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });

  if (isLoading) return <PageLoader />;
  const columns = (data as { columns: Record<string, any[]>; count: number })?.columns || {};
  const order = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'];

  return (
    <>
      <Seo title="Kitchen Board" noindex />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Kitchen Board</h1>
          <p className="text-sm text-charcoal-500">
            Live orders · auto-refresh 15s · {(data as { count?: number })?.count ?? 0} active
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        {order.map((col) => (
          <div key={col} className="rounded-2xl border border-charcoal-100 bg-white p-3 dark:border-charcoal-700 dark:bg-charcoal-800">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-royal-700 dark:text-gold-400">
              {col.replace(/_/g, ' ')} ({(columns[col] || []).length})
            </h2>
            <div className="space-y-2">
              {(columns[col] || []).map((o: any) => (
                <article key={o.id} className="rounded-xl border border-charcoal-100 p-3 text-xs dark:border-charcoal-600">
                  <p className="font-mono font-semibold">{o.order_number}</p>
                  <p className="capitalize text-charcoal-500">{o.order_type} · {o.guest_name}</p>
                  <ul className="mt-2 space-y-0.5">
                    {o.items?.map((i: any, idx: number) => (
                      <li key={idx}>
                        {i.quantity}× {i.name}
                        {i.special_notes ? ` (${i.special_notes})` : ''}
                      </li>
                    ))}
                  </ul>
                  {o.special_instructions && (
                    <p className="mt-1 italic text-amber-700">Note: {o.special_instructions}</p>
                  )}
                  <p className="mt-1 font-semibold">{formatCurrency(o.total_amount)}</p>
                  <select
                    className="input mt-2 py-1 text-xs"
                    value={o.status}
                    onChange={(e) => mutation.mutate({ id: o.id, status: e.target.value })}
                  >
                    {order.concat(['delivered', 'cancelled']).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <a
                    className="mt-2 inline-block text-royal-700 underline"
                    href={`${API_BASE}/ops/orders/${o.id}/invoice`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => {
                      // open with token via fetch blob is complex; use timeline page instead
                      e.preventDefault();
                      window.open(`/admin/orders?focus=${o.id}`, '_self');
                    }}
                  >
                    Open in Orders
                  </a>
                </article>
              ))}
              {!(columns[col] || []).length && (
                <p className="py-6 text-center text-charcoal-400">Empty</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* -------------------- Enhanced Orders with invoice/timeline -------------------- */
export function AdminOrdersPro() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => orderApi.list({ page: 1 }),
  });
  const [timeline, setTimeline] = useState<any>(null);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      orderApi.updateStatus(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-orders'] }),
  });

  const loadTimeline = async (id: string) => {
    try {
      const { data: t } = await api.get(`/ops/orders/${id}/timeline`);
      setTimeline(t);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const openInvoice = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/ops/orders/${id}/invoice`, {
        headers: authHeaders(),
      });
      const html = await res.text();
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(html);
        w.document.close();
      }
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <>
      <Seo title="Orders" noindex />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Orders</h1>
        <div className="flex gap-2">
          <a className="btn-outline text-sm" href={`${API_BASE}/ops/export/orders.csv`} onClick={async (e) => {
            e.preventDefault();
            const res = await fetch(`${API_BASE}/ops/export/orders.csv`, { headers: authHeaders() });
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'orders.csv';
            a.click();
          }}>
            Export CSV
          </a>
        </div>
      </div>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="overflow-x-auto rounded-2xl border bg-white lg:col-span-2 dark:border-charcoal-700 dark:bg-charcoal-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-charcoal-50 text-xs uppercase dark:bg-charcoal-900">
              <tr>
                <th className="px-3 py-3">Order</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Total</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Tools</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((o) => (
                <tr key={o.id} className="border-t dark:border-charcoal-700">
                  <td className="px-3 py-2 font-mono text-xs">{o.order_number}</td>
                  <td className="px-3 py-2 capitalize">{o.order_type}</td>
                  <td className="px-3 py-2">{formatCurrency(o.total_amount)}</td>
                  <td className="px-3 py-2">
                    <select
                      className="input py-1 text-xs"
                      value={o.status}
                      onChange={(e) => mutation.mutate({ id: o.id, status: e.target.value })}
                    >
                      {['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'].map(
                        (s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        )
                      )}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => loadTimeline(o.id)}>
                        Timeline
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openInvoice(o.id)}>
                        Invoice
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <aside className="card h-fit">
          <h2 className="font-display text-lg font-semibold">Timeline / Notes</h2>
          {!timeline && <p className="mt-3 text-sm text-charcoal-500">Select Timeline on an order.</p>}
          {timeline && (
            <div className="mt-4 space-y-3 text-sm">
              <p className="font-mono font-semibold">{timeline.order_number}</p>
              <ol className="space-y-2 border-l-2 border-royal-700/30 pl-4">
                {timeline.timeline?.map((s: any) => (
                  <li key={s.code} className={s.current ? 'font-bold text-royal-700' : s.done ? 'text-charcoal-700' : 'text-charcoal-400'}>
                    {s.done ? '✓' : '○'} {s.label}
                  </li>
                ))}
              </ol>
              <div className="border-t pt-3 text-xs">
                <p>Total: {formatCurrency(timeline.totals?.total || 0)}</p>
                {timeline.special_instructions && <p>Notes: {timeline.special_instructions}</p>}
                {timeline.delivery_address && <p>Address: {timeline.delivery_address}</p>}
              </div>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

/* -------------------- Reservation Calendar -------------------- */
export function AdminReservationCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [table, setTable] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['res-cal', year, month],
    queryFn: () =>
      api.get('/ops/reservations/calendar', { params: { year, month } }).then((r) => r.data),
  });

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDow = new Date(year, month - 1, 1).getDay();
  const byDay = (data as { days?: Record<string, any[]> })?.days || {};

  const selected = selectedDay ? byDay[selectedDay] || [] : [];

  const assign = async (id: string) => {
    await api.patch(`/ops/reservations/${id}/table`, { table_number: table });
    setTable('');
    qc.invalidateQueries({ queryKey: ['res-cal'] });
  };

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      reservationApi.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['res-cal'] }),
  });

  if (isLoading) return <PageLoader />;

  return (
    <>
      <Seo title="Reservation Calendar" noindex />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Reservation Calendar</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (month === 1) {
                setMonth(12);
                setYear((y) => y - 1);
              } else setMonth((m) => m - 1);
            }}
          >
            Prev
          </Button>
          <span className="rounded-xl bg-charcoal-100 px-4 py-2 text-sm font-semibold dark:bg-charcoal-700">
            {year}-{String(month).padStart(2, '0')}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (month === 12) {
                setMonth(1);
                setYear((y) => y + 1);
              } else setMonth((m) => m + 1);
            }}
          >
            Next
          </Button>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-charcoal-500">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const count = (byDay[key] || []).length;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDay(key)}
                  className={`min-h-[64px] rounded-xl border p-2 text-left text-sm transition ${
                    selectedDay === key
                      ? 'border-royal-700 bg-royal-700/10'
                      : 'border-charcoal-100 hover:border-gold-400 dark:border-charcoal-600'
                  }`}
                >
                  <span className="font-semibold">{day}</span>
                  {count > 0 && (
                    <span className="mt-1 block rounded-full bg-gold-400 px-1.5 text-[10px] font-bold text-charcoal-900">
                      {count} booking{count > 1 ? 's' : ''}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <aside className="card">
          <h2 className="font-display text-lg font-semibold">
            {selectedDay ? formatDate(selectedDay) : 'Select a day'}
          </h2>
          <div className="mt-4 space-y-3">
            {selected.map((r: any) => (
              <div key={r.id} className="rounded-xl border border-charcoal-100 p-3 text-sm dark:border-charcoal-600">
                <p className="font-mono text-xs">{r.reservation_number}</p>
                <p className="font-semibold">
                  {r.time} · {r.guest_name} · {r.guest_count} pax
                </p>
                <p className="text-xs text-charcoal-500">{r.phone}</p>
                <p className="text-xs">Table: {r.table_number || '—'}</p>
                <select
                  className="input mt-2 py-1 text-xs"
                  value={r.status}
                  onChange={(e) => statusMut.mutate({ id: r.id, status: e.target.value })}
                >
                  {['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <div className="mt-2 flex gap-1">
                  <Input
                    placeholder="Table #"
                    value={table}
                    onChange={(e) => setTable(e.target.value)}
                  />
                  <Button size="sm" onClick={() => assign(r.id)} disabled={!table}>
                    Assign
                  </Button>
                </div>
              </div>
            ))}
            {selectedDay && !selected.length && (
              <p className="text-sm text-charcoal-500">No reservations this day.</p>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

/* -------------------- Homepage Builder -------------------- */
export function AdminHomepageBuilder() {
  const [sections, setSections] = useState<
    { id: string; label: string; enabled: boolean; order: number }[]
  >([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const { isLoading } = useQuery({
    queryKey: ['home-layout'],
    queryFn: async () => {
      const { data } = await api.get('/cms/homepage-layout');
      setSections(data.sections || []);
      return data;
    },
  });

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...sections];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setSections(next.map((s, i) => ({ ...s, order: i })));
  };

  const save = async () => {
    setError('');
    try {
      await api.put('/cms/homepage-layout', {
        sections: sections.map((s, i) => ({ ...s, order: i })),
      });
      setMsg('Homepage layout saved. Pair with Feature Manager for section visibility.');
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <>
      <Seo title="Homepage Builder" noindex />
      <h1 className="mb-2 font-display text-2xl font-bold">Homepage Builder</h1>
      <p className="mb-6 text-sm text-charcoal-500">
        Reorder and enable/disable homepage sections. Content still comes from Menu/CMS; feature flags also control visibility.
      </p>
      <div className="space-y-2">
        {sections.map((s, idx) => (
          <div key={s.id} className="card flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="font-semibold">{s.label}</p>
              <p className="font-mono text-xs text-charcoal-400">{s.id}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`rounded-full px-3 py-1 text-xs font-bold ${s.enabled ? 'bg-green-600 text-white' : 'bg-charcoal-300'}`}
                onClick={() =>
                  setSections((prev) =>
                    prev.map((x) => (x.id === s.id ? { ...x, enabled: !x.enabled } : x))
                  )
                }
              >
                {s.enabled ? 'ON' : 'OFF'}
              </button>
              <Button size="sm" variant="ghost" onClick={() => move(idx, -1)}>
                ↑
              </Button>
              <Button size="sm" variant="ghost" onClick={() => move(idx, 1)}>
                ↓
              </Button>
            </div>
          </div>
        ))}
      </div>
      {msg && <p className="mt-3 text-sm text-green-700">{msg}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <Button className="mt-6" onClick={save}>
        Save layout
      </Button>
    </>
  );
}

/* -------------------- Analytics extras -------------------- */
export function AdminAnalyticsPro() {
  const { data: popular } = useQuery({
    queryKey: ['popular-dishes'],
    queryFn: () => api.get('/ops/analytics/popular-dishes').then((r) => r.data),
  });
  const { data: peaks } = useQuery({
    queryKey: ['peak-hours'],
    queryFn: () => api.get('/ops/analytics/peak-hours').then((r) => r.data),
  });

  const download = async (path: string, filename: string) => {
    const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  return (
    <>
      <Seo title="Analytics" noindex />
      <h1 className="mb-6 font-display text-2xl font-bold">Analytics & Exports</h1>
      <div className="mb-6 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => download('/ops/export/orders.csv', 'orders.csv')}>
          Orders CSV
        </Button>
        <Button
          variant="outline"
          onClick={() => download('/ops/export/reservations.csv', 'reservations.csv')}
        >
          Reservations CSV
        </Button>
        <Button variant="outline" onClick={() => download('/ops/export/menu.csv', 'menu.csv')}>
          Menu CSV
        </Button>
        <Button variant="gold" onClick={() => download('/ops/backup/json', 'rrr-backup.json')}>
          Full JSON Backup
        </Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="font-display text-lg font-semibold">Best-selling dishes</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {(popular as { name: string; quantity: number }[] | undefined)?.map((p) => (
              <li key={p.name} className="flex justify-between border-b border-charcoal-100 py-2 dark:border-charcoal-700">
                <span>{p.name}</span>
                <strong>{p.quantity}</strong>
              </li>
            ))}
            {!popular?.length && <p className="text-charcoal-500">No order data yet.</p>}
          </ul>
        </div>
        <div className="card">
          <h2 className="font-display text-lg font-semibold">Peak order hours</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {(peaks as { hour: number; orders: number }[] | undefined)?.map((p) => (
              <li key={p.hour} className="flex items-center gap-3">
                <span className="w-16 font-mono">{String(p.hour).padStart(2, '0')}:00</span>
                <div className="h-2 flex-1 rounded bg-charcoal-100 dark:bg-charcoal-700">
                  <div
                    className="h-2 rounded bg-royal-700"
                    style={{
                      width: `${Math.min(100, (p.orders / Math.max(...(peaks as any[]).map((x: any) => x.orders), 1)) * 100)}%`,
                    }}
                  />
                </div>
                <span className="w-8 text-right">{p.orders}</span>
              </li>
            ))}
            {!peaks?.length && <p className="text-charcoal-500">No order data yet.</p>}
          </ul>
        </div>
      </div>
    </>
  );
}
