'use client';

import {
  Ban,
  Bus,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock3,
  Download,
  Loader2,
  Pencil,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  UserRound,
  X,
} from 'lucide-react';
import { Fragment, useState, type ReactNode } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, type AdminBooking, type AdminPayment, type Paginated, type ScheduleOverview } from '@/services/portal';
import { extractApiError, formatDateTime, formatIDR, formatTime } from '@/services/stms';
import { useAuth } from '@/shared/providers/auth-provider';
import { useToast } from '@/shared/providers/toast-provider';
import { ActionButton, AppCard, Badge, EmptyState, PageHeader, Skeleton } from '@/shared/ui/components';

// =====================================================================
// Shared schedule-first shell for Booking & Payment Management.
// The page lists departures only; the heavy rows are lazy-loaded per
// schedule when a card is expanded (queries keyed by schedule_id).
// =====================================================================

const inputClass = 'min-h-11 w-full rounded-md border border-steel bg-canvas px-4 text-sm text-ink outline-none transition-colors placeholder:text-graphite focus:border-primary dark:border-ink-soft dark:bg-ink dark:text-slate-100';
const selectClass = 'min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold dark:border-slate-800 dark:bg-slate-950';
const pagerBtn = 'grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-primary hover:text-primary disabled:opacity-40 dark:border-slate-800 dark:text-slate-300';
const smallBtn = 'inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-extrabold text-slate-600 transition hover:border-primary hover:text-primary disabled:opacity-50 dark:border-slate-800 dark:text-slate-300';
const dangerBtn = 'inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-rose-200 px-3 text-xs font-extrabold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300';
const th = 'py-3 pr-4 font-extrabold';
const td = 'py-3 pr-4 align-top';

type ScheduleFilter = { page: number; search: string; status: string; date: string };

/** Trip status derived server-side: schedule.status reconciled with the trip. */
function tripLabel(s: ScheduleOverview): { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' } {
  if (s.status === 'cancelled') return { label: 'Dibatalkan', tone: 'danger' };
  if (s.status === 'completed' || s.trip_status === 'completed') return { label: 'Selesai', tone: 'neutral' };
  if (s.status === 'departed' || ['started', 'pickup', 'boarding', 'on_route', 'drop_off'].includes(s.trip_status ?? '')) return { label: 'Berangkat', tone: 'warning' };
  return { label: 'Belum Berangkat', tone: 'success' };
}

