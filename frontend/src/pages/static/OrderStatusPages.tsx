import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { orderApi } from '@/api/services';
import { Seo } from '@/seo/Seo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageLoader } from '@/components/ui/Spinner';
import { formatCurrency } from '@/lib/utils';

export function OrderSuccessPage() {
  const { orderNumber = '' } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['track', orderNumber],
    queryFn: () => orderApi.track(orderNumber),
    enabled: !!orderNumber,
  });
  if (isLoading) return <PageLoader />;
  return (
    <>
      <Seo title="Order Confirmed" noindex />
      <div className="container-rrr max-w-lg py-16 text-center">
        <div className="card">
          <p className="text-4xl" aria-hidden>✓</p>
          <h1 className="mt-3 font-display text-2xl font-bold">Order placed!</h1>
          <p className="mt-2 font-mono text-royal-700">{data?.order_number || orderNumber}</p>
          <p className="mt-2 text-sm text-charcoal-500">Status: {data?.status} · Total: {data ? formatCurrency(data.total_amount) : '—'}</p>
          <Link to={`/track/${orderNumber}`} className="mt-6 inline-block">
            <Button>Track order</Button>
          </Link>
        </div>
      </div>
    </>
  );
}

export function TrackOrderPage() {
  const { orderNumber = '' } = useParams();
  const [input, setInput] = useState(orderNumber);
  const [active, setActive] = useState(orderNumber);
  const { data, isLoading, error } = useQuery({
    queryKey: ['track', active],
    queryFn: () => orderApi.track(active),
    enabled: !!active,
  });
  return (
    <>
      <Seo title="Track Order" path="/track" noindex />
      <div className="container-rrr max-w-xl py-12">
        <h1 className="section-title mb-6">Track Order</h1>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setActive(input.trim());
          }}
        >
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Order number e.g. RRR-…" />
          <Button type="submit">Track</Button>
        </form>
        {isLoading && <PageLoader />}
        {error && <p className="mt-4 text-red-600">Order not found</p>}
        {data && (
          <div className="card mt-6 space-y-3">
            <p className="font-mono font-semibold">{data.order_number}</p>
            <p>Status: <strong className="capitalize">{data.status}</strong></p>
            <p>Payment: {data.payment_status}</p>
            <p className="text-lg font-bold text-royal-700">{formatCurrency(data.total_amount)}</p>
            <ul className="divide-y text-sm">
              {data.items.map((i) => (
                <li key={i.id} className="flex justify-between py-2">
                  <span>{i.quantity}× {i.name}</span>
                  <span>{formatCurrency(i.line_total)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
