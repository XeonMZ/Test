'use client';

import { ArrowRight, CalendarDays, Loader2, MapPin, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRoutes } from '@/services/stms';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Field shell — cloud well with a hairline, sharp 4px, 44px control inside. */
const field = 'rounded-md border border-steel bg-canvas px-4 py-3 transition-colors focus-within:border-primary dark:border-ink-soft dark:bg-ink';
const fieldLabel = 'flex items-center gap-2 text-xs font-semibold uppercase tracking-button text-graphite';
const fieldControl = 'mt-1.5 h-8 w-full cursor-pointer bg-transparent text-base font-medium text-ink outline-none dark:text-white';

/**
 * Landing hero search — DESIGN.md booking card.
 *
 * Solid white paper (no glass/blur), ink header slab, sharp fields, one blue
 * CTA. Options come from the live catalog endpoint; submitting hands the query
 * straight to the schedule browser.
 */
export function HeroSearch() {
  const router = useRouter();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(todayISO());

  const routesQuery = useQuery({ queryKey: ['catalog-routes'], queryFn: fetchRoutes, staleTime: 5 * 60_000, retry: 1 });
  const routes = routesQuery.data ?? [];

  const origins = useMemo(() => Array.from(new Set(routes.map((r) => r.origin))).sort(), [routes]);
  const destinations = useMemo(
    () => Array.from(new Set(routes.filter((r) => (origin ? r.origin === origin : true)).map((r) => r.destination))).sort(),
    [routes, origin],
  );

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (origin) params.set('origin', origin);
    if (destination) params.set('destination', destination);
    if (date) params.set('date', date);
    router.push(`/jadwal?${params.toString()}`);
  }

  const unavailable = routesQuery.isError;

  return (
    <div className="overflow-hidden rounded-2xl bg-canvas shadow-float dark:bg-ink">
      {/* Ink slab header — anchors the card, mirrors the page rhythm */}
      <div className="bg-ink px-6 py-6 text-on-ink">
        <p className="text-xs font-semibold uppercase tracking-button text-primary-bright">Pesan Sekarang</p>
        <p className="mt-3 font-display text-2xl font-medium leading-tight tracking-tight">Perjalanan berikutnya</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">Cari rute, jadwal, dan ketersediaan kursi secara real-time.</p>
      </div>

      <form className="grid gap-3 p-6" aria-label="Pencarian jadwal" onSubmit={submit}>
        <label className={field}>
          <span className={fieldLabel}><MapPin size={13} aria-hidden="true" className="text-primary" /> Kota asal</span>
          <select value={origin} onChange={(e) => setOrigin(e.target.value)} className={fieldControl} aria-label="Kota asal">
            <option value="">Semua kota asal</option>
            {origins.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
        </label>

        <label className={field}>
          <span className={fieldLabel}><MapPin size={13} aria-hidden="true" className="text-primary" /> Kota tujuan</span>
          <select value={destination} onChange={(e) => setDestination(e.target.value)} className={fieldControl} aria-label="Kota tujuan">
            <option value="">Semua tujuan</option>
            {destinations.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
        </label>

        <label className={field}>
          <span className={fieldLabel}><CalendarDays size={13} aria-hidden="true" className="text-primary" /> Tanggal berangkat</span>
          <input type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} className={fieldControl} aria-label="Tanggal berangkat" />
        </label>

        <button
          type="submit"
          className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold uppercase tracking-button text-white transition-colors hover:bg-primary-deep"
        >
          {routesQuery.isLoading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Search size={16} aria-hidden="true" />}
          Cari ketersediaan <ArrowRight size={16} aria-hidden="true" />
        </button>

        {unavailable ? (
          <p className="text-center text-xs leading-relaxed text-graphite">
            Daftar rute belum dapat dimuat. Kamu tetap bisa mencari langsung di halaman jadwal.
          </p>
        ) : null}
      </form>
    </div>
  );
}
