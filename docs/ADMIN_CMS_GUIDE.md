# Admin CMS — Where everything lives (do not re-search only AdminPages.tsx)

## Critical: two admin page files

| File | Role |
|------|------|
| `frontend/src/pages/admin/AdminPages.tsx` | **Legacy / dashboard / developer** (older list UIs) |
| `frontend/src/pages/admin/AdminCmsPages.tsx` | **Full CMS** (forms, upload, features) — **1,062 lines** |
| `frontend/src/pages/admin/AdminOpsPages.tsx` | **Kitchen, calendar, homepage builder, analytics** — **570 lines** |

If you only open `AdminPages.tsx` you will still see the old note about “forms via API”. That component is **deprecated** and no longer routed for Menu.

Routes are defined in `frontend/src/App.tsx` and the sidebar in `frontend/src/components/layout/AdminLayout.tsx`.

---

## Exact admin routes (after latest deploy)

| URL | Component | File |
|-----|-----------|------|
| `/admin` | AdminDashboard | AdminPages.tsx |
| `/admin/kitchen` | AdminKitchen | AdminOpsPages.tsx |
| `/admin/orders` | AdminOrdersPro | AdminOpsPages.tsx |
| `/admin/calendar` | AdminReservationCalendar | AdminOpsPages.tsx |
| `/admin/reservations` | AdminReservations | AdminPages.tsx |
| `/admin/menu` | **AdminMenuManager** | **AdminCmsPages.tsx** |
| `/admin/media` | **AdminMediaLibrary** | **AdminCmsPages.tsx** |
| `/admin/gallery` | AdminGalleryManager | AdminCmsPages.tsx |
| `/admin/reviews` | AdminReviewsManager | AdminCmsPages.tsx |
| `/admin/blogs` | AdminBlogManager | AdminCmsPages.tsx |
| `/admin/offers` | AdminOffersManager | AdminCmsPages.tsx |
| `/admin/events` | AdminEventsManager | AdminCmsPages.tsx |
| `/admin/users` | AdminUsers | AdminPages.tsx |
| `/admin/features` | **AdminFeatureManager** | **AdminCmsPages.tsx** |
| `/admin/cms` | AdminRestaurantCms | AdminCmsPages.tsx |
| `/admin/homepage` | **AdminHomepageBuilder** | **AdminOpsPages.tsx** |
| `/admin/analytics` | AdminAnalyticsPro | AdminOpsPages.tsx |
| `/admin/settings` | AdminSettings | AdminPages.tsx |
| `/admin/seed` | AdminSeedTools | AdminCmsPages.tsx |

---

## What “Full CRUD Menu” includes (AdminMenuManager)

- **+ Add item** form (name, category, price, image URL, descriptions, allergens, tags, spice, prep, flags)
- **Edit** inline form for any row
- **Duplicate / Archive / Restore / Delete**
- **Bulk**: select all → available / unavailable / featured / delete
- Category list at bottom of same page

Search for: `export function AdminMenuManager` in `AdminCmsPages.tsx`.

---

## What Media Manager includes (AdminMediaLibrary)

- `type="file"` multi upload
- Folder field
- Search
- Delete + Copy URL
- Backend: `POST /api/v1/media/upload` → Cloudinary when env set, else placeholder URL

Search for: `export function AdminMediaLibrary` and `type="file"`.

---

## Feature Manager vs Developer Feature Flags

| | Admin Features | Developer Flags |
|--|----------------|-----------------|
| Route | `/admin/features` | `/developer/flags` |
| Component | AdminFeatureManager | DeveloperFlags |
| Scope | Customer + homepage + admin modules; **enabled + visible** | Older simple ON/OFF list |
| Public API | `GET /api/v1/features/public` | `GET /admin/feature-flags` |

Use **Admin → Features** for owner module control (ordering off hides cart).

---

## Homepage Builder

Route: `/admin/homepage`  
API: `GET/PUT /api/v1/cms/homepage-layout`  
Reorder (↑↓) + enable/disable sections.  
Also pair with Feature Manager homepage_* flags for site-wide hide.

Restaurant CMS (hero title, logo, colors): `/admin/cms`.

---

## Backend modules (already registered)

```
/api/v1/menu/*           public + item CRUD
/api/v1/menu/admin/*     bulk, duplicate, archive
/api/v1/media/*          upload library
/api/v1/features/*       module manager
/api/v1/cms/*            restaurant + homepage layout
/api/v1/ops/*            kitchen, calendar, invoice, export, backup
```

---

## If production still looks “empty CMS”

1. Confirm GitHub has files:
   - `frontend/src/pages/admin/AdminCmsPages.tsx`
   - `frontend/src/pages/admin/AdminOpsPages.tsx`
2. Redeploy **frontend** on Vercel (not only backend).
3. Hard refresh / clear CDN cache.
4. Login as admin → open sidebar items **Menu CMS**, **Media**, **Features**, **Home Builder**.
5. Do **not** judge by searching only `AdminPages.tsx` for “create form”.

Verify in browser Network tab that chunks load when opening `/admin/menu` (lazy load from AdminCmsPages).

---

## Owner checklist (no code)

1. Seed DB (`/admin/seed` or API seed)  
2. Media → upload photos  
3. Menu CMS → add/edit dishes (paste image URLs from Media)  
4. Restaurant CMS → logo, hero, phone  
5. Features → toggle ordering / reservation / sections  
6. Home Builder → section order  
7. Kitchen / Orders / Calendar → daily ops  
8. Analytics → CSV / JSON backup  
