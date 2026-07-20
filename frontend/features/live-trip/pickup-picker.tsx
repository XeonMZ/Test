'use client';

import { Crosshair, Loader2, MapPin, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useMapProvider } from '@/features/map/registry';
import type { MapHandle, MapPoint, SearchResult } from '@/features/map/types';

export type PickedLocation = { label: string; lat: string; lng: string };

/**
 * Location field for the booking wizard — provider-agnostic (Provider
 * Pattern). Type a label manually, or open the picker to use 📍 current
 * location, tap the map to drop a pin, or search an address. The map engine
 * (Google / OSM MapLibre / Beta mock) loads ONLY when the picker opens.
 * Reverse-geocode runs once per pin drop and only when no label was typed —
 * stored coordinates are never re-geocoded.
 */
export function PickupPicker({ title, value, onChange, accent }: { title: string; value: PickedLocation; onChange: (v: PickedLocation) => void; accent: 'pickup' | 'drop' }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const mapDiv = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<MapHandle | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const { provider, config } = useMapProvider();
  const color = accent === 'pickup' ? '#2563eb' : '#dc2626';

  const fieldInput = 'min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100';

  function place(lat: number, lng: number, label?: string) {
    const current = valueRef.current;
    onChange({ label: label ?? current.label, lat: lat.toFixed(7), lng: lng.toFixed(7) });
    handleRef.current?.setPoints([{ lat, lng, kind: accent, label: label ?? current.label } as MapPoint]);
    handleRef.current?.panTo({ lat, lng });
    if (!label && !current.label) {
      void provider.reverseGeocode({ lat, lng }).then((address) => {
        if (address) onChange({ label: address, lat: lat.toFixed(7), lng: lng.toFixed(7) });
      });
    }
  }

  useEffect(() => {
    if (!open || handleRef.current || !mapDiv.current) return;
    let cancelled = false;
    setLoading(true);
    const start = value.lat && value.lng ? { lat: Number(value.lat), lng: Number(value.lng) } : null;
    provider
      .mount(mapDiv.current, { center: start, zoom: 14 })
      .then((handle) => {
        if (cancelled) { handle.destroy(); return; }
        handleRef.current = handle;
        if (start) handle.setPoints([{ ...start, kind: accent, label: value.label } as MapPoint]);
        handle.onPick((p) => place(p.lat, p.lng));
      })
      .catch((e: Error) => !cancelled && setMapError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
      handleRef.current?.destroy();
      handleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, provider.id]);

  async function runSearch() {
    if (query.trim().length < 3) return;
    setSearching(true);
    try {
      setResults(await provider.search(query.trim()));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => place(pos.coords.latitude, pos.coords.longitude),
      () => setMapError('Izin lokasi ditolak. Pilih titik pada peta atau cari alamat.'),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  return (
    <div className="space-y-2">
      <input value={value.label} onChange={(e) => onChange({ ...value, label: e.target.value })} placeholder={title} className={fieldInput} aria-label={title} />
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-extrabold transition hover:border-primary hover:text-primary dark:border-slate-700" style={{ color }}>
          <MapPin size={13} /> {value.lat ? `📍 ${Number(value.lat).toFixed(4)}, ${Number(value.lng).toFixed(4)} — ubah` : 'Pilih di peta / lokasi saat ini'}
        </button>
      ) : (
        <div className="space-y-2 rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
          {config.provider === 'beta' ? (
            <p className="rounded-xl bg-amber-100 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-amber-800 dark:bg-amber-950/60 dark:text-amber-200">⚠ Simulation Mode — peta & pencarian bersifat simulasi</p>
          ) : null}
          <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); void runSearch(); }}>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari alamat…" className={fieldInput} aria-label={`Cari alamat untuk ${title}`} />
            <button type="submit" disabled={searching} title="Cari alamat" aria-label="Cari alamat" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-900 text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-800">
              {searching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            </button>
            <button type="button" onClick={useCurrentLocation} title="Gunakan lokasi saat ini" aria-label="Gunakan lokasi saat ini" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary transition hover:bg-primary/20"><Crosshair size={17} /></button>
            <button type="button" onClick={() => setOpen(false)} aria-label="Tutup peta" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-slate-200 text-slate-500 dark:border-slate-700"><X size={15} /></button>
          </form>
          {results.length > 0 ? (
            <ul className="max-h-40 space-y-1 overflow-y-auto" role="listbox" aria-label="Hasil pencarian alamat">
              {results.map((r, i) => (
                <li key={`${r.lat}-${r.lng}-${i}`}>
                  <button type="button" onClick={() => { place(r.lat, r.lng, r.label); setResults([]); setQuery(''); }} className="w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-primary/10 hover:text-primary dark:text-slate-200">
                    📍 {r.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {loading ? <div className="grid h-56 place-items-center rounded-2xl bg-slate-100 dark:bg-slate-900"><Loader2 size={20} className="animate-spin text-slate-400" /></div> : null}
          {mapError ? <p className="text-xs font-bold text-rose-600">{mapError}</p> : null}
          <div ref={mapDiv} className={`${loading ? 'hidden' : ''} relative h-56 w-full overflow-hidden rounded-2xl`} aria-label={`Peta pemilihan ${title}`} role="application" />
          <p className="text-[11px] font-semibold text-slate-400">Klik peta untuk menentukan titik. Koordinat tersimpan otomatis dan tidak di-geocode ulang.</p>
        </div>
      )}
    </div>
  );
}
