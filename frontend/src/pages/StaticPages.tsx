import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { contentApi, menuApi, publicApi } from '@/api/services';
import { Seo } from '@/seo/Seo';
import { MenuCard } from '@/components/menu/MenuCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageLoader } from '@/components/ui/Spinner';
import { useState } from 'react';
import { getErrorMessage } from '@/api/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/authStore';
import { orderApi, reservationApi } from '@/api/services';

export function AboutPage() {
  return (
    <>
      <Seo title="About Us" path="/about" description="About Royal Rail Restro — premium family restaurant in Gewalbigha, Gaya, Bihar." />
      <div className="container-rrr py-12">
        <h1 className="section-title">About Royal Rail Restro</h1>
        <p className="section-subtitle mb-8">Premium yet affordable family dining in the heart of Gaya</p>
        <div className="prose prose-lg max-w-3xl dark:prose-invert">
          <p>
            Located on the 1st Floor of Dev Raj Tower, Gewalbigha, Royal Rail Restro brings the romance of
            classic railway dining into a modern family restaurant. Our kitchen serves North Indian
            favourites, Chinese classics, tandoor specials, pizzas, burgers, momos, biryanis, and our
            signature Rail Special Thali.
          </p>
          <p>
            We believe great food should feel first-class without the first-class price. Whether you are
            celebrating a birthday, hosting relatives, or craving a weekday thali — you are always welcome aboard.
          </p>
        </div>
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

export function RailThaliPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['rail-specials'],
    queryFn: menuApi.railSpecials,
  });
  return (
    <>
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
        {isLoading ? (
          <PageLoader />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data?.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function ChefSpecialsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['chef-specials'],
    queryFn: menuApi.chefSpecials,
  });
  return (
    <>
      <Seo title="Chef Specials" path="/chef-specials" />
      <div className="container-rrr py-12">
        <h1 className="section-title">Chef Specials</h1>
        <p className="section-subtitle mb-8">Signature creations from our kitchen</p>
        {isLoading ? <PageLoader /> : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data?.map((item) => <MenuCard key={item.id} item={item} />)}
          </div>
        )}
      </div>
    </>
  );
}

