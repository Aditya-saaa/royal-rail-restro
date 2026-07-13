import { Link } from 'react-router-dom';
import { useFeatureStore } from '@/store/featureStore';
import { Button } from '@/components/ui/Button';

/** Blocks a page when feature is disabled — friendly message, not infinite load. */
export function FeatureGate({
  featureKey,
  children,
  title = 'This section is unavailable',
}: {
  featureKey: string;
  children: React.ReactNode;
  title?: string;
}) {
  const loaded = useFeatureStore((s) => s.loaded);
  const enabled = useFeatureStore((s) => s.isEnabled(featureKey));
  const visible = useFeatureStore((s) => s.isVisible(featureKey));
  const message = useFeatureStore((s) => s.message(featureKey));

  // While flags load, still render children (defaults are on) to avoid flash of "unavailable"
  if (loaded && (!enabled || !visible)) {
    return (
      <div className="container-rrr flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 text-4xl" aria-hidden>
          🚂
        </div>
        <h1 className="font-display text-2xl font-bold text-charcoal-900 dark:text-cream-50">
          {title}
        </h1>
        <p className="mt-3 max-w-md text-sm text-charcoal-500">
          {message || 'This service is currently unavailable. Please check back later.'}
        </p>
        <Link to="/" className="mt-6">
          <Button variant="outline">Back to home</Button>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
