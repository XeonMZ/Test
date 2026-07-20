#!/usr/bin/env bash
# =====================================================================
# SJT — full production verification gate.
# Run from the repository root on any machine with PHP 8.2+, Composer,
# and Node 20+. Exits non-zero on the first failure.
#
#   ./verify.sh
#
# Green output here == the "10/10" definition of done:
#   backend deps install, config caches, migrations run on a clean DB,
#   the whole test suite passes, and the frontend lints, type-checks,
#   and builds for production.
# =====================================================================
set -euo pipefail

step() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }

# ---------- Backend ----------
step "Backend: install dependencies"
( cd backend && composer install --no-interaction --prefer-dist )

step "Backend: config + route cache compiles (catches syntax/config errors)"
( cd backend \
  && cp -n .env.example .env || true \
  && php artisan key:generate --force --no-interaction \
  && php artisan config:cache \
  && php artisan route:cache \
  && php artisan config:clear && php artisan route:clear )

step "Backend: migrations run on a clean sqlite database"
( cd backend \
  && rm -f database/verify.sqlite && touch database/verify.sqlite \
  && DB_CONNECTION=sqlite DB_DATABASE="$(pwd)/database/verify.sqlite" php artisan migrate --force \
  && DB_CONNECTION=sqlite DB_DATABASE="$(pwd)/database/verify.sqlite" php artisan db:seed --force \
  && rm -f database/verify.sqlite )

step "Backend: test suite"
( cd backend && php artisan test )

# ---------- Frontend ----------
step "Frontend: install dependencies"
( cd frontend && npm ci )

step "Frontend: lint"
( cd frontend && npm run lint )

step "Frontend: typecheck"
( cd frontend && npm run typecheck )

step "Frontend: production build"
( cd frontend && NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:8000/api}" npm run build )

printf '\n\033[1;32mALL VERIFICATION GATES PASSED\033[0m\n'
