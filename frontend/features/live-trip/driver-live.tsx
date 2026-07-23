'use client';

import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
  MapPin,
  Navigation,
  Package,
  Phone,
  RefreshCw,
  UserRound,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { navigationUrl } from '@/lib/google-maps';
import { liveTripApi, type LiveBookingManifest, type LiveJastipManifest, type LiveManifest } from '@/services/portal';
import { extractApiError, formatDateTime } from '@/services/stms';
import { useToast } from '@/shared/providers/toast-provider';
import { Badge, EmptyState, Skeleton } from '@/shared/ui/components';
import { LiveMap, useTripChannel, type LiveLocation, type MapPoint } from './live-map';

// =====================================================================
// Shared manifest helpers (driver live page + admin/owner monitor)
// =====================================================================

const actionBtn = 'inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-extrabold text-slate-600 transition hover:border-primary hover:text-primary disabled:opacity-50 dark:border-slate-800 dark:text-slate-300';

export function manifestPoints(data: LiveManifest, live: LiveLocation | null): { points: MapPoint[]; path: Array<{ lat: number; lng: number }> } {
  const points: MapPoint[] = [];
  const loc = live ?? data.location ?? null;
  if (loc) points.push({ lat: loc.lat, lng: loc.lng, kind: 'driver', label: 'Driver' });
  for (const b of data.bookings) {
    if (b.pickup.lat != null && b.pickup.lng != null) points.push({ lat: b.pickup.lat, lng: b.pickup.lng, kind: 'pickup', label: `Jemput: ${b.name ?? b.code}`, done: b.picked_up_at != null });
    if (b.drop.lat != null && b.drop.lng != null) points.push({ lat: b.drop.lat, lng: b.drop.lng, kind: 'drop', label: `Tujuan: ${b.name ?? b.code}`, done: b.dropped_off_at != null });
  }
  for (const j of data.jastip) {
    if (j.pickup.lat != null && j.pickup.lng != null) points.push({ lat: j.pickup.lat, lng: j.pickup.lng, kind: 'jastip', label: `Paket ambil: ${j.code}`, done: j.picked_up_at != null });
    if (j.drop.lat != null && j.drop.lng != null) points.push({ lat: j.drop.lat, lng: j.drop.lng, kind: 'jastip', label: `Paket antar: ${j.code}`, done: j.delivered_at != null });
  }
  const path = [...data.path];
  if (live) path.push({ lat: live.lat, lng: live.lng });
  return { points, path };
}

export function CallLink({ phone, label }: { phone?: string | null; label: string }) {
  if (!phone) return null;
  return (
    <a href={`tel:${phone}`} className={actionBtn} aria-label={`${label} ${phone}`}>
      <Phone size={13} /> {label}
    </a>
  );
}

export function NavLink({ lat, lng }: { lat?: number | null; lng?: number | null }) {
  if (lat == null || lng == null) return null;
  return (
    <a href={navigationUrl(lat, lng)} target="_blank" rel="noopener noreferrer" className={actionBtn}>
      <Navigation size={13} /> Navigasi
    </a>
  );
}

