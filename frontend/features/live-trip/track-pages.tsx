'use client';

import { ArrowLeft, Bus, Clock3, MapPin, RefreshCw, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminApi, liveTripApi } from '@/services/portal';
import { extractApiError, formatDateTime } from '@/services/stms';
import { Badge, EmptyState, PageHeader, Skeleton } from '@/shared/ui/components';
import { BottomSheet, JastipRow, PassengerRow, manifestPoints } from './driver-live';
import { LiveMap, useTripChannel, type LiveLocation, type MapPoint } from './live-map';

// =====================================================================
// ADMIN / OWNER — LIVE TRIP MONITORING (read-only)
// =====================================================================

export function LiveMonitorPage({ scheduleId, backHref }: { scheduleId: number; backHref: string }) {
  const [live, setLive] = useState<LiveLocation | null>(null);

  const query = useQuery({
    queryKey: ['live-monitor', scheduleId],
    queryFn: () => adminApi.scheduleLive(scheduleId),
    // Snapshot fallback while the trip can still change; a finished or
    // cancelled trip stops polling entirely (T6: no wasted requests).
    refetchInterval: (q) => {
      const status = q.state.data?.trip?.status;
      return status === 'completed' || status === 'cancelled' ? false : 15_000;
    },
    placeholderData: keepPreviousData,
  });
  const data = query.data;
  const tripActive = data?.trip?.active ?? false;

  useTripChannel(tripActive ? data?.trip?.id ?? null : null, setLive);

  const mapData = useMemo(() => (data ? manifestPoints(data, live) : { points: [], path: [] }), [data, live]);

  if (query.isLoading) return <div className="space-y-4"><Skeleton className="h-72" /><Skeleton className="h-40" /></div>;
  if (query.isError || !data) return <EmptyState title="Gagal memuat monitoring" description={extractApiError(query.error, 'Terjadi kesalahan.')} />;

  const s = data.schedule;
  return (
    <div className="space-y-4 pb-[58vh] lg:pb-0">
      <PageHeader
        title="Live Trip Monitoring"
        description={`${s?.route?.origin ?? '—'} → ${s?.route?.destination ?? '—'} · berangkat ${s?.departure_at ? formatDateTime(s.departure_at) : '—'} · Driver ${data.driver?.name ?? '—'} · ${data.vehicle ? `${data.vehicle.brand} ${data.vehicle.plate_number}` : '—'}. Mode pantau — posisi driver tidak dapat diubah dari sini.`}
        actions={
          <Link href={backHref} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-semibold uppercase tracking-button text-slate-700 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-200">
            <ArrowLeft size={16} /> Kembali
          </Link>
        }
      />

      <div className="relative">
        <LiveMap points={mapData.points} path={mapData.path} center={mapData.points.find((p: MapPoint) => p.kind === 'driver') ?? null} className="h-[44vh] min-h-72 w-full lg:h-[50vh]" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <Badge tone={tripActive ? 'success' : data.trip?.status === 'completed' ? 'neutral' : 'warning'}>
            {tripActive ? '🟢 On Trip' : data.trip?.status === 'completed' ? 'Selesai' : data.trip ? data.trip.status : 'Trip belum dimulai'}
          </Badge>
          {data.location ? <Badge tone="neutral">Update {formatDateTime((live ?? data.location).recorded_at)}</Badge> : null}
        </div>
        <button onClick={() => query.refetch()} aria-label="Refresh" className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-md bg-white/95 text-slate-700 shadow-md dark:bg-slate-900/95 dark:text-slate-200">
          <RefreshCw size={17} className={query.isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      <BottomSheet title={`Manifest — ${data.bookings.length} penumpang · ${data.jastip.length} paket`}>
        <div className="space-y-3">
          <p className="text-xs font-extrabold uppercase tracking-button text-slate-500">Manifest Customer ({data.bookings.length})</p>
          {data.bookings.length === 0 ? <p className="text-sm font-semibold text-slate-500">Belum ada penumpang aktif.</p> : null}
          {data.bookings.map((b) => <PassengerRow key={b.id} b={b} internal />)}

          <p className="pt-2 text-xs font-extrabold uppercase tracking-button text-slate-500">Manifest Paket ({data.jastip.length})</p>
          {data.jastip.length === 0 ? <p className="text-sm font-semibold text-slate-500">Tidak ada paket pada trip ini.</p> : null}
          {data.jastip.map((j) => <JastipRow key={j.id} j={j} />)}
        </div>
      </BottomSheet>
    </div>
  );
}

// =====================================================================
// CUSTOMER — TRACK DRIVER (own booking only, active trip only)
// =====================================================================

export function CustomerTrackPage({ bookingUuid }: { bookingUuid: string }) {
  const [live, setLive] = useState<LiveLocation | null>(null);

  const query = useQuery({
    queryKey: ['customer-track', bookingUuid],
    queryFn: () => liveTripApi.customerTrack(bookingUuid),
    refetchInterval: (q) => (q.state.data?.active ? 15_000 : false), // stop polling once closed
  });
  const data = query.data;

  useTripChannel(data?.active ? data.trip?.id ?? null : null, setLive);

  const points = useMemo(() => {
    if (!data?.active || !data.booking) return [] as MapPoint[];
    const pts: MapPoint[] = [];
    const loc = live ?? data.location ?? null;
    if (loc) pts.push({ lat: loc.lat, lng: loc.lng, kind: 'driver', label: 'Driver' });
    if (data.booking.pickup.lat != null && data.booking.pickup.lng != null) pts.push({ lat: data.booking.pickup.lat, lng: data.booking.pickup.lng, kind: 'pickup', label: 'Titik jemput', done: data.booking.picked_up_at != null });
    if (data.booking.drop.lat != null && data.booking.drop.lng != null) pts.push({ lat: data.booking.drop.lat, lng: data.booking.drop.lng, kind: 'drop', label: 'Tujuan' });
    return pts;
  }, [data, live]);

  const path = useMemo(() => {
    const base = data?.path ?? [];
    return live ? [...base, { lat: live.lat, lng: live.lng }] : base;
  }, [data, live]);

  if (query.isLoading) return <div className="space-y-4"><Skeleton className="h-80" /><Skeleton className="h-32" /></div>;
  if (query.isError) return <EmptyState title="Tidak dapat melacak" description={extractApiError(query.error, 'Booking tidak ditemukan atau bukan milik Anda.')} />;

  // Trip not started or finished → tracking closed.
  if (!data?.active) {
    return (
      <EmptyState
        title={data?.completed || data?.trip_status === 'completed' ? 'Trip Completed 🎉' : 'Tracking belum tersedia'}
        description={data?.completed || data?.trip_status === 'completed' ? 'Perjalanan Anda telah selesai. Terima kasih telah bepergian bersama kami!' : 'Tombol Track Driver aktif ketika driver sudah memulai perjalanan.'}
      />
    );
  }

  const statusLabel = data.booking?.dropped_off_at ? 'Sudah diantar' : data.booking?.picked_up_at ? 'Dalam perjalanan' : 'Driver menuju titik jemput';

  return (
    <div className="space-y-4 pb-[44vh] lg:pb-0">
      <div className="relative">
        <LiveMap points={points} path={path} center={points.find((p) => p.kind === 'driver') ?? null} className="h-[52vh] min-h-80 w-full lg:h-[56vh]" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <Badge tone="success">🟢 Live</Badge>
          <Badge tone="warning">{statusLabel}</Badge>
        </div>
      </div>

      {/* Driver card — no manifest, no other customers, no packages. */}
      <BottomSheet title="Info perjalanan">
        <div className="flex flex-wrap items-center gap-4">
          {data.driver?.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.driver.photo} alt={`Foto driver ${data.driver.name ?? ''}`} className="h-16 w-16 rounded-2xl object-cover ring-2 ring-primary/30" />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-lg bg-primary/10 text-primary"><UserRound size={26} /></span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">{data.driver?.name ?? 'Driver'}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-slate-500">
              <span className="inline-flex items-center gap-1"><Bus size={13} /> {data.vehicle?.brand ?? '—'} · {data.vehicle?.plate_number ?? '—'}</span>
              <span className="inline-flex items-center gap-1"><MapPin size={13} /> {data.route ? `${data.route.origin} → ${data.route.destination}` : '—'}</span>
            </p>
          </div>
          {data.eta_minutes != null ? (
            <div className="rounded-lg bg-primary/10 px-4 py-2.5 text-center">
              <p className="flex items-center gap-1.5 text-lg font-extrabold text-primary"><Clock3 size={16} /> ± {data.eta_minutes} mnt</p>
              <p className="text-[10px] font-bold uppercase tracking-button text-slate-500">Perkiraan tiba</p>
            </div>
          ) : null}
        </div>
        <p className="mt-3 text-xs font-semibold text-slate-400">Posisi diperbarui otomatis setiap ±12 detik selama perjalanan berlangsung. Booking <span className="font-mono font-bold">{data.booking?.code}</span>.</p>
      </BottomSheet>
    </div>
  );
}
