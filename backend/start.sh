#!/usr/bin/env bash
# =====================================================================
# SJT backend release/start script for Railway (or any container host).
#
# Runs on every deploy, in order:
#   1. Ensure APP_KEY exists (generate a runtime one if missing).
#   2. Run migrations (creates the previously-missing tables too).
#   3. Seed idempotently (safe to repeat — no duplicates, no crashes).
#   4. Cache config/routes for performance.
#   5. Start the web server.
#
# Set this as the backend service Start Command:
#   bash start.sh
# =====================================================================
set -euo pipefail

echo "==> SJT backend booting…"

# 1. APP_KEY — required for encryption. Prefer setting APP_KEY in Railway
#    variables (stable across deploys). If absent, generate one so the app
#    doesn't hard-fail; note this changes on each deploy if not persisted.
if [ -z "${APP_KEY:-}" ]; then
  echo "==> APP_KEY not set — generating a temporary key (set APP_KEY in Railway to persist)."
  php artisan key:generate --force || true
fi

# 2. Migrations — idempotent; only pending migrations run.
echo "==> Running migrations…"
php artisan migrate --force

# 3. Seed — idempotent seeder (firstOrCreate/updateOrCreate).
#    Toggle off by setting SEED_ON_DEPLOY=false in Railway if you ever want to.
if [ "${SEED_ON_DEPLOY:-true}" = "true" ]; then
  echo "==> Seeding (idempotent)…"
  php artisan db:seed --force
else
  echo "==> Skipping seed (SEED_ON_DEPLOY=false)."
fi

# 4. Optimize caches. Clear first so stale cache from a previous image
#    can't reference old config.
echo "==> Caching config & routes…"
php artisan optimize:clear || true
php artisan config:cache
php artisan route:cache || true

# Public storage symlink (driver photos, etc).
php artisan storage:link || true

# 5. Serve. PORT is provided by Railway.
echo "==> Starting web server on port ${PORT:-8000}…"
exec php artisan serve --host 0.0.0.0 --port "${PORT:-8000}"
