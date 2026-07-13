# Pre-deploy critical fixes (this pass)

## TypeScript

1. **`Review.admin_reply`** added (plus `replied_at`, ids) in `frontend/src/types/index.ts`
2. **`authHeaders(): HeadersInit`** with explicit `Record<string, string>` — fixes Vercel `HeadersInit` errors
3. Removed duplicate `RestaurantInfo` interface
4. Expanded `GalleryImage`, `BlogPost`, `EventItem`, `MediaAsset` types
5. `mediaApi.upload` returns typed `MediaAsset`; no manual multipart Content-Type

## Functional

| Issue | Fix |
|-------|-----|
| Developer console blocked for admin | `isDeveloper()` includes admin/manager; ProtectedRoute OR-logic |
| Media upload double-auth | Upload endpoint uses only `AdminUser` |
| Hero image no upload | Restaurant CMS: upload hero + logo via mediaApi |
| Gallery URL null | Prefer `secure_url \|\| url` after upload |
| Media UI fragile | Typed list items, refresh, clear errors, copy feedback |

## Verify after Vercel build

```bash
# Local typecheck (optional)
cd frontend && npx tsc -b --pretty false
```

## E2E admin checklist (post-deploy)

1. Login as `admin@…` (superuser)
2. `/developer` → metrics load (not redirected home)
3. `/admin/media` → upload image → Copy URL works
4. `/admin/gallery` → multi-upload → Edit → Delete
5. `/admin/cms` → Upload hero → Save → public home shows image
6. `/admin/menu` → Add item + upload image → Save
7. Reviews page → admin_reply shows without TS error (compile already)

## Backend required

Redeploy Render so `/api/v1/developer/*` and media upload dep fix are live.
