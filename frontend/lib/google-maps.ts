/**
 * Lazy Google Maps JS API loader (production-ready).
 * Requires: npm install -D @types/google.maps
 */

declare global {
  interface Window {
    google?: typeof google;
    __gmapsLoaded?: Promise<typeof google.maps>;
  }
}

export {};

export function loadGoogleMaps(libraries: string[] = []): Promise<typeof google.maps> {
  if (typeof window === "undefined") return Promise.reject(new Error("Maps hanya tersedia di browser."));
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (window.__gmapsLoaded) return window.__gmapsLoaded;

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  window.__gmapsLoaded = new Promise((resolve, reject) => {
    if (!key) return reject(new Error("Google Maps API key belum dikonfigurasi."));
    const script = document.createElement("script");
    const libs = libraries.length ? `&libraries=${libraries.join(",")}` : "";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}${libs}&loading=async`;
    script.async = true;
    script.onload = () => window.google?.maps ? resolve(window.google.maps) : reject(new Error("Google Maps gagal dimuat."));
    script.onerror = () => reject(new Error("Google Maps gagal dimuat."));
    document.head.appendChild(script);
  });

  return window.__gmapsLoaded;
}

export function navigationUrl(lat:number,lng:number){
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}
