import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { orderApi } from '@/api/services';
import { getErrorMessage } from '@/api/client';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { Seo } from '@/seo/Seo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';

const schema = z.object({
  guest_name: z.string().min(2, 'Name required'),
  guest_email: z.string().email('Valid email required'),
  guest_phone: z.string().min(10, 'Valid phone required'),
  delivery_address: z.string().optional(),
  special_instructions: z.string().optional(),
  payment_method: z.enum(['cod', 'upi', 'card']),
});

type FormData = z.infer<typeof schema>;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const {
    items,
    orderType,
    setOrderType,
    couponCode,
    setCouponCode,
    clear,
    subtotal,
  } = useCartStore();
  const [preview, setPreview] = useState<{
    subtotal: number;
    discount_amount: number;
    delivery_fee: number;
    gst_amount: number;
    packing_fee: number;
    total_amount: number;
  } | null>(null);
  const [couponMsg, setCouponMsg] = useState('');
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      guest_name: user?.full_name || '',
      guest_email: user?.email || '',
      guest_phone: user?.phone || '',
      payment_method: 'cod',
    },
  });

  const buildPayload = (data: FormData) => ({
    items: items.map((i) => ({
      menu_item_id: i.menu_item.id,
      quantity: i.quantity,
      special_notes: i.special_notes,
    })),
    order_type: orderType,
    payment_method: data.payment_method,
    coupon_code: couponCode || undefined,
    delivery_address: data.delivery_address,
    special_instructions: data.special_instructions,
    guest_name: data.guest_name,
    guest_email: data.guest_email,
    guest_phone: data.guest_phone,
  });

  const placeOrder = useMutation({
    mutationFn: (data: FormData) => orderApi.create(buildPayload(data)),
    onSuccess: (order) => {
      clear();
      navigate(`/order-success/${order.order_number}`);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const refreshPreview = async (data?: FormData) => {
    if (!items.length) return;
    try {
      const payload = buildPayload(
        data || {
          guest_name: user?.full_name || 'Guest',
          guest_email: user?.email || 'guest@example.com',
          guest_phone: '9999999999',
          payment_method: 'cod',
        }
      );
      const p = await orderApi.preview(payload);
      setPreview(p);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const applyCoupon = async () => {
    try {
      const res = await orderApi.validateCoupon(couponCode, subtotal(), orderType);
      setCouponMsg(res.message);
      await refreshPreview();
    } catch (err) {
      setCouponMsg(getErrorMessage(err));
    }
  };

  if (!items.length) {
    return (
      <div className="container-rrr py-20 text-center">
        <p>Your cart is empty.</p>
        <Button className="mt-4" onClick={() => navigate('/menu')}>
          Browse Menu
        </Button>
      </div>
    );
  }

  return (
    <>
      <Seo title="Checkout" path="/checkout" noindex />
      <div className="container-rrr py-10">
        <h1 className="section-title mb-8">Checkout</h1>
        <form
          onSubmit={handleSubmit((d) => placeOrder.mutate(d))}
          className="grid gap-8 lg:grid-cols-3"
        >
          <div className="space-y-6 lg:col-span-2">
            <fieldset className="card">
              <legend className="mb-4 font-display text-lg font-semibold">Order type</legend>
              <div className="flex flex-wrap gap-3">
                {(['delivery', 'pickup', 'dine_in'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize ${
                      orderType === t
                        ? 'bg-royal-700 text-white'
                        : 'bg-charcoal-100 dark:bg-charcoal-700'
                    }`}
                    onClick={() => {
                      setOrderType(t);
                      setTimeout(() => refreshPreview(), 0);
                    }}
                  >
                    {t.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="card space-y-4">
              <legend className="mb-2 font-display text-lg font-semibold">Contact</legend>
              <Input label="Full name" required {...register('guest_name')} error={errors.guest_name?.message} />
              <Input label="Email" type="email" required {...register('guest_email')} error={errors.guest_email?.message} />
              <Input label="Phone" required {...register('guest_phone')} error={errors.guest_phone?.message} />
              {orderType === 'delivery' && (
                <div>
                  <label className="label" htmlFor="delivery_address">
                    Delivery address *
                  </label>
                  <textarea
                    id="delivery_address"
                    className="input min-h-[90px]"
                    {...register('delivery_address')}
                  />
                </div>
              )}
              <div>
                <label className="label" htmlFor="special_instructions">
                  Special instructions
                </label>
                <textarea
                  id="special_instructions"
                  className="input min-h-[70px]"
                  {...register('special_instructions')}
                />
              </div>
            </fieldset>

            <fieldset className="card">
              <legend className="mb-4 font-display text-lg font-semibold">Payment</legend>
              <div className="space-y-2">
                {[
                  { v: 'cod', l: 'Cash on Delivery / Pay at restaurant' },
                  { v: 'upi', l: 'UPI (Payment ready architecture)' },
                  { v: 'card', l: 'Card (Payment ready architecture)' },
                ].map((p) => (
                  <label key={p.v} className="flex items-center gap-3 rounded-xl border border-charcoal-100 p-3 dark:border-charcoal-600">
                    <input type="radio" value={p.v} {...register('payment_method')} />
                    <span className="text-sm">{p.l}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <aside className="card h-fit space-y-4">
            <h2 className="font-display text-xl font-semibold">Order total</h2>
            <div className="flex gap-2">
              <Input
                placeholder="Coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              />
              <Button type="button" variant="outline" onClick={applyCoupon}>
                Apply
              </Button>
            </div>
            {couponMsg && <p className="text-xs text-charcoal-500">{couponMsg}</p>}
            <Button type="button" variant="ghost" className="w-full text-xs" onClick={() => refreshPreview()}>
              Calculate GST & fees
            </Button>
            {preview ? (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd>{formatCurrency(preview.subtotal)}</dd>
                </div>
                <div className="flex justify-between text-green-700">
                  <dt>Discount</dt>
                  <dd>-{formatCurrency(preview.discount_amount)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Packing</dt>
                  <dd>{formatCurrency(preview.packing_fee)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Delivery</dt>
                  <dd>{formatCurrency(preview.delivery_fee)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>GST</dt>
                  <dd>{formatCurrency(preview.gst_amount)}</dd>
                </div>
                <div className="flex justify-between border-t pt-2 text-base font-bold">
                  <dt>Total</dt>
                  <dd className="text-royal-700 dark:text-gold-400">
                    {formatCurrency(preview.total_amount)}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-charcoal-500">
                Est. subtotal: {formatCurrency(subtotal())}
              </p>
            )}
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" size="lg" loading={placeOrder.isPending}>
              Place Order
            </Button>
          </aside>
        </form>
      </div>
    </>
  );
}
