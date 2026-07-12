import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { reservationApi } from '@/api/services';
import { getErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { Seo } from '@/seo/Seo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

const schema = z.object({
  guest_name: z.string().min(2),
  guest_email: z.string().email(),
  guest_phone: z.string().min(10),
  reservation_date: z.string().min(1),
  reservation_time: z.string().min(1),
  guest_count: z.coerce.number().min(1).max(50),
  special_requests: z.string().optional(),
  occasion: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ReservationPage() {
  const user = useAuthStore((s) => s.user);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      guest_name: user?.full_name || '',
      guest_email: user?.email || '',
      guest_phone: user?.phone || '',
      guest_count: 2,
      reservation_date: new Date().toISOString().slice(0, 10),
      reservation_time: '',
    },
  });

  const date = watch('reservation_date');
  const selectedTime = watch('reservation_time');

  const { data: slots } = useQuery({
    queryKey: ['slots', date],
    queryFn: () => reservationApi.slots(date),
    enabled: !!date,
  });

  useEffect(() => {
    setValue('reservation_time', '');
  }, [date, setValue]);

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      reservationApi.create({
        ...data,
        reservation_time: data.reservation_time.length === 5
          ? `${data.reservation_time}:00`
          : data.reservation_time,
      }),
    onSuccess: (res) => {
      setSuccess(res.reservation_number);
      setError('');
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  return (
    <>
      <Seo
        title="Table Reservation"
        description="Book a table at Royal Rail Restro, Gewalbigha Gaya. Online reservations for family dining."
        path="/reservation"
      />
      <div className="container-rrr py-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="section-title">Reserve a Table</h1>
          <p className="section-subtitle mb-8">
            Select a date and time slot. Our team will confirm your booking.
          </p>

          {success ? (
            <div className="card border-green-200 bg-green-50 text-center dark:bg-green-950/30">
              <p className="text-lg font-semibold text-green-800 dark:text-green-300">
                Reservation requested!
              </p>
              <p className="mt-2 text-sm">
                Your reference number is{' '}
                <strong className="font-mono">{success}</strong>
              </p>
              <p className="mt-2 text-sm text-charcoal-500">
                Status: pending approval. You will receive confirmation shortly.
              </p>
              <Button className="mt-6" onClick={() => setSuccess(null)}>
                Book another
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="card space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Full name" required {...register('guest_name')} error={errors.guest_name?.message} />
                <Input label="Phone" required {...register('guest_phone')} error={errors.guest_phone?.message} />
                <Input label="Email" type="email" required {...register('guest_email')} error={errors.guest_email?.message} />
                <Input
                  label="Guests"
                  type="number"
                  min={1}
                  max={50}
                  required
                  {...register('guest_count')}
                  error={errors.guest_count?.message}
                />
                <Input
                  label="Date"
                  type="date"
                  required
                  min={new Date().toISOString().slice(0, 10)}
                  {...register('reservation_date')}
                  error={errors.reservation_date?.message}
                />
                <div>
                  <label className="label" htmlFor="occasion">
                    Occasion
                  </label>
                  <select id="occasion" className="input" {...register('occasion')}>
                    <option value="">None</option>
                    <option value="birthday">Birthday</option>
                    <option value="anniversary">Anniversary</option>
                    <option value="family">Family gathering</option>
                    <option value="business">Business</option>
                  </select>
                </div>
              </div>

              <div>
                <p className="label">Time slot *</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {slots?.map((s) => (
                    <button
                      key={s.time}
                      type="button"
                      disabled={!s.available}
                      onClick={() => setValue('reservation_time', s.time, { shouldValidate: true })}
                      className={cn(
                        'rounded-xl border px-2 py-2 text-sm font-medium transition',
                        selectedTime === s.time
                          ? 'border-royal-700 bg-royal-700 text-white'
                          : s.available
                            ? 'border-charcoal-200 hover:border-royal-700 dark:border-charcoal-600'
                            : 'cursor-not-allowed border-charcoal-100 bg-charcoal-50 text-charcoal-300 opacity-60'
                      )}
                      aria-pressed={selectedTime === s.time}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
                {errors.reservation_time && (
                  <p className="mt-1 text-xs text-red-600">{errors.reservation_time.message || 'Select a time'}</p>
                )}
                <input type="hidden" {...register('reservation_time')} />
              </div>

              <div>
                <label className="label" htmlFor="special_requests">
                  Special requests
                </label>
                <textarea id="special_requests" className="input min-h-[90px]" {...register('special_requests')} />
              </div>

              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <Button type="submit" size="lg" className="w-full" loading={mutation.isPending}>
                Request Reservation
              </Button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
