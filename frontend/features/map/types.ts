/**
 * Provider Pattern — frontend contract.
 *
 * Every map surface (driver live, customer track, admin/owner monitor,
 * booking pickup picker, simulator) renders through this interface. Which
 * concrete provider is used is decided by the backend resolution
 * (`GET /map/config`) and looked up in the registry — no provider if/else in
 * business components.
 */

export type LatLng = { lat: number; lng: number };

export type MapPoint = LatLng & {
  label?: string | null;
  kind: 'driver' | 'pickup' | 'drop' | 'jastip';
  done?: boolean;
};

export type SearchResult = { label: string; lat: number; lng: number };

export type MapProviderId = 'google' | 'osm' | 'beta';

export const MARKER_COLORS: Record<MapPoint['kind'], string> = {
  driver: '#16a34a', // 🟢 driver
  pickup: '#024ad8', // 🔵 pickup points
  drop: '#dc2626',   // 🔴 destinations
  jastip: '#f59e0b', // 🟡 packages
};

export const DONE_COLOR = '#94a3b8';

/** Live handle bound to one mounted map element. */
export interface MapHandle {
  /** Reconcile markers. Implementations must avoid full recreation when only the driver moved. */
  setPoints(points: MapPoint[]): void;
  /** Reconcile the breadcrumb polyline. */
  setPath(path: LatLng[]): void;
  panTo(p: LatLng): void;
  /** Fit viewport to all current points (called once after first data). */
  fitAll(): void;
  /** Register/unregister a map-click (pin) callback. */
  onPick(cb: ((p: LatLng) => void) | null): void;
  destroy(): void;
}

export interface MapProvider {
  readonly id: MapProviderId;
  mount(el: HTMLElement, opts?: { center?: LatLng | null; zoom?: number }): Promise<MapHandle>;
  /** Address search (Places / Nominatim / simulated). */
  search(query: string): Promise<SearchResult[]>;
  /** Reverse geocode a pin drop — callers must skip this when a label already exists (cost rule). */
  reverseGeocode(p: LatLng): Promise<string | null>;
  /** Route polyline between two points (existing Google mode: straight segment — no Directions billing; OSM: OSRM; beta: simulated). */
  route(from: LatLng, to: LatLng): Promise<LatLng[]>;
}
