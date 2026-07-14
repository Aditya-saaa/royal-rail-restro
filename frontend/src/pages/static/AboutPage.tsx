import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/api/services';
import { Seo } from '@/seo/Seo';
import { QueryState } from '@/components/common/QueryState';

export function AboutPage() {
  const { data: cms, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['cms-public'],
    queryFn: publicApi.cms,
    staleTime: 120_000,
    retry: 2,
  });
  const settings = (cms as { settings?: Record<string, string> } | undefined)?.settings || {};
  const about =
    settings.about_html ||
    'Located on the 1st Floor of Dev Raj Tower, Gewalbigha, Royal Rail Restro brings the romance of classic railway dining into a modern family restaurant. Our kitchen serves North Indian favourites, Chinese classics, tandoor specials, pizzas, burgers, momos, biryanis, and our signature Rail Special Thali.\n\nWe believe great food should feel first-class without the first-class price. Whether you are celebrating a birthday, hosting relatives, or craving a weekday thali — you are always welcome aboard.';
  const tagline =
    settings.restaurant_tagline || 'Premium yet affordable family dining in the heart of Gaya';

  return (
    <>
      <Seo title="About Us" path="/about" description="About Royal Rail Restro — premium family restaurant in Gewalbigha, Gaya, Bihar." />
      <div className="container-rrr py-12">
        <h1 className="section-title">About Royal Rail Restro</h1>
        <p className="section-subtitle mb-8">{tagline}</p>
        <QueryState
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          skeleton={<div className="space-y-3"><div className="skeleton h-4 w-full" /><div className="skeleton h-4 w-5/6" /><div className="skeleton h-4 w-2/3" /></div>}
        >
          <div className="prose prose-lg max-w-3xl whitespace-pre-wrap dark:prose-invert">
            {about.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </QueryState>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {['Family Restaurant', 'Table Reservation', 'Online Ordering'].map((f) => (
            <div key={f} className="card text-center font-semibold text-royal-700 dark:text-gold-400">
              {f}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function OurStoryPage() {
  return (
    <>
      <Seo title="Our Story" path="/our-story" />
      <div className="container-rrr py-12 max-w-3xl">
        <h1 className="section-title">Our Story</h1>
        <div className="mt-6 space-y-4 text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
          <p>
            The idea for Royal Rail Restro began on long train journeys across India — steel thalis,
            hot chai, and meals that felt like home between stations.
          </p>
          <p>
            We opened our doors in Gaya to recreate that warmth with elevated ingredients, attentive
            hospitality, and a dining room designed for families. Our Rail Special Thali remains the
            heart of the menu: a complete journey on a single platter.
          </p>
          <p>
            Today we continue to innovate with chef specials, seasonal menus, and digital convenience —
            reservations, online ordering, and loyalty — while keeping the soul of railway hospitality alive.
          </p>
        </div>
      </div>
    </>
  );
}
