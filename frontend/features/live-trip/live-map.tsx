'use client';

import { useEffect, useRef, useState } from 'react';
import { useMapProvider } from '@/features/map/registry';
import type { LatLng, MapHandle, MapPoint } from '@/features/map/types';
import { echoManager } from '@/shared/realtime/echo-manager';

// =====================================================================
// Shared live-trip map — now provider-agnostic (Provider Pattern).
// The concrete engine (Google / OSM+MapLibre / Beta mock) is resolved by
// the backend and looked up in the registry; this component's public API
// is unchanged, so every existing page (driver live, monitor, customer
// track) works without modification.
// Realtime stays on Reverb: private `trip.{id}`, 12s polling fallback.
// =====================================================================

export type { LatLng, MapPoint } from '@/features/map/types';

/**
 * Imperative map wrapper: markers + path reconcile on prop change through the
 * active provider's handle. Shows an unmistakable badge when Beta/Simulation
 * mode is active, and a notice when beta was requested but is disabled.
 */
export function LiveMap({ points, path, center, className }: { points: MapPoint[]; path: LatLng[]; center?: LatLng | null; className?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<MapHandle | null>(null);
  const didFitRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const { provider, config } = useMapProvider();

  useEffect(() => {
    let cancelled = false;
    if (!containerRef.current || handleRef.current) return;
    provider
      .mount(containerRef.current, { center: center ?? null })
      .then((handle) => {
        if (cancelled) { handle.destroy(); return; }
        handleRef.current = handle;
        setReady(true);
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
      handleRef.current?.destroy();
      handleRef.current = null;
    };
    // Provider identity is stable for the page's lifetime (config cached 60s).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider.id]);

  useEffect(() => {
    const handle = handleRef.current;
    if (!ready || !handle) return;
    handle.setPoints(points);
    handle.setPath(path);
    if (!didFitRef.current && points.length > 0) {
      handle.fitAll();
      didFitRef.current = true;
    } else {
      const driver = points.find((p) => p.kind === 'driver');
      if (driver && Number.isFinite(driver.lat)) handle.panTo({ lat: driver.lat, lng: driver.lng });
    }
  }, [ready, points, path]);

  if (error) {
    return (
      <div className={`grid place-items-center rounded-3xl bg-slate-100 p-6 text-center dark:bg-slate-900 ${className ?? ''}`}>
        <p className="text-sm font-bold text-slate-500">{error}</p>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-slate-100 dark:bg-slate-900 ${className ?? ''}`}>
      <div ref={containerRef} className="absolute inset-0" aria-label="Peta perjalanan" role="application" />
      {config.provider === 'beta' ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center pt-2">
          <span className="rounded-2xl bg-amber-500 px-4 py-1.5 text-sm font-extrabold uppercase tracking-wide text-white shadow-lg">⚠ SIMULATION MODE</span>
        </div>
      ) : null}
      {config.beta_blocked && config.message ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center pb-2">
          <span className="rounded-2xl bg-slate-900/85 px-4 py-1.5 text-xs font-bold text-white shadow-lg">{config.message}</span>
        </div>
      ) : null}
    </div>
  );
}

export type LiveLocation = { lat: number; lng: number; recorded_at: string; speed?: number | null; heading?: number | null };

/**
 * Realtime driver position for one trip. WebSocket-first (private
 * `trip.{tripId}`, event `driver.location.updated`, Laravel Reverb); the
 * caller keeps its 12-second snapshot polling as fallback. Subscription lives
 * only while the consuming page is mounted.
 */
export function useTripChannel(tripId: number | null | undefined, onLocation: (loc: LiveLocation) => void) {
  const handlerRef = useRef(onLocation);
  handlerRef.current = onLocation;

  useEffect(() => {
    if (!tripId) return;
    const echo = echoManager.connect();
    if (!echo) return;
    const channelName = `trip.${tripId}`;
    try {
      const channel = echo.private(channelName);
      channel.listen('.driver.location.updated', (payload: { latitude: number; longitude: number; recorded_at: string }) => {
        handlerRef.current({ lat: Number(payload.latitude), lng: Number(payload.longitude), recorded_at: payload.recorded_at });
      });
      return () => { echo.leave(channelName); };
    } catch {
      return; // socket unavailable → polling fallback covers it
    }
  }, [tripId]);
}
