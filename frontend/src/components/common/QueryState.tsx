import { getErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { PageLoader, SkeletonCard } from '@/components/ui/Spinner';

/** Shared loading / error / empty for public content pages — never infinite blank. */
export function QueryState({
  isLoading,
  isError,
  error,
  isEmpty,
  emptyTitle = 'Nothing here yet',
  emptyDescription = 'Check back soon or explore the menu.',
  onRetry,
  children,
  skeleton,
}: {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRetry?: () => void;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
}) {
  if (isLoading) {
    return (
      <>
        {skeleton || (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}
      </>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/30">
        <p className="font-semibold text-red-800 dark:text-red-200">Could not load this page</p>
        <p className="mt-2 text-sm text-red-700/80 dark:text-red-300/80">
          {getErrorMessage(error)}
        </p>
        {onRetry && (
          <Button className="mt-4" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="rounded-2xl border border-dashed border-charcoal-200 p-12 text-center dark:border-charcoal-600">
        <p className="font-display text-lg font-semibold text-charcoal-800 dark:text-cream-100">
          {emptyTitle}
        </p>
        <p className="mt-2 text-sm text-charcoal-500">{emptyDescription}</p>
      </div>
    );
  }

  return <>{children}</>;
}

export function InlineLoader() {
  return <PageLoader />;
}
