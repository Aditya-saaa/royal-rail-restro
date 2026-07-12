import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/api/client';
import { Seo } from '@/seo/Seo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password required'),
  remember_me: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/account';
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { remember_me: true },
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await login(data.email, data.password, data.remember_me);
      const user = useAuthStore.getState().user;
      if (user && (user.is_superuser || user.roles.some((r) => r.name === 'admin'))) {
        navigate('/admin');
      } else {
        navigate(from);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <>
      <Seo title="Sign In" path="/login" noindex />
      <div className="container-rrr flex min-h-[70vh] items-center justify-center py-12">
        <div className="card w-full max-w-md">
          <h1 className="font-display text-2xl font-bold text-charcoal-900 dark:text-cream-50">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-charcoal-500">Sign in to Royal Rail Restro</p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <Input label="Email" type="email" autoComplete="email" required {...register('email')} error={errors.email?.message} />
            <Input label="Password" type="password" autoComplete="current-password" required {...register('password')} error={errors.password?.message} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('remember_me')} />
              Remember me
            </label>
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" loading={isSubmitting}>
              Sign in
            </Button>
          </form>
          <p className="mt-4 text-center text-sm">
            <Link to="/forgot-password" className="text-royal-700">
              Forgot password?
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-charcoal-500">
            New here?{' '}
            <Link to="/signup" className="font-semibold text-royal-700">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
