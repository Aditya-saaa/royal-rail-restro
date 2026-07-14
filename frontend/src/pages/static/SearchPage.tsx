import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '@/api/services';
import { Seo } from '@/seo/Seo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';

export function SearchPage() {
  const [q, setQ] = useState('');
  const [veg, setVeg] = useState('');
  const [suggestions, setSuggestions] = useState<
    { type: string; id: string; label: string; slug: string; price: number; is_veg: boolean }[]
  >([]);
  const [results, setResults] = useState<{
    menu_items: { id: string; name: string; slug: string; price: number; is_veg: boolean }[];
    categories: { id: string; name: string; slug: string }[];
    blog_posts: { id: string; title: string; slug: string }[];
    popular?: { id: string; name: string; slug: string; price: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Debounced typeahead
  useEffect(() => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const t = window.setTimeout(async () => {
      try {
        const data = await publicApi.search(q.trim());
        // request suggest via raw query param through search API when available
        const res = await fetch(
          `${(await import('@/api/client')).API_BASE}/search?q=${encodeURIComponent(q.trim())}&suggest=true`
        ).then((r) => r.json());
        setSuggestions(res.suggestions || []);
        void data;
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => window.clearTimeout(t);
  }, [q]);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (q.trim().length < 1) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: q.trim() });
      if (veg === '1') params.set('is_veg', 'true');
      if (veg === '0') params.set('is_veg', 'false');
      const { API_BASE } = await import('@/api/client');
      const data = await fetch(`${API_BASE}/search?${params}`).then((r) => r.json());
      setResults(data);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo title="Search" path="/search" noindex />
      <div className="container-rrr py-12">
        <h1 className="section-title mb-6">Search</h1>
        <form onSubmit={search} className="relative flex max-w-2xl flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search dishes, categories…"
              aria-label="Search"
              aria-autocomplete="list"
              autoComplete="off"
            />
            {suggestions.length > 0 && (
              <ul
                className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-charcoal-100 bg-white shadow-soft dark:border-charcoal-700 dark:bg-charcoal-800"
                role="listbox"
              >
                {suggestions.map((s) => (
                  <li key={s.id}>
                    <Link
                      to={`/menu/${s.slug}`}
                      className="flex justify-between px-4 py-2 text-sm hover:bg-charcoal-50 dark:hover:bg-charcoal-700"
                      role="option"
                    >
                      <span>
                        {s.is_veg ? '🟢' : '🔴'} {s.label}
                      </span>
                      <span className="text-royal-700">{formatCurrency(s.price)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <select
            className="input w-auto"
            value={veg}
            onChange={(e) => setVeg(e.target.value)}
            aria-label="Veg filter"
          >
            <option value="">All</option>
            <option value="1">Veg</option>
            <option value="0">Non-veg</option>
          </select>
          <Button type="submit" loading={loading}>
            Search
          </Button>
        </form>
        {results && (
          <div className="mt-8 space-y-8">
            <section>
              <h2 className="font-display text-xl font-semibold">Dishes</h2>
              <ul className="mt-3 space-y-2">
                {results.menu_items.map((i) => (
                  <li key={i.id}>
                    <Link
                      to={`/menu/${i.slug}`}
                      className="flex justify-between rounded-xl border border-charcoal-100 p-3 dark:border-charcoal-700"
                    >
                      <span>
                        {i.is_veg ? '🟢' : '🔴'} {i.name}
                      </span>
                      <span className="font-semibold text-royal-700">{formatCurrency(i.price)}</span>
                    </Link>
                  </li>
                ))}
                {!results.menu_items.length && (
                  <p className="text-sm text-charcoal-500">No dishes found.</p>
                )}
              </ul>
            </section>
            {!!results.popular?.length && !results.menu_items.length && (
              <section>
                <h2 className="font-display text-xl font-semibold">Popular</h2>
                <ul className="mt-3 space-y-2">
                  {results.popular.map((i) => (
                    <li key={i.id}>
                      <Link to={`/menu/${i.slug}`} className="text-royal-700">
                        {i.name} · {formatCurrency(i.price)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <section>
              <h2 className="font-display text-xl font-semibold">Categories</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {results.categories.map((c) => (
                  <Link
                    key={c.id}
                    to={`/menu?category=${c.slug}`}
                    className="rounded-full bg-royal-700/10 px-3 py-1 text-sm text-royal-700"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </>
  );
}
