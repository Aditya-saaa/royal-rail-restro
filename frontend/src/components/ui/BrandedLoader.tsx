import { cn } from '@/lib/utils';

/** Instant branded shell — never a blank white screen while JS/API wake. */
export function BrandedBootScreen({ message = 'Preparing your Royal Rail experience…' }: { message?: string }) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-charcoal-900 via-royal-900 to-charcoal-900 text-cream-50"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage:
          'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(212,175,55,0.08) 40px, rgba(212,175,55,0.08) 42px)',
      }} />
      <div className="relative flex flex-col items-center px-6 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-royal-700 text-3xl shadow-royal">
          🚂
        </div>
        <p className="font-display text-2xl font-bold tracking-tight text-gold-400 sm:text-3xl">
          Royal Rail Restro
        </p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.25em] text-charcoal-300">
          Gaya · Bihar
        </p>

        {/* Animated train track */}
        <div className="relative mt-10 h-10 w-64 overflow-hidden sm:w-80">
          <div className="absolute bottom-2 left-0 right-0 h-0.5 bg-gold-400/40" />
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className="h-2 w-0.5 bg-gold-400/30" />
            ))}
          </div>
          <div className="animate-train absolute bottom-3 text-2xl" aria-hidden>
            🚂
          </div>
        </div>

        <p className="mt-8 max-w-sm text-sm text-cream-200/90">{message}</p>
        <div className="mt-4 h-1 w-48 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/3 animate-progress rounded-full bg-gold-400" />
        </div>
      </div>
      <style>{`
        @keyframes train {
          0% { transform: translateX(-2rem); }
          100% { transform: translateX(18rem); }
        }
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
        .animate-train { animation: train 2.2s ease-in-out infinite; }
        .animate-progress { animation: progress 1.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .animate-train, .animate-progress { animation: none; }
        }
      `}</style>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16" role="status">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-royal-700 text-xl text-gold-400 shadow-royal">
        🚂
      </div>
      <p className="text-sm text-charcoal-500 dark:text-charcoal-300">Loading…</p>
      <div className="h-1 w-32 overflow-hidden rounded-full bg-charcoal-100 dark:bg-charcoal-700">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-royal-700" />
      </div>
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-8 w-8 animate-spin rounded-full border-2 border-royal-700 border-t-transparent',
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card space-y-3 p-0 overflow-hidden" aria-hidden>
      <div className="skeleton h-40 w-full rounded-none" />
      <div className="space-y-2 p-4">
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-8 w-24" />
      </div>
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="animate-fade-in" aria-busy="true" aria-label="Loading homepage">
      {/* Hero skeleton */}
      <section className="bg-royal-gradient px-4 py-16 text-white sm:py-24">
        <div className="container-rrr grid gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="h-6 w-40 rounded-full bg-white/10" />
            <div className="h-12 w-full max-w-md rounded-xl bg-white/15" />
            <div className="h-12 w-3/4 rounded-xl bg-white/10" />
            <div className="h-4 w-full max-w-lg rounded bg-white/10" />
            <div className="h-4 w-2/3 rounded bg-white/10" />
            <div className="flex gap-3 pt-4">
              <div className="h-12 w-36 rounded-xl bg-gold-400/40" />
              <div className="h-12 w-36 rounded-xl bg-white/10" />
            </div>
          </div>
          <div className="h-64 rounded-3xl bg-white/10 sm:h-80" />
        </div>
      </section>
      <section className="container-rrr grid grid-cols-2 gap-4 py-10 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-16 w-full" />
        ))}
      </section>
      <section className="container-rrr py-10">
        <div className="skeleton mb-6 h-8 w-48" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-24 w-full rounded-2xl" />
          ))}
        </div>
      </section>
      <section className="bg-cream-100 py-10 dark:bg-charcoal-950">
        <div className="container-rrr">
          <div className="skeleton mb-6 h-8 w-56" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function AdminPageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in" aria-busy="true">
      <div className="skeleton h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-2xl" />
        ))}
      </div>
      <div className="skeleton h-72 w-full rounded-2xl" />
    </div>
  );
}

export function Toast({
  type = 'info',
  message,
  onClose,
}: {
  type?: 'success' | 'error' | 'info';
  message: string;
  onClose?: () => void;
}) {
  const colors = {
    success: 'border-green-500/40 bg-green-50 text-green-900 dark:bg-green-950/40 dark:text-green-100',
    error: 'border-red-500/40 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-100',
    info: 'border-gold-400/40 bg-cream-100 text-charcoal-800 dark:bg-charcoal-800 dark:text-cream-100',
  };
  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-[100] max-w-sm rounded-xl border px-4 py-3 text-sm shadow-soft',
        colors[type]
      )}
      role="status"
    >
      <div className="flex items-start gap-3">
        <p className="flex-1">{message}</p>
        {onClose && (
          <button type="button" className="opacity-60 hover:opacity-100" onClick={onClose} aria-label="Dismiss">
            ×
          </button>
        )}
      </div>
    </div>
  );
}
