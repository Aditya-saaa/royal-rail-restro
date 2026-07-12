import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiCalendar, FiStar, FiUsers, FiAward } from 'react-icons/fi';
import { publicApi } from '@/api/services';
import { Seo, restaurantJsonLd } from '@/seo/Seo';
import { MenuCard } from '@/components/menu/MenuCard';
import { Button } from '@/components/ui/Button';
import { SkeletonCard, PageLoader } from '@/components/ui/Spinner';
import { formatCurrency } from '@/lib/utils';

export default function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['home'],
    queryFn: publicApi.home,
  });

  if (isLoading || !data) {
    return (
      <>
        <Seo />
        <PageLoader />
      </>
    );
  }

  return (
    <>
      <Seo jsonLd={restaurantJsonLd} path="/" />

      {/* Hero */}
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
              Welcome to{' '}
              <span className="text-gold-400">Royal Rail Restro</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-cream-200/90">
              North Indian classics, sizzling tandoor, Indo-Chinese favourites and our legendary
              Rail Special Thali — crafted for families who love premium yet affordable dining.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/menu">
                <Button variant="gold" size="lg">
                  Order Online <FiArrowRight />
                </Button>
              </Link>
              <Link to="/reservation">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-royal-700"
                >
                  <FiCalendar /> Reserve Table
                </Button>
              </Link>
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
              <img
                src="https://placehold.co/720x480/1a1a1a/D4AF37?text=Royal+Rail+Dining"
                alt="Royal Rail Restro dining experience"
                className="h-auto w-full rounded-2xl object-cover"
                width={720}
                height={480}
              />
            </div>
            <div className="absolute -bottom-4 -left-4 rounded-2xl bg-gold-400 px-4 py-3 text-charcoal-900 shadow-gold">
              <p className="text-xs font-semibold uppercase tracking-wide">Guest Rating</p>
              <p className="font-display text-2xl font-bold">★ {data.stats.rating}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-charcoal-100 bg-white dark:border-charcoal-700 dark:bg-charcoal-800">
        <div className="container-rrr grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
          {[
            { icon: FiUsers, label: 'Happy Guests', value: data.stats.happy_customers },
            { icon: FiAward, label: 'Signature Dishes', value: data.stats.dishes },
            { icon: FiStar, label: 'Average Rating', value: data.stats.rating },
            { icon: FiCalendar, label: 'Years of Taste', value: data.stats.years },
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

      {/* Categories */}
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
          {data.categories.slice(0, 12).map((c) => (
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

      {/* Signature / Featured */}
      <section className="bg-cream-100 py-16 dark:bg-charcoal-950">
        <div className="container-rrr">
          <h2 className="section-title">Signature Dishes</h2>
          <p className="section-subtitle mb-8">Guest favourites prepared fresh every day</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {data.featured_dishes.length
              ? data.featured_dishes.map((item) => <MenuCard key={item.id} item={item} />)
              : Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </section>

      {/* Offers */}
      {data.offers.length > 0 && (
        <section className="container-rrr py-16">
          <h2 className="section-title">Today&apos;s Offers</h2>
          <p className="section-subtitle mb-8">Save more on your favourite meals</p>
          <div className="grid gap-6 md:grid-cols-3">
            {data.offers.map((o) => (
              <article
                key={o.id}
                className="card overflow-hidden bg-royal-gradient p-0 text-white"
              >
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
          {data.chef_specials.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {/* Rail specials CTA */}
      {data.rail_specials.length > 0 && (
        <section className="bg-charcoal-900 py-16 text-white">
          <div className="container-rrr grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-gold-400">
                Signature Experience
              </p>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                Rail Special Thali
              </h2>
              <p className="mt-4 text-charcoal-300">
                A multi-course journey inspired by classic railway dining — dal, sabzi, roti, rice,
                raita and dessert, plated with royal flair.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-cream-200">
                {data.rail_specials.map((t) => (
                  <li key={t.id} className="flex justify-between border-b border-white/10 py-2">
                    <span>{t.name}</span>
                    <span className="font-semibold text-gold-400">{formatCurrency(t.price)}</span>
                  </li>
                ))}
              </ul>
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

      {/* Testimonials */}
      {data.testimonials.length > 0 && (
        <section className="container-rrr py-16">
          <h2 className="section-title">What Guests Say</h2>
          <p className="section-subtitle mb-8">Real reviews from our dining family</p>
          <div className="grid gap-6 md:grid-cols-3">
            {data.testimonials.map((t) => (
              <blockquote key={t.id} className="card">
                <div className="mb-3 text-gold-400" aria-label={`${t.rating} out of 5 stars`}>
                  {'★'.repeat(t.rating)}
                  {'☆'.repeat(5 - t.rating)}
                </div>
                {t.title && (
                  <p className="mb-2 font-display text-lg font-semibold">{t.title}</p>
                )}
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
      {data.gallery.length > 0 && (
        <section className="bg-cream-100 py-16 dark:bg-charcoal-950">
          <div className="container-rrr">
            <h2 className="section-title">Moments at Royal Rail</h2>
            <p className="section-subtitle mb-8">A glimpse of our kitchen & dining hall</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              {data.gallery.slice(0, 6).map((g) => (
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
      <section className="container-rrr py-16">
        <div className="card overflow-hidden bg-royal-gradient p-8 text-white md:p-12">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Reserve Your Table
            </h2>
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

      {/* Map */}
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
    </>
  );
}
