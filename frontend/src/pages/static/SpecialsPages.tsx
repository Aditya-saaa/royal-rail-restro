import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { menuApi } from '@/api/services';
import { Seo } from '@/seo/Seo';
import { MenuCard } from '@/components/menu/MenuCard';
import { Button } from '@/components/ui/Button';
import { FeatureGate } from '@/components/common/FeatureGate';
import { QueryState } from '@/components/common/QueryState';

export function RailThaliPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['rail-specials'],
    queryFn: menuApi.railSpecials,
    staleTime: 120_000,
    retry: 3,
  });
  return (
    <FeatureGate featureKey="home_rail_specials" title="Rail Special Thali is unavailable">
      <Seo title="Rail Special Thali" path="/rail-special-thali" description="Signature Rail Special Thali at Royal Rail Restro, Gaya — veg & non-veg multi-course platters." />
      <div className="bg-royal-gradient py-14 text-white">
        <div className="container-rrr">
          <h1 className="font-display text-4xl font-bold">Rail Special Thali</h1>
          <p className="mt-3 max-w-2xl text-cream-200">
            Multi-course platters inspired by classic railway dining — dal, sabzi, roti, rice, raita & dessert.
          </p>
        </div>
      </div>
      <div className="container-rrr py-12">
        <QueryState
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={!isLoading && !isError && !(data && data.length)}
          emptyTitle="No thali specials listed yet"
          emptyDescription="Our kitchen is updating the Rail Special menu. Browse the full menu in the meantime."
          onRetry={() => refetch()}
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data?.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        </QueryState>
        <div className="mt-8 text-center">
          <Link to="/menu">
            <Button variant="outline">Browse full menu</Button>
          </Link>
        </div>
      </div>
    </FeatureGate>
  );
}

export function ChefSpecialsPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['chef-specials'],
    queryFn: menuApi.chefSpecials,
    staleTime: 120_000,
    retry: 3,
  });
  return (
    <FeatureGate featureKey="home_chef_specials" title="Chef Specials are unavailable">
      <Seo title="Chef Specials" path="/chef-specials" />
      <div className="container-rrr py-12">
        <h1 className="section-title">Chef Specials</h1>
        <p className="section-subtitle mb-8">Signature creations from our kitchen</p>
        <QueryState
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={!isLoading && !isError && !(data && data.length)}
          emptyTitle="No chef specials right now"
          emptyDescription="Explore the full menu for daily favourites."
          onRetry={() => refetch()}
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data?.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        </QueryState>
      </div>
    </FeatureGate>
  );
}
