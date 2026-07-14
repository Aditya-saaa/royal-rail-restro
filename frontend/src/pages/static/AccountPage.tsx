import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { orderApi, reservationApi } from '@/api/services';
import { Seo } from '@/seo/Seo';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

export function AccountPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { data: orders } = useQuery({ queryKey: ['my-orders'], queryFn: () => orderApi.mine() });
  const { data: reservations } = useQuery({ queryKey: ['my-reservations'], queryFn: () => reservationApi.mine() });

  return (
    <>
      <Seo title="My Account" path="/account" noindex />
      <div className="container-rrr py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="section-title">Hello, {user?.full_name}</h1>
            <p className="text-sm text-charcoal-500">{user?.email}</p>
          </div>
          <Button variant="outline" onClick={() => logout()}>Logout</Button>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <section className="card">
            <h2 className="font-display text-xl font-semibold">Past orders</h2>
            <ul className="mt-4 space-y-3">
              {orders?.items.map((o) => (
                <li key={o.id} className="flex items-center justify-between border-b border-charcoal-100 py-2 text-sm dark:border-charcoal-700">
                  <div>
                    <p className="font-mono">{o.order_number}</p>
                    <p className="text-charcoal-400 capitalize">{o.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(o.total_amount)}</p>
                    <Link to={`/track/${o.order_number}`} className="text-royal-700">Track</Link>
                  </div>
                </li>
              ))}
              {!orders?.items.length && <p className="text-sm text-charcoal-500">No orders yet.</p>}
            </ul>
          </section>
          <section className="card">
            <h2 className="font-display text-xl font-semibold">Reservations</h2>
            <ul className="mt-4 space-y-3">
              {reservations?.items.map((r) => (
                <li key={r.id} className="border-b border-charcoal-100 py-2 text-sm dark:border-charcoal-700">
                  <p className="font-mono">{r.reservation_number}</p>
                  <p>{formatDate(r.reservation_date)} · {r.guest_count} guests · <span className="capitalize">{r.status}</span></p>
                </li>
              ))}
              {!reservations?.items.length && <p className="text-sm text-charcoal-500">No reservations yet.</p>}
            </ul>
            <Link to="/reservation" className="mt-4 inline-block text-sm font-semibold text-royal-700">Book a table →</Link>
          </section>
        </div>
      </div>
    </>
  );
}
