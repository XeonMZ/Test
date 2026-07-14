'use client';

import { clsx } from 'clsx';
import { ArrowRight, BusFront, CalendarDays, Clock, LogIn, MapPin, RefreshCw, Search, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { extractApiError, fetchRoutes, fetchSchedules, formatIDR, formatTime, type CatalogSchedule } from '@/services/stms';
import { useAuth } from '@/shared/providers/auth-provider';
import { AppCard, EmptyState, PageHeader, SectionHeader, Skeleton } from '@/shared/ui/components';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Public schedule browser. Anyone (including guests) can search and view
 * available departures. Booking a seat requires signing in — the "Pesan"
 * button routes guests to /login and carries the search context forward.
 */
export function PublicSchedules() {
  const router = useRouter();
  const params = useSearchParams();
  const { isAuthenticated } = useAuth();

  const [origin, setOrigin] = useState(params.get('origin') ?? '');
  const [destination, setDestination] = useState(params.get('destination') ?? '');
  const [date, setDate] = useState(params.get('date') ?? todayISO());
  const [submitted, setSubmitted] = useState(Boolean(params.get('origin') || params.get('destination') || params.get('date')));

  const routesQuery = useQuery({ queryKey: ['catalog-routes'], queryFn: fetchRoutes, staleTime: 5 * 60_000 });
  const schedulesQuery = useQuery({
    queryKey: ['catalog-schedules', origin, destination, date],
    queryFn: () => fetchSchedules({ origin, destination, date }),
    enabled: submitted,
  });

  const origins = useMemo(() => Array.from(new Set((routesQuery.data ?? []).map((r) => r.origin))).sort(), [routesQuery.data]);
  const destinations = useMemo(
    () => Array.from(new Set((routesQuery.data ?? []).filter((r) => (origin ? r.origin === origin : true)).map((r) => r.destination))).sort(),
    [routesQuery.data, origin],
  );

  function goBook(schedule: CatalogSchedule) {
    const qs = new URLSearchParams();
    if (schedule.route?.origin) qs.set('origin', schedule.route.origin);
    if (schedule.route?.destination) qs.set('destination', schedule.route.destination);
    if (schedule.departure_at) qs.set('date', schedule.departure_at.slice(0, 10));
    const target = `/booking?${qs.toString()}`;
    // Guests must sign in first; carry the intended destination via ?next=.
    router.push(isAuthenticated ? target : `/login?next=${encodeURIComponent(target)}`);
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Jadwal Tersedia"
        description="Cari dan lihat jadwal keberangkatan. Untuk memesan kursi, kamu perlu masuk terlebih dahulu."
        actions={
          !isAuthenticated ? (
            <Link href="/login" className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-extrabold text-white shadow-sm shadow-primary/20 transition hover:bg-primary/90">
              <LogIn size={16} /> Masuk untuk memesan
            </Link>
          ) : null
        }
      />

      <AppCard>
        <SectionHeader title="Cari jadwal" description="Filter berdasarkan kota asal, tujuan, dan tanggal keberangkatan." />
        <form
          className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
            schedulesQuery.refetch();
          }}
        >
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200"><MapPin size={15} /> Kota asal</span>
            <select value={origin} onChange={(e) => setOrigin(e.target.value)} className={inputClass} aria-label="Kota asal">
              <option value="">Semua kota asal</option>
              {origins.map((city) => <option key={city} value={city}>{city}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200"><MapPin size={15} /> Kota tujuan</span>
            <select value={destination} onChange={(e) => setDestination(e.target.value)} className={inputClass} aria-label="Kota tujuan">
              <option value="">Semua tujuan</option>
              {destinations.map((city) => <option key={city} value={city}>{city}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200"><CalendarDays size={15} /> Tanggal</span>
            <input type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} aria-label="Tanggal keberangkatan" />
          </label>
          <button type="submit" className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-extrabold text-white shadow-sm shadow-primary/20 transition hover:bg-primary/90">
            <Search size={16} /> Cari
          </button>
        </form>
      </AppCard>

      {!submitted ? (
        <EmptyState title="Mulai pencarian" description="Pilih kota asal, tujuan, dan tanggal untuk melihat jadwal yang tersedia." />
      ) : schedulesQuery.isLoading ? (
        <div className="space-y-3"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
      ) : schedulesQuery.isError ? (
        <AppCard>
          <SectionHeader title="Gagal memuat jadwal" description={extractApiError(schedulesQuery.error, 'Terjadi kesalahan saat memuat jadwal.')} />
          <button onClick={() => schedulesQuery.refetch()} className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-extrabold text-white"><RefreshCw size={14} /> Coba lagi</button>
        </AppCard>
      ) : (schedulesQuery.data?.length ?? 0) === 0 ? (
        <EmptyState title="Jadwal tidak ditemukan" description="Coba ubah tanggal atau rute pencarian. Jadwal baru ditambahkan oleh admin secara berkala." />
      ) : (
        <ul className="space-y-3">
          {schedulesQuery.data!.map((item) => (
            <li key={item.uuid}>
              <AppCard className="transition hover:border-primary">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-display text-lg font-extrabold text-slate-950 dark:text-white">
                      {item.route?.origin} <ArrowRight size={16} className="text-primary" aria-hidden="true" /> {item.route?.destination}
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">{item.route?.code}</span>
                    </p>
                    <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1.5"><Clock size={14} /> {formatTime(item.departure_at)} – {formatTime(item.arrival_at)}</span>
                      <span className="inline-flex items-center gap-1.5"><BusFront size={14} /> {item.vehicle?.brand} · {item.vehicle?.code}</span>
                      <span className={clsx('inline-flex items-center gap-1.5', item.seats_available === 0 && 'text-rose-600')}><Users size={14} /> {item.seats_available} kursi tersisa</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end">
                    <div className="text-left sm:text-right">
                      <p className="font-display text-xl font-extrabold text-primary">{formatIDR(item.base_fare)}</p>
                      <p className="text-xs font-bold text-slate-400">per kursi</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => goBook(item)}
                      disabled={item.seats_available === 0}
                      className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-primary px-5 text-sm font-extrabold text-white shadow-sm shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {item.seats_available === 0 ? 'Penuh' : isAuthenticated ? 'Pesan' : 'Masuk & pesan'} {item.seats_available > 0 ? <ArrowRight size={15} /> : null}
                    </button>
                  </div>
                </div>
              </AppCard>
            </li>
          ))}
        </ul>
      )}

      {!isAuthenticated ? (
        <p className="text-center text-sm font-semibold text-slate-500">
          Belum punya akun? <Link href="/register" className="font-extrabold text-primary hover:underline">Daftar gratis</Link> untuk mulai memesan.
        </p>
      ) : null}
    </div>
  );
}

const inputClass =
  'min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100';
