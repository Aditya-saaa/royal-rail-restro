# Priority matrix — what exists vs what was just added

## Already in v2 (do not rebuild)

| Your priority | Status | Where |
|---------------|--------|--------|
| 1 Menu Add/Edit/Delete + bulk | ✅ | `/admin/menu` · `AdminMenuManager` · `/menu/admin/*` |
| 1 Gallery/Blog/Offers/Events CMS | ✅ | `/admin/gallery` blogs offers events |
| 1 Reviews approve/reply | ✅ | `/admin/reviews` |
| 2 Media / Cloudinary upload | ✅ | `/admin/media` · `POST /media/upload` |
| 3 Feature toggles + hide cart | ✅ | `/admin/features` · `featureStore` · order 503 |
| 5 Restaurant settings CMS | ✅ | `/admin/cms` |
| 9 Reviews workflow | ✅ | approve/reject/feature/reply |
| 11 Activity logs (basic) | ✅ | Developer → Logs · `ActivityLog` |
| SEO base + restaurant schema | ✅ | `Seo.tsx` · robots · sitemap |

## Added in this pass

| Priority | Delivery |
|----------|----------|
| 4 Homepage builder | `/admin/homepage` · `GET/PUT /cms/homepage-layout` |
| 6 Kitchen + timeline + invoice | `/admin/kitchen` · `/admin/orders` pro · `/ops/*` |
| 7 Reservation calendar + table assign | `/admin/calendar` · `/ops/reservations/calendar` |
| 8 Search typeahead + filters | `/search` + `suggest` + is_veg |
| 10 Analytics + CSV/JSON backup | `/admin/analytics` · `/ops/export/*` · `/ops/backup/json` |
| 13 Stronger schema | LocalBusiness + hours + Organization + Breadcrumb helpers |

## Still optional / later

- Full WYSIWYG drag-drop page builder with live preview
- Razorpay live payment capture UI
- Virtualized tables for 10k+ rows
- Automated spam ML for reviews
- Multi-branch / multi-kitchen

## Owner map (no code)

1. Login → Admin  
2. **Menu CMS** dishes  
3. **Media** photos  
4. **Restaurant CMS** logo/hero/phone  
5. **Features** turn modules on/off  
6. **Home Builder** section order  
7. **Kitchen / Orders / Calendar** ops  
8. **Analytics** exports & backup  
