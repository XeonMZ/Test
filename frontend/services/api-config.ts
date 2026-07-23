/**
 * API base URL resolution.
 *
 * Why this exists: `NEXT_PUBLIC_*` variables are **inlined at build time**.
 * Setting `NEXT_PUBLIC_API_URL` on the host after the image was built changes
 * nothing, so the bundle keeps calling the build-time default
 * (`http://localhost:8000/api`). On a phone that resolves to the phone itself,
 * the request never leaves the device, and axios reports a bare
 * "Network Error" — with no hint about the real cause.
 *
 * Resolution order (first usable wins):
 *   1. `window.__STMS_API_URL__` — injected per-request by the server layout
 *      from the runtime `API_URL` env var. Changing it needs only a restart,
 *      no rebuild.
 *   2. `NEXT_PUBLIC_API_URL` — the build-time value, when it is usable.
 *   3. Same-origin `/api` — used only when (2) is unusable (points at
 *      localhost while the page itself is deployed). Correct for the common
 *      reverse-proxy setup; when it is wrong it produces an honest 404
 *      instead of an opaque network failure.
 */

declare global {
  interface Window {
    __STMS_API_URL__?: string;
  }
}

const BUILD_TIME_API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || '';
const DEV_FALLBACK = 'http://localhost:8000/api';

function isLocalHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

/** True when `candidate` cannot possibly work from the current page. */
function isUnusable(candidate: string, origin: string): boolean {
  try {
    const url = new URL(candidate, origin);
    const page = new URL(origin);
    // Pointing at localhost from a deployed page → request never leaves device.
    if (isLocalHostname(url.hostname) && !isLocalHostname(page.hostname)) return true;
    // Plain-HTTP API from an HTTPS page → blocked as mixed content.
    if (page.protocol === 'https:' && url.protocol === 'http:') return true;
    return false;
  } catch {
    return true;
  }
}

/** True when the resolver had to guess same-origin because nothing usable was configured. */
export function isUsingFallbackApiUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const origin = window.location.origin;
  const runtime = window.__STMS_API_URL__?.trim();
  if (runtime && !isUnusable(runtime, origin)) return false;
  if (BUILD_TIME_API_URL && !isUnusable(BUILD_TIME_API_URL, origin)) return false;
  return !isLocalHostname(window.location.hostname);
}

const CONFIG_HINT =
  'URL API belum dikonfigurasi dengan benar. Set API_URL="https://domain-backend/api" pada environment service FRONTEND lalu restart ' +
  '(atau set NEXT_PUBLIC_API_URL lalu rebuild), dan pada BACKEND set FRONTEND_URL ke alamat situs ini agar CORS mengizinkannya.';

export function resolveApiBaseUrl(): string {
  // Server-side render: runtime env is directly readable.
  if (typeof window === 'undefined') {
    return process.env.API_URL?.trim() || BUILD_TIME_API_URL || DEV_FALLBACK;
  }

  const origin = window.location.origin;

  const runtime = window.__STMS_API_URL__?.trim();
  if (runtime && !isUnusable(runtime, origin)) return runtime;

  if (BUILD_TIME_API_URL && !isUnusable(BUILD_TIME_API_URL, origin)) return BUILD_TIME_API_URL;

  // Deployed page with no usable configuration: assume the API is proxied on
  // the same origin. Loud console guidance below explains how to set it.
  if (!isLocalHostname(window.location.hostname)) {
    const configured = runtime || BUILD_TIME_API_URL || '(kosong)';
    console.error(
      `[STMS] URL API tidak dapat dipakai: "${configured}".\n` +
        `Sementara memakai ${origin}/api.\n` +
        'Perbaiki dengan salah satu cara:\n' +
        `  1) Set API_URL="https://domain-backend/api" pada environment service FRONTEND lalu RESTART (tanpa rebuild), atau\n` +
        '  2) Set NEXT_PUBLIC_API_URL lalu REBUILD frontend (NEXT_PUBLIC_* dibakar saat build).\n' +
        'Dan pada BACKEND set FRONTEND_URL ke origin frontend ini agar CORS mengizinkannya.',
    );
    return `${origin}/api`;
  }

  return BUILD_TIME_API_URL || DEV_FALLBACK;
}

/**
 * Human-readable diagnosis for a failed request.
 * Returns null when the failure is a normal HTTP error (the caller should
 * show the server's own message instead).
 */
export function diagnoseNetworkFailure(error: unknown): string | null {
  const err = error as { code?: string; message?: string; response?: { status?: number } };

  // A 404 while running on the guessed same-origin URL means there is no API
  // proxied here — i.e. the API URL was never configured. Say so plainly
  // instead of letting a generic "not found" surface.
  if (err?.response) {
    if (err.response.status === 404 && isUsingFallbackApiUrl()) return CONFIG_HINT;
    return null; // server answered — not a network-level failure
  }

  const base = typeof window !== 'undefined' ? resolveApiBaseUrl() : BUILD_TIME_API_URL;

  if (err?.code === 'ECONNABORTED') {
    return `Server API tidak merespons tepat waktu (${base}). Periksa apakah backend sedang berjalan.`;
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  let hint = isUsingFallbackApiUrl() ? CONFIG_HINT : 'Periksa apakah backend berjalan dan dapat diakses publik.';
  try {
    const url = new URL(base, origin || 'http://localhost');
    if (origin && isLocalHostname(url.hostname) && !isLocalHostname(new URL(origin).hostname)) {
      hint = 'URL API menunjuk ke localhost, sehingga permintaan tidak pernah keluar dari perangkat ini. Set API_URL di environment frontend.';
    } else if (origin && new URL(origin).protocol === 'https:' && url.protocol === 'http:') {
      hint = 'Halaman diakses lewat HTTPS tetapi URL API memakai HTTP, sehingga diblokir browser (mixed content). Gunakan HTTPS untuk API.';
    } else if (origin && url.origin !== new URL(origin).origin) {
      hint = 'Kemungkinan CORS: pada backend set FRONTEND_URL ke ' + origin + ' lalu jalankan php artisan config:clear.';
    }
  } catch {
    /* fall through to the generic hint */
  }

  return `Tidak dapat menghubungi server API di ${base}. ${hint}`;
}
