/* eslint-disable @typescript-eslint/no-explicit-any */
import { loadGoogleMaps } from '@/lib/google-maps';
import { DONE_COLOR, MARKER_COLORS, type LatLng, type MapHandle, type MapPoint, type MapProvider, type SearchResult } from '../types';

/**
 * Mode 1 — Google Maps (full production). Reuses the existing lazy loader
 * (script only when a map mounts) and the audited reconciliation strategy:
 * driver-marker-only reposition + polyline setPath (no churn, no flicker).
 * route() intentionally returns a straight segment — the production polyline
 * is the GPS breadcrumb; no billable Directions calls are introduced.
 */
export const googleMapProvider: MapProvider = {
  id: 'google',

  async mount(el, opts = {}) {
    const maps = await loadGoogleMaps(['places']);
    const map = new maps.Map(el, {
      center: opts.center ?? { lat: -7.2575, lng: 112.7521 },
      zoom: opts.zoom ?? 12,
      disableDefaultUI: true,
      zoomControl: true,
      clickableIcons: false,
    });

    let markers: any[] = [];
    let driverMarker: any = null;
    let polyline: any = null;
    let staticKey = '';
    let pickCb: ((p: LatLng) => void) | null = null;
    let clickListener: any = null;

    const icon = (kind: MapPoint['kind'], done?: boolean) => ({
      path: maps.SymbolPath.CIRCLE,
      scale: kind === 'driver' ? 9 : 7,
      fillColor: done ? DONE_COLOR : MARKER_COLORS[kind],
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    });

    const handle: MapHandle = {
      setPoints(points) {
        const valid = points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
        const driver = valid.find((p) => p.kind === 'driver') ?? null;
        const statics = valid.filter((p) => p.kind !== 'driver');
        const key = JSON.stringify(statics);
        if (key === staticKey && driverMarker) {
          if (driver) driverMarker.setPosition({ lat: driver.lat, lng: driver.lng });
          return;
        }
        staticKey = key;
        markers.forEach((m) => m.setMap(null));
        driverMarker = null;
        markers = valid.map((p) => {
          const marker = new maps.Marker({ map, position: { lat: p.lat, lng: p.lng }, title: p.label ?? undefined, icon: icon(p.kind, p.done), zIndex: p.kind === 'driver' ? 10 : 1 });
          if (p.kind === 'driver') driverMarker = marker;
          return marker;
        });
      },
      setPath(path) {
        if (path.length > 1) {
          if (polyline) polyline.setPath(path);
          else polyline = new maps.Polyline({ map, path, strokeColor: '#0f766e', strokeOpacity: 0.85, strokeWeight: 4 });
        } else if (polyline) {
          polyline.setMap(null);
          polyline = null;
        }
      },
      panTo(p) { map.panTo(p); },
      fitAll() {
        if (markers.length === 0) return;
        const bounds = new maps.LatLngBounds();
        markers.forEach((m) => bounds.extend(m.getPosition()));
        map.fitBounds(bounds, 48);
      },
      onPick(cb) {
        pickCb = cb;
        if (cb && !clickListener) clickListener = map.addListener('click', (e: any) => { if (e.latLng && pickCb) pickCb({ lat: e.latLng.lat(), lng: e.latLng.lng() }); });
        if (!cb && clickListener) { maps.event.removeListener(clickListener); clickListener = null; }
      },
      destroy() {
        markers.forEach((m) => m.setMap(null));
        polyline?.setMap(null);
        if (clickListener) maps.event.removeListener(clickListener);
        el.innerHTML = '';
      },
    };
    return handle;
  },

  /** Places Autocomplete predictions resolved to coordinates. */
  async search(query) {
    const maps = await loadGoogleMaps(['places']);
    const service = new maps.places.AutocompleteService();
    const predictions: any[] = await new Promise((resolve) =>
      service.getPlacePredictions({ input: query }, (res: any[]) => resolve(res ?? [])),
    );
    const geocoder = new maps.Geocoder();
    const results: SearchResult[] = [];
    for (const p of predictions.slice(0, 5)) {
      try {
        const { results: geo } = await geocoder.geocode({ placeId: p.place_id });
        const loc = geo?.[0]?.geometry?.location;
        if (loc) results.push({ label: p.description as string, lat: loc.lat(), lng: loc.lng() });
      } catch { /* skip unresolvable prediction */ }
    }
    return results;
  },

  async reverseGeocode(p) {
    const maps = await loadGoogleMaps();
    const geocoder = new maps.Geocoder();
    try {
      const { results } = await geocoder.geocode({ location: p });
      return (results?.[0]?.formatted_address as string) ?? null;
    } catch {
      return null;
    }
  },

  async route(from, to) {
    return [from, to]; // straight segment — production polyline is the GPS breadcrumb
  },
};
