import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@/api/services';
import { Seo } from '@/seo/Seo';
import { formatDate } from '@/lib/utils';
import { FeatureGate } from '@/components/common/FeatureGate';
import { QueryState } from '@/components/common/QueryState';

export function EventsPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['events'],
    queryFn: contentApi.events,
    staleTime: 60_000,
    retry: 3,
  });
  return (
    <FeatureGate featureKey="events" title="Events are currently unavailable">
      <Seo title="Events" path="/events" />
      <div className="container-rrr py-12">
        <h1 className="section-title">Upcoming Events</h1>
        <QueryState
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={!isLoading && !isError && !(data && data.length)}
          emptyTitle="No upcoming events"
          emptyDescription="Check back soon for live music dinners and celebrations."
          onRetry={() => refetch()}
        >
          <div className="mt-8 space-y-4">
            {data?.map((e) => (
              <article
                key={e.id}
                className="card flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h2 className="font-display text-xl font-semibold">{e.title}</h2>
                  <p className="text-sm text-charcoal-500">{e.description}</p>
                  <p className="mt-1 text-sm text-royal-700">
                    {formatDate(e.event_date)} · {e.start_time} – {e.end_time}
                  </p>
                </div>
                <p className="text-sm text-charcoal-400">{e.location}</p>
              </article>
            ))}
          </div>
        </QueryState>
      </div>
    </FeatureGate>
  );
}
