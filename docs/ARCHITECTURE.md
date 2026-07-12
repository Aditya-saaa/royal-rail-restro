# Royal Rail Restro — Architecture

## Layers

1. **Frontend (React 19 + Vite + TS)** — Customer site, Admin panel, Developer panel
2. **API (FastAPI)** — JWT auth, RBAC, business services
3. **PostgreSQL** — Normalized domain schema
4. **Redis** — Cache / session support
5. **Cloudinary-ready** — Media assets
6. **Nginx / Docker** — Reverse proxy & containers

## Domain modules

- Auth & Users (roles, permissions)
- Menu (categories, items, nutrition flags)
- Orders (cart → checkout → GST → tracking)
- Reservations (slots, capacity, approval)
- Content (reviews, gallery, blog, events, offers, FAQ, contact)
- Admin analytics
- Developer (theme, flags, health)

## Security

- bcrypt passwords, JWT access + refresh
- HttpOnly cookie option + Bearer header
- Rate limiting (SlowAPI)
- CORS allowlist, CSP & security headers
- Pydantic validation on all inputs
- SQLAlchemy ORM (parameterized queries)

## Brand

- Royal Red `#8B0000`, Gold `#D4AF37`, Cream, Charcoal
- Railway-inspired subtle patterns & thali signature