export function PassengerRow({ b, actions, internal }: { b: LiveBookingManifest; actions?: ReactNode; internal?: boolean }) {
  const [open, setOpen] = useState(false);
  const status = b.dropped_off_at ? { label: 'Diantar', tone: 'success' as const } : b.picked_up_at ? { label: 'Dijemput', tone: 'warning' as const } : { label: 'Belum dijemput', tone: 'neutral' as const };
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-slate-100">
            <UserRound size={15} className="text-primary" /> {b.name ?? '—'}
            <Badge tone={status.tone}>{status.label}</Badge>
            {internal && b.payment_status ? <Badge tone={b.payment_status === 'paid' ? 'success' : 'warning'}>{b.payment_status}</Badge> : null}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            Kursi {b.seats.length > 0 ? b.seats.join(', ') : '—'} · <span className="font-mono">{b.code}</span>
            {internal && b.email ? <span className="block">{b.email}</span> : null}
          </p>
          <p className="mt-1.5 flex items-start gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300"><MapPin size={13} className="mt-0.5 shrink-0 text-blue-600" /> {b.pickup.label ?? 'Titik jemput belum diisi'}</p>
          <p className="mt-1 flex items-start gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300"><MapPin size={13} className="mt-0.5 shrink-0 text-rose-600" /> {b.drop.label ?? 'Titik tujuan belum diisi'}</p>
          {b.note ? <p className="mt-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">📝 {b.note}</p> : null}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <CallLink phone={b.phone} label="Telepon" />
          <NavLink lat={b.picked_up_at ? b.drop.lat : b.pickup.lat} lng={b.picked_up_at ? b.drop.lng : b.pickup.lng} />
          <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className={actionBtn}><Info size={13} /> Detail</button>
          {actions}
        </div>
      </div>
      {open ? (
        <dl className="mt-3 grid gap-x-6 gap-y-1.5 border-t border-slate-100 pt-3 text-xs dark:border-slate-800 sm:grid-cols-2">
          <div><dt className="font-bold uppercase text-slate-400">No. HP</dt><dd className="font-mono font-semibold">{b.phone ?? '—'}</dd></div>
          <div><dt className="font-bold uppercase text-slate-400">Status booking</dt><dd className="font-semibold capitalize">{b.booking_status.replaceAll('_', ' ')}</dd></div>
          <div><dt className="font-bold uppercase text-slate-400">Dijemput</dt><dd className="font-semibold">{b.picked_up_at ? formatDateTime(b.picked_up_at) : '—'}</dd></div>
          <div><dt className="font-bold uppercase text-slate-400">Diantar</dt><dd className="font-semibold">{b.dropped_off_at ? formatDateTime(b.dropped_off_at) : '—'}</dd></div>
        </dl>
      ) : null}
    </div>
  );
}

export function JastipRow({ j, actions }: { j: LiveJastipManifest; actions?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const tone = j.status === 'delivered' ? 'success' : j.status === 'picked_up' ? 'warning' : 'neutral';
  return (
    <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-slate-100">
            <Package size={15} className="text-amber-600" /> {j.item_name}
            <Badge tone={tone}><span className="capitalize">{j.status.replaceAll('_', ' ')}</span></Badge>
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">Resi <span className="font-mono">{j.code}</span> · {j.sender_name ?? '—'} → {j.receiver_name ?? '—'}</p>
          <p className="mt-1.5 flex items-start gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300"><MapPin size={13} className="mt-0.5 shrink-0 text-amber-600" /> Ambil: {j.pickup.label ?? '—'}</p>
          <p className="mt-1 flex items-start gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300"><MapPin size={13} className="mt-0.5 shrink-0 text-rose-600" /> Antar: {j.drop.label ?? '—'}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <CallLink phone={j.sender_phone} label="Pengirim" />
          <CallLink phone={j.receiver_phone} label="Penerima" />
          <NavLink lat={j.picked_up_at ? j.drop.lat : j.pickup.lat} lng={j.picked_up_at ? j.drop.lng : j.pickup.lng} />
          <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className={actionBtn}><Info size={13} /> Detail</button>
          {actions}
        </div>
      </div>
      {open ? (
        <dl className="mt-3 grid gap-x-6 gap-y-1.5 border-t border-amber-100 pt-3 text-xs dark:border-amber-900/50 sm:grid-cols-2">
          <div><dt className="font-bold uppercase text-slate-400">HP Pengirim</dt><dd className="font-mono font-semibold">{j.sender_phone ?? '—'}</dd></div>
          <div><dt className="font-bold uppercase text-slate-400">HP Penerima</dt><dd className="font-mono font-semibold">{j.receiver_phone ?? '—'}</dd></div>
          <div><dt className="font-bold uppercase text-slate-400">Diambil</dt><dd className="font-semibold">{j.picked_up_at ? formatDateTime(j.picked_up_at) : '—'}</dd></div>
          <div><dt className="font-bold uppercase text-slate-400">Diantar</dt><dd className="font-semibold">{j.delivered_at ? formatDateTime(j.delivered_at) : '—'}</dd></div>
        </dl>
      ) : null}
    </div>
  );
}

/** Gojek-style bottom sheet: fixed on mobile with drag-toggle, inline card on desktop. */
export function BottomSheet({ children, title }: { children: ReactNode; title: string }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <section
      aria-label={title}
      className="fixed inset-x-0 bottom-0 z-30 mx-auto max-h-[62vh] w-full max-w-3xl rounded-t-3xl border border-b-0 border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 lg:static lg:max-h-none lg:rounded-2xl lg:border-b lg:shadow-none"
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full flex-col items-center gap-1 px-5 pb-2 pt-3 lg:hidden"
      >
        <span className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
        <span className="flex items-center gap-1 text-xs font-extrabold text-slate-500">{title} {expanded ? <ChevronDown size={13} /> : <ChevronUp size={13} />}</span>
      </button>
      <div className={`${expanded ? 'block' : 'hidden'} max-h-[52vh] overflow-y-auto px-4 pb-6 pt-1 lg:block lg:max-h-none lg:p-6`}>{children}</div>
    </section>
  );
}

