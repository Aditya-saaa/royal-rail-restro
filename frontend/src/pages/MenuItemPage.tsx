import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { menuApi } from '@/api/services';
import { Seo } from '@/seo/Seo';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';
import { useCartStore } from '@/store/cartStore';
import { formatCurrency, spiceLabel } from '@/lib/utils';
import { useState } from 'react';

export default function MenuItemPage() {
  const { slug = '' } = useParams();
  const addItem = useCartStore((s) => s.addItem);
  const [qty, setQty] = useState(1);

  const { data: item, isLoading, error } = useQuery({
    queryKey: ['menu-item', slug],
    queryFn: () => menuApi.item(slug),
    enabled: !!slug,
  });

  if (isLoading) return <PageLoader />;
  if (error || !item) {
    return (
      <div className="container-rrr py-20 text-center">
        <h1 className="section-title">Dish not found</h1>
        <Link to="/menu" className="mt-4 inline-block text-royal-700">
          Back to menu
        </Link>
      </div>
    );
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MenuItem',
    name: item.name,
    description: item.description || item.short_description,
    offers: {
      '@type': 'Offer',
      price: item.price,
      priceCurrency: 'INR',
      availability: item.is_available
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <>
      <Seo
        title={item.name}
        description={item.short_description || item.description || item.name}
        path={`/menu/${item.slug}`}
        image={item.image_url || undefined}
        jsonLd={jsonLd}
      />
      <div className="container-rrr py-10">
        <nav className="mb-6 text-sm text-charcoal-500" aria-label="Breadcrumb">
          <Link to="/">Home</Link> / <Link to="/menu">Menu</Link> /{' '}
          <span className="text-charcoal-800 dark:text-cream-100">{item.name}</span>
        </nav>
        <div className="grid gap-10 lg:grid-cols-2">
          <img
            src={
              item.image_url ||
              `https://placehold.co/800x600/8B0000/D4AF37?text=${encodeURIComponent(item.name)}`
            }
            alt={item.name}
            className="w-full rounded-3xl object-cover shadow-soft"
          />
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className={item.is_veg ? 'badge-veg' : 'badge-nonveg'}>
                {item.is_veg ? 'VEG' : 'NON-VEG'}
              </span>
              {item.is_chef_special && (
                <span className="badge bg-gold-400 text-charcoal-900">Chef Special</span>
              )}
              {item.is_rail_special && (
                <span className="badge bg-royal-700 text-white">Rail Special</span>
              )}
            </div>
            <h1 className="font-display text-3xl font-bold sm:text-4xl">{item.name}</h1>
            <p className="mt-2 text-2xl font-bold text-royal-700 dark:text-gold-400">
              {formatCurrency(item.price)}
            </p>
            <p className="mt-4 leading-relaxed text-charcoal-600 dark:text-charcoal-300">
              {item.description || item.short_description}
            </p>
            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-charcoal-400">Spice</dt>
                <dd className="font-medium">{spiceLabel(item.spice_level)}</dd>
              </div>
              <div>
                <dt className="text-charcoal-400">Prep time</dt>
                <dd className="font-medium">{item.preparation_time_mins} mins</dd>
              </div>
              {item.calories != null && (
                <div>
                  <dt className="text-charcoal-400">Calories</dt>
                  <dd className="font-medium">{item.calories} kcal</dd>
                </div>
              )}
              {item.recommended_pairing && (
                <div>
                  <dt className="text-charcoal-400">Pairs with</dt>
                  <dd className="font-medium">{item.recommended_pairing}</dd>
                </div>
              )}
            </dl>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="flex items-center rounded-xl border border-charcoal-200 dark:border-charcoal-600">
                <button
                  type="button"
                  className="px-4 py-2 text-lg"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="min-w-[2rem] text-center font-semibold" aria-live="polite">
                  {qty}
                </span>
                <button
                  type="button"
                  className="px-4 py-2 text-lg"
                  onClick={() => setQty((q) => q + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <Button
                size="lg"
                disabled={!item.is_available}
                onClick={() => addItem(item, qty)}
              >
                Add to cart · {formatCurrency(Number(item.price) * qty)}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
