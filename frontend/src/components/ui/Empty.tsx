export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="card py-12 text-center">
      <p className="font-display text-lg font-semibold text-charcoal-800 dark:text-cream-100">{title}</p>
      {description && <p className="mt-2 text-sm text-charcoal-500">{description}</p>}
    </div>
  );
}
