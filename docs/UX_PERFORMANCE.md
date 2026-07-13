# UX & Performance upgrade notes

## Blank screen elimination

1. **index.html boot shell** — paints logo + train progress before JS loads  
2. **AppShell BrandedBootScreen** — short React-level branded fade  
3. **HomeSkeleton** — progressive homepage while `/home` loads (not blank spinner-only)  
4. **AdminPageSkeleton** — admin routes show structured placeholders  

## React Query

- Shared client: `src/lib/queryClient.ts`  
- `staleTime` 2m, `gcTime` 30m  
- Cold-start retries (3× exponential)  
- Prefetch `/home` on bootstrap  
- Dashboard / users use `placeholderData`  

## Developer console (real)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/developer/console` | Health, latencies, counts, safe env |
| `GET /api/v1/developer/logs` | Activity logs |
| `POST /api/v1/developer/maintenance` | Maintenance mode |
| `POST /api/v1/developer/seed` | Seed DB |
| `POST /api/v1/developer/probe` | Allow-listed latency probe |
| `GET /api/v1/developer/features` | Feature list |

UI: `/developer` → `DeveloperConsole.tsx`

## Admin redesign

- Grouped sidebar (Operations / Catalogue / Content / Platform)  
- Mobile drawer  
- Dashboard cards + chart polish  
- Debounced user search  

## Deploy

Push + redeploy **frontend and backend**.  
Login as superuser/admin for `/developer`.  
