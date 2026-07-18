/**
 * Lazy Google Maps JS API loader (cost optimization).
 *
 * The script is injected only when a map page actually mounts — never in the
 * global layout — and only once per session (singleton promise). Pages without
 * maps ship zero Maps bytes and incur zero Maps API cost.
 *
 * Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in the frontend environment.
 */

declare global {
    interface Window { google?: any; __gmapsLoaded?: Promise<any> }
}

export function loadGoogleMaps(libraries: string[] = []): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Maps hanya tersedia di browser.'));
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (window.__gmapsLoaded) return window.__gmapsLoaded;

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
  window.__gmapsLoaded = new Promise((resolve, reject) => {
    if (!key) {
      reject(new Error('Google Maps API key belum dikonfigurasi (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).'));
      return;
    }
    const script = document.createElement('script');
    const libs = libraries.length > 0 ? `&libraries=${libraries.join(',')}` : '';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}${libs}&loading=async`;
    script.async = true;
    script.onload = () => (window.google?.maps ? resolve(window.google.maps) : reject(new Error('Google Maps gagal dimuat.')));
    script.onerror = () => reject(new Error('Google Maps gagal dimuat. Periksa API key & koneksi.'));
    document.head.appendChild(script);
  });
  return window.__gmapsLoaded;
}

/** Deep link to turn-by-turn navigation in the Google Maps app/site. */
export function navigationUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}