// =====================================================================
// DRIVER LIVE TRIP PAGE
// =====================================================================

const TRIP_ACTIVE = ['started', 'pickup', 'boarding', 'on_route', 'drop_off'];
const BEACON_INTERVAL_MS = 12_000; // 10–15s window; matches backend policy

export function DriverLiveTripPage({ tripId }: { tripId: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [live, setLive] = useState<LiveLocation | null>(null);
  const watchRef = useRef<{ pos: GeolocationPosition | null; timer: ReturnType<typeof setInterval> | null; watchId: number | null }>({ pos: null, timer: null, watchId: null });

  const query = useQuery({
    queryKey: ['driver-live-manifest', tripId],
    queryFn: () => liveTripApi.driverManifest(tripId),
    refetchInterval: 30_000, // manifest refresh (statuses); location rides the socket
    placeholderData: keepPreviousData,
  });
  const data = query.data;
  const active = data?.trip?.active ?? false;

  useTripChannel(active ? tripId : null, setLive);

  // GPS beacon: watchPosition caches the freshest fix; a 12s interval posts it
  // to the existing /driver/location endpoint — only while the trip is active.
  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !navigator.geolocation) return;
    const state = watchRef.current;
    state.watchId = navigator.geolocation.watchPosition((pos) => { state.pos = pos; }, () => undefined, { enableHighAccuracy: true, maximumAge: 5_000 });
    const send = () => {
      const pos = state.pos;
      if (!pos) return;
      setLive({ lat: pos.coords.latitude, lng: pos.coords.longitude, recorded_at: new Date().toISOString() });
      void liveTripApi.driverSendLocation({
        trip_id: tripId,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        ...(pos.coords.speed != null ? { speed: pos.coords.speed } : {}),
        ...(pos.coords.heading != null && !Number.isNaN(pos.coords.heading) ? { heading: pos.coords.heading } : {}),
        ...(pos.coords.accuracy != null ? { accuracy: pos.coords.accuracy } : {}),
      }).catch(() => undefined);
    };
    send();
    state.timer = setInterval(send, BEACON_INTERVAL_MS);
    return () => {
      // Trip finished / page left → beacon stops immediately.
      if (state.watchId != null) navigator.geolocation.clearWatch(state.watchId);
      if (state.timer) clearInterval(state.timer);
      state.pos = null;
    };
  }, [active, tripId]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['driver-live-manifest', tripId] });

  const pickupMutation = useMutation({
    mutationFn: (bookingId: number) => liveTripApi.driverPickup(tripId, bookingId),
    onSuccess: () => { toast('Penumpang ditandai dijemput.', 'success'); refresh(); },
    onError: (error) => toast(extractApiError(error, 'Gagal memperbarui status.'), 'error'),
  });
  const dropoffMutation = useMutation({
    mutationFn: (bookingId: number) => liveTripApi.driverDropoff(tripId, bookingId),
    onSuccess: () => { toast('Penumpang ditandai diantar.', 'success'); refresh(); },
    onError: (error) => toast(extractApiError(error, 'Gagal memperbarui status.'), 'error'),
  });
  const jastipMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'picked_up' | 'delivered' }) => liveTripApi.driverJastipStatus(id, status),
    onSuccess: () => { toast('Status paket diperbarui.', 'success'); refresh(); },
    onError: (error) => toast(extractApiError(error, 'Gagal memperbarui paket.'), 'error'),
  });

  const mapData = useMemo(() => (data ? manifestPoints(data, live) : { points: [], path: [] }), [data, live]);

  if (query.isLoading) return <div className="space-y-4"><Skeleton className="h-72" /><Skeleton className="h-40" /></div>;
  if (query.isError || !data) return <EmptyState title="Gagal memuat trip" description={extractApiError(query.error, 'Terjadi kesalahan.')} />;

  const remaining = data.bookings.filter((b) => !b.dropped_off_at).length;

  return (
    <div className="space-y-4 pb-[58vh] lg:pb-0">
      {/* ------- Map (full width, top) ------- */}
      <div className="relative">
        <LiveMap points={mapData.points} path={mapData.path} center={mapData.points.find((p) => p.kind === 'driver') ?? null} className="h-[46vh] min-h-72 w-full lg:h-[52vh]" />
        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
          <Badge tone={active ? 'success' : 'neutral'}>{active ? '🟢 Live' : data.trip?.status === 'completed' ? 'Selesai' : data.trip?.status ?? 'Belum mulai'}</Badge>
          <Badge tone="neutral">{data.route ? `${data.route.origin} → ${data.route.destination}` : '—'}</Badge>
        </div>
        <button onClick={() => query.refetch()} aria-label="Refresh manifest" className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-md bg-white/95 text-slate-700 shadow-md dark:bg-slate-900/95 dark:text-slate-200">
          <RefreshCw size={17} className={query.isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ------- Bottom sheet: manifest ------- */}
      <BottomSheet title={`Manifest — ${remaining} penumpang belum diantar`}>
        <div className="space-y-3">
          <p className="text-xs font-extrabold uppercase tracking-button text-slate-500">Penumpang ({data.bookings.length})</p>
          {data.bookings.length === 0 ? <p className="text-sm font-semibold text-slate-500">Belum ada penumpang aktif pada jadwal ini.</p> : null}
          {data.bookings.map((b) => (
            <PassengerRow
              key={b.id}
              b={b}
              internal={false}
              actions={
                active ? (
                  !b.picked_up_at ? (
                    <button onClick={() => pickupMutation.mutate(b.id)} disabled={pickupMutation.isPending} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-extrabold text-white hover:bg-emerald-700 disabled:opacity-60">
                      {pickupMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Dijemput
                    </button>
                  ) : !b.dropped_off_at ? (
                    <button onClick={() => dropoffMutation.mutate(b.id)} disabled={dropoffMutation.isPending} className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold uppercase tracking-button text-white hover:bg-primary-deep disabled:opacity-60">
                      {dropoffMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Diantar
                    </button>
                  ) : null
                ) : null
              }
            />
          ))}

          <p className="pt-2 text-xs font-extrabold uppercase tracking-button text-slate-500">Paket / Jastip ({data.jastip.length})</p>
          {data.jastip.length === 0 ? <p className="text-sm font-semibold text-slate-500">Tidak ada paket untuk trip ini.</p> : null}
          {data.jastip.map((j) => (
            <JastipRow
              key={j.id}
              j={j}
              actions={
                active ? (
                  j.status !== 'picked_up' && !j.picked_up_at ? (
                    <button onClick={() => jastipMutation.mutate({ id: j.id, status: 'picked_up' })} disabled={jastipMutation.isPending} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-amber-600 px-3 text-xs font-extrabold text-white hover:bg-amber-700 disabled:opacity-60">
                      <CheckCircle2 size={13} /> Diambil
                    </button>
                  ) : j.status !== 'delivered' ? (
                    <button onClick={() => jastipMutation.mutate({ id: j.id, status: 'delivered' })} disabled={jastipMutation.isPending} className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold uppercase tracking-button text-white hover:bg-primary-deep disabled:opacity-60">
                      <CheckCircle2 size={13} /> Diantar
                    </button>
                  ) : null
                ) : null
              }
            />
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}
