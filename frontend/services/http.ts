import axios from 'axios';
import { clearAuthSession, getStoredToken } from '@/shared/lib/auth-storage';

export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// Runtime diagnostic: if the built API URL points at this frontend's own host
// (every call would 404) or at localhost while the page itself is deployed,
// surface an unmissable console error explaining the fix. Warning only — a
// deliberate same-domain reverse-proxy setup would still work.
if (typeof window !== 'undefined') {
  try {
    const api = new URL(http.defaults.baseURL as string, window.location.origin);
    const isLocalHostname = (h: string) => h === 'localhost' || h === '127.0.0.1';
    const pointsAtSelf = api.host === window.location.host;
    const pointsAtLocalhost = isLocalHostname(api.hostname) && !isLocalHostname(window.location.hostname);
    if (pointsAtSelf || pointsAtLocalhost) {
      console.error(
        `[STMS] NEXT_PUBLIC_API_URL salah konfigurasi: "${http.defaults.baseURL}". ` +
          'Nilai ini harus URL publik service BACKEND yang diakhiri /api (contoh: https://domain-backend/api), ' +
          'diset di environment service FRONTEND, lalu frontend di-REBUILD (variabel NEXT_PUBLIC_* dibakar saat build).',
      );
    }
  } catch {
    /* diagnostic only */
  }
}

http.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== 'undefined') {
      const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/install'];
      const onPublicPath = publicPaths.some((path) => window.location.pathname.startsWith(path));
      clearAuthSession();
      if (!onPublicPath) {
        const next = encodeURIComponent(window.location.pathname);
        window.location.href = `/login?next=${next}`;
      }
    }
    return Promise.reject(error);
  },
);