export function GalleryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['gallery'],
    queryFn: () => contentApi.gallery(),
  });
  return (
    <>
      <Seo title="Gallery" path="/gallery" />
      <div className="container-rrr py-12">
        <h1 className="section-title">Gallery</h1>
        <p className="section-subtitle mb-8">Food, interiors & celebrations</p>
        {isLoading ? <PageLoader /> : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {data?.map((g) => (
              <figure key={g.id} className="group overflow-hidden rounded-2xl">
                <img src={g.image_url} alt={g.alt_text || g.title} loading="lazy" className="aspect-square w-full object-cover transition group-hover:scale-105" />
                <figcaption className="sr-only">{g.title}</figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function ReviewsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => contentApi.reviews({ page: 1 }),
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
        {isLoading ? <PageLoader /> : (
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
        )}
      </div>
    </>
  );
}

export function OffersPage() {
  const { data, isLoading } = useQuery({ queryKey: ['offers'], queryFn: contentApi.offers });
  return (
    <>
      <Seo title="Offers" path="/offers" />
      <div className="container-rrr py-12">
        <h1 className="section-title">Offers & Coupons</h1>
        {isLoading ? <PageLoader /> : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data?.map((o) => (
              <article key={o.id} className="card">
                <span className="badge bg-gold-400 text-charcoal-900">{o.discount_label}</span>
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
        )}
      </div>
    </>
  );
}

export function EventsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['events'], queryFn: contentApi.events });
  return (
    <>
      <Seo title="Events" path="/events" />
      <div className="container-rrr py-12">
        <h1 className="section-title">Upcoming Events</h1>
        {isLoading ? <PageLoader /> : (
          <div className="mt-8 space-y-4">
            {data?.map((e) => (
              <article key={e.id} className="card flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-xl font-semibold">{e.title}</h2>
                  <p className="text-sm text-charcoal-500">{e.description}</p>
                  <p className="mt-1 text-sm text-royal-700">{formatDate(e.event_date)} · {e.start_time} – {e.end_time}</p>
                </div>
                <p className="text-sm text-charcoal-400">{e.location}</p>
              </article>
            ))}
            {!data?.length && <p className="text-charcoal-500">No upcoming events. Check back soon.</p>}
          </div>
        )}
      </div>
    </>
  );
}

export function BlogPage() {
  const { data, isLoading } = useQuery({ queryKey: ['blog'], queryFn: () => contentApi.blog() });
  return (
    <>
      <Seo title="Blog" path="/blog" />
      <div className="container-rrr py-12">
        <h1 className="section-title">Blog</h1>
        {isLoading ? <PageLoader /> : (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {data?.items.map((p) => (
              <Link key={p.id} to={`/blog/${p.slug}`} className="card transition hover:shadow-royal">
                {p.cover_image && <img src={p.cover_image} alt="" className="mb-4 h-40 w-full rounded-xl object-cover" />}
                <h2 className="font-display text-xl font-semibold">{p.title}</h2>
                <p className="mt-2 text-sm text-charcoal-500">{p.excerpt}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function BlogPostPage() {
  const { slug = '' } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['blog', slug],
    queryFn: () => contentApi.blogPost(slug),
    enabled: !!slug,
  });
  if (isLoading) return <PageLoader />;
  if (!data) return <div className="container-rrr py-20">Post not found</div>;
  return (
    <>
      <Seo title={data.title} description={data.excerpt || undefined} path={`/blog/${data.slug}`} />
      <article className="container-rrr max-w-3xl py-12">
        <h1 className="font-display text-4xl font-bold">{data.title}</h1>
        {data.published_at && <p className="mt-2 text-sm text-charcoal-400">{formatDate(data.published_at)}</p>}
        <div className="prose mt-8 max-w-none whitespace-pre-wrap dark:prose-invert">{data.content}</div>
      </article>
    </>
  );
}

export function FaqsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['faqs'], queryFn: () => contentApi.faqs() });
  const jsonLd = data
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: data.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      }
    : undefined;
  return (
    <>
      <Seo title="FAQs" path="/faqs" jsonLd={jsonLd} />
      <div className="container-rrr max-w-3xl py-12">
        <h1 className="section-title">Frequently Asked Questions</h1>
        {isLoading ? <PageLoader /> : (
          <div className="mt-8 space-y-3">
            {data?.map((f) => (
              <details key={f.id} className="card group">
                <summary className="cursor-pointer list-none font-semibold marker:content-none">
                  {f.question}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-charcoal-600 dark:text-charcoal-300">{f.answer}</p>
              </details>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function ContactPage() {
  const { register, handleSubmit, reset } = useForm();
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { data: info } = useQuery({ queryKey: ['restaurant'], queryFn: publicApi.restaurant });

  const onSubmit = async (data: Record<string, string>) => {
    setLoading(true);
    setError('');
    try {
      await contentApi.contact(data);
      setMsg('Message sent! We will get back to you soon.');
      reset();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo title="Contact" path="/contact" />
      <div className="container-rrr py-12">
        <h1 className="section-title">Contact Us</h1>
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
            <Input label="Name" required {...register('name', { required: true })} />
            <Input label="Email" type="email" required {...register('email', { required: true })} />
            <Input label="Phone" {...register('phone')} />
            <Input label="Subject" required {...register('subject', { required: true })} />
            <div>
              <label className="label">Message</label>
              <textarea className="input min-h-[120px]" required {...register('body', { required: true })} />
            </div>
            {msg && <p className="text-sm text-green-700">{msg}</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" loading={loading}>Send Message</Button>
          </form>
          <div className="space-y-4">
            <div className="card">
              <h2 className="font-display text-xl font-semibold">Visit us</h2>
              <p className="mt-2 text-sm text-charcoal-600 dark:text-charcoal-300">{info?.address}</p>
              <p className="mt-2 text-sm">{info?.phone}</p>
              <p className="text-sm">{info?.email}</p>
            </div>
            <iframe
              title="Map"
              className="h-64 w-full rounded-2xl border-0"
              src="https://maps.google.com/maps?q=Gewalbigha%20Gaya&t=&z=15&ie=UTF8&iwloc=&output=embed"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </>
  );
}

function PolicyLayout({ title, path, children }: { title: string; path: string; children: ReactNode }) {
  return (
    <>
      <Seo title={title} path={path} />
      <div className="container-rrr max-w-3xl py-12">
        <h1 className="section-title">{title}</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-charcoal-600 dark:text-charcoal-300">{children}</div>
      </div>
    </>
  );
}

export function PrivacyPage() {
  return (
    <PolicyLayout title="Privacy Policy" path="/privacy">
      <p>Royal Rail Restro (&quot;we&quot;) respects your privacy. We collect account details, order history, reservation data, and contact form submissions solely to operate our restaurant services.</p>
      <p>We do not sell personal data. Payment architecture is designed for secure processors; card data is not stored on our servers. Cookies are used for authentication and preferences.</p>
      <p>Contact info@royalrailrestro.com for data requests. Address: 1st Floor, Dev Raj Tower, Gewalbigha, Gaya, Bihar, India.</p>
    </PolicyLayout>
  );
}

export function TermsPage() {
  return (
    <PolicyLayout title="Terms of Service" path="/terms">
      <p>By using Royal Rail Restro digital services you agree to accurate information for orders and reservations, compliance with house policies, and payment of applicable charges including GST.</p>
      <p>Menu availability and prices may change. We may refuse service for abuse, fraud, or safety concerns. Indian law governs these terms; disputes subject to Gaya jurisdiction.</p>
    </PolicyLayout>
  );
}

export function RefundPage() {
  return (
    <PolicyLayout title="Refund Policy" path="/refund">
      <p>Orders may be cancelled before kitchen preparation begins for a full refund. Once food preparation starts, cancellations may not be eligible.</p>
      <p>Quality issues: contact us within 2 hours of delivery with order number and photos. Approved refunds are processed to the original payment method within 5–7 business days or as store credit/loyalty points.</p>
      <p>Reservations can be cancelled free of charge up to 2 hours before the slot.</p>
    </PolicyLayout>
  );
}

export function SearchPage() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<{
    menu_items: { id: string; name: string; slug: string; price: number; is_veg: boolean }[];
    categories: { id: string; name: string; slug: string }[];
    blog_posts: { id: string; title: string; slug: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim().length < 2) return;
    setLoading(true);
    try {
      const data = await publicApi.search(q.trim());
      setResults(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo title="Search" path="/search" noindex />
      <div className="container-rrr py-12">
        <h1 className="section-title mb-6">Search</h1>
        <form onSubmit={search} className="flex max-w-xl gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dishes, categories…" aria-label="Search" />
          <Button type="submit" loading={loading}>Search</Button>
        </form>
        {results && (
          <div className="mt-8 space-y-8">
            <section>
              <h2 className="font-display text-xl font-semibold">Dishes</h2>
              <ul className="mt-3 space-y-2">
                {results.menu_items.map((i) => (
                  <li key={i.id}>
                    <Link to={`/menu/${i.slug}`} className="flex justify-between rounded-xl border border-charcoal-100 p-3 dark:border-charcoal-700">
                      <span>{i.name}</span>
                      <span className="font-semibold text-royal-700">{formatCurrency(i.price)}</span>
                    </Link>
                  </li>
                ))}
                {!results.menu_items.length && <p className="text-sm text-charcoal-500">No dishes found.</p>}
              </ul>
            </section>
            <section>
              <h2 className="font-display text-xl font-semibold">Categories</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {results.categories.map((c) => (
                  <Link key={c.id} to={`/menu?category=${c.slug}`} className="rounded-full bg-royal-700/10 px-3 py-1 text-sm text-royal-700">
                    {c.name}
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </>
  );
}

export function NotFoundPage() {
  return (
    <>
      <Seo title="Page Not Found" noindex />
      <div className="container-rrr py-24 text-center">
        <p className="font-display text-6xl font-bold text-royal-700">404</p>
        <h1 className="mt-4 text-2xl font-semibold">This track has no station</h1>
        <p className="mt-2 text-charcoal-500">The page you requested does not exist.</p>
        <Link to="/" className="mt-6 inline-block">
          <Button>Back to Home</Button>
        </Link>
      </div>
    </>
  );
}

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

export function AccountPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { data: orders } = useQuery({ queryKey: ['my-orders'], queryFn: () => orderApi.mine() });
  const { data: reservations } = useQuery({ queryKey: ['my-reservations'], queryFn: () => reservationApi.mine() });

  return (
    <>
      <Seo title="My Account" path="/account" noindex />
      <div className="container-rrr py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="section-title">Hello, {user?.full_name}</h1>
            <p className="text-sm text-charcoal-500">{user?.email}</p>
          </div>
          <Button variant="outline" onClick={() => logout()}>Logout</Button>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <section className="card">
            <h2 className="font-display text-xl font-semibold">Past orders</h2>
            <ul className="mt-4 space-y-3">
              {orders?.items.map((o) => (
                <li key={o.id} className="flex items-center justify-between border-b border-charcoal-100 py-2 text-sm dark:border-charcoal-700">
                  <div>
                    <p className="font-mono">{o.order_number}</p>
                    <p className="text-charcoal-400 capitalize">{o.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(o.total_amount)}</p>
                    <Link to={`/track/${o.order_number}`} className="text-royal-700">Track</Link>
                  </div>
                </li>
              ))}
              {!orders?.items.length && <p className="text-sm text-charcoal-500">No orders yet.</p>}
            </ul>
          </section>
          <section className="card">
            <h2 className="font-display text-xl font-semibold">Reservations</h2>
            <ul className="mt-4 space-y-3">
              {reservations?.items.map((r) => (
                <li key={r.id} className="border-b border-charcoal-100 py-2 text-sm dark:border-charcoal-700">
                  <p className="font-mono">{r.reservation_number}</p>
                  <p>{formatDate(r.reservation_date)} · {r.guest_count} guests · <span className="capitalize">{r.status}</span></p>
                </li>
              ))}
              {!reservations?.items.length && <p className="text-sm text-charcoal-500">No reservations yet.</p>}
            </ul>
            <Link to="/reservation" className="mt-4 inline-block text-sm font-semibold text-royal-700">Book a table →</Link>
          </section>
        </div>
      </div>
    </>
  );
}
