import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { menuApi } from '@/api/services';
import { Seo } from '@/seo/Seo';
import { MenuCard } from '@/components/menu/MenuCard';
import { SkeletonCard } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { FeatureGate } from '@/components/common/FeatureGate';
import { QueryState } from '@/components/common/QueryState';

export default function MenuPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') || '');
  const category = params.get('category') || '';
  const isVeg = params.get('veg');
  const sortBy = params.get('sort') || 'sort_order';

  const queryParams = useMemo(
    () => ({
      search: search || undefined,
      category_slug: category || undefined,
      is_veg: isVeg === '1' ? true : isVeg === '0' ? false : undefined,
      sort_by: sortBy,
      page_size: 24,
      is_available: true,
    }),
    [search, category, isVeg, sortBy]
  );

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => menuApi.categories(),
    staleTime: 120_000,
    retry: 3,
  });

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['menu-items', queryParams],
    queryFn: () => menuApi.items(queryParams),
    staleTime: 60_000,
    retry: 3,
  });

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    setParams(next);
  };

  return (
    <FeatureGate featureKey="menu" title="Menu is currently unavailable">
      <Seo
        title="Menu"
        description="Browse Royal Rail Restro menu — North Indian, Chinese, Tandoor, Pizza, Burgers, Momos, Biryani & desserts in Gaya."
        path="/menu"
      />
      <div className="container-rrr py-10">
        <header className="mb-8">
          <h1 className="section-title">Our Menu</h1>
          <p className="section-subtitle">
            Filter by category, veg preference, and spice — every dish is prepared fresh.
          </p>
        </header>

        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_auto_auto]">
          <Input
            placeholder="Search dishes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setFilter('q', search);
            }}
            aria-label="Search menu"
          />
          <select
            className="input"
            value={isVeg || ''}
            onChange={(e) => setFilter('veg', e.target.value)}
            aria-label="Dietary filter"
          >
            <option value="">All</option>
            <option value="1">Vegetarian</option>
            <option value="0">Non-Vegetarian</option>
          </select>
          <select
            className="input"
            value={sortBy}
            onChange={(e) => setFilter('sort', e.target.value)}
            aria-label="Sort by"
          >
            <option value="sort_order">Featured</option>
            <option value="price">Price: Low to High</option>
            <option value="name">Name</option>
            <option value="rating_avg">Rating</option>
          </select>
        </div>

        <div className="mb-8 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Categories">
          <button
            type="button"
            role="tab"
            aria-selected={!category}
            className={cn(
              'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium',
              !category
                ? 'bg-royal-700 text-white'
                : 'bg-white text-charcoal-600 ring-1 ring-charcoal-200 dark:bg-charcoal-800 dark:text-cream-100'
            )}
            onClick={() => setFilter('category', '')}
          >
            All
          </button>
          {categories?.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={category === c.slug}
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium',
                category === c.slug
                  ? 'bg-royal-700 text-white'
                  : 'bg-white text-charcoal-600 ring-1 ring-charcoal-200 dark:bg-charcoal-800 dark:text-cream-100'
              )}
              onClick={() => setFilter('category', c.slug)}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>

        <QueryState
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={!isLoading && !isError && !(data?.items?.length)}
          emptyTitle="No dishes match your filters"
          emptyDescription="Try another category or clear search."
          onRetry={() => refetch()}
          skeleton={
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          }
        >
          <p className="mb-4 text-sm text-charcoal-500" aria-live="polite">
            {data?.meta.total ?? 0} dishes {isFetching ? '· updating…' : ''}
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data?.items.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        </QueryState>
      </div>
    </FeatureGate>
  );
}
