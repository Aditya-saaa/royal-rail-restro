# QA status after UX/performance pass

## Fully working (source-verified)

| Area | Notes |
|------|--------|
| Boot / no blank screen | HTML shell + BrandedBoot + HomeSkeleton |
| Progressive home | Skeleton first; hero/CMS; section gates |
| React Query | Tuned client, prefetch home, retries for cold start |
| Menu CMS | Full CRUD + bulk + upload image |
| Media | Upload/delete/list Cloudinary |
| Gallery | Multi upload + edit + delete |
| Blog/Events/Offers | Full CRUD |
| Features | Enable/visible; ordering 503 |
| Restaurant CMS + Home builder | Saved + consumed on public home |
| Kitchen/Orders/Calendar | Live ops APIs |
| Analytics export/backup | CSV + JSON |
| **Developer console** | Real `/developer/console`, maintenance, seed, probe, logs |

## Partially working / deferred polish

| Area | Notes |
|------|--------|
| Interactive crop UI | URL transforms only |
| Excel/PDF reports | CSV/JSON yes |
| Heatmaps | Not implemented |
| Virtualized tables | Not needed at current scale |

## Fixed during this pass

- Blank white screen on wake  
- Home blocked on full spinner  
- Developer home was fake cards → real console  
- Admin sidebar denser/grouped + mobile drawer  
- Dashboard skeleton + retry  
- User search debounce  

## Deploy

1. Push zip contents to GitHub  
2. Redeploy **backend** (new `/api/v1/developer/*`)  
3. Redeploy **frontend** (boot shell + AppShell + DeveloperConsole)  
4. Login as superuser → open `/developer`  
