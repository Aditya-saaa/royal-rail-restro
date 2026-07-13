# Royal Rail Restro — Full Module Audit + Remediation

**Rule applied:** Do not assume UI = working. Verified APIs + service methods + frontend calls.

## Phase 1 — Audit matrix (after remediation)

| Module | UI | API C/R/U/D | DB | Upload | Permissions | Production |
|--------|:--:|:-----------:|:--:|:------:|:-----------:|:----------:|
| Auth | ✅ | ✅ | ✅ | n/a | JWT/RBAC | ✅ |
| Menu items | ✅ | ✅ + bulk/dup/archive | ✅ | ✅ file→Cloudinary | Admin | ✅ |
| Categories | ✅ full form | ✅ | ✅ | URL | Admin | ✅ |
| Gallery | ✅ multi-upload + edit/delete | ✅ | ✅ | ✅ | Admin | ✅ |
| Blog | ✅ create/edit/delete | ✅ | ✅ | cover upload | Admin | ✅ |
| Events | ✅ create/edit/delete | ✅ | ✅ | URL | Admin | ✅ |
| Offers | ✅ create/edit/delete | ✅ | ✅ | URL | Admin | ✅ |
| Reviews | ✅ approve/feature/reject/reply/delete | ✅ | ✅ | n/a | Admin | ✅ |
| Media library | ✅ | list/upload/delete/patch | ✅ | Cloudinary | Admin | ✅ |
| Feature manager | ✅ enable+visible | ✅ | ✅ | n/a | Admin | ✅ |
| Restaurant CMS | ✅ | profile/theme | ✅ | URL | Admin | ✅ |
| Homepage builder | ✅ reorder/enable | layout API | ✅ | n/a | Admin | ✅ |
| Home public | ✅ respects layout+CMS hero | `/home` cms+layout | ✅ | n/a | Public | ✅ |
| Kitchen | ✅ | `/ops/kitchen` | ✅ | n/a | Staff | ✅ |
| Orders | ✅ timeline/invoice/export | ✅ | ✅ | n/a | Staff | ✅ |
| Reservations | ✅ list+status | ✅ | ✅ | n/a | Staff | ✅ |
| Res calendar | ✅ + table assign | ✅ | ✅ | n/a | Staff | ✅ |
| Analytics/backup | ✅ | export CSV/JSON | ✅ | n/a | Admin | ✅ |
| Seed | ✅ | ✅ | ✅ | n/a | secret/admin | ✅ |
| Developer health | ✅ read | ✅ | ✅ | n/a | Dev | ✅ |

## Phase 1 — Gaps found (were real)

1. Gallery/Blog/Event/Offer: **create-only** (no update/delete APIs)  
2. Categories: API yes, **admin UI incomplete**  
3. Menu: create/edit yes, **no in-form upload**  
4. HomePage: **ignored** homepage builder + CMS hero fields  
5. FAQ: no update/delete  

## Phase 2 — Implemented

### Backend
- `ContentService`: get/update/delete for gallery, blog, event, offer, FAQ  
- Routes:  
  - `PATCH/DELETE /gallery/{id}`, `GET /gallery/admin`  
  - `GET /blog/admin/list`, `PATCH/DELETE /blog/id/{id}`  
  - `GET /events/admin`, `PATCH/DELETE /events/{id}`  
  - `GET /offers/admin`, `PATCH/DELETE /offers/{id}`  
  - `PATCH/DELETE /faqs/{id}`  
- `GET /home` now returns `cms` + `homepage_layout`

### Frontend
- `contentApi` full update/delete clients  
- Menu: category CRUD section + image file upload  
- Gallery: multi Cloudinary upload + edit/delete  
- Blog/Events/Offers: full edit/delete UIs  
- HomePage: hero from CMS, sections gated by homepage builder  

## Intentionally deferred (not fake UI)

- Interactive crop/rotate UI (Cloudinary transforms available via URL)  
- Excel/PDF reports (CSV + JSON backup work)  
- Heatmaps  
- Coupon dedicated admin screen (API exists)  

## Deploy

```bash
git add . && git commit -m "fix: full content CRUD, gallery upload, homepage CMS wire-up" && git push
# Redeploy Render + Vercel
# Seed if empty
curl -X POST $API/api/v1/admin/seed -H "X-Seed-Secret: $SEED"
```

## Smoke test (every button must hit network)

1. Admin → Menu → Add item + upload image → Save → Edit → Delete  
2. Admin → Menu → Category Add/Edit/Delete  
3. Admin → Gallery → multi-upload → Edit → Delete  
4. Admin → Blog/Events/Offers → Create → Edit → Delete  
5. Admin → CMS → change hero title → public home shows it  
6. Admin → Homepage → disable “offers” → home hides offers  
7. Admin → Features → offline ordering → cart gone; POST /orders → 503  
8. Admin → Media → upload → copy URL  
9. Admin → Kitchen/Orders/Calendar → status change  
10. Admin → Analytics → export CSV / JSON backup  
