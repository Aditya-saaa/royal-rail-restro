import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiCalendar, FiStar, FiUsers, FiAward } from 'react-icons/fi';
import { publicApi } from '@/api/services';
import { getErrorMessage, API_BASE } from '@/api/client';
import { Seo, restaurantJsonLd } from '@/seo/Seo';
import { MenuCard } from '@/components/menu/MenuCard';
import { Button } from '@/components/ui/Button';
import { SkeletonCard, HomeSkeleton } from '@/components/ui/Spinner';
import { formatCurrency } from '@/lib/utils';
import type { HomePayload } from '@/types';
import { useFeatureStore } from '@/store/featureStore';

/** Always renderable fallback so the homepage never stays blank. */
const FALLBACK_HOME: HomePayload = {
  featured_dishes: [],
  chef_specials: [],
  rail_specials: [],
  categories: [
    { id: '1', name: 'North Indian', slug: 'north-indian', icon: '🍛', sort_order: 1, is_active: true, is_featured: true },
    { id: '2', name: 'Chinese', slug: 'chinese', icon: '🥡', sort_order: 2, is_active: true, is_featured: true },
    { id: '3', name: 'Tandoor', slug: 'tandoor', icon: '🔥', sort_order: 3, is_active: true, is_featured: true },
    { id: '4', name: 'Pizza', slug: 'pizza', icon: '🍕', sort_order: 4, is_active: true, is_featured: true },
    { id: '5', name: 'Burgers', slug: 'burgers', icon: '🍔', sort_order: 5, is_active: true, is_featured: true },
    { id: '6', name: 'Rail Special Thali', slug: 'rail-special-thali', icon: '🚂', sort_order: 0, is_active: true, is_featured: true },
  ],
  offers: [],
  testimonials: [],
  gallery: [],
  stats: {
    happy_customers: '10,000+',
    dishes: '150+',
    years: '5+',
    rating: '4.8',
  },
};

