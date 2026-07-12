import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '@/api/services';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/api/client';
import { Seo } from '@/seo/Seo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const schema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Need uppercase')
    .regex(/[0-9]/, 'Need a digit')
    .regex(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/, 'Need special character'),
});

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await authApi.signup(data);
      await login(data.email, data.password, true);
      navigate('/account');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <>
      <Seo title="Create Account" path="/signup" noindex />
      <div className="container-rrr flex min-h-[70vh] items-center justify-center py-12">
        <div className="card w-full max-w-md">
          <h1 className="font-display text-2xl font-bold">Join Royal Rail</h1>
          <p className="mt-1 text-sm text-charcoal-500">Track orders, reservations & rewards</p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <Input label="Full name" required {...register('full_name')} error={errors.full_name?.message} />
            <Input label="Email" type="email" required {...register('email')} error={errors.email?.message} />
            <Input label="Phone" {...register('phone')} error={errors.phone?.message} />
            <Input
              label="Password"
              type="password"
              required
              hint="Min 8 chars, uppercase, digit & special character"
              {...register('password')}
              error={errors.password?.message}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" loading={isSubmitting}>
              Create account
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-charcoal-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-royal-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
