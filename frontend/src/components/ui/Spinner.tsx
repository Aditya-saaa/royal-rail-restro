import { cn } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-8 w-8 animate-spin rounded-full border-3 border-royal-700 border-t-transparent',
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center" role="status">
      <Spinner className="h-10 w-10" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card space-y-3" aria-hidden>
      <div className="skeleton h-40 w-full" />
      <div className="skeleton h-4 w-2/3" />
      <div className="skeleton h-3 w-1/2" />
      <div className="skeleton h-8 w-24" />
    </div>
  );
}
