# Royal Rail Restro — Official Digital Platform

**Enterprise-grade restaurant management & customer platform**  
1st Floor, Dev Raj Tower, Gewalbigha, Gaya, Bihar, India

---

## Overview

Premium full-stack platform for Royal Rail Restro covering:

- Customer website (menu, ordering, reservations, loyalty)
- Admin panel (operations, analytics, CMS)
- Developer panel (theme, health, feature flags)
- JWT auth, RBAC, Redis cache, Cloudinary media
- SEO, accessibility (WCAG AA), PWA

## Tech Stack

| Layer | Stack |
|-------|--------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, Framer Motion |
| Backend | FastAPI, SQLAlchemy, Alembic, Pydantic, JWT, bcrypt |
| Data | PostgreSQL, Redis |
| Media | Cloudinary |
| Deploy | Docker, Docker Compose, Nginx |

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (local frontend)
- Python 3.12+ (local backend)

### With Docker (recommended)

```bash
cp .env.example .env
docker compose up --build -d
```

- Website: http://localhost:5173  
- API docs: http://localhost:8000/docs  
- Admin: http://localhost:5173/admin  
- Developer: http://localhost:5173/developer  

Default admin: `admin@royalrailrestro.com` / `Admin@RRR2026!`

### Local development

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

## Project Structure

```
royal-rail-restro/
├── backend/          # FastAPI application
├── frontend/         # React + Vite SPA
├── nginx/            # Reverse proxy
├── docker/           # Docker helpers
├── scripts/          # Ops scripts
├── docs/             # Architecture notes
├── docker-compose.yml
└── .env.example
```

## Brand

- **Primary:** Royal Red `#8B0000`, Gold `#D4AF37`, White, Charcoal
- **Secondary:** Cream, Warm Gray
- **Identity:** Railway-inspired luxury, premium yet affordable family dining

## v2.0 Admin CMS (owner, no code)

After login as admin (`/admin`):

| Module | Path | What you can do |
|--------|------|-----------------|
| Menu CMS | `/admin/menu` | Add/edit/delete/duplicate/archive dishes, bulk availability & price |
| Media | `/admin/media` | Upload images (Cloudinary), copy URLs |
| Features | `/admin/features` | Toggle ordering, reservations, homepage sections |
| Restaurant CMS | `/admin/cms` | Logo, hero, contact, socials, theme colors |
| Reviews | `/admin/reviews` | Approve, feature, reply, delete |
| Blog / Offers / Events / Gallery | respective routes | Full create CMS |
| Data & Seed | `/admin/seed` | Populate catalogue if empty |

See `docs/V2_UPGRADE.md` and `docs/SEED_FIX.md`.

## License

Proprietary — Royal Rail Restro, Gaya. All rights reserved.
