import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@/api/services';
import { Seo } from '@/seo/Seo';
import { FeatureGate } from '@/components/common/FeatureGate';
import { QueryState } from '@/components/common/QueryState';

export function OffersPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['offers'],
    queryFn: contentApi.offers,
    staleTime: 60_000,
    retry: 3,
  });
  return (
    <FeatureGate featureKey="offers" title="Offers are currently unavailable">
      <Seo title="Offers" path="/offers" />
      <div className="container-rrr py-12">
        <h1 className="section-title">Offers & Coupons</h1>
        <p className="section-subtitle mb-8">Save more on your favourite meals</p>
        <QueryState
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={!isLoading && !isError && !(data && data.length)}
          emptyTitle="No active offers"
          emptyDescription="New deals are on the way. Follow us or check back soon."
          onRetry={() => refetch()}
        >
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data?.map((o) => (
              <article key={o.id} className="card">
                <span className="badge bg-gold-400 text-charcoal-900">{o.discount_label || 'Offer'}</span>
                <h2 className="mt-3 font-display text-xl font-semibold">{o.title}</h2>
                <p className="mt-2 text-sm text-charcoal-500">{o.description}</p>
                {o.coupon_code && (
                  <p className="mt-4 rounded-lg bg-charcoal-50 px-3 py-2 font-mono text-sm dark:bg-charcoal-900">
                    {o.coupon_code}
                  </p>
                )}
              </article>
            ))}
          </div>
        </QueryState>
      </div>
    </FeatureGate>
  );
}
