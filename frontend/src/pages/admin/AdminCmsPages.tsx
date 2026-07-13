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
          <div>
            <Input
              label="Image URL"
              value={String(editing.image_url || '')}
              onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
            />
            <label className="mt-2 inline-flex cursor-pointer text-xs font-semibold text-royal-700">
              Or upload image…
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    const asset = await mediaApi.upload(f, 'menu', f.name);
                    setEditing({
                      ...editing,
                      image_url: asset.secure_url || asset.url,
                    });
                    setMsg('Image uploaded to media library');
                  } catch (err) {
                    setError(getErrorMessage(err));
                  }
                }}
              />
            </label>
          </div>
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

      {/* Categories full CRUD */}
      <CategoryManagerSection categories={categories || []} onChanged={() => qc.invalidateQueries({ queryKey: ['admin-cats'] })} />
    </>
  );
}

function CategoryManagerSection({
  categories,
  onChanged,
}: {
  categories: Category[];
  onChanged: () => void;
}) {
  const [form, setForm] = useState({
    id: '',
    name: '',
    description: '',
    icon: '🍽️',
    image_url: '',
    is_active: true,
    is_featured: false,
    sort_order: 0,
  });
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const save = async () => {
    setError('');
    try {
      if (form.id) {
        await menuApi.updateCategory(form.id, {
          name: form.name,
          description: form.description,
          icon: form.icon,
          image_url: form.image_url,
          is_active: form.is_active,
          is_featured: form.is_featured,
          sort_order: form.sort_order,
        });
      } else {
        await menuApi.createCategory({
          name: form.name,
          description: form.description,
          icon: form.icon,
          image_url: form.image_url,
          is_active: form.is_active,
          is_featured: form.is_featured,
          sort_order: form.sort_order,
        });
      }
      setForm({
        id: '',
        name: '',
        description: '',
        icon: '🍽️',
        image_url: '',
        is_active: true,
        is_featured: false,
        sort_order: 0,
      });
      setMsg('Category saved');
      onChanged();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <div className="card mt-8">
      <h2 className="mb-3 font-display text-lg font-semibold">Categories (full CRUD)</h2>
      {msg && <p className="mb-2 text-sm text-green-700">{msg}</p>}
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <div className="mb-4 grid gap-2 md:grid-cols-3">
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Icon" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
        <Input
          label="Image URL"
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
        />
        <Input
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <Input
          label="Sort"
          type="number"
          value={form.sort_order}
          onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
        />
        <div className="flex items-end gap-3 text-sm">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Active
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
            />
            Featured
          </label>
          <Button onClick={save}>{form.id ? 'Update' : 'Add'} category</Button>
          {form.id && (
            <Button
              variant="ghost"
              onClick={() =>
                setForm({
                  id: '',
                  name: '',
                  description: '',
                  icon: '🍽️',
                  image_url: '',
                  is_active: true,
                  is_featured: false,
                  sort_order: 0,
                })
              }
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-charcoal-100 p-3 text-sm dark:border-charcoal-600"
          >
            <p className="font-semibold">
              {c.icon} {c.name}
            </p>
            <p className="text-xs text-charcoal-400">{c.slug}</p>
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setForm({
                    id: c.id,
                    name: c.name,
                    description: c.description || '',
                    icon: c.icon || '🍽️',
                    image_url: c.image_url || '',
                    is_active: c.is_active,
                    is_featured: c.is_featured,
                    sort_order: c.sort_order,
                  })
                }
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600"
                onClick={async () => {
                  if (!confirm(`Delete category ${c.name}?`)) return;
                  try {
                    await menuApi.deleteCategory(c.id);
                    onChanged();
                  } catch (e) {
                    setError(getErrorMessage(e));
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
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
  const [msg, setMsg] = useState('');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['media', folder, search],
    queryFn: () => mediaApi.list({ folder, search: search || undefined, page: 1, page_size: 48 }),
    staleTime: 30_000,
  });

  const onUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError('');
    setMsg('');
    try {
      let ok = 0;
      for (const file of Array.from(files)) {
        await mediaApi.upload(file, folder, file.name);
        ok += 1;
      }
      setMsg(`Uploaded ${ok} file(s) to folder “${folder}”`);
      await refetch();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const items = data?.items ?? [];

  return (
    <>
      <Seo title="Media Library" noindex />
      <h1 className="mb-2 font-display text-2xl font-bold">Media Library</h1>
      <p className="mb-6 text-sm text-charcoal-500">
        Upload to Cloudinary (or placeholder fallback). Copy URLs into menu, hero, gallery, and blog.
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        <Input className="max-w-[180px]" value={folder} onChange={(e) => setFolder(e.target.value)} label="Folder" />
        <Input className="max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} label="Search" />
        <div className="flex items-end gap-2">
          <label className={`btn-primary cursor-pointer ${uploading ? 'opacity-60' : ''}`}>
            {uploading ? 'Uploading…' : 'Upload images'}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                void onUpload(e.target.files);
                e.target.value = '';
              }}
            />
          </label>
          <Button variant="outline" size="sm" onClick={() => refetch()} loading={isFetching}>
            Refresh
          </Button>
        </div>
      </div>
      {msg && <p className="mb-3 text-sm text-green-700">{msg}</p>}
      {error && <p className="mb-3 text-sm text-red-600" role="alert">{error}</p>}
      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((m) => {
            const url = m.secure_url || m.url;
            return (
              <figure key={m.id} className="card group relative overflow-hidden p-2">
                <img
                  src={m.thumbnail || url}
                  alt={m.alt_text || m.original_name}
                  className="aspect-square w-full rounded-lg object-cover"
                  loading="lazy"
                />
                <figcaption className="mt-1 truncate text-xs" title={m.original_name}>
                  {m.original_name}
                </figcaption>
                <div className="mt-1 flex flex-wrap gap-1">
                  <button
                    type="button"
                    className="text-xs font-semibold text-royal-700"
                    onClick={() => {
                      void navigator.clipboard.writeText(url);
                      setMsg('URL copied');
                    }}
                  >
                    Copy URL
                  </button>
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-600"
                    onClick={async () => {
                      if (!confirm('Delete this media asset?')) return;
                      try {
                        await mediaApi.remove(m.id);
                        setMsg('Deleted');
                        await refetch();
                      } catch (e) {
                        setError(getErrorMessage(e));
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </figure>
            );
          })}
          {!items.length && (
            <p className="col-span-full text-sm text-charcoal-500">No media yet. Upload to get started.</p>
          )}
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
          <label className="inline-flex cursor-pointer text-xs font-semibold text-royal-700">
            Upload hero image…
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setError('');
                try {
                  const asset = await mediaApi.upload(f, 'hero', f.name);
                  setForm((prev) => ({
                    ...prev,
                    hero_image: asset.secure_url || asset.url,
                  }));
                  setMsg('Hero image uploaded — click Save changes');
                } catch (err) {
                  setError(getErrorMessage(err));
                }
                e.target.value = '';
              }}
            />
          </label>
          {form.hero_image ? (
            <img
              src={form.hero_image}
              alt="Hero preview"
              className="mt-1 max-h-40 w-full rounded-xl object-cover"
            />
          ) : null}
          {field('hero_video', 'Hero video URL (optional)')}
          {field('logo_url', 'Logo URL (also under Brand)')}
          <label className="inline-flex cursor-pointer text-xs font-semibold text-royal-700">
            Upload logo…
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  const asset = await mediaApi.upload(f, 'brand', f.name);
                  setForm((prev) => ({
                    ...prev,
                    logo_url: asset.secure_url || asset.url,
                  }));
                  setMsg('Logo uploaded — click Save changes');
                } catch (err) {
                  setError(getErrorMessage(err));
                }
                e.target.value = '';
              }}
            />
          </label>
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
/*  Events / Offers / Blog / Gallery — full CRUD                       */
/* ------------------------------------------------------------------ */

export function AdminEventsManager() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-events'],
    queryFn: contentApi.eventsAdmin,
  });
  const empty = {
    id: '',
    title: '',
    event_date: '',
    description: '',
    start_time: '19:00',
    end_time: '22:00',
    location: 'Royal Rail Restro, Gaya',
    is_active: true,
    image_url: '',
  };
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const save = async () => {
    setError('');
    try {
      const payload = {
        title: form.title,
        event_date: form.event_date,
        description: form.description,
        start_time: form.start_time,
        end_time: form.end_time,
        location: form.location,
        is_active: form.is_active,
        image_url: form.image_url || undefined,
      };
      if (form.id) await contentApi.updateEvent(form.id, payload);
      else await contentApi.createEvent(payload as never);
      setForm(empty);
      setMsg(form.id ? 'Event updated' : 'Event created');
      refetch();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  if (isLoading) return <PageLoader />;
  return (
    <>
      <Seo title="Events CMS" noindex />
      <h1 className="mb-6 font-display text-2xl font-bold">Events</h1>
      {msg && <p className="mb-2 text-sm text-green-700">{msg}</p>}
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <div className="card mb-6 grid gap-3 md:grid-cols-2">
        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input
          label="Date"
          type="date"
          value={form.event_date}
          onChange={(e) => setForm({ ...form, event_date: e.target.value })}
        />
        <Input
          label="Start"
          value={form.start_time}
          onChange={(e) => setForm({ ...form, start_time: e.target.value })}
        />
        <Input label="End" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
        <Input
          label="Location"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />
        <Input
          label="Image URL"
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
        />
        <div className="md:col-span-2">
          <label className="label">Description</label>
          <textarea
            className="input"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          Active
        </label>
        <div className="flex gap-2">
          <Button onClick={save}>{form.id ? 'Update event' : 'Create event'}</Button>
          {form.id && (
            <Button variant="ghost" onClick={() => setForm(empty)}>
              Cancel
            </Button>
          )}
        </div>
      </div>
      <div className="space-y-2">
        {data?.map((e) => (
          <div key={e.id} className="card flex flex-wrap items-center justify-between gap-2 text-sm">
            <div>
              <p className="font-semibold">{e.title}</p>
              <p className="text-charcoal-500">
                {e.event_date} · {e.start_time} – {e.end_time} · {e.is_active ? 'Active' : 'Hidden'}
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setForm({
                    id: e.id,
                    title: e.title,
                    event_date: String(e.event_date).slice(0, 10),
                    description: e.description || '',
                    start_time: e.start_time || '19:00',
                    end_time: e.end_time || '22:00',
                    location: e.location || '',
                    is_active: true,
                    image_url: e.image_url || '',
                  })
                }
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600"
                onClick={async () => {
                  if (!confirm('Delete event?')) return;
                  await contentApi.deleteEvent(e.id);
                  refetch();
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
        {!data?.length && <p className="text-sm text-charcoal-500">No events yet.</p>}
      </div>
    </>
  );
}

export function AdminBlogManager() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-blog-full'],
    queryFn: () => contentApi.blogAdmin(),
  });
  const empty = { id: '', title: '', content: '', excerpt: '', status: 'published', cover_image: '' };
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const save = async () => {
    setError('');
    try {
      const payload = {
        title: form.title,
        content: form.content,
        excerpt: form.excerpt,
        status: form.status,
        cover_image: form.cover_image || undefined,
      };
      if (form.id) await contentApi.updateBlog(form.id, payload as never);
      else await contentApi.createBlog(payload as never);
      setForm(empty);
      setMsg('Post saved');
      refetch();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  if (isLoading) return <PageLoader />;
  return (
    <>
      <Seo title="Blog CMS" noindex />
      <h1 className="mb-6 font-display text-2xl font-bold">Blog CMS</h1>
      {msg && <p className="mb-2 text-sm text-green-700">{msg}</p>}
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <div className="card mb-6 space-y-3">
        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input
          label="Excerpt"
          value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
        />
        <Input
          label="Cover image URL"
          value={form.cover_image}
          onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
        />
        <label className="inline-flex cursor-pointer text-xs font-semibold text-royal-700">
          Upload cover…
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const asset = await mediaApi.upload(f, 'blog', f.name);
              setForm({ ...form, cover_image: asset.secure_url || asset.url });
            }}
          />
        </label>
        <div>
          <label className="label">Content (Markdown supported)</label>
          <textarea
            className="input min-h-[160px] font-mono text-sm"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
        </div>
        <select
          className="input max-w-xs"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        <div className="flex gap-2">
          <Button onClick={save}>{form.id ? 'Update post' : 'Create post'}</Button>
          {form.id && (
            <Button variant="ghost" onClick={() => setForm(empty)}>
              Cancel
            </Button>
          )}
        </div>
      </div>
      {data?.items.map((p) => (
        <div key={p.id} className="card mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
          <div>
            <p className="font-semibold">{p.title}</p>
            <p className="text-xs text-charcoal-400">
              {p.status} · {p.views} views
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                setForm({
                  id: p.id,
                  title: p.title,
                  content: p.content,
                  excerpt: p.excerpt || '',
                  status: p.status,
                  cover_image: p.cover_image || '',
                })
              }
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600"
              onClick={async () => {
                if (!confirm('Delete post?')) return;
                await contentApi.deleteBlog(p.id);
                refetch();
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
      {!data?.items.length && <p className="text-sm text-charcoal-500">No posts yet.</p>}
    </>
  );
}

export function AdminOffersManager() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-offers-full'],
    queryFn: contentApi.offersAdmin,
  });
  const empty = {
    id: '',
    title: '',
    discount_label: '',
    coupon_code: '',
    description: '',
    is_active: true,
    is_featured: true,
    image_url: '',
  };
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const save = async () => {
    setError('');
    try {
      const payload = {
        title: form.title,
        discount_label: form.discount_label,
        coupon_code: form.coupon_code,
        description: form.description,
        is_active: form.is_active,
        is_featured: form.is_featured,
        image_url: form.image_url || undefined,
      };
      if (form.id) await contentApi.updateOffer(form.id, payload as never);
      else await contentApi.createOffer(payload as never);
      setForm(empty);
      setMsg('Offer saved');
      refetch();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  if (isLoading) return <PageLoader />;
  return (
    <>
      <Seo title="Offers CMS" noindex />
      <h1 className="mb-6 font-display text-2xl font-bold">Offers</h1>
      {msg && <p className="mb-2 text-sm text-green-700">{msg}</p>}
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <div className="card mb-6 grid gap-3 md:grid-cols-2">
        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input
          label="Discount label"
          value={form.discount_label}
          onChange={(e) => setForm({ ...form, discount_label: e.target.value })}
        />
        <Input
          label="Coupon code"
          value={form.coupon_code}
          onChange={(e) => setForm({ ...form, coupon_code: e.target.value })}
        />
        <Input
          label="Image URL"
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
        />
        <Input
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Active
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
            />
            Featured
          </label>
        </div>
        <div className="flex gap-2">
          <Button onClick={save}>{form.id ? 'Update offer' : 'Create offer'}</Button>
          {form.id && (
            <Button variant="ghost" onClick={() => setForm(empty)}>
              Cancel
            </Button>
          )}
        </div>
      </div>
      {data?.map((o) => (
        <div key={o.id} className="card mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
          <div>
            <p className="font-semibold">{o.title}</p>
            <p className="text-charcoal-500">
              {o.coupon_code} · {o.is_active ? 'Active' : 'Off'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge bg-gold-400 text-charcoal-900">{o.discount_label}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                setForm({
                  id: o.id,
                  title: o.title,
                  discount_label: o.discount_label || '',
                  coupon_code: o.coupon_code || '',
                  description: o.description || '',
                  is_active: o.is_active,
                  is_featured: o.is_featured,
                  image_url: o.image_url || '',
                })
              }
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600"
              onClick={async () => {
                if (!confirm('Delete offer?')) return;
                await contentApi.deleteOffer(o.id);
                refetch();
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
      {!data?.length && <p className="text-sm text-charcoal-500">No offers yet.</p>}
    </>
  );
}

export function AdminGalleryManager() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-gallery-full'],
    queryFn: contentApi.galleryAdmin,
  });
  const empty = {
    id: '',
    title: '',
    image_url: '',
    alt_text: '',
    category: 'general',
    is_featured: true,
    is_active: true,
  };
  const [form, setForm] = useState(empty);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const save = async () => {
    setError('');
    if (!form.image_url) {
      setError('Image is required — upload or paste URL');
      return;
    }
    try {
      const payload = {
        title: form.title || 'Gallery image',
        image_url: form.image_url,
        alt_text: form.alt_text,
        category: form.category,
        is_featured: form.is_featured,
        is_active: form.is_active,
      };
      if (form.id) await contentApi.updateGallery(form.id, payload as never);
      else await contentApi.createGallery(payload as never);
      setForm(empty);
      setMsg('Gallery item saved');
      refetch();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const onUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError('');
    try {
      for (const file of Array.from(files)) {
        const asset = await mediaApi.upload(file, 'gallery', file.name);
        const imageUrl = asset.secure_url || asset.url;
        if (!imageUrl) throw new Error('Upload returned no URL');
        await contentApi.createGallery({
          title: file.name.replace(/\.[^.]+$/, ''),
          image_url: imageUrl,
          alt_text: file.name,
          is_featured: true,
          is_active: true,
          category: 'general',
        });
      }
      setMsg(`Uploaded ${files.length} image(s)`);
      refetch();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) return <PageLoader />;
  return (
    <>
      <Seo title="Gallery CMS" noindex />
      <h1 className="mb-2 font-display text-2xl font-bold">Gallery</h1>
      <p className="mb-4 text-sm text-charcoal-500">
        Upload to Cloudinary media library and attach to site gallery. Edit, feature, or delete any image.
      </p>
      {msg && <p className="mb-2 text-sm text-green-700">{msg}</p>}
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <div className="mb-4">
        <label className="btn-primary cursor-pointer">
          {uploading ? 'Uploading…' : 'Upload image(s) to gallery'}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onUpload(e.target.files)}
          />
        </label>
      </div>
      <div className="card mb-6 grid gap-3 md:grid-cols-3">
        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input
          label="Image URL"
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
        />
        <Input
          label="Alt text"
          value={form.alt_text}
          onChange={(e) => setForm({ ...form, alt_text: e.target.value })}
        />
        <Input
          label="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
        <div className="flex items-end gap-3 text-sm">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
            />
            Featured
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Active
          </label>
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={save}>{form.id ? 'Update' : 'Add'} entry</Button>
          {form.id && (
            <Button variant="ghost" onClick={() => setForm(empty)}>
              Cancel
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {data?.map((g) => (
          <div key={g.id} className="group relative overflow-hidden rounded-xl border border-charcoal-100 dark:border-charcoal-700">
            <img src={g.image_url} alt={g.alt_text} className="aspect-square object-cover" />
            <p className="p-2 text-xs font-medium">{g.title}</p>
            <div className="flex gap-1 p-2 pt-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setForm({
                    id: g.id,
                    title: g.title,
                    image_url: g.image_url,
                    alt_text: g.alt_text || '',
                    category: g.category || 'general',
                    is_featured: g.is_featured,
                    is_active: true,
                  })
                }
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600"
                onClick={async () => {
                  if (!confirm('Delete gallery image?')) return;
                  await contentApi.deleteGallery(g.id);
                  refetch();
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
      {!data?.length && <p className="text-sm text-charcoal-500">No gallery images yet.</p>}
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
