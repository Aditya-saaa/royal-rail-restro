import { Link } from 'react-router-dom';
import { Seo } from '@/seo/Seo';
import { Button } from '@/components/ui/Button';

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
