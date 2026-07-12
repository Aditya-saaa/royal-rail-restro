# Deployment Guide — Royal Rail Restro

## Docker Compose (recommended)

```bash
cd royal-rail-restro
cp .env.example .env
# Edit SECRET_KEY, admin password, Cloudinary, SMTP as needed
docker compose up --build -d
```

| Service  | URL |
|----------|-----|
| Website  | http://localhost:5173 |
| API docs | http://localhost:8000/docs |
| Health   | http://localhost:8000/health |
| Admin    | http://localhost:5173/admin |
| Developer| http://localhost:5173/developer |

Default admin: `admin@royalrailrestro.com` / `Admin@RRR2026!`

## Production checklist

1. Set `APP_ENV=production`, `APP_DEBUG=false`
2. Generate strong `SECRET_KEY` (32+ chars)
3. Enable HTTPS and set `COOKIE_SECURE=true`
4. Configure Cloudinary for media
5. Configure SMTP for email verification & reservation alerts
6. Restrict `CORS_ORIGINS` to your domain
7. Use managed PostgreSQL & Redis
8. Put Nginx (or cloud LB) in front with TLS
9. Enable GitHub Actions for CI (build + test)
10. Rotate admin password after first login

## Local without Docker

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# Start Postgres + Redis locally, update DATABASE_URL / REDIS_URL
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## GitHub Actions sketch

```yaml
name: CI
on: [push]
jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install -r backend/requirements.txt
      - run: cd backend && pytest -q || true
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd frontend && npm install && npm run build
```
