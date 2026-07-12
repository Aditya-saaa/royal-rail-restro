import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';
import { Seo } from '@/seo/Seo';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { FiTrash2 } from 'react-icons/fi';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, subtotal, itemCount } = useCartStore();
  const total = subtotal();

  return (
    <>
      <Seo title="Cart" path="/cart" noindex />
      <div className="container-rrr py-10">
        <h1 className="section-title mb-8">Your Cart</h1>
        {!items.length ? (
          <div className="card py-16 text-center">
            <p className="text-charcoal-500">Your cart is empty.</p>
            <Link to="/menu" className="mt-4 inline-block">
              <Button>Browse Menu</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {items.map(({ menu_item, quantity }) => (
                <article key={menu_item.id} className="card flex gap-4">
                  <img
                    src={
                      menu_item.image_url ||
                      `https://placehold.co/120x120/8B0000/D4AF37?text=RRR`
                    }
                    alt=""
                    className="h-20 w-20 rounded-xl object-cover"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="font-semibold">{menu_item.name}</h2>
                        <p className="text-sm text-charcoal-500">
                          {formatCurrency(menu_item.price)} each
                        </p>
                      </div>
                      <button
                        type="button"
                        className="text-red-500"
                        aria-label={`Remove ${menu_item.name}`}
                        onClick={() => removeItem(menu_item.id)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center rounded-lg border border-charcoal-200 dark:border-charcoal-600">
                        <button
                          type="button"
                          className="px-3 py-1"
                          onClick={() => updateQuantity(menu_item.id, quantity - 1)}
                        >
                          −
                        </button>
                        <span className="px-2 font-medium">{quantity}</span>
                        <button
                          type="button"
                          className="px-3 py-1"
                          onClick={() => updateQuantity(menu_item.id, quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <p className="font-bold text-royal-700 dark:text-gold-400">
                        {formatCurrency(Number(menu_item.price) * quantity)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <aside className="card h-fit space-y-4">
              <h2 className="font-display text-xl font-semibold">Summary</h2>
              <div className="flex justify-between text-sm">
                <span>Items ({itemCount()})</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <p className="text-xs text-charcoal-400">
                GST, delivery & discounts calculated at checkout.
              </p>
              <Button className="w-full" size="lg" onClick={() => navigate('/checkout')}>
                Proceed to Checkout
              </Button>
              <Link to="/menu" className="block text-center text-sm text-royal-700">
                Continue shopping
              </Link>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
