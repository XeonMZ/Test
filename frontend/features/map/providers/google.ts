/* eslint-disable @typescript-eslint/no-explicit-any */
import { loadGoogleMaps } from '@/lib/google-maps';
import {
  DONE_COLOR,
  MARKER_COLORS,
  type LatLng,
  type MapHandle,
  type MapPoint,
  type MapProvider,
  type SearchResult,
} from '../types';

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

    let markers: google.maps.Marker[] = [];
    let driverMarker: google.maps.Marker | null = null;
    let polyline: google.maps.Polyline | null = null;
    let staticKey = '';
    let pickCb: ((p: LatLng) => void) | null = null;
    let clickListener: google.maps.MapsEventListener | null = null;

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
        const valid = points.filter(
          (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)
        );

        const driver = valid.find((p) => p.kind === 'driver') ?? null;
        const statics = valid.filter((p) => p.kind !== 'driver');

        const key = JSON.stringify(statics);

        if (key === staticKey && driverMarker) {
          if (driver) {
            driverMarker.setPosition({
              lat: driver.lat,
              lng: driver.lng,
            });
          }
          return;
        }

        staticKey = key;

        markers.forEach((m) => m.setMap(null));
        markers = [];
        driverMarker = null;

        markers = valid.map((p) => {
          const marker = new maps.Marker({
            map,
            position: {
              lat: p.lat,
              lng: p.lng,
            },
            title: p.label ?? undefined,
            icon: icon(p.kind, p.done),
            zIndex: p.kind === 'driver' ? 10 : 1,
          });

          if (p.kind === 'driver') {
            driverMarker = marker;
          }

          return marker;
        });
      },

      setPath(path) {
        if (path.length > 1) {
          if (polyline) {
            polyline.setPath(path);
          } else {
            polyline = new maps.Polyline({
              map,
              path,
              strokeColor: '#0f766e',
              strokeOpacity: 0.85,
              strokeWeight: 4,
            });
          }
        } else if (polyline) {
          polyline.setMap(null);
          polyline = null;
        }
      },

      panTo(p) {
        map.panTo(p);
      },

      fitAll() {
        if (!markers.length) return;

        const bounds = new maps.LatLngBounds();

        markers.forEach((m) => {
          const pos = m.getPosition();
          if (pos) {
            bounds.extend(pos);
          }
        });

        map.fitBounds(bounds, 48);
      },
            onPick(cb) {
        pickCb = cb;

        if (cb && !clickListener) {
          clickListener = map.addListener(
            'click',
            (e: google.maps.MapMouseEvent) => {
              if (e.latLng && pickCb) {
                pickCb({
                  lat: e.latLng.lat(),
                  lng: e.latLng.lng(),
                });
              }
            }
          );
        }

        if (!cb && clickListener) {
          maps.event.removeListener(clickListener);
          clickListener = null;
        }
      },

      destroy() {
        markers.forEach((m) => m.setMap(null));

        if (polyline) {
          polyline.setMap(null);
          polyline = null;
        }

        if (clickListener) {
          maps.event.removeListener(clickListener);
          clickListener = null;
        }

        el.innerHTML = '';
      },
    };

    return handle;
  },

  async search(query) {
    const maps = await loadGoogleMaps(['places']);

    const service = new maps.places.AutocompleteService();

    const predictions =
      await new Promise<google.maps.places.AutocompletePrediction[]>(
        (resolve) => {
          service.getPlacePredictions(
  {
    input: query,
  },
  (
    res,
    status
  ) => {
    if (status === 'OK' && res) {
      resolve(res);
    } else {
      resolve([]);
    }
  }
);
        }
      );

    const geocoder = new maps.Geocoder();

    const results: SearchResult[] = [];

    for (const p of predictions.slice(0, 5)) {
      try {
        const { results: geo } =
          await geocoder.geocode({
            placeId: p.place_id,
          });

        const loc = geo?.[0]?.geometry?.location;

        if (loc) {
          results.push({
            label: p.description,
            lat: loc.lat(),
            lng: loc.lng(),
          });
        }
      } catch {
        // Ignore failed geocoding
      }
    }

    return results;
  },
    async reverseGeocode(p) {
    const maps = await loadGoogleMaps();

    const geocoder = new maps.Geocoder();

    try {
      const { results } = await geocoder.geocode({
        location: p,
      });

      return results?.[0]?.formatted_address ?? null;
    } catch {
      return null;
    }
  },

  async route(from, to) {
    // Menghindari penggunaan Google Directions API
    // agar tidak menambah biaya. Polyline akan
    // menggunakan breadcrumb GPS dari backend.
    return [from, to];
  },
};
