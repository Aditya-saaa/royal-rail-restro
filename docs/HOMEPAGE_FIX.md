# Homepage Blank — Root Cause & Fix

## Diagnosis (live API checked)

| Check | Result |
|-------|--------|
| `GET /health` | 200, database ok |
| `GET /api/v1/home` | 200 but **empty arrays** (no seed data) |
| `GET /api/v1/menu/categories` | `[]` |
| `GET /home` (missing prefix) | **404** |
| CORS `Access-Control-Allow-Origin` for Vercel | **missing** on responses |

## Root causes

1. **CORS** — Browser blocked Vercel → Render API calls (no matching origin). Navbar/Footer still showed (static React shell); main content waited on `publicApi.home()` forever.
2. **HomePage loader trap** — `if (isLoading \|\| !data)` never recovered on error or empty payload.
3. **Empty Neon DB** — Startup seed failed or never committed; tables exist but catalogue is empty.
4. **Possible wrong `VITE_API_URL`** — If set to host without `/api/v1`, requests hit `/home` → 404.

## Fixes shipped in this update

### Frontend
- Normalize `VITE_API_URL` (auto-append `/api/v1`)
- Disable `withCredentials` for cross-origin Bearer auth (avoids credentialed CORS edge cases)
- Homepage always renders hero + brand sections even if API fails
- Error/empty catalogue banner with retry

### Backend
- CORS `allow_origin_regex` for any `http(s)` origin (Vercel previews)
- Stronger seed logging on startup
- `POST /api/v1/admin/seed` with `X-Seed-Secret` or admin Bearer
- `GET /api/v1/admin/db-stats` public catalogue counts
- DATABASE_URL normalizer for Neon SSL / asyncpg

## Deploy steps (do these now)

### 1. Push code
```bash
git add .
git commit -m "fix: homepage blank — CORS, seed endpoint, resilient HomePage"
git push origin main
```

### 2. Render env vars
```
CORS_ALLOW_ALL=true
CORS_ORIGINS=https://YOUR-VERCEL-APP.vercel.app,http://localhost:5173
SEED_SECRET=pick-a-long-random-string
DATABASE_URL=postgresql+asyncpg://...@...neon.tech/...?ssl=require
```
Redeploy backend after env changes.

### 3. Seed production database
After backend is live:
```bash
curl -X POST https://royal-rail-restro-api.onrender.com/api/v1/admin/seed \
  -H "X-Seed-Secret: pick-a-long-random-string"
```
Expect JSON like `{ "categories": 12, "menu_items": 28, "success": true }`.

Verify:
```bash
curl https://royal-rail-restro-api.onrender.com/api/v1/admin/db-stats
curl https://royal-rail-restro-api.onrender.com/api/v1/home | head
```

### 4. Vercel env
```
VITE_API_URL=https://royal-rail-restro-api.onrender.com/api/v1
```
**Must include `/api/v1`.**  
Install command: `npm install --legacy-peer-deps`  
Redeploy frontend after env change (Vite inlines env at build time).

### 5. Browser check
- Hard refresh homepage
- DevTools → Network: `.../api/v1/home` should be 200 with dishes
- No CORS errors in Console

## Redis

`redis: error` on health is OK if you did not provision Redis. Caching degrades gracefully; not the homepage blocker.
