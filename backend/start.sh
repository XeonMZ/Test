#!/usr/bin/env bash
# =====================================================================
# SJT backend/worker start script
#
# Backend:
#   SERVICE_TYPE=web
#
# Worker:
#   SERVICE_TYPE=worker
#
# Railway Start Command:
#   bash start.sh
# =====================================================================

set -euo pipefail

# Ensure Laravel writable skeleton exists.
mkdir -p \
  storage/app/public \
  storage/app/private \
  storage/framework/cache/data \
  storage/framework/sessions \
  storage/framework/testing \
  storage/framework/views \
  storage/logs \
  bootstrap/cache

echo "==> SJT starting..."

# ==========================
# Worker Mode
# ==========================
if [ "${SERVICE_TYPE:-web}" = "worker" ]; then
  echo "==> Worker mode detected."
  exec php artisan queue:work --sleep=3 --tries=3 --timeout=90
fi

echo "==> Web mode detected."

# ==========================
# APP_KEY
# ==========================
if [ -z "${APP_KEY:-}" ]; then
  echo "==> APP_KEY not set — generating temporary key."
  php artisan key:generate --force || true
fi

# ==========================
# Migrate
# ==========================
echo "==> Running migrations..."
php artisan migrate --force

# ==========================
# Seed
# ==========================
if [ "${SEED_ON_DEPLOY:-true}" = "true" ]; then
  echo "==> Seeding..."
  php artisan db:seed --force
else
  echo "==> Skipping seed."
fi

# ==========================
# Optimize
# ==========================
echo "==> Caching config & routes..."
php artisan optimize:clear || true
php artisan config:cache
php artisan route:cache || true

# Storage symlink
php artisan storage:link || true

# ==========================
# Start Web Server
# ==========================
echo "==> Starting web server on port ${PORT:-8000}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
