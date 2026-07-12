'use client';

import { ArrowRight, CalendarDays, Loader2, MapPin, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRoutes } from '@/services/stms';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Landing hero search. Options come from the live catalog endpoint;
 * submitting hands the query straight to the booking wizard.
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
    <div className="glass-panel rounded-[2rem] p-6 shadow-soft">
      <div className="rounded-[1.5rem] bg-slate-950 p-6 text-white">
        <p className="font-display text-2xl font-bold">Pesan perjalanan berikutnya</p>
        <p className="mt-2 text-slate-300">Cari rute, jadwal, dan ketersediaan kursi secara real-time.</p>
      </div>

      <form className="mt-6 grid gap-4" aria-label="Pencarian jadwal" onSubmit={submit}>
        <label className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          <span className="flex items-center gap-2 text-sm font-bold text-slate-500"><MapPin size={16} /> Kota asal</span>
          <select value={origin} onChange={(e) => setOrigin(e.target.value)} className="mt-2 w-full bg-transparent text-lg font-bold outline-none dark:text-white" aria-label="Kota asal">
            <option value="">Semua kota asal</option>
            {origins.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
        </label>

        <label className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          <span className="flex items-center gap-2 text-sm font-bold text-slate-500"><MapPin size={16} /> Kota tujuan</span>
          <select value={destination} onChange={(e) => setDestination(e.target.value)} className="mt-2 w-full bg-transparent text-lg font-bold outline-none dark:text-white" aria-label="Kota tujuan">
            <option value="">Semua tujuan</option>
            {destinations.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
        </label>

        <label className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          <span className="flex items-center gap-2 text-sm font-bold text-slate-500"><CalendarDays size={16} /> Tanggal berangkat</span>
          <input type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} className="mt-2 w-full bg-transparent text-lg font-bold outline-none dark:text-white" aria-label="Tanggal berangkat" />
        </label>

        <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-extrabold text-white shadow-sm shadow-primary/20 transition hover:bg-primary/90">
          {routesQuery.isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          Cari ketersediaan <ArrowRight size={16} />
        </button>

        {unavailable ? (
          <p className="text-center text-xs font-semibold text-slate-500">Daftar rute belum dapat dimuat. Kamu tetap bisa mencari langsung di halaman booking.</p>
        ) : null}
      </form>
    </div>
  );
}
