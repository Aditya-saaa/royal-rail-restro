# Bugfix: public pages, features, uploads

## Root causes found

| Symptom | Root cause |
|---------|------------|
| Rail Thali / Offers / Gallery “loading forever” | Pages only checked `isLoading` — no `isError` / empty / retry; cold API hang looked infinite |
| Feature Manager toggles ignored | Footer never filtered by features; Offers nav used only `home_offers`; public APIs never checked flags; admin toggle didn’t refresh store |
| All image uploads broken | Axios default `Content-Type: application/json` on every request → multipart body corrupted |
| Cloudinary failures crash upload | Uncaught exception; now soft-fallback to placeholder URL |

## Fixes

### Upload
- Removed global JSON Content-Type; set only for object bodies; **delete** Content-Type for FormData
- Cloudinary upload: pass raw `bytes`, catch errors, placeholder fallback
- Media upload auth: single `AdminUser` dependency

### Public pages
- `QueryState`: loading skeleton / error+retry / empty
- `FeatureGate`: friendly unavailable page when module off
- Applied to: Rail Thali, Chef, Gallery, Offers, Events, Blog, Contact

### Feature Manager
- Navbar + Footer filter by flags
- Offers: `offers` OR `home_offers`
- After admin toggle: `setLocal` + `reload()` public feature map
- Backend 503 on public gallery/events/offers/blog/rail/chef when disabled

## Redeploy both
Frontend + backend required.

## Verify
1. Disable Gallery in Feature Manager → nav/footer hide; `/gallery` shows unavailable; API 503  
2. Enable again → visible  
3. Media upload → list shows asset  
4. Rail Thali with empty DB → empty state, not infinite loader  
5. Offers with network error → Retry button  
