import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@/api/services';
import { Seo } from '@/seo/Seo';
import { QueryState } from '@/components/common/QueryState';

export function ReviewsPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => contentApi.reviews({ page: 1 }),
    staleTime: 60_000,
    retry: 3,
  });
  return (
    <>
      <Seo title="Reviews" path="/reviews" jsonLd={{
        '@context': 'https://schema.org',
        '@type': 'Restaurant',
        name: 'Royal Rail Restro',
        aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', reviewCount: String(data?.meta.total || 5) },
      }} />
      <div className="container-rrr py-12">
        <h1 className="section-title">Guest Reviews</h1>
        <QueryState
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={!isLoading && !isError && !data?.items.length}
          emptyTitle="No reviews yet"
          emptyDescription="Be the first to share your experience with us."
          onRetry={() => refetch()}
        >
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {data?.items.map((r) => (
              <blockquote key={r.id} className="card">
                <div className="text-gold-400">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                <p className="mt-2 font-semibold">{r.title}</p>
                <p className="mt-1 text-sm text-charcoal-600 dark:text-charcoal-300">{r.comment}</p>
                <footer className="mt-3 text-sm text-royal-700">— {r.guest_name || 'Guest'}</footer>
              </blockquote>
            ))}
          </div>
        </QueryState>
      </div>
    </>
  );
}
