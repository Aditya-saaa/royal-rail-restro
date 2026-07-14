import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { contentApi, publicApi } from '@/api/services';
import { Seo } from '@/seo/Seo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getErrorMessage } from '@/api/client';
import { FeatureGate } from '@/components/common/FeatureGate';

export function ContactPage() {
  // contact_form feature gate applied in return
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
    <FeatureGate featureKey="contact_form" title="Contact form is currently unavailable">
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
    </FeatureGate>
  );
}
