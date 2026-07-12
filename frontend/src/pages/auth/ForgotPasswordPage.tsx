import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '@/api/services';
import { getErrorMessage } from '@/api/client';
import { Seo } from '@/seo/Seo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(email);
      setMsg('If an account exists, a reset link has been sent.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo title="Forgot Password" path="/forgot-password" noindex />
      <div className="container-rrr flex min-h-[60vh] items-center justify-center py-12">
        <form onSubmit={submit} className="card w-full max-w-md space-y-4">
          <h1 className="font-display text-2xl font-bold">Reset password</h1>
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          {msg && <p className="text-sm text-green-700">{msg}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" loading={loading}>
            Send reset link
          </Button>
          <Link to="/login" className="block text-center text-sm text-royal-700">
            Back to sign in
          </Link>
        </form>
      </div>
    </>
  );
}
