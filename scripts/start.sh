#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
cp -n .env.example .env 2>/dev/null || true
docker compose up --build -d
echo "Royal Rail Restro is starting..."
echo "  Website : http://localhost:5173"
echo "  API     : http://localhost:8000/docs"
echo "  Admin   : http://localhost:5173/admin"
echo "  Login   : admin@royalrailrestro.com / Admin@RRR2026!"
