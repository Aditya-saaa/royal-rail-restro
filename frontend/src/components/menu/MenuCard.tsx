import { memo } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiStar } from 'react-icons/fi';
import type { MenuItem } from '@/types';
import { formatCurrency, spiceLabel } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { useFeatureStore } from '@/store/featureStore';
import { Button } from '@/components/ui/Button';

interface Props {
  item: MenuItem;
}

export const MenuCard = memo(function MenuCard({ item }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const orderingOn = useFeatureStore((s) => s.isEnabled('online_ordering'));

  return (
    <article className="card group flex flex-col overflow-hidden p-0 transition hover:-translate-y-1 hover:shadow-royal">
      <Link to={`/menu/${item.slug}`} className="relative block overflow-hidden">
        <img
          src={item.image_url || `https://placehold.co/600x400/8B0000/D4AF37?text=${encodeURIComponent(item.name)}`}
          alt={item.name}
          loading="lazy"
          className="h-44 w-full object-cover transition duration-500 group-hover:scale-105"
          width={600}
          height={400}
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className={item.is_veg ? 'badge-veg' : 'badge-nonveg'} aria-label={item.is_veg ? 'Vegetarian' : 'Non-vegetarian'}>
            {item.is_veg ? 'VEG' : 'NON-VEG'}
          </span>
          {item.is_chef_special && (
            <span className="badge bg-gold-400 text-charcoal-900">Chef</span>
          )}
          {item.is_rail_special && (
            <span className="badge bg-royal-700 text-white">Rail Special</span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <Link to={`/menu/${item.slug}`}>
            <h3 className="font-display text-lg font-semibold text-charcoal-900 dark:text-cream-50">
              {item.name}
            </h3>
          </Link>
          {Number(item.rating_avg) > 0 && (
            <span className="inline-flex items-center gap-0.5 text-xs text-gold-600">
              <FiStar className="fill-gold-400 text-gold-400" aria-hidden />
              {Number(item.rating_avg).toFixed(1)}
            </span>
          )}
        </div>
        <p className="mb-3 line-clamp-2 flex-1 text-sm text-charcoal-500 dark:text-charcoal-300">
          {item.short_description || item.description}
        </p>
        <div className="mb-3 flex items-center gap-2 text-xs text-charcoal-400">
          {item.spice_level > 0 && <span>🌶 {spiceLabel(item.spice_level)}</span>}
          {item.category && <span>· {item.category.name}</span>}
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-lg font-bold text-royal-700 dark:text-gold-400">
              {formatCurrency(item.price)}
            </span>
            {item.compare_at_price && Number(item.compare_at_price) > Number(item.price) && (
              <span className="ml-2 text-sm text-charcoal-400 line-through">
                {formatCurrency(item.compare_at_price)}
              </span>
            )}
          </div>
          {orderingOn ? (
            <Button
              size="sm"
              onClick={() => addItem(item)}
              aria-label={`Add ${item.name} to cart`}
              disabled={!item.is_available}
            >
              <FiPlus aria-hidden /> Add
            </Button>
          ) : (
            <Link to={`/menu/${item.slug}`} className="text-sm font-semibold text-royal-700">
              View
            </Link>
          )}
        </div>
      </div>
    </article>
  );
});
