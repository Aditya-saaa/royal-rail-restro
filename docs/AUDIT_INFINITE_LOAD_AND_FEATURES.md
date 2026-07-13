# Full audit: infinite loading + Feature Manager + Sign-in

## Root causes confirmed

### A. Infinite loading / Sign-in hang
| Cause | Detail |
|-------|--------|
| `authStore.isLoading` reused | `fetchMe()` set `isLoading=true` for session restore; `ProtectedRoute` waited forever if API hung |
| Persist rehydrate | Could restore loading flags inconsistently |
| Login lazy-loaded | Chunk failure → Suspense forever |
| AppShell opacity-0 | Splash kept children invisible (felt like hang) |

### B. Feature Manager “does nothing”
| Cause | Detail |
|-------|--------|
| Missing `menu` key | Catalog had no top-level **menu** page toggle |
| Nav/footer incomplete | Menu always shown; offers key mismatch historically |
| Admin toggle not reloading public store | Fixed earlier with reload; reinforced |
| No backend gate for menu | Added 503 when menu disabled |

### C. Public pages “loading forever”
| Cause | Detail |
|-------|--------|
| Only `isLoading` branch | Fixed with QueryState (error/empty/retry) on content pages |
| Menu page still old pattern | Now QueryState + FeatureGate |

## Fixes in this pass
1. Split `isLoading` vs `isBootstrapping`; always clear boot flag; 12s timeout
2. ProtectedRoute uses bootstrapping only + hard timeout
3. Login/Signup/ForgotPassword **eager imports** (no Suspense)
4. Login form local `submitting` + 20s timeout; never stuck button
5. AppShell always mounts children (splash overlay only)
6. Feature catalog: **`menu`**, **`offers`** as first-class customer modules
7. Disabling a feature also sets visible=false by default
8. Sync `offers` ↔ `home_offers` on update
9. Navbar/Footer use feature keys for menu/offers/gallery/events/blog/etc.
10. Menu page FeatureGate + QueryState

## Feature Manager keys (customer pages)
- `menu` → /menu + nav
- `offers` → /offers + nav (+ syncs home_offers)
- `events` → /events
- `gallery` → /gallery
- `blog` → /blog
- `reviews` → reviews
- `table_reservation` → reserve
- `home_rail_specials` → Rail Thali
- `home_chef_specials` → Chef specials
- `online_ordering` → cart/checkout
- `contact_form` → contact
- `search` → search

## Deploy
Redeploy **frontend + backend**. Then:
1. Hard refresh / clear site data if login still weird (old zustand persist)
2. Open /login — form must appear immediately
3. Admin → Features → disable Gallery → nav hides + /gallery unavailable
4. Disable Menu → /menu unavailable
5. Re-enable → works

## If still infinite after deploy
Open DevTools → Network:
- Failed `/auth/me` with hanging request → old build without timeout (must be this zip)
- Failed JS chunk → CDN/cache; hard refresh
- CORS on API → set VITE_API_URL + CORS on Render
