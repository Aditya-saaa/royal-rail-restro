/**
 * Full Admin CMS pages for Royal Rail Restro v2
 * Menu CRUD + bulk, Media, Features, Restaurant CMS, Events, enhanced Reviews
 */
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  menuApi,
  mediaApi,
  featureApi,
  cmsApi,
  contentApi,
  adminApi,
} from '@/api/services';
import { Seo } from '@/seo/Seo';
import { PageLoader } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';
import { getErrorMessage } from '@/api/client';
import type { MenuItem, Category } from '@/types';

/* ------------------------------------------------------------------ */
/*  Menu Manager                                                       */
/* ------------------------------------------------------------------ */

const emptyItem = {
  name: '',
  category_id: '',
  price: 0,
  short_description: '',
  description: '',
  is_veg: true,
  spice_level: 0,
  is_available: true,
  is_featured: false,
  is_chef_special: false,
  is_rail_special: false,
  is_seasonal: false,
  image_url: '',
  allergens: '',
  tags: '',
  preparation_time_mins: 20,
  calories: undefined as number | undefined,
};

export function AdminMenuManager() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Partial<MenuItem> & Record<string, unknown> | null>(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['admin-cats'],
    queryFn: () => menuApi.categories({ active_only: false }),
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-menu-full', search],
    queryFn: () =>
      menuApi.items({
        page_size: 100,
        is_available: undefined,
        search: search || undefined,
        sort_by: 'sort_order',
      }),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const payload = { ...editing };
      if (!payload.category_id && categories?.[0]) {
        payload.category_id = categories[0].id;
      }
      if (payload.id) {
        return menuApi.updateItem(String(payload.id), payload);
      }
      return menuApi.createItem(payload);
    },
    onSuccess: () => {
      setMsg('Saved');
      setEditing(null);
      qc.invalidateQueries({ queryKey: ['admin-menu-full'] });
    },
    onError: (e) => setError(getErrorMessage(e)),
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (!data?.items) return;
    if (selected.size === data.items.length) setSelected(new Set());
    else setSelected(new Set(data.items.map((i) => i.id)));
  };

  const bulk = async (action: string) => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    setError('');
    try {
      if (action === 'delete') await menuApi.bulkDelete(ids);
      if (action === 'available') await menuApi.bulkAvailability(ids, true);
      if (action === 'unavailable') await menuApi.bulkAvailability(ids, false);
      if (action === 'featured') await menuApi.bulkFlags(ids, { is_featured: true });
      setSelected(new Set());
      setMsg(`Bulk ${action} done`);
      refetch();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <>
      <Seo title="Menu CMS" noindex />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Menu Manager</h1>
          <p className="text-sm text-charcoal-500">Full CRUD, bulk actions, duplicate & archive</p>
        </div>
        <Button
          onClick={() =>
            setEditing({
              ...emptyItem,
              category_id: categories?.[0]?.id || '',
            })
          }
        >
          + Add item
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          className="max-w-xs"
          placeholder="Search menu…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button variant="outline" size="sm" onClick={selectAll}>
          {selected.size ? 'Clear selection' : 'Select all'}
        </Button>
        {selected.size > 0 && (
          <>
            <Button variant="outline" size="sm" onClick={() => bulk('available')}>
              Set available ({selected.size})
            </Button>
            <Button variant="outline" size="sm" onClick={() => bulk('unavailable')}>
              Set unavailable
            </Button>
            <Button variant="outline" size="sm" onClick={() => bulk('featured')}>
              Mark featured
            </Button>
            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => bulk('delete')}>
              Delete
            </Button>
          </>
        )}
      </div>
      {msg && <p className="mb-2 text-sm text-green-700">{msg}</p>}
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      {editing && (
        <div className="card mb-6 grid gap-3 md:grid-cols-2">
          <h2 className="md:col-span-2 font-display text-lg font-semibold">
            {editing.id ? 'Edit item' : 'New item'}
          </h2>
          <Input
            label="Name"
            value={String(editing.name || '')}
            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
          />
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={String(editing.category_id || '')}
              onChange={(e) => setEditing({ ...editing, category_id: e.target.value })}
            >
              {categories?.map((c: Category) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Price (₹)"
            type="number"
            value={Number(editing.price || 0)}
            onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
          />
          <Input
            label="Image URL"
            value={String(editing.image_url || '')}
            onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
          />
          <div className="md:col-span-2">
            <label className="label">Short description</label>
            <textarea
              className="input min-h-[70px]"
              value={String(editing.short_description || '')}
              onChange={(e) => setEditing({ ...editing, short_description: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Full description</label>
            <textarea
              className="input min-h-[90px]"
              value={String(editing.description || '')}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            />
          </div>
          <Input
            label="Allergens"
            value={String(editing.allergens || '')}
            onChange={(e) => setEditing({ ...editing, allergens: e.target.value })}
          />
          <Input
            label="Tags (comma)"
            value={String(editing.tags || '')}
            onChange={(e) => setEditing({ ...editing, tags: e.target.value })}
          />
          <Input
            label="Spice 0–5"
            type="number"
            min={0}
            max={5}
            value={Number(editing.spice_level || 0)}
            onChange={(e) => setEditing({ ...editing, spice_level: Number(e.target.value) })}
          />
          <Input
            label="Prep mins"
            type="number"
            value={Number(editing.preparation_time_mins || 20)}
            onChange={(e) =>
              setEditing({ ...editing, preparation_time_mins: Number(e.target.value) })
            }
          />
          <div className="md:col-span-2 flex flex-wrap gap-4 text-sm">
            {(
              [
                ['is_veg', 'Veg'],
                ['is_available', 'Available'],
                ['is_featured', 'Featured'],
                ['is_chef_special', 'Chef special'],
                ['is_rail_special', 'Rail special'],
                ['is_seasonal', 'Seasonal'],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(editing[k])}
                  onChange={(e) => setEditing({ ...editing, [k]: e.target.checked })}
                />
                {label}
              </label>
            ))}
          </div>
          <div className="md:col-span-2 flex gap-2">
            <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              Save
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border bg-white dark:border-charcoal-700 dark:bg-charcoal-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-charcoal-50 text-xs uppercase dark:bg-charcoal-900">
            <tr>
              <th className="px-3 py-3"> </th>
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Price</th>
              <th className="px-3 py-3">Flags</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((item) => (
              <tr key={item.id} className="border-t dark:border-charcoal-700">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    aria-label={`Select ${item.name}`}
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {item.image_url && (
                      <img src={item.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    )}
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-charcoal-400">
                        {item.is_veg ? 'Veg' : 'Non-veg'} · spice {item.spice_level}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2">{formatCurrency(item.price)}</td>
                <td className="px-3 py-2 text-xs">
                  {[
                    item.is_available ? 'On' : 'Off',
                    item.is_featured && 'Featured',
                    item.is_chef_special && 'Chef',
                    item.is_rail_special && 'Rail',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setEditing({ ...item })}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await menuApi.duplicateItem(item.id);
                        refetch();
                      }}
                    >
                      Dup
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        if (item.is_available) await menuApi.archiveItem(item.id);
                        else await menuApi.restoreItem(item.id);
                        refetch();
                      }}
                    >
                      {item.is_available ? 'Archive' : 'Restore'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      onClick={async () => {
                        if (confirm('Delete permanently?')) {
                          await menuApi.deleteItem(item.id);
                          refetch();
                        }
                      }}
                    >
                      Del
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Categories mini CMS */}
      <div className="card mt-8">
        <h2 className="mb-3 font-display text-lg font-semibold">Categories</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {categories?.map((c) => (
            <div key={c.id} className="rounded-xl border border-charcoal-100 p-3 text-sm dark:border-charcoal-600">
              <p className="font-semibold">
                {c.icon} {c.name}
              </p>
              <p className="text-xs text-charcoal-400">{c.slug}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Media Library                                                      */
/* ------------------------------------------------------------------ */

export function AdminMediaLibrary() {
  const [folder, setFolder] = useState('royal-rail-restro');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['media', folder, search],
    queryFn: () => mediaApi.list({ folder, search: search || undefined, page: 1 }),
  });

  const onUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError('');
    try {
      for (const file of Array.from(files)) {
        await mediaApi.upload(file, folder, file.name);
      }
      refetch();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const items = (data as { items?: { id: string; url: string; original_name: string; alt_text?: string }[] })
    ?.items || [];

  return (
    <>
      <Seo title="Media Library" noindex />
      <h1 className="mb-2 font-display text-2xl font-bold">Media Library</h1>
      <p className="mb-6 text-sm text-charcoal-500">
        Cloudinary-backed uploads with folder tags, search, and responsive URLs.
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        <Input className="max-w-[180px]" value={folder} onChange={(e) => setFolder(e.target.value)} label="Folder" />
        <Input className="max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} label="Search" />
        <div className="flex items-end">
          <label className="btn-primary cursor-pointer">
            {uploading ? 'Uploading…' : 'Upload images'}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => onUpload(e.target.files)}
            />
          </label>
        </div>
      </div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((m) => (
            <figure key={m.id} className="card group relative overflow-hidden p-2">
              <img src={m.url} alt={m.alt_text || m.original_name} className="aspect-square w-full rounded-lg object-cover" />
              <figcaption className="mt-1 truncate text-xs">{m.original_name}</figcaption>
              <button
                type="button"
                className="absolute right-3 top-3 rounded bg-red-600 px-2 py-0.5 text-xs text-white opacity-0 group-hover:opacity-100"
                onClick={async () => {
                  await mediaApi.remove(m.id);
                  refetch();
                }}
              >
                Delete
              </button>
              <button
                type="button"
                className="mt-1 text-xs text-royal-700"
                onClick={() => {
                  navigator.clipboard.writeText(m.url);
                }}
              >
                Copy URL
              </button>
            </figure>
          ))}
          {!items.length && <p className="text-sm text-charcoal-500">No media yet. Upload to get started.</p>}
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Feature Manager                                                    */
/* ------------------------------------------------------------------ */

type FeatureRow = {
  key: string;
  enabled: boolean;
  visible: boolean;
  description: string;
  category: string;
  maintenance_message?: string | null;
};

export function AdminFeatureManager() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['features-admin'],
    queryFn: async () => {
      await featureApi.ensure();
      return featureApi.list() as Promise<FeatureRow[]>;
    },
  });
  const [filter, setFilter] = useState('all');
  const [msg, setMsg] = useState('');

  const grouped = useMemo(() => {
    const rows = data || [];
    const cats = Array.from(new Set(rows.map((r) => r.category)));
    return cats.map((c) => ({
      category: c,
      items: rows.filter((r) => r.category === c && (filter === 'all' || r.category === filter)),
    })).filter((g) => g.items.length);
  }, [data, filter]);

  const toggle = async (row: FeatureRow, field: 'enabled' | 'visible') => {
    await featureApi.update(row.key, { [field]: !row[field] });
    setMsg(`Updated ${row.key}`);
    refetch();
  };

  if (isLoading) return <PageLoader />;

  return (
    <>
      <Seo title="Feature Manager" noindex />
      <h1 className="mb-2 font-display text-2xl font-bold">Feature Manager</h1>
      <p className="mb-4 text-sm text-charcoal-500">
        Enable / disable customer features, homepage sections, and admin modules without code.
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        {['all', 'customer', 'homepage', 'admin'].map((c) => (
          <button
            key={c}
            type="button"
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
              filter === c ? 'bg-royal-700 text-white' : 'bg-charcoal-100 dark:bg-charcoal-700'
            }`}
            onClick={() => setFilter(c)}
          >
            {c}
          </button>
        ))}
      </div>
      {msg && <p className="mb-3 text-sm text-green-700">{msg}</p>}
      <div className="space-y-8">
        {grouped.map((g) => (
          <section key={g.category}>
            <h2 className="mb-3 font-display text-lg font-semibold capitalize text-royal-700 dark:text-gold-400">
              {g.category}
            </h2>
            <div className="space-y-2">
              {g.items.map((row) => (
                <div
                  key={row.key}
                  className="card flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-semibold">{row.key}</p>
                    <p className="text-xs text-charcoal-500">{row.description}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <label className="flex items-center gap-2">
                      <span>Enabled</span>
                      <button
                        type="button"
                        className={`rounded-full px-3 py-1 ${row.enabled ? 'bg-green-600 text-white' : 'bg-charcoal-300'}`}
                        onClick={() => toggle(row, 'enabled')}
                      >
                        {row.enabled ? 'ON' : 'OFF'}
                      </button>
                    </label>
                    <label className="flex items-center gap-2">
                      <span>Visible</span>
                      <button
                        type="button"
                        className={`rounded-full px-3 py-1 ${row.visible ? 'bg-royal-700 text-white' : 'bg-charcoal-300'}`}
                        onClick={() => toggle(row, 'visible')}
                      >
                        {row.visible ? 'SHOW' : 'HIDE'}
                      </button>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Restaurant CMS                                                     */
/* ------------------------------------------------------------------ */

export function AdminRestaurantCms() {
  const [form, setForm] = useState<Record<string, string>>({});
  const [theme, setTheme] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const { isLoading } = useQuery({
    queryKey: ['cms-profile'],
    queryFn: async () => {
      const [profile, th] = await Promise.all([cmsApi.profile(), cmsApi.theme()]);
      setForm(profile as Record<string, string>);
      setTheme(th as Record<string, string>);
      return profile;
    },
  });

  const save = async () => {
    setError('');
    try {
      await cmsApi.updateProfile({
        name: form.restaurant_name,
        tagline: form.restaurant_tagline,
        phone: form.restaurant_phone,
        email: form.restaurant_email,
        address: form.restaurant_address,
        logo_url: form.logo_url,
        hero_title: form.hero_title,
        hero_subtitle: form.hero_subtitle,
        hero_image: form.hero_image,
        hero_video: form.hero_video,
        about: form.about_html,
        facebook: form.social_facebook,
        instagram: form.social_instagram,
        whatsapp: form.social_whatsapp,
        opening_hours_json: form.opening_hours_json,
        footer_text: form.footer_text,
      });
      await cmsApi.updateTheme(theme);
      setMsg('Restaurant profile & theme saved');
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  if (isLoading) return <PageLoader />;

  const field = (key: string, label: string, multiline = false) => (
    <div key={key}>
      <label className="label" htmlFor={key}>
        {label}
      </label>
      {multiline ? (
        <textarea
          id={key}
          className="input min-h-[90px]"
          value={form[key] || ''}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
      ) : (
        <input
          id={key}
          className="input"
          value={form[key] || ''}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
      )}
    </div>
  );

  return (
    <>
      <Seo title="Restaurant CMS" noindex />
      <h1 className="mb-2 font-display text-2xl font-bold">Restaurant CMS</h1>
      <p className="mb-6 text-sm text-charcoal-500">
        Edit logo, hero, contact, socials, hours, and brand colors — no code required.
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card space-y-3">
          <h2 className="font-display text-lg font-semibold">Brand & contact</h2>
          {field('restaurant_name', 'Restaurant name')}
          {field('restaurant_tagline', 'Tagline')}
          {field('logo_url', 'Logo URL')}
          {field('restaurant_phone', 'Phone')}
          {field('restaurant_email', 'Email')}
          {field('restaurant_address', 'Address', true)}
          {field('social_instagram', 'Instagram URL')}
          {field('social_facebook', 'Facebook URL')}
          {field('social_whatsapp', 'WhatsApp number / link')}
        </div>
        <div className="card space-y-3">
          <h2 className="font-display text-lg font-semibold">Homepage hero</h2>
          {field('hero_title', 'Hero title')}
          {field('hero_subtitle', 'Hero subtitle')}
          {field('hero_image', 'Hero image URL')}
          {field('hero_video', 'Hero video URL (optional)')}
          {field('about_html', 'About / story text', true)}
          {field('opening_hours_json', 'Opening hours (JSON or text)', true)}
          {field('footer_text', 'Footer text')}
        </div>
        <div className="card space-y-3 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold">Theme colors</h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {['primary', 'gold', 'charcoal', 'cream'].map((k) => (
              <div key={k} className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme[k] || '#8B0000'}
                  onChange={(e) => setTheme({ ...theme, [k]: e.target.value })}
                  className="h-10 w-12 cursor-pointer rounded"
                />
                <Input
                  label={k}
                  value={theme[k] || ''}
                  onChange={(e) => setTheme({ ...theme, [k]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      {msg && <p className="mt-4 text-sm text-green-700">{msg}</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <Button className="mt-6" onClick={save}>
        Save changes
      </Button>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Enhanced Reviews Admin                                             */
/* ------------------------------------------------------------------ */

export function AdminReviewsManager() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-reviews-full'],
    queryFn: () => contentApi.reviewsAdmin({ page: 1, approved_only: false }),
  });
  const [reply, setReply] = useState<Record<string, string>>({});

  if (isLoading) return <PageLoader />;

  return (
    <>
      <Seo title="Reviews CMS" noindex />
      <h1 className="mb-6 font-display text-2xl font-bold">Reviews</h1>
      <div className="space-y-3">
        {data?.items.map((r) => (
          <div key={r.id} className="card text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-gold-500">{'★'.repeat(r.rating)}</p>
                <p className="font-semibold">{r.title || 'Untitled'}</p>
                <p>{r.comment}</p>
                <p className="text-charcoal-400">— {r.guest_name || 'Guest'}</p>
                <p className="text-xs">{r.is_approved ? 'Approved' : 'Pending'}</p>
                {r.admin_reply && (
                  <p className="mt-2 rounded bg-charcoal-50 p-2 text-xs dark:bg-charcoal-900">
                    Reply: {r.admin_reply}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                <Button size="sm" onClick={() => contentApi.approveReview(r.id, false).then(() => refetch())}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => contentApi.approveReview(r.id, true).then(() => refetch())}>
                  Feature
                </Button>
                <Button size="sm" variant="ghost" onClick={() => contentApi.rejectReview(r.id).then(() => refetch())}>
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600"
                  onClick={() => contentApi.deleteReview(r.id).then(() => refetch())}
                >
                  Delete
                </Button>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Input
                placeholder="Admin reply…"
                value={reply[r.id] || ''}
                onChange={(e) => setReply({ ...reply, [r.id]: e.target.value })}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  contentApi.replyReview(r.id, reply[r.id] || '').then(() => refetch())
                }
              >
                Reply
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Events / Offers / Blog simple create                               */
/* ------------------------------------------------------------------ */

export function AdminEventsManager() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-events'],
    queryFn: contentApi.events,
  });
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [desc, setDesc] = useState('');

  if (isLoading) return <PageLoader />;
  return (
    <>
      <Seo title="Events CMS" noindex />
      <h1 className="mb-6 font-display text-2xl font-bold">Events</h1>
      <div className="card mb-6 grid gap-3 md:grid-cols-2">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <div className="md:col-span-2">
          <label className="label">Description</label>
          <textarea className="input" value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <Button
          onClick={async () => {
            await contentApi.createEvent({
              title,
              event_date: date,
              description: desc,
            } as never);
            setTitle('');
            setDesc('');
            refetch();
          }}
        >
          Create event
        </Button>
      </div>
      <div className="space-y-2">
        {data?.map((e) => (
          <div key={e.id} className="card text-sm">
            <p className="font-semibold">{e.title}</p>
            <p className="text-charcoal-500">
              {e.event_date} · {e.start_time} – {e.end_time}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}

export function AdminBlogManager() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-blog-full'],
    queryFn: () => contentApi.blog(),
  });
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [status, setStatus] = useState('published');

  if (isLoading) return <PageLoader />;
  return (
    <>
      <Seo title="Blog CMS" noindex />
      <h1 className="mb-6 font-display text-2xl font-bold">Blog CMS</h1>
      <div className="card mb-6 space-y-3">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input label="Excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
        <div>
          <label className="label">Content (Markdown supported)</label>
          <textarea
            className="input min-h-[160px] font-mono text-sm"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <select className="input max-w-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        <Button
          onClick={async () => {
            await contentApi.createBlog({ title, content, excerpt, status } as never);
            setTitle('');
            setContent('');
            setExcerpt('');
            refetch();
          }}
        >
          Save post
        </Button>
      </div>
      {data?.items.map((p) => (
        <div key={p.id} className="card mb-2 text-sm">
          <p className="font-semibold">{p.title}</p>
          <p className="text-xs text-charcoal-400">
            {p.status} · {p.views} views
          </p>
        </div>
      ))}
    </>
  );
}

export function AdminOffersManager() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-offers-full'],
    queryFn: contentApi.offers,
  });
  const [title, setTitle] = useState('');
  const [label, setLabel] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  if (isLoading) return <PageLoader />;
  return (
    <>
      <Seo title="Offers CMS" noindex />
      <h1 className="mb-6 font-display text-2xl font-bold">Offers</h1>
      <div className="card mb-6 grid gap-3 md:grid-cols-2">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input label="Discount label" value={label} onChange={(e) => setLabel(e.target.value)} />
        <Input label="Coupon code" value={code} onChange={(e) => setCode(e.target.value)} />
        <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Button
          onClick={async () => {
            await contentApi.createOffer({
              title,
              discount_label: label,
              coupon_code: code,
              description,
              is_active: true,
              is_featured: true,
            } as never);
            setTitle('');
            setLabel('');
            setCode('');
            setDescription('');
            refetch();
          }}
        >
          Create offer
        </Button>
      </div>
      {data?.map((o) => (
        <div key={o.id} className="card mb-2 flex justify-between text-sm">
          <div>
            <p className="font-semibold">{o.title}</p>
            <p className="text-charcoal-500">{o.coupon_code}</p>
          </div>
          <span className="badge bg-gold-400 text-charcoal-900">{o.discount_label}</span>
        </div>
      ))}
    </>
  );
}

export function AdminGalleryManager() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-gallery-full'],
    queryFn: () => contentApi.gallery(),
  });
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');

  if (isLoading) return <PageLoader />;
  return (
    <>
      <Seo title="Gallery CMS" noindex />
      <h1 className="mb-6 font-display text-2xl font-bold">Gallery</h1>
      <div className="card mb-6 grid gap-3 md:grid-cols-3">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input label="Image URL" value={url} onChange={(e) => setUrl(e.target.value)} />
        <Input label="Alt text" value={alt} onChange={(e) => setAlt(e.target.value)} />
        <Button
          onClick={async () => {
            await contentApi.createGallery({
              title,
              image_url: url,
              alt_text: alt,
              is_featured: true,
              is_active: true,
            } as never);
            setTitle('');
            setUrl('');
            setAlt('');
            refetch();
          }}
        >
          Add image
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {data?.map((g) => (
          <div key={g.id} className="overflow-hidden rounded-xl">
            <img src={g.image_url} alt={g.alt_text} className="aspect-square object-cover" />
            <p className="mt-1 text-xs">{g.title}</p>
          </div>
        ))}
      </div>
    </>
  );
}

export function AdminSeedTools() {
  const [secret, setSecret] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const { data: stats, refetch } = useQuery({
    queryKey: ['db-stats'],
    queryFn: adminApi.dbStats,
  });

  return (
    <>
      <Seo title="Seed & Data" noindex />
      <h1 className="mb-4 font-display text-2xl font-bold">Data & Seed</h1>
      <div className="card mb-4 text-sm">
        <p>Categories: {(stats as { categories?: number })?.categories ?? '—'}</p>
        <p>Menu items: {(stats as { menu_items?: number })?.menu_items ?? '—'}</p>
        <p>Users: {(stats as { users?: number })?.users ?? '—'}</p>
        <p>Seeded: {String((stats as { seeded?: boolean })?.seeded)}</p>
      </div>
      <Input
        label="SEED_SECRET (optional if logged in as admin)"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
      />
      <Button
        className="mt-3"
        onClick={async () => {
          setError('');
          try {
            const res = await adminApi.seed(secret || undefined);
            setResult(JSON.stringify(res, null, 2));
            refetch();
          } catch (e) {
            setError(getErrorMessage(e));
          }
        }}
      >
        Run database seed
      </Button>
      {result && <pre className="mt-4 overflow-auto rounded-xl bg-charcoal-900 p-4 text-xs text-cream-100">{result}</pre>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </>
  );
}
