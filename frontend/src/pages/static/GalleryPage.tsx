import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@/api/services';
import { Seo } from '@/seo/Seo';
import { FeatureGate } from '@/components/common/FeatureGate';
import { QueryState } from '@/components/common/QueryState';

export function GalleryPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['gallery'],
    queryFn: () => contentApi.gallery(),
    staleTime: 120_000,
    retry: 3,
  });
  return (
    <FeatureGate featureKey="gallery" title="Gallery is currently unavailable">
      <Seo title="Gallery" path="/gallery" />
      <div className="container-rrr py-12">
        <h1 className="section-title">Gallery</h1>
        <p className="section-subtitle mb-8">Food, interiors & celebrations</p>
        <QueryState
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={!isLoading && !isError && !(data && data.length)}
          emptyTitle="No gallery images yet"
          emptyDescription="Our media team is preparing photos. Visit us in Gewalbigha!"
          onRetry={() => refetch()}
          skeleton={
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton aspect-square w-full rounded-2xl" />
              ))}
            </div>
          }
        >
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {data?.map((g) => (
              <figure key={g.id} className="group overflow-hidden rounded-2xl">
                <img
                  src={g.image_url}
                  alt={g.alt_text || g.title}
                  loading="lazy"
                  className="aspect-square w-full object-cover transition group-hover:scale-105"
                />
                <figcaption className="sr-only">{g.title}</figcaption>
              </figure>
            ))}
          </div>
        </QueryState>
      </div>
    </FeatureGate>
  );
}
