/**
 * Build-time environment guard (runs automatically via the `prebuild` hook).
 *
 * NEXT_PUBLIC_* variables are baked into the bundle at build time; a wrong or
 * missing NEXT_PUBLIC_API_URL silently produces a deploy where every API call
 * 404s against the frontend's own domain. This script turns that silent
 * failure into a loud, actionable build error.
 *
 * Escape hatch (not recommended): SKIP_ENV_ASSERT=1
 */
const fail = (msg) => {
  console.error('\n\x1b[1;31m[ENV ERROR]\x1b[0m ' + msg + '\n');
  process.exit(1);
};

if (process.env.SKIP_ENV_ASSERT === '1') {
  console.warn('[assert-env] SKIP_ENV_ASSERT=1 — melewati validasi environment.');
  process.exit(0);
}

const raw = (process.env.NEXT_PUBLIC_API_URL ?? '').trim();

if (!raw) {
  fail(
    'NEXT_PUBLIC_API_URL belum diset saat build.\n' +
    'Set di environment service FRONTEND (bukan backend) ke URL publik backend, diakhiri /api.\n' +
    'Contoh: NEXT_PUBLIC_API_URL=https://sjt-backend-production.up.railway.app/api\n' +
    'Lalu rebuild/redeploy frontend — variabel NEXT_PUBLIC_* dibakar saat build.',
  );
}

let url;
try {
  url = new URL(raw);
} catch {
  fail(`NEXT_PUBLIC_API_URL bukan URL absolut yang valid: "${raw}". Wajib berformat https://domain-backend/api`);
}

if (url.protocol !== 'https:' && url.protocol !== 'http:') {
  fail(`NEXT_PUBLIC_API_URL harus http(s), diterima: "${raw}"`);
}

// Railway/most hosts expose the service's own public domain at build time.
// If the API URL points at the frontend itself, every request will 404.
const selfDomain = (process.env.RAILWAY_PUBLIC_DOMAIN ?? process.env.VERCEL_URL ?? '').trim();
if (selfDomain && url.host.toLowerCase() === selfDomain.toLowerCase()) {
  fail(
    `NEXT_PUBLIC_API_URL menunjuk ke domain frontend ini sendiri (${selfDomain}).\n` +
    'Ia harus menunjuk ke domain service BACKEND (Laravel), contoh:\n' +
    '  NEXT_PUBLIC_API_URL=https://<domain-backend>/api',
  );
}

if (!url.pathname.replace(/\/+$/, '').endsWith('/api')) {
  console.warn(
    `[assert-env] Peringatan: NEXT_PUBLIC_API_URL biasanya diakhiri "/api" (diterima: "${raw}"). ` +
    'Pastikan ini memang benar untuk setup Anda.',
  );
}

console.log(`[assert-env] OK — API URL: ${raw}`);
