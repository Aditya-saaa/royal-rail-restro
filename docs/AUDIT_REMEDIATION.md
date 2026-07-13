# Audit → Remediation log

## Phase 1 findings (verified in source)

| Gap | Fix |
|-----|-----|
| Gallery create-only | PATCH/DELETE `/gallery/{id}` + admin list + UI edit/delete + multi-upload |
| Blog create-only | PATCH/DELETE `/blog/id/{id}` + admin list all statuses + UI |
| Events create-only | PATCH/DELETE `/events/{id}` + admin list + UI |
| Offers create-only | PATCH/DELETE `/offers/{id}` + admin list inactive + UI |
| Categories UI list-only | CategoryManagerSection full C/R/U/D on Menu page |
| Menu image paste-only | File upload → Cloudinary media → fills image_url |
| HomePage ignored CMS layout | `/home` returns `cms` + `homepage_layout`; HomePage gates sections + hero fields |
| FAQ no U/D | PATCH/DELETE `/faqs/{id}` |

## Already production-ready (no change needed)

- Menu item CRUD + bulk + duplicate/archive
- Media library upload/delete/list
- Feature manager enable/visible
- Restaurant CMS profile/theme
- Kitchen, orders timeline/invoice, reservation calendar
- Seed, analytics export/backup
- Auth JWT + RBAC

## Deploy verification checklist

```bash
# After push + redeploy
curl -X POST $API/api/v1/admin/seed -H "X-Seed-Secret: $SEED"
curl $API/api/v1/home | head   # should include cms + homepage_layout keys when set

# Admin UI smoke
# /admin/menu — add item, upload image, bulk
# /admin/gallery — multi upload, edit, delete
# /admin/blogs — create, edit, delete
# /admin/events — create, edit, delete
# /admin/offers — create, edit, delete
# /admin/media — upload
# /admin/features — toggle online_ordering → cart hides
# /admin/cms — hero title appears on site
# /admin/homepage — disable section → hidden on home
```
