'use client';

import { ArrowLeft, ArrowRight, Award, BadgePercent, Bus, Copy, MapPin, Navigation, Phone, RefreshCw, TicketPercent } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchBookingTracking,
  fetchMembership,
  fetchPromo,
  fetchPromos,
  type Promo,
} from '@/services/portal';
import { extractApiError, fetchCustomerBookings, formatDateTime, formatIDR } from '@/services/stms';
import { useToast } from '@/shared/providers/toast-provider';
import { AppCard, Badge, EmptyState, PageHeader, SectionHeader, Skeleton, StatsCard } from '@/shared/ui/components';

// ============================== PROMO ==============================

export function PromoListPage() {
  const query = useQuery({ queryKey: ['customer-promos'], queryFn: fetchPromos });

  return (
    <div className="space-y-6">
      <PageHeader title="Promo & Voucher" description="Promo aktif langsung dari sistem — masa berlaku dan voucher diperbarui real-time." />

      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-40" /><Skeleton className="h-40" /></div>
      ) : query.isError ? (
        <EmptyState title="Gagal memuat promo" description={extractApiError(query.error, 'Terjadi kesalahan.')} />
      ) : (query.data?.length ?? 0) === 0 ? (
        <EmptyState title="Belum ada promo aktif" description="Promo baru akan muncul di sini begitu diterbitkan." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {query.data!.map((promo) => (
            <li key={promo.uuid}>
              <Link href={`/customer/promo/${promo.uuid}`} className="group block">
                <PromoCard promo={promo} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PromoCard({ promo }: { promo: Promo }) {
  return (
    <AppCard className="relative overflow-hidden transition group-hover:-translate-y-0.5 group-hover:border-primary">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10" aria-hidden="true" />
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><BadgePercent size={20} /></span>
      <h3 className="mt-4 font-display text-xl font-extrabold text-slate-950 dark:text-white">{promo.name}</h3>
      <p className="mt-1 font-mono text-xs font-extrabold tracking-widest text-primary">{promo.code}</p>
      <p className="mt-3 font-display text-2xl font-extrabold text-emerald-600">- {formatIDR(promo.amount)}</p>
      <p className="mt-2 text-xs font-semibold text-slate-500">Berlaku s.d. {formatDateTime(promo.ends_at)}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-extrabold text-primary">Lihat detail <ArrowRight size={14} className="transition group-hover:translate-x-1" /></span>
    </AppCard>
  );
}

export function PromoDetailPage({ id }: { id: string }) {
  const { toast } = useToast();
  const query = useQuery({ queryKey: ['customer-promo', id], queryFn: () => fetchPromo(id) });
  const promo = query.data;

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast(`Kode ${code} disalin.`, 'success');
    } catch {
      toast('Gagal menyalin kode.', 'error');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detail Promo"
        actions={
          <Link href="/customer/promo" className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-extrabold text-slate-700 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-200">
            <ArrowLeft size={15} /> Semua promo
          </Link>
        }
      />

      {query.isLoading ? (
        <Skeleton className="h-64" />
      ) : query.isError ? (
        <EmptyState title="Promo tidak ditemukan" description={extractApiError(query.error, 'Promo tidak dapat dimuat atau sudah berakhir.')} />
      ) : promo ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <AppCard>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><TicketPercent size={22} /></span>
            <h2 className="mt-4 font-display text-2xl font-extrabold text-slate-950 dark:text-white">{promo.name}</h2>
            <p className="mt-2 font-display text-3xl font-extrabold text-emerald-600">Potongan {formatIDR(promo.amount)}</p>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60">
                <dt className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Mulai</dt>
                <dd className="mt-1 font-bold text-slate-900 dark:text-slate-100">{formatDateTime(promo.starts_at)}</dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60">
                <dt className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Berakhir</dt>
                <dd className="mt-1 font-bold text-slate-900 dark:text-slate-100">{formatDateTime(promo.ends_at)}</dd>
              </div>
            </dl>
          </AppCard>
          <AppCard className="h-fit">
            <SectionHeader title="Voucher tersedia" description="Salin kode dan gunakan saat pemesanan." />
            {(promo.vouchers?.length ?? 0) === 0 ? (
              <p className="mt-4 text-sm font-semibold text-slate-500">Tidak ada voucher aktif untuk promo ini.</p>
            ) : (
              <ul className="mt-5 space-y-2">
                {promo.vouchers!.map((voucher) => (
                  <li key={voucher.id} className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3">
                    <span className="font-mono text-sm font-extrabold tracking-widest text-primary">{voucher.code}</span>
                    <button onClick={() => copy(voucher.code)} className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-extrabold text-white transition hover:bg-primary/90">
                      <Copy size={12} /> Salin
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </AppCard>
        </div>
      ) : null}
    </div>
  );
}

// ============================ MEMBERSHIP ============================

const LEVEL_STYLES: Record<string, string> = {
  bronze: 'from-amber-700 to-amber-900',
  silver: 'from-slate-400 to-slate-600',
  gold: 'from-amber-400 to-amber-600',
  platinum: 'from-indigo-400 to-indigo-700',
};

export function MembershipPage() {
  const query = useQuery({ queryKey: ['customer-membership'], queryFn: fetchMembership });
  const data = query.data;

  return (
    <div className="space-y-6">
      <PageHeader title="Membership" description="Level dan poin keanggotaanmu, dihitung dari aktivitas perjalanan nyata." />

      {query.isLoading ? (
        <Skeleton className="h-56" />
      ) : query.isError ? (
        <EmptyState title="Gagal memuat membership" description={extractApiError(query.error, 'Terjadi kesalahan.')} />
      ) : data ? (
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <div className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br p-8 text-white shadow-lg ${LEVEL_STYLES[data.membership.level] ?? LEVEL_STYLES.bronze}`}>
            <Award size={30} className="opacity-90" />
            <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.3em] opacity-80">SJT Member</p>
            <p className="mt-1 font-display text-3xl font-extrabold capitalize">{data.membership.level}</p>
            <div className="mt-8 flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-70">Poin</p>
                <p className="font-display text-2xl font-extrabold">{data.membership.points.toLocaleString('id-ID')}</p>
              </div>
              <p className="text-xs font-semibold opacity-70">Sejak {formatDateTime(data.membership.created_at)}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatsCard label="Perjalanan selesai" value={String(data.completed_trips)} helper="Total perjalanan berstatus selesai" />
            <StatsCard label="Poin aktif" value={data.membership.points.toLocaleString('id-ID')} helper="Poin bertambah dari perjalanan yang diselesaikan" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ============================= TRACKING =============================

const TRACKABLE = ['paid', 'ticket_generated'];

export function TrackingPage() {
  const bookingsQuery = useQuery({ queryKey: ['customer-bookings'], queryFn: fetchCustomerBookings });
  const trackable = useMemo(
    () => (bookingsQuery.data ?? []).filter((b) => TRACKABLE.includes(b.status)),
    [bookingsQuery.data],
  );
  const [selected, setSelected] = useState<string | null>(null);
  const activeUuid = selected ?? trackable[0]?.uuid ?? null;

  const trackingQuery = useQuery({
    queryKey: ['booking-tracking', activeUuid],
    queryFn: () => fetchBookingTracking(activeUuid!),
    enabled: Boolean(activeUuid),
    refetchInterval: 10_000,
  });

  const tracking = trackingQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader title="Lacak Perjalanan" description="Posisi armada diperbarui otomatis setiap 10 detik dari GPS driver." />

      {bookingsQuery.isLoading ? (
        <Skeleton className="h-64" />
      ) : trackable.length === 0 ? (
        <EmptyState title="Tidak ada perjalanan aktif" description="Perjalanan bisa dilacak setelah pembayaran selesai dan sebelum perjalanan berakhir." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <AppCard className="h-fit">
            <SectionHeader title="Perjalanan aktif" />
            <ul className="mt-4 space-y-2">
              {trackable.map((booking) => (
                <li key={booking.uuid}>
                  <button
                    type="button"
                    onClick={() => setSelected(booking.uuid)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${activeUuid === booking.uuid ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-slate-200 hover:border-primary/50 dark:border-slate-800'}`}
                  >
                    <p className="font-extrabold text-slate-900 dark:text-slate-100">{booking.schedule?.route ? `${booking.schedule.route.origin} → ${booking.schedule.route.destination}` : booking.code}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{formatDateTime(booking.schedule?.departure_at)}</p>
                  </button>
                </li>
              ))}
            </ul>
          </AppCard>

          <AppCard>
            <div className="flex items-center justify-between gap-3">
              <SectionHeader title="Status armada" />
              <button onClick={() => trackingQuery.refetch()} className="inline-flex items-center gap-1.5 text-sm font-extrabold text-primary hover:underline">
                <RefreshCw size={14} className={trackingQuery.isFetching ? 'animate-spin' : ''} /> Perbarui
              </button>
            </div>

            {trackingQuery.isLoading ? (
              <Skeleton className="mt-5 h-48" />
            ) : trackingQuery.isError ? (
              <p className="mt-5 text-sm font-semibold text-rose-600">{extractApiError(trackingQuery.error, 'Gagal memuat status perjalanan.')}</p>
            ) : tracking ? (
              <div className="mt-5 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Bus size={22} /></span>
                  <div>
                    <p className="font-extrabold text-slate-900 dark:text-slate-100">{tracking.schedule.vehicle ? `${tracking.schedule.vehicle.brand} · ${tracking.schedule.vehicle.code}` : 'Armada'}</p>
                    <p className="text-xs font-semibold text-slate-500">{tracking.schedule.route ? `${tracking.schedule.route.origin} → ${tracking.schedule.route.destination}` : '—'}</p>
                  </div>
                  <Badge tone={tracking.trip?.status === 'completed' ? 'success' : tracking.trip ? 'warning' : 'neutral'}>
                    {tracking.trip ? `Trip: ${tracking.trip.status.replaceAll('_', ' ')}` : 'Trip belum dimulai'}
                  </Badge>
                </div>

                {/* #1 Driver info card */}
                {tracking.driver ? (
                  <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Driver Anda</p>
                    <div className="mt-3 flex items-center gap-4">
                      {tracking.driver.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={tracking.driver.photo_url} alt={tracking.driver.name ?? 'Driver'} className="h-16 w-16 rounded-2xl object-cover" />
                      ) : (
                        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800"><Bus size={24} /></span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-extrabold text-slate-900 dark:text-slate-100">{tracking.driver.name ?? 'Driver'}</p>
                        {tracking.driver.rating_count > 0 ? (
                          <p className="text-xs font-bold text-amber-500">★ {tracking.driver.rating_avg.toFixed(1)} <span className="text-slate-400">({tracking.driver.rating_count} penilaian)</span></p>
                        ) : null}
                        <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">{tracking.driver.vehicle_name ?? tracking.schedule.vehicle?.brand ?? 'Kendaraan'} {tracking.driver.vehicle_plate ? `· ${tracking.driver.vehicle_plate}` : ''}</p>
                      </div>
                    </div>
                    <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div><dt className="text-xs font-bold uppercase tracking-widest text-slate-400">No. HP</dt><dd className="mt-1 font-bold text-slate-900 dark:text-slate-100">{tracking.driver.phone ?? '—'}</dd></div>
                      <div><dt className="text-xs font-bold uppercase tracking-widest text-slate-400">Plat</dt><dd className="mt-1 font-mono font-bold text-slate-900 dark:text-slate-100">{tracking.driver.vehicle_plate ?? '—'}</dd></div>
                      <div><dt className="text-xs font-bold uppercase tracking-widest text-slate-400">Estimasi tiba</dt><dd className="mt-1 font-bold text-slate-900 dark:text-slate-100">{tracking.eta_minutes !== null ? `${tracking.eta_minutes} mnt` : '—'}</dd></div>
                    </dl>
                    {tracking.driver.phone ? (
                      <a href={`https://wa.me/${(tracking.driver.phone).replace(/[^0-9]/g, '').replace(/^0/, '62')}`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-emerald-700">
                        <Phone size={15} /> Hubungi driver
                      </a>
                    ) : null}
                  </div>
                ) : null}

                {tracking.location ? (
                  <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                    <p className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-slate-100"><Navigation size={16} className="text-primary" /> Posisi terakhir</p>
                    <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                      <div><dt className="text-xs font-bold uppercase tracking-widest text-slate-400">Koordinat</dt><dd className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-slate-100">{tracking.location.latitude.toFixed(5)}, {tracking.location.longitude.toFixed(5)}</dd></div>
                      <div><dt className="text-xs font-bold uppercase tracking-widest text-slate-400">Kecepatan</dt><dd className="mt-1 font-bold text-slate-900 dark:text-slate-100">{tracking.location.speed !== null ? `${Math.round(tracking.location.speed)} km/j` : '—'}</dd></div>
                      <div><dt className="text-xs font-bold uppercase tracking-widest text-slate-400">Diperbarui</dt><dd className="mt-1 font-bold text-slate-900 dark:text-slate-100">{formatDateTime(tracking.location.recorded_at)}</dd></div>
                    </dl>
                    <a
                      href={`https://www.google.com/maps?q=${tracking.location.latitude},${tracking.location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-extrabold text-white transition hover:bg-primary/90"
                    >
                      <MapPin size={15} /> Buka di peta
                    </a>
                  </div>
                ) : (
                  <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500 dark:bg-slate-950/60">
                    Belum ada sinyal GPS dari driver. Posisi akan tampil begitu driver memulai perjalanan dan mengirim lokasi.
                  </p>
                )}
              </div>
            ) : null}
          </AppCard>
        </div>
      )}
    </div>
  );
}