function formatDateID(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function ScheduleShell({
  title,
  description,
  statuses,
  searchPlaceholder,
  headerActions,
  query,
  filter,
  onFilter,
  renderStats,
  renderDetail,
  expandLabel,
}: {
  title: string;
  description: string;
  statuses: Array<{ value: string; label: string }>;
  searchPlaceholder: string;
  headerActions?: ReactNode;
  query: { isLoading: boolean; isError: boolean; error: unknown; isFetching: boolean; refetch: () => void; data?: Paginated<ScheduleOverview> };
  filter: ScheduleFilter;
  onFilter: (patch: Partial<ScheduleFilter>) => void;
  renderStats: (s: ScheduleOverview) => ReactNode;
  renderDetail: (s: ScheduleOverview, filter: ScheduleFilter) => ReactNode;
  expandLabel: string;
}) {
  const [draft, setDraft] = useState('');
  const [openId, setOpenId] = useState<number | null>(null);
  const meta = query.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <div className="flex flex-wrap gap-2">
            {headerActions}
            <ActionButton onClick={() => query.refetch()} disabled={query.isFetching}>
              <RefreshCw size={16} className={query.isFetching ? 'animate-spin' : ''} /> Refresh
            </ActionButton>
          </div>
        }
      />

      {/* Search + filters — one row on desktop, wraps cleanly on mobile. */}
      <div className="flex flex-wrap items-center gap-2">
        <form
          className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-md"
          onSubmit={(e) => { e.preventDefault(); onFilter({ search: draft, page: 1 }); }}
        >
          <label className="relative min-w-0 flex-1">
            <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={searchPlaceholder} className={`${inputClass} pl-10`} />
          </label>
          <button type="submit" className="min-h-11 rounded-md bg-slate-900 px-4 text-sm font-semibold uppercase tracking-button text-white transition hover:bg-slate-800 dark:bg-slate-800">Cari</button>
        </form>

        <select
          value={filter.status}
          onChange={(e) => onFilter({ status: e.target.value, page: 1 })}
          aria-label="Filter status"
          className={selectClass}
        >
          {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <label className="inline-flex items-center gap-2">
          <CalendarDays size={16} className="text-slate-400" />
          <input
            type="date"
            value={filter.date}
            onChange={(e) => onFilter({ date: e.target.value, page: 1 })}
            aria-label="Filter tanggal keberangkatan"
            className={selectClass}
          />
          {filter.date ? (
            <button onClick={() => onFilter({ date: '', page: 1 })} aria-label="Hapus filter tanggal" className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 dark:border-slate-800"><X size={13} /></button>
          ) : null}
        </label>
      </div>

      {query.isLoading ? (
        <div className="space-y-3"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
      ) : query.isError ? (
        <EmptyState title="Gagal memuat jadwal" description={extractApiError(query.error, 'Terjadi kesalahan.')} />
      ) : (meta?.data.length ?? 0) === 0 ? (
        <EmptyState title="Tidak ada jadwal" description="Ubah kata kunci, status, atau tanggal keberangkatan." />
      ) : (
        <div className="space-y-4">
          {meta!.data.map((schedule) => {
            const trip = tripLabel(schedule);
            const open = openId === schedule.id;
            return (
              <AppCard key={schedule.id} className="overflow-hidden !p-0">
                {/* --------- Departure card header (always visible) --------- */}
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : schedule.id)}
                  aria-expanded={open}
                  className="flex w-full flex-col gap-4 px-5 py-5 text-left transition hover:bg-slate-50/70 dark:hover:bg-slate-900/40 sm:flex-row sm:items-center"
                >
                  {/* Time + date */}
                  <div className="flex shrink-0 items-center gap-3 sm:w-40 sm:flex-col sm:items-start sm:gap-1">
                    <p className="flex items-center gap-1.5 font-display text-2xl font-medium text-slate-950 dark:text-white"><Clock3 size={18} className="text-primary" /> {formatTime(schedule.departure_at)}</p>
                    <p className="text-xs font-bold text-slate-500">{formatDateID(schedule.departure_at)}</p>
                  </div>

                  {/* Route + crew */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-extrabold text-slate-900 dark:text-slate-100">
                      {schedule.route ? `${schedule.route.origin} → ${schedule.route.destination}` : '—'}
                      {schedule.route?.code ? <span className="ml-2 font-mono text-xs font-bold text-slate-400">{schedule.route.code}</span> : null}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-slate-500">
                      <span className="inline-flex items-center gap-1.5"><UserRound size={14} /> {schedule.driver?.user?.name ?? '—'}</span>
                      <span className="inline-flex items-center gap-1.5"><Bus size={14} /> {schedule.vehicle ? `${schedule.vehicle.brand} · ${schedule.vehicle.code}` : '—'}</span>
                    </p>
                  </div>

                  {/* Aggregates (differ per page) */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:justify-end">
                    {renderStats(schedule)}
                    <Badge tone={trip.tone}>{trip.label}</Badge>
                    <span className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-primary/10 px-3 text-xs font-extrabold text-primary">
                      {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {open ? 'Tutup' : expandLabel}
                    </span>
                  </div>
                </button>

                {/* --------- Lazy-loaded detail (only fetched when open) --------- */}
                {open ? <div className="border-t border-slate-100 px-5 py-5 dark:border-slate-800">{renderDetail(schedule, filter)}</div> : null}
              </AppCard>
            );
          })}

          {meta && meta.last_page > 1 ? (
            <nav className="flex items-center justify-between gap-3" aria-label="Paginasi jadwal">
              <p className="text-xs font-bold text-slate-500">Hal. {meta.current_page} dari {meta.last_page} · {meta.total} jadwal</p>
              <div className="flex gap-2">
                <button disabled={meta.current_page <= 1} onClick={() => { setOpenId(null); onFilter({ page: filter.page - 1 }); }} className={pagerBtn} aria-label="Sebelumnya"><ChevronLeft size={16} /></button>
                <button disabled={meta.current_page >= meta.last_page} onClick={() => { setOpenId(null); onFilter({ page: filter.page + 1 }); }} className={pagerBtn} aria-label="Berikutnya"><ChevronRight size={16} /></button>
              </div>
            </nav>
          ) : null}
        </div>
      )}
    </div>
  );
}

function useScheduleFilter(): [ScheduleFilter, (patch: Partial<ScheduleFilter>) => void] {
  const [filter, setFilter] = useState<ScheduleFilter>({ page: 1, search: '', status: '', date: '' });
  return [filter, (patch) => setFilter((f) => ({ ...f, ...patch }))];
}

function StatChip({ label, value, tone }: { label: string; value: string; tone?: 'primary' | 'success' | 'warning' }) {
  const color = tone === 'success' ? 'text-emerald-600' : tone === 'warning' ? 'text-amber-600' : 'text-slate-900 dark:text-slate-100';
  return (
    <span className="text-center">
      <span className={`block text-sm font-extrabold ${color}`}>{value}</span>
      <span className="block text-[10px] font-bold uppercase tracking-button text-slate-400">{label}</span>
    </span>
  );
}

// =====================================================================
// BOOKING MANAGEMENT — schedule-first
// =====================================================================

const BOOKING_STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'waiting_payment', label: 'Pending (menunggu bayar)' },
  { value: 'paid', label: 'Paid' },
  { value: 'ticket_generated', label: 'Tiket Terbit' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'expired', label: 'Expired' },
  { value: 'seat_locked', label: 'Kursi Terkunci' },
];