export default function HomePage() {
  const isVisible = useFeatureStore((s) => s.isVisible);
  const orderingOn = useFeatureStore((s) => s.isEnabled('online_ordering'));
  const reserveOn = useFeatureStore((s) => s.isEnabled('table_reservation'));

  const { data, isLoading, isError, error, refetch, isFetching, isFetching: refreshing } = useQuery({
    queryKey: ['home'],
    queryFn: publicApi.home,
    retry: 3,
    staleTime: 2 * 60_000,
    gcTime: 30 * 60_000,
    placeholderData: (prev) => prev,
  });

  // Progressive: show branded skeleton instead of blank/spinner-only
  if (isLoading && !data) {
    return (
      <>
        <Seo />
        <HomeSkeleton />
      </>
    );
  }

  // Never block the whole page on API failure or empty payload
  const home = data ?? FALLBACK_HOME;
  const apiEmpty =
    data &&
    !data.featured_dishes?.length &&
    !data.categories?.length &&
    !data.chef_specials?.length;

  // Homepage builder layout from CMS (section enable flags)
  const layoutSections = ((data as { homepage_layout?: { id: string; enabled: boolean }[] } | undefined)
    ?.homepage_layout || []) as { id: string; enabled: boolean }[];
  const layoutEnabled = (id: string) => {
    if (!layoutSections.length) return true;
    const s = layoutSections.find((x) => x.id === id);
    return s ? s.enabled !== false : true;
  };
  const cms = (data as { cms?: Record<string, string | null | undefined> } | undefined)?.cms || {};
  const heroTitle = cms.hero_title || 'Welcome to';
  const heroSubtitle =
    cms.hero_subtitle ||
    'North Indian classics, sizzling tandoor, Indo-Chinese favourites and our legendary Rail Special Thali — crafted for families who love premium yet affordable dining.';
  const heroImage =
    cms.hero_image || 'https://placehold.co/720x480/1a1a1a/D4AF37?text=Royal+Rail+Dining';

  return (
    <>
      <Seo jsonLd={restaurantJsonLd} path="/" />

      {(isError || apiEmpty || refreshing) && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          {refreshing && !isError && !apiEmpty && (
            <span>Updating live menu…</span>
          )}
          {isError ? (
            <>
              Could not load live menu data ({getErrorMessage(error)}). Showing brand homepage.
              API: <code className="text-xs">{API_BASE}</code>.{' '}
              <button type="button" className="underline font-semibold" onClick={() => refetch()}>
                Retry
              </button>
            </>
          ) : apiEmpty ? (
            <>
              Live catalogue is empty on the server. Seed the database (POST /api/v1/admin/seed) or
              redeploy backend after the seed fix.{' '}
              <button type="button" className="underline font-semibold" onClick={() => refetch()} disabled={isFetching}>
                Refresh
              </button>
            </>
          ) : null}
        </div>
      )}

      {/* Hero */}
      {layoutEnabled('hero') && isVisible('home_hero') && (
      <section className="relative overflow-hidden bg-royal-gradient text-white">
        <div className="absolute inset-0 bg-rail-pattern opacity-40" aria-hidden />
        <div className="container-rrr relative grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold-400">
              🚂 Premium Family Dining · Gaya
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              {heroTitle.includes('Royal Rail') ? (
                heroTitle
              ) : (
                <>
                  {heroTitle}{' '}
                  <span className="text-gold-400">Royal Rail Restro</span>
                </>
              )}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-cream-200/90">{heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {orderingOn ? (
                <Link to="/menu">
                  <Button variant="gold" size="lg">
                    Order Online <FiArrowRight />
                  </Button>
                </Link>
              ) : (
                <Link to="/menu">
                  <Button variant="gold" size="lg">
                    View Menu <FiArrowRight />
                  </Button>
                </Link>
              )}
              {reserveOn && (
                <Link to="/reservation">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white text-white hover:bg-white hover:text-royal-700"
                  >
                    <FiCalendar /> Reserve Table
                  </Button>
                </Link>
              )}
            </div>
            <p className="mt-6 text-sm text-cream-200/70">
              1st Floor, Dev Raj Tower, Gewalbigha, Gaya · Open 11 AM – 10:30 PM
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <div className="glass rounded-3xl p-3">
              {cms.hero_video ? (
                <video
                  className="h-auto w-full rounded-2xl object-cover"
                  src={cms.hero_video}
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster={heroImage}
                  aria-label="Royal Rail Restro dining experience"
                />
              ) : (
                <img
                  src={heroImage}
                  alt="Royal Rail Restro dining experience"
                  className="h-auto w-full rounded-2xl object-cover"
                  width={720}
                  height={480}
                />
              )}
            </div>
            <div className="absolute -bottom-4 -left-4 rounded-2xl bg-gold-400 px-4 py-3 text-charcoal-900 shadow-gold">
              <p className="text-xs font-semibold uppercase tracking-wide">Guest Rating</p>
              <p className="font-display text-2xl font-bold">★ {home.stats.rating}</p>
            </div>
          </motion.div>
        </div>
      </section>
      )}

      {/* Stats */}
      {layoutEnabled('stats') && (
      <section className="border-b border-charcoal-100 bg-white dark:border-charcoal-700 dark:bg-charcoal-800">
        <div className="container-rrr grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
          {[
            { icon: FiUsers, label: 'Happy Guests', value: home.stats.happy_customers },
            { icon: FiAward, label: 'Signature Dishes', value: home.stats.dishes },
            { icon: FiStar, label: 'Average Rating', value: home.stats.rating },
            { icon: FiCalendar, label: 'Years of Taste', value: home.stats.years },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <s.icon className="mx-auto mb-2 h-6 w-6 text-royal-700 dark:text-gold-400" aria-hidden />
              <p className="font-display text-2xl font-bold text-charcoal-900 dark:text-cream-50">
                {s.value}
              </p>
              <p className="text-sm text-charcoal-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>
      )}

      {/* Categories */}
      {layoutEnabled('categories') && isVisible('home_categories') && (
      <section className="container-rrr py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="section-title">Popular Categories</h2>
            <p className="section-subtitle">Explore cuisines from our full kitchen repertoire</p>
          </div>
          <Link to="/menu" className="hidden text-sm font-semibold text-royal-700 sm:inline-flex">
            View full menu →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {(home.categories?.length ? home.categories : FALLBACK_HOME.categories).slice(0, 12).map((c) => (
            <Link
              key={c.id}
              to={`/menu?category=${c.slug}`}
              className="card group flex flex-col items-center p-4 text-center transition hover:-translate-y-1 hover:border-gold-400/50 hover:shadow-gold"
            >
              <span className="mb-2 text-3xl" aria-hidden>
                {c.icon || '🍽️'}
              </span>
              <span className="text-sm font-semibold text-charcoal-800 dark:text-cream-100">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </section>
      )}

      {/* Signature / Featured */}
      {layoutEnabled('featured') && isVisible('home_featured_dishes') && (
      <section className="bg-cream-100 py-16 dark:bg-charcoal-950">
        <div className="container-rrr">
          <h2 className="section-title">Signature Dishes</h2>
          <p className="section-subtitle mb-8">Guest favourites prepared fresh every day</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {home.featured_dishes?.length
              ? home.featured_dishes.map((item) => <MenuCard key={item.id} item={item} />)
              : Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
          {!home.featured_dishes?.length && (
            <div className="mt-6 text-center">
              <Link to="/menu">
                <Button variant="outline">Browse full menu</Button>
              </Link>
            </div>
          )}
        </div>
      </section>
      )}

      {/* Why choose us / awards */}
      {layoutEnabled('awards') && isVisible('home_awards') && (
        <section className="container-rrr py-12">
          <h2 className="section-title text-center">Why Choose Royal Rail</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { t: 'Premium ingredients', d: 'Fresh, quality produce every day' },
              { t: 'Family first', d: 'Warm hospitality for every guest' },
              { t: 'Signature thali', d: 'Railway-inspired multi-course platters' },
              { t: 'Affordable luxury', d: 'First-class taste without excess' },
            ].map((x) => (
              <div key={x.t} className="card text-center">
                <p className="font-display text-lg font-semibold text-royal-700 dark:text-gold-400">{x.t}</p>
                <p className="mt-2 text-sm text-charcoal-500">{x.d}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Offers */}
      {layoutEnabled('offers') && isVisible('home_offers') && (home.offers?.length ?? 0) > 0 && (
        <section className="container-rrr py-16">
          <h2 className="section-title">Today&apos;s Offers</h2>
          <p className="section-subtitle mb-8">Save more on your favourite meals</p>
          <div className="grid gap-6 md:grid-cols-3">
            {home.offers.map((o) => (
              <article key={o.id} className="card overflow-hidden bg-royal-gradient p-0 text-white">
                <div className="p-6">
                  <span className="badge bg-gold-400 text-charcoal-900">
                    {o.discount_label || 'Offer'}
                  </span>
                  <h3 className="mt-3 font-display text-xl font-semibold">{o.title}</h3>
                  <p className="mt-2 text-sm text-cream-200/80">{o.description}</p>
                  {o.coupon_code && (
                    <p className="mt-4 rounded-lg border border-dashed border-gold-400/50 bg-black/20 px-3 py-2 font-mono text-sm text-gold-400">
                      Code: {o.coupon_code}
                    </p>
                  )}
                  <Link to="/offers" className="mt-4 inline-flex text-sm font-semibold text-gold-400">
                    View details →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Chef specials */}
      {layoutEnabled('chef') && isVisible('home_chef_specials') && (home.chef_specials?.length ?? 0) > 0 && (
        <section className="container-rrr py-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="section-title">Chef Recommendations</h2>
              <p className="section-subtitle">Handpicked by our kitchen</p>
            </div>
            <Link to="/chef-specials" className="text-sm font-semibold text-royal-700">
              See all →
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {home.chef_specials.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Rail specials CTA */}
      {layoutEnabled('rail') && isVisible('home_rail_specials') && (
      <section className="bg-charcoal-900 py-16 text-white">
        <div className="container-rrr grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-gold-400">
              Signature Experience
            </p>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Rail Special Thali</h2>
            <p className="mt-4 text-charcoal-300">
              A multi-course journey inspired by classic railway dining — dal, sabzi, roti, rice,
              raita and dessert, plated with royal flair.
            </p>
            {(home.rail_specials?.length ?? 0) > 0 && (
              <ul className="mt-6 space-y-2 text-sm text-cream-200">
                {home.rail_specials.map((t) => (
                  <li key={t.id} className="flex justify-between border-b border-white/10 py-2">
                    <span>{t.name}</span>
                    <span className="font-semibold text-gold-400">{formatCurrency(t.price)}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/rail-special-thali" className="mt-8 inline-block">
              <Button variant="gold">Explore Thali Menu</Button>
            </Link>
          </div>
          <img
            src="https://placehold.co/640x480/8B0000/D4AF37?text=Rail+Special+Thali"
            alt="Rail Special Thali platter"
            className="rounded-3xl shadow-royal"
            loading="lazy"
          />
        </div>
      </section>
      )}

      {/* Story */}
      {layoutEnabled('story') && isVisible('home_story') && (
        <section className="container-rrr py-16">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gold-600">Our Story</p>
              <h2 className="section-title mt-2">Inspired by the rails</h2>
              <p className="mt-4 text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
                Royal Rail Restro brings the nostalgia of classic railway dining to Gewalbigha, Gaya —
                steel thalis, warm hospitality, and modern family comfort under one roof.
              </p>
              <Link to="/our-story" className="mt-6 inline-block">
                <Button variant="outline">Read our story</Button>
              </Link>
            </div>
            <img
              src="https://placehold.co/640x400/1a1a1a/D4AF37?text=Our+Story"
              alt="Royal Rail Restro story"
              className="rounded-3xl shadow-soft"
              loading="lazy"
            />
          </div>
        </section>
      )}

      {/* Testimonials */}
      {layoutEnabled('testimonials') && isVisible('home_testimonials') && (home.testimonials?.length ?? 0) > 0 && (
        <section className="container-rrr py-16">
          <h2 className="section-title">What Guests Say</h2>
          <p className="section-subtitle mb-8">Real reviews from our dining family</p>
          <div className="grid gap-6 md:grid-cols-3">
            {home.testimonials.map((t) => (
              <blockquote key={t.id} className="card">
                <div className="mb-3 text-gold-400" aria-label={`${t.rating} out of 5 stars`}>
                  {'★'.repeat(t.rating)}
                  {'☆'.repeat(5 - t.rating)}
                </div>
                {t.title && <p className="mb-2 font-display text-lg font-semibold">{t.title}</p>}
                <p className="text-sm leading-relaxed text-charcoal-600 dark:text-charcoal-300">
                  “{t.comment}”
                </p>
                <footer className="mt-4 text-sm font-semibold text-royal-700 dark:text-gold-400">
                  — {t.guest_name || 'Guest'}
                </footer>
              </blockquote>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/reviews" className="text-sm font-semibold text-royal-700">
              Read all reviews →
            </Link>
          </div>
        </section>
      )}

      {/* Gallery strip */}
      {layoutEnabled('gallery') && isVisible('home_gallery') && (home.gallery?.length ?? 0) > 0 && (
        <section className="bg-cream-100 py-16 dark:bg-charcoal-950">
          <div className="container-rrr">
            <h2 className="section-title">Moments at Royal Rail</h2>
            <p className="section-subtitle mb-8">A glimpse of our kitchen & dining hall</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              {home.gallery.slice(0, 6).map((g) => (
                <img
                  key={g.id}
                  src={g.image_url}
                  alt={g.alt_text || g.title}
                  loading="lazy"
                  className="aspect-square rounded-2xl object-cover transition hover:scale-[1.02]"
                />
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link to="/gallery">
                <Button variant="outline">Open Gallery</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Reservation CTA */}
      {layoutEnabled('reservation_cta') && isVisible('home_reservation_cta') && reserveOn && (
      <section className="container-rrr py-16">
        <div className="card overflow-hidden bg-royal-gradient p-8 text-white md:p-12">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Reserve Your Table</h2>
            <p className="mt-3 text-cream-200/90">
              Perfect for family dinners, celebrations, and weekend outings. Instant online
              booking with confirmation.
            </p>
            <Link to="/reservation" className="mt-6 inline-block">
              <Button variant="gold" size="lg">
                Book Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
      )}

      {/* Map */}
      {layoutEnabled('map') && (
      <section className="border-t border-charcoal-100 bg-white py-12 dark:border-charcoal-700 dark:bg-charcoal-800">
        <div className="container-rrr">
          <h2 className="section-title mb-6">Find Us</h2>
          <div className="overflow-hidden rounded-2xl border border-charcoal-100 dark:border-charcoal-700">
            <iframe
              title="Royal Rail Restro location map"
              src="https://maps.google.com/maps?q=Gewalbigha%20Gaya%20Bihar&t=&z=15&ie=UTF8&iwloc=&output=embed"
              className="h-72 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <p className="mt-4 text-sm text-charcoal-500">
            1st Floor, Dev Raj Tower, Gewalbigha, Gaya, Bihar, India
          </p>
        </div>
      </section>
      )}
    </>
  );
}
