/* eslint-disable @typescript-eslint/no-explicit-any */
import { DONE_COLOR, MARKER_COLORS, type LatLng, type MapHandle, type MapPoint, type MapProvider } from '../types';

/**
 * Mode 2 — OpenStreetMap (low-cost production): MapLibre GL JS rendering OSM
 * raster tiles, Nominatim for address search/reverse geocode, OSRM for
 * routing, Browser Geolocation for position. Zero Google rendering.
 *
 * MapLibre loads lazily from CDN only when a map mounts (same cost strategy
 * as the Google loader). Marker reconciliation mirrors the audited Google
 * implementation: driver-only reposition, path source mutation — no churn.
 */

declare global { interface Window { maplibregl?: any; __maplibreLoaded?: Promise<any> } }

const MAPLIBRE_JS = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';
const MAPLIBRE_CSS = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';
const NOMINATIM = 'https://nominatim.openstreetmap.org';
const OSRM = 'https://router.project-osrm.org';

function loadMapLibre(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Map hanya tersedia di browser.'));
  if (window.maplibregl) return Promise.resolve(window.maplibregl);
  if (window.__maplibreLoaded) return window.__maplibreLoaded;
  window.__maplibreLoaded = new Promise((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = MAPLIBRE_CSS;
    document.head.appendChild(css);
    const script = document.createElement('script');
    script.src = MAPLIBRE_JS;
    script.async = true;
    script.onload = () => (window.maplibregl ? resolve(window.maplibregl) : reject(new Error('MapLibre gagal dimuat.')));
    script.onerror = () => reject(new Error('MapLibre gagal dimuat. Periksa koneksi.'));
    document.head.appendChild(script);
  });
  return window.__maplibreLoaded;
}

/** Raster OSM style — browser tile cache applies automatically. */
const OSM_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

function markerElement(kind: MapPoint['kind'], done?: boolean): HTMLElement {
  const el = document.createElement('div');
  const size = kind === 'driver' ? 18 : 14;
  el.style.cssText = `width:${size}px;height:${size}px;border-radius:9999px;background:${done ? DONE_COLOR : MARKER_COLORS[kind]};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);`;
  return el;
}

export const osmMapProvider: MapProvider = {
  id: 'osm',

  async mount(el, opts = {}) {
    const maplibregl = await loadMapLibre();
    const center = opts.center ?? { lat: -7.2575, lng: 112.7521 };
    const map = new maplibregl.Map({ container: el, style: OSM_STYLE, center: [center.lng, center.lat], zoom: opts.zoom ?? 12, attributionControl: { compact: true } });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }));

    let markers: any[] = [];
    let driverMarker: any = null;
    let staticKey = '';
    let pickCb: ((p: LatLng) => void) | null = null;
    const loaded = new Promise<void>((resolve) => map.on('load', () => resolve()));

    map.on('click', (e: any) => { if (pickCb) pickCb({ lat: e.lngLat.lat, lng: e.lngLat.lng }); });

    const handle: MapHandle = {
      setPoints(points) {
        const valid = points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
        const driver = valid.find((p) => p.kind === 'driver') ?? null;
        const statics = valid.filter((p) => p.kind !== 'driver');
        const key = JSON.stringify(statics);
        if (key === staticKey && driverMarker) {
          if (driver) driverMarker.setLngLat([driver.lng, driver.lat]);
          return;
        }
        staticKey = key;
        markers.forEach((m) => m.remove());
        driverMarker = null;
        markers = valid.map((p) => {
          const marker = new maplibregl.Marker({ element: markerElement(p.kind, p.done) }).setLngLat([p.lng, p.lat]).addTo(map);
          if (p.label) marker.setPopup(new maplibregl.Popup({ closeButton: false }).setText(p.label));
          if (p.kind === 'driver') driverMarker = marker;
          return marker;
        });
      },
      setPath(path) {
        void loaded.then(() => {
          const data = { type: 'Feature', geometry: { type: 'LineString', coordinates: path.map((p) => [p.lng, p.lat]) } };
          const source = map.getSource('trip-path');
          if (source) {
            source.setData(data);
          } else {
            map.addSource('trip-path', { type: 'geojson', data });
            map.addLayer({ id: 'trip-path', type: 'line', source: 'trip-path', paint: { 'line-color': '#0f766e', 'line-width': 4, 'line-opacity': 0.85 } });
          }
        });
      },
      panTo(p) { map.panTo([p.lng, p.lat]); },
      fitAll() {
        if (markers.length === 0) return;
        const bounds = new maplibregl.LngLatBounds();
        markers.forEach((m) => bounds.extend(m.getLngLat()));
        map.fitBounds(bounds, { padding: 48, maxZoom: 15 });
      },
      onPick(cb) { pickCb = cb; },
      destroy() { markers.forEach((m) => m.remove()); map.remove(); },
    };
    return handle;
  },

  /** Nominatim search — free, no key; polite single request per query. */
  async search(query) {
    const res = await fetch(`${NOMINATIM}/search?format=json&limit=5&q=${encodeURIComponent(query)}`, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const rows = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
    return rows.map((r) => ({ label: r.display_name, lat: Number(r.lat), lng: Number(r.lon) }));
  },

  async reverseGeocode(p) {
    try {
      const res = await fetch(`${NOMINATIM}/reverse?format=json&lat=${p.lat}&lon=${p.lng}`, { headers: { Accept: 'application/json' } });
      if (!res.ok) return null;
      const data = (await res.json()) as { display_name?: string };
      return data.display_name ?? null;
    } catch {
      return null;
    }
  },

  /** OSRM public demo server (override via self-hosted OSRM in production). */
  async route(from, to) {
    try {
      const res = await fetch(`${OSRM}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`);
      if (!res.ok) return [from, to];
      const data = (await res.json()) as { routes?: Array<{ geometry?: { coordinates?: Array<[number, number]> } }> };
      const coords = data.routes?.[0]?.geometry?.coordinates ?? [];
      return coords.length > 1 ? coords.map(([lng, lat]) => ({ lat, lng })) : [from, to];
    } catch {
      return [from, to];
    }
  },
};
