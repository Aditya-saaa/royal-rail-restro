# Royal Rail Restro v2.0 — Production Upgrade Notes

## Backward compatibility

- All existing public API routes remain (`/api/v1/menu/*`, `/orders`, `/reservations`, `/home`, etc.)
- Database tables unchanged; FeatureFlag uses existing columns (`enabled`, `description`, `rollout_percent`)
- New modules are **additive** routers only

## New backend modules

| Prefix | Purpose |
|--------|---------|
| `/api/v1/features` | Feature manager (public map + admin CRUD) |
| `/api/v1/media` | Media library upload/list/delete (Cloudinary) |
| `/api/v1/cms` | Restaurant profile + theme CMS |
| `/api/v1/menu/admin/*` | Bulk delete/availability/price/flags, sort, duplicate, archive |

## Feature Manager

- Admin → **Features**
- Categories: customer · homepage · admin
- Each flag: **Enabled** (logic) + **Visible** (UI)
- When `online_ordering` is OFF → cart/checkout APIs return 503 friendly message; navbar hides cart
- When `table_reservation` is OFF → reservation create returns 503

Public: `GET /api/v1/features/public`

## Admin CMS UI routes

- `/admin/menu` — full item CRUD + bulk
- `/admin/media` — media library
- `/admin/features` — feature toggles
- `/admin/cms` — restaurant branding
- `/admin/events`, `/admin/blogs`, `/admin/offers`, `/admin/gallery`, `/admin/reviews`
- `/admin/seed` — seed tools

## Deploy after pull

1. Redeploy backend (new routes auto-load)
2. Login as admin
3. Open **Admin → Features →** ensure catalog (auto on load)
4. Open **Admin → Data & Seed** if catalogue empty
5. Redeploy frontend (new pages)

## Owner workflow (no code)

1. **Restaurant CMS** — logo, hero, phone, hours, colors  
2. **Menu CMS** — add/edit dishes, bulk availability  
3. **Media** — upload photos, copy URLs into menu  
4. **Features** — turn ordering/reservation/sections on/off  
5. **Reviews** — approve / reply / feature  
6. **Orders / Reservations** — live ops  