function bookingTone(status?: string): 'neutral' | 'success' | 'warning' | 'danger' {
  if (['paid', 'ticket_generated', 'completed'].includes(status ?? '')) return 'success';
  if (['cancelled', 'expired', 'failed'].includes(status ?? '')) return 'danger';
  if (['waiting_payment', 'seat_locked', 'pending'].includes(status ?? '')) return 'warning';
  return 'neutral';
}

function seatNumbers(booking: AdminBooking): string {
  const seats = (booking.seat_reservations ?? []).map((r) => r.vehicle_seat?.seat_number).filter(Boolean);
  return seats.length > 0 ? seats.join(', ') : '—';
}

/** Detail rows of one departure — fetched only while the card is open. */
function ScheduleBookingRows({ scheduleId, status }: { scheduleId: number; status: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editNames, setEditNames] = useState<Record<number, string>>({});
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const query = useQuery({
    queryKey: ['schedule-bookings', scheduleId, status, page],
    queryFn: () => adminApi.bookings({ schedule_id: scheduleId, status: status || undefined, page, per_page: 20 }),
    placeholderData: keepPreviousData,
  });

  const cancelMutation = useMutation({
    mutationFn: adminApi.bookingCancel,
    onSuccess: () => {
      toast('Booking dibatalkan.', 'success');
      setCancellingId(null);
      queryClient.invalidateQueries({ queryKey: ['schedule-bookings', scheduleId] });
      queryClient.invalidateQueries({ queryKey: ['booking-schedules'] });
    },
    onError: (error) => { setCancellingId(null); toast(extractApiError(error, 'Gagal membatalkan booking.'), 'error'); },
  });

  const editMutation = useMutation({
    mutationFn: (booking: AdminBooking) => adminApi.bookingUpdate(booking.id, {
      passengers: (booking.passengers ?? []).map((p) => ({ id: p.id, name: editNames[p.id] ?? p.name })),
    }),
    onSuccess: () => {
      toast('Data penumpang diperbarui.', 'success');
      setEditId(null);
      setEditNames({});
      queryClient.invalidateQueries({ queryKey: ['schedule-bookings', scheduleId] });
    },
    onError: (error) => toast(extractApiError(error, 'Gagal memperbarui booking.'), 'error'),
  });

  const meta = query.data;

  if (query.isLoading) return <div className="space-y-3"><Skeleton className="h-14" /><Skeleton className="h-14" /></div>;
  if (query.isError) return <EmptyState title="Gagal memuat booking" description={extractApiError(query.error, 'Terjadi kesalahan.')} />;
  if ((meta?.data.length ?? 0) === 0) return <EmptyState title="Belum ada booking" description="Belum ada pemesanan pada jadwal ini (sesuai filter aktif)." />;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-button text-slate-500">
          <tr><th className={th}>Kode</th><th className={th}>Customer</th><th className={th}>No. HP</th><th className={th}>Kursi</th><th className={th}>Status</th><th className={th}>Pembayaran</th><th className={th}>Total</th><th className="py-3 text-right font-extrabold">Aksi</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {meta!.data.map((booking) => (
            <Fragment key={booking.id}>
              <tr>
                <td className={`${td} font-mono text-xs font-extrabold`}>{booking.code}</td>
                <td className={`${td} font-bold text-slate-900 dark:text-slate-100`}>{booking.customer?.user?.name ?? '—'}</td>
                <td className={`${td} font-mono text-xs`}>{booking.customer?.phone ?? '—'}</td>
                <td className={`${td} font-mono text-xs font-extrabold`}>{seatNumbers(booking)}</td>
                <td className={td}><Badge tone={bookingTone(booking.status)}>{booking.status.replaceAll('_', ' ')}</Badge></td>
                <td className={td}>{booking.payment ? <Badge tone={bookingTone(booking.payment.status)}>{booking.payment.status}</Badge> : <span className="text-xs font-bold text-slate-400">—</span>}</td>
                <td className={`${td} font-extrabold`}>{formatIDR(booking.amount)}</td>
                <td className="py-3 text-right">
                  <span className="inline-flex flex-wrap justify-end gap-1.5">
                    <button onClick={() => setDetailId(detailId === booking.id ? null : booking.id)} aria-expanded={detailId === booking.id} className={smallBtn}>{detailId === booking.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />} Detail</button>
                    {!['cancelled', 'expired'].includes(booking.status) ? (
                      <button onClick={() => { setEditId(editId === booking.id ? null : booking.id); setEditNames({}); }} className={smallBtn}><Pencil size={13} /> Edit</button>
                    ) : null}
                    {!['cancelled', 'completed'].includes(booking.status) ? (
                      cancellingId === booking.id ? (
                        <span className="inline-flex gap-1.5">
                          <button onClick={() => cancelMutation.mutate(booking.id)} disabled={cancelMutation.isPending} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-rose-600 px-3 text-xs font-extrabold text-white hover:bg-rose-700 disabled:opacity-60">
                            {cancelMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Ban size={13} />} Konfirmasi
                          </button>
                          <button onClick={() => setCancellingId(null)} aria-label="Batal" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 dark:border-slate-800"><X size={13} /></button>
                        </span>
                      ) : (
                        <button onClick={() => setCancellingId(booking.id)} className={dangerBtn}><Ban size={13} /> Cancel</button>
                      )
                    ) : null}
                  </span>
                </td>
              </tr>

              {detailId === booking.id ? (
                <tr>
                  <td colSpan={8} className="bg-slate-50 px-4 py-4 dark:bg-slate-950/60">
                    <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                      <div><dt className="text-xs font-bold uppercase text-slate-400">Dibuat</dt><dd className="font-semibold">{formatDateTime(booking.created_at)}</dd></div>
                      <div><dt className="text-xs font-bold uppercase text-slate-400">Tiket</dt><dd className="font-semibold">{booking.ticket?.ticket_number ?? 'Belum terbit'}</dd></div>
                      <div><dt className="text-xs font-bold uppercase text-slate-400">Metode bayar</dt><dd className="font-semibold capitalize">{booking.payment?.method?.replaceAll('_', ' ') ?? '—'}</dd></div>
                      <div className="sm:col-span-2 lg:col-span-3">
                        <dt className="text-xs font-bold uppercase text-slate-400">Penumpang</dt>
                        <dd className="mt-1 flex flex-wrap gap-2">
                          {(booking.passengers ?? []).map((p) => <Badge key={p.id} tone="neutral">{p.name}{p.identity_number ? ` · ${p.identity_number}` : ''}</Badge>)}
                          {(booking.passengers ?? []).length === 0 ? <span className="text-xs font-bold text-slate-400">—</span> : null}
                        </dd>
                      </div>
                    </dl>
                  </td>
                </tr>
              ) : null}

              {editId === booking.id ? (
                <tr>
                  <td colSpan={8} className="bg-primary/5 px-4 py-4">
                    <form
                      className="space-y-3"
                      onSubmit={(e) => { e.preventDefault(); editMutation.mutate(booking); }}
                    >
                      <p className="text-xs font-extrabold uppercase tracking-button text-slate-500">Edit nama penumpang</p>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {(booking.passengers ?? []).map((p) => (
                          <input
                            key={p.id}
                            required
                            minLength={2}
                            defaultValue={p.name}
                            onChange={(e) => setEditNames((n) => ({ ...n, [p.id]: e.target.value }))}
                            aria-label={`Nama penumpang ${p.name}`}
                            className={inputClass}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" disabled={editMutation.isPending} className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-primary px-4 text-xs font-semibold uppercase tracking-button text-white hover:bg-primary-deep disabled:opacity-60">
                          {editMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Simpan
                        </button>
                        <button type="button" onClick={() => setEditId(null)} className={smallBtn}>Batal</button>
                      </div>
                    </form>
                  </td>
                </tr>
              ) : null}
            </Fragment>
          ))}
        </tbody>
      </table>

      {meta && meta.last_page > 1 ? (
        <nav className="mt-4 flex items-center justify-between gap-3" aria-label="Paginasi booking">
          <p className="text-xs font-bold text-slate-500">Hal. {meta.current_page} dari {meta.last_page} · {meta.total} booking</p>
          <div className="flex gap-2">
            <button disabled={meta.current_page <= 1} onClick={() => setPage((p) => p - 1)} className={pagerBtn} aria-label="Sebelumnya"><ChevronLeft size={16} /></button>
            <button disabled={meta.current_page >= meta.last_page} onClick={() => setPage((p) => p + 1)} className={pagerBtn} aria-label="Berikutnya"><ChevronRight size={16} /></button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}

export function ScheduleBookingsPage() {
  const [filter, patch] = useScheduleFilter();
  const query = useQuery({
    queryKey: ['booking-schedules', filter],
    queryFn: () => adminApi.bookingSchedules({
      page: filter.page,
      search: filter.search || undefined,
      status: filter.status || undefined,
      date: filter.date || undefined,
    }),
    placeholderData: keepPreviousData,
  });

  return (
    <ScheduleShell
      title="Booking Management"
      description="Pilih jadwal keberangkatan untuk melihat seluruh booking di dalamnya. Aksi pembatalan & edit tercatat di audit trail."
      statuses={BOOKING_STATUS_OPTIONS}
      searchPlaceholder="Cari kode booking, customer, HP, rute, driver…"
      query={query}
      filter={filter}
      onFilter={patch}
      expandLabel="Lihat Booking"
      renderStats={(s) => (
        <>
          <StatChip label="Booking" value={String(s.bookings_count ?? 0)} />
          <StatChip label="Kursi" value={`${s.seats_taken ?? 0}/${s.capacity ?? 0}`} tone={Number(s.seats_taken ?? 0) >= Number(s.capacity ?? 0) && Number(s.capacity ?? 0) > 0 ? 'warning' : 'success'} />
        </>
      )}
      renderDetail={(s, f) => <ScheduleBookingRows scheduleId={s.id} status={f.status} />}
    />
  );
}

// =====================================================================
// PAYMENT MANAGEMENT — schedule-first
// =====================================================================

const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'expired', label: 'Expired' },
  { value: 'partial_refunded', label: 'Partial Refunded' },
];

/** Detail rows of one departure — fetched only while the card is open. */
function SchedulePaymentRows({ scheduleId, status }: { scheduleId: number; status: string }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [confirming, setConfirming] = useState<{ id: number; action: 'verify' | 'refund' | 'fail' } | null>(null);

  const isOwner = user?.role === 'owner';

  const query = useQuery({
    queryKey: ['schedule-payments', scheduleId, status, page],
    queryFn: () => adminApi.payments({ schedule_id: scheduleId, status: status || undefined, page, per_page: 20 }),
    placeholderData: keepPreviousData,
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['schedule-payments', scheduleId] });
    queryClient.invalidateQueries({ queryKey: ['payment-schedules'] });
  };

  const verifyMutation = useMutation({
    mutationFn: adminApi.paymentVerify,
    onSuccess: () => { toast('Pembayaran diverifikasi & booking dikonfirmasi.', 'success'); setConfirming(null); refreshAll(); },
    onError: (error) => { setConfirming(null); toast(extractApiError(error, 'Verifikasi gagal.'), 'error'); },
  });
  const refundMutation = useMutation({
    mutationFn: adminApi.paymentRefund,
    onSuccess: () => { toast('Pembayaran ditandai refund.', 'success'); setConfirming(null); refreshAll(); },
    onError: (error) => { setConfirming(null); toast(extractApiError(error, 'Refund gagal.'), 'error'); },
  });
  const failMutation = useMutation({
    mutationFn: adminApi.paymentMarkFailed,
    onSuccess: () => { toast('Pembayaran ditandai gagal.', 'success'); setConfirming(null); refreshAll(); },
    onError: (error) => { setConfirming(null); toast(extractApiError(error, 'Gagal memperbarui pembayaran.'), 'error'); },
  });

  const meta = query.data;

  if (query.isLoading) return <div className="space-y-3"><Skeleton className="h-14" /><Skeleton className="h-14" /></div>;
  if (query.isError) return <EmptyState title="Gagal memuat pembayaran" description={extractApiError(query.error, 'Terjadi kesalahan.')} />;
  if ((meta?.data.length ?? 0) === 0) return <EmptyState title="Belum ada pembayaran" description="Belum ada transaksi pada jadwal ini (sesuai filter aktif)." />;

  const confirmBar = (payment: AdminPayment) => {
    if (!confirming || confirming.id !== payment.id) return null;
    const pending = verifyMutation.isPending || refundMutation.isPending || failMutation.isPending;
    const run = () => {
      if (confirming.action === 'verify') verifyMutation.mutate(payment.id);
      else if (confirming.action === 'refund') refundMutation.mutate(payment.id);
      else failMutation.mutate(payment.id);
    };
    const label = confirming.action === 'verify' ? 'Konfirmasi verifikasi' : confirming.action === 'refund' ? 'Konfirmasi refund' : 'Konfirmasi tandai gagal';
    return (
      <span className="inline-flex gap-1.5">
        <button onClick={run} disabled={pending} className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-extrabold text-white disabled:opacity-60 ${confirming.action === 'verify' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
          {pending ? <Loader2 size={13} className="animate-spin" /> : confirming.action === 'verify' ? <CheckCircle2 size={13} /> : <RotateCcw size={13} />} {label}
        </button>
        <button onClick={() => setConfirming(null)} aria-label="Batal" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 dark:border-slate-800"><X size={13} /></button>
      </span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-button text-slate-500">
          <tr><th className={th}>Kode Booking</th><th className={th}>Customer</th><th className={th}>Nominal</th><th className={th}>Metode</th><th className={th}>Status</th><th className={th}>Waktu Bayar</th><th className="py-3 text-right font-extrabold">Aksi</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {meta!.data.map((payment) => (
            <Fragment key={payment.id}>
              <tr>
                <td className={`${td} font-mono text-xs font-extrabold`}>{payment.booking?.code ?? '—'}</td>
                <td className={`${td} font-bold text-slate-900 dark:text-slate-100`}>{payment.booking?.customer?.user?.name ?? '—'}<span className="block font-mono text-[10px] font-semibold text-slate-400">{payment.booking?.customer?.phone ?? ''}</span></td>
                <td className={`${td} font-extrabold`}>{formatIDR(payment.amount)}</td>
                <td className={`${td} capitalize`}>{payment.method?.replaceAll('_', ' ') ?? '—'}</td>
                <td className={td}><Badge tone={bookingTone(payment.status)}>{payment.status.replaceAll('_', ' ')}</Badge></td>
                <td className={`${td} text-slate-500`}>{payment.paid_at ? formatDateTime(payment.paid_at) : '—'}</td>
                <td className="py-3 text-right">
                  {confirming?.id === payment.id ? confirmBar(payment) : (
                    <span className="inline-flex flex-wrap justify-end gap-1.5">
                      <button onClick={() => setDetailId(detailId === payment.id ? null : payment.id)} aria-expanded={detailId === payment.id} className={smallBtn}>{detailId === payment.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />} Detail</button>
                      {payment.status === 'pending' ? (
                        <>
                          <button onClick={() => setConfirming({ id: payment.id, action: 'verify' })} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-emerald-200 px-3 text-xs font-extrabold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300"><CheckCircle2 size={13} /> Verifikasi</button>
                          <button onClick={() => setConfirming({ id: payment.id, action: 'fail' })} className={dangerBtn}><Ban size={13} /> Tandai gagal</button>
                        </>
                      ) : null}
                      {isOwner && ['paid', 'partial_refunded'].includes(payment.status) ? (
                        <button onClick={() => setConfirming({ id: payment.id, action: 'refund' })} className={dangerBtn}><RotateCcw size={13} /> Refund</button>
                      ) : null}
                    </span>
                  )}
                </td>
              </tr>

              {detailId === payment.id ? (
                <tr>
                  <td colSpan={7} className="bg-slate-50 px-4 py-4 dark:bg-slate-950/60">
                    <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                      <div><dt className="text-xs font-bold uppercase text-slate-400">Referensi</dt><dd className="font-mono text-xs font-semibold">{payment.reference}</dd></div>
                      <div><dt className="text-xs font-bold uppercase text-slate-400">Provider</dt><dd className="font-semibold capitalize">{payment.provider ?? '—'}</dd></div>
                      <div><dt className="text-xs font-bold uppercase text-slate-400">Dibuat</dt><dd className="font-semibold">{formatDateTime(payment.created_at)}</dd></div>
                    </dl>
                  </td>
                </tr>
              ) : null}
            </Fragment>
          ))}
        </tbody>
      </table>

      {meta && meta.last_page > 1 ? (
        <nav className="mt-4 flex items-center justify-between gap-3" aria-label="Paginasi pembayaran">
          <p className="text-xs font-bold text-slate-500">Hal. {meta.current_page} dari {meta.last_page} · {meta.total} transaksi</p>
          <div className="flex gap-2">
            <button disabled={meta.current_page <= 1} onClick={() => setPage((p) => p - 1)} className={pagerBtn} aria-label="Sebelumnya"><ChevronLeft size={16} /></button>
            <button disabled={meta.current_page >= meta.last_page} onClick={() => setPage((p) => p + 1)} className={pagerBtn} aria-label="Berikutnya"><ChevronRight size={16} /></button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}

export function SchedulePaymentsPage() {
  const { toast } = useToast();
  const [filter, patch] = useScheduleFilter();
  const [exporting, setExporting] = useState(false);

  const query = useQuery({
    queryKey: ['payment-schedules', filter],
    queryFn: () => adminApi.paymentSchedules({
      page: filter.page,
      search: filter.search || undefined,
      status: filter.status || undefined,
      date: filter.date || undefined,
    }),
    placeholderData: keepPreviousData,
  });

  async function exportPayments() {
    setExporting(true);
    try {
      await adminApi.downloadFile('/admin/payments/export', 'stms-payments.csv', filter.status ? { status: filter.status } : undefined);
      toast('Data pembayaran berhasil diekspor.', 'success');
    } catch (error) {
      toast(extractApiError(error, 'Ekspor gagal.'), 'error');
    } finally {
      setExporting(false);
    }
  }

  return (
    <ScheduleShell
      title="Payment Monitoring"
      description="Pilih jadwal keberangkatan untuk melihat seluruh pembayaran di dalamnya. Verifikasi & refund memakai state machine pembayaran yang sama dengan gateway."
      statuses={PAYMENT_STATUS_OPTIONS}
      searchPlaceholder="Cari kode booking, customer, HP, rute, driver, metode…"
      headerActions={
        <ActionButton onClick={exportPayments} disabled={exporting}>
          {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Export CSV
        </ActionButton>
      }
      query={query}
      filter={filter}
      onFilter={patch}
      expandLabel="Lihat Pembayaran"
      renderStats={(s) => (
        <>
          <StatChip label="Booking" value={String(s.bookings_count ?? 0)} />
          <StatChip label="Lunas" value={String(s.paid_count ?? 0)} tone="success" />
          <StatChip label="Pending" value={String(s.pending_count ?? 0)} tone={Number(s.pending_count ?? 0) > 0 ? 'warning' : undefined} />
          <span className="text-center">
            <span className="block text-sm font-extrabold text-primary">{formatIDR(s.total_paid ?? 0)}</span>
            <span className="block text-[10px] font-bold uppercase tracking-button text-slate-400">Pendapatan</span>
          </span>
        </>
      )}
      renderDetail={(s, f) => <SchedulePaymentRows scheduleId={s.id} status={f.status} />}
    />
  );
}
