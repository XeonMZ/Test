'use client';

import { usePathname } from 'next/navigation';

import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Megaphone,
  Pencil,
  RefreshCw,
  Save,
  Search,
  X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, type Paginated } from '@/services/portal';
import { extractApiError, formatDateTime, formatIDR } from '@/services/stms';
import { useToast } from '@/shared/providers/toast-provider';
import { ActionButton, AppCard, Badge, EmptyState, PageHeader, SectionHeader, Skeleton } from '@/shared/ui/components';

// ============================ shared shell ============================

type ListState = { page: number; search: string; status: string };

function useListState(): [ListState, (patch: Partial<ListState>) => void] {
  const [state, setState] = useState<ListState>({ page: 1, search: '', status: 'all' });
  return [state, (patch) => setState((s) => ({ ...s, page: 1, ...patch }))];
}

function ResourceShell({
  title,
  description,
  state,
  onState,
  statuses,
  query,
  header,
  children,
}: {
  title: string;
  description: string;
  state: ListState;
  onState: (patch: Partial<ListState>) => void;
  statuses?: string[];
  query: { isLoading: boolean; isError: boolean; error: unknown; isFetching: boolean; refetch: () => void; data?: Paginated<never> | Paginated<unknown> };
  header: ReactNode;
  children: ReactNode;
}) {
  const [draft, setDraft] = useState('');
  const meta = query.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <ActionButton onClick={() => query.refetch()} disabled={query.isFetching}>
            <RefreshCw size={16} className={query.isFetching ? 'animate-spin' : ''} /> Refresh
          </ActionButton>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <form
          className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-sm"
          onSubmit={(event) => {
            event.preventDefault();
            onState({ search: draft });
          }}
        >
          <label className="relative min-w-0 flex-1">
            <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Cari…"
              className="min-h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950"
            />
          </label>
          <button type="submit" className="min-h-11 rounded-md bg-slate-900 px-4 text-sm font-extrabold text-white transition hover:bg-slate-800 dark:bg-slate-800">Cari</button>
        </form>
        {statuses ? (
          <select
            value={state.status}
            onChange={(e) => onState({ status: e.target.value })}
            aria-label="Filter status"
            className="min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold dark:border-slate-800 dark:bg-slate-950"
          >
            <option value="all">Semua status</option>
            {statuses.map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
          </select>
        ) : null}
      </div>

      {query.isLoading ? (
        <div className="space-y-3"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
      ) : query.isError ? (
        <EmptyState title="Gagal memuat data" description={extractApiError(query.error, 'Terjadi kesalahan.')} />
      ) : (meta?.data.length ?? 0) === 0 ? (
        <EmptyState title="Tidak ada data" description="Ubah kata kunci atau filter status." />
      ) : (
        <AppCard className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">{header}</thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{children}</tbody>
          </table>
          {meta && meta.last_page > 1 ? (
            <nav className="mt-4 flex items-center justify-between gap-3" aria-label="Paginasi">
              <p className="text-xs font-bold text-slate-500">Hal. {meta.current_page} dari {meta.last_page} · {meta.total} data</p>
              <div className="flex gap-2">
                <button disabled={meta.current_page <= 1} onClick={() => onState({ page: state.page - 1 })} className={pagerBtn} aria-label="Sebelumnya"><ChevronLeft size={15} /></button>
                <button disabled={meta.current_page >= meta.last_page} onClick={() => onState({ page: state.page + 1 })} className={pagerBtn} aria-label="Berikutnya"><ChevronRight size={15} /></button>
              </div>
            </nav>
          ) : null}
        </AppCard>
      )}
    </div>
  );
}

const pagerBtn = 'grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-primary hover:text-primary disabled:opacity-40 dark:border-slate-800 dark:text-slate-300';
const th = 'py-3 pr-4 font-extrabold';
const td = 'py-3 pr-4';

function statusTone(status?: string): 'neutral' | 'success' | 'warning' | 'danger' {
  if (!status) return 'neutral';
  if (['paid', 'ticket_generated', 'completed', 'active', 'issued'].includes(status)) return 'success';
  if (['cancelled', 'expired', 'failed', 'inactive', 'suspended', 'retired'].includes(status)) return 'danger';
  if (['seat_locked', 'waiting_payment', 'pending', 'maintenance', 'on_leave'].includes(status)) return 'warning';
  return 'neutral';
}

function ConfirmInline({ label, confirmLabel, pending, onConfirm }: { label: string; confirmLabel: string; pending: boolean; onConfirm: () => void }) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-rose-200 px-3 text-xs font-extrabold text-rose-700 transition hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300">
        <Ban size={13} /> {label}
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <button onClick={onConfirm} disabled={pending} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-rose-600 px-3 text-xs font-extrabold text-white transition hover:bg-rose-700 disabled:opacity-60">
        {pending ? <Loader2 size={13} className="animate-spin" /> : <Ban size={13} />} {confirmLabel}
      </button>
      <button onClick={() => setConfirming(false)} aria-label="Batal" className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 dark:border-slate-800"><X size={13} /></button>
    </span>
  );
}

// ============================== BOOKINGS ==============================

const BOOKING_STATUSES = ['draft', 'seat_locked', 'waiting_payment', 'paid', 'ticket_generated', 'completed', 'cancelled', 'expired'];

export function AdminBookingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [state, patch] = useListState();

  const query = useQuery({
    queryKey: ['admin-bookings', state],
    queryFn: () => adminApi.bookings(state),
    placeholderData: keepPreviousData,
  });

  const cancelMutation = useMutation({
    mutationFn: adminApi.bookingCancel,
    onSuccess: () => {
      toast('Booking dibatalkan.', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
    },
    onError: (error) => toast(extractApiError(error, 'Gagal membatalkan booking.'), 'error'),
  });

  return (
    <ResourceShell
      title="Bookings"
      description="Seluruh pemesanan pada sistem, dengan aksi pembatalan tercatat di audit trail."
      state={state}
      onState={patch}
      statuses={BOOKING_STATUSES}
      query={query}
      header={<tr><th className={th}>Kode</th><th className={th}>Customer</th><th className={th}>Rute</th><th className={th}>Jumlah</th><th className={th}>Status</th><th className={th}>Dibuat</th><th className="py-3 text-right font-extrabold">Aksi</th></tr>}
    >
      {query.data?.data.map((booking) => (
        <tr key={booking.id}>
          <td className={`${td} font-mono text-xs font-extrabold`}>{booking.code}</td>
          <td className={`${td} font-bold text-slate-900 dark:text-slate-100`}>{booking.customer?.user?.name ?? '—'}</td>
          <td className={td}>{booking.schedule?.route ? `${booking.schedule.route.origin} → ${booking.schedule.route.destination}` : '—'}</td>
          <td className={`${td} font-extrabold`}>{formatIDR(booking.amount)}</td>
          <td className={td}><Badge tone={statusTone(booking.status)}>{booking.status.replaceAll('_', ' ')}</Badge></td>
          <td className={`${td} text-slate-500`}>{formatDateTime(booking.created_at)}</td>
          <td className="py-3 text-right">
            {!['cancelled', 'completed'].includes(booking.status) ? (
              <ConfirmInline label="Batalkan" confirmLabel="Konfirmasi" pending={cancelMutation.isPending} onConfirm={() => cancelMutation.mutate(booking.id)} />
            ) : <span className="text-xs font-bold text-slate-400">—</span>}
          </td>
        </tr>
      ))}
    </ResourceShell>
  );
}

// ============================== PAYMENTS ==============================

export function AdminPaymentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [state, patch] = useListState();

  const query = useQuery({ queryKey: ['admin-payments', state], queryFn: () => adminApi.payments(state), placeholderData: keepPreviousData });

  const failMutation = useMutation({
    mutationFn: adminApi.paymentMarkFailed,
    onSuccess: () => {
      toast('Pembayaran ditandai gagal.', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
    },
    onError: (error) => toast(extractApiError(error, 'Gagal memperbarui pembayaran.'), 'error'),
  });

  return (
    <ResourceShell
      title="Payments"
      description="Monitoring transaksi pembayaran dengan aksi tandai-gagal untuk transaksi bermasalah."
      state={state}
      onState={patch}
      statuses={['pending', 'paid', 'failed', 'expired', 'refunded']}
      query={query}
      header={<tr><th className={th}>Referensi</th><th className={th}>Booking</th><th className={th}>Customer</th><th className={th}>Metode</th><th className={th}>Jumlah</th><th className={th}>Status</th><th className="py-3 text-right font-extrabold">Aksi</th></tr>}
    >
      {query.data?.data.map((payment) => (
        <tr key={payment.id}>
          <td className={`${td} font-mono text-xs font-extrabold`}>{payment.reference}</td>
          <td className={`${td} font-mono text-xs`}>{payment.booking?.code ?? '—'}</td>
          <td className={`${td} font-bold text-slate-900 dark:text-slate-100`}>{payment.booking?.customer?.user?.name ?? '—'}</td>
          <td className={`${td} capitalize`}>{payment.method?.replaceAll('_', ' ') ?? '—'}</td>
          <td className={`${td} font-extrabold`}>{formatIDR(payment.amount)}</td>
          <td className={td}><Badge tone={statusTone(payment.status)}>{payment.status}</Badge></td>
          <td className="py-3 text-right">
            {payment.status === 'pending' ? (
              <ConfirmInline label="Tandai gagal" confirmLabel="Konfirmasi" pending={failMutation.isPending} onConfirm={() => failMutation.mutate(payment.id)} />
            ) : <span className="text-xs font-bold text-slate-400">—</span>}
          </td>
        </tr>
      ))}
    </ResourceShell>
  );
}

// ============================== CUSTOMERS ==============================

export function AdminCustomersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [state, patch] = useListState();

  const query = useQuery({ queryKey: ['admin-customers', state], queryFn: () => adminApi.customers(state), placeholderData: keepPreviousData });

  const pathname = usePathname();
  const isOwner = pathname?.startsWith('/owner') ?? false;
  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.customerDelete(id),
    onSuccess: () => { toast('Customer dihapus. Riwayat tetap tersimpan.', 'success'); queryClient.invalidateQueries({ queryKey: ['admin-customers'] }); },
    onError: (error) => toast(extractApiError(error, 'Gagal menghapus customer.'), 'error'),
  });
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => adminApi.customerUpdate(id, { is_active: isActive }),
    onSuccess: (_r, vars) => {
      toast(vars.isActive ? 'Akun customer diaktifkan.' : 'Akun customer dinonaktifkan.', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
    },
    onError: (error) => toast(extractApiError(error, 'Gagal memperbarui customer.'), 'error'),
  });

  return (
    <ResourceShell
      title="Customers"
      description="Kelola akun pelanggan: aktif/nonaktifkan akses login."
      state={state}
      onState={patch}
      statuses={['active', 'inactive']}
      query={query}
      header={<tr><th className={th}>Nama</th><th className={th}>Email</th><th className={th}>Telepon</th><th className={th}>Membership</th><th className={th}>Status</th><th className="py-3 text-right font-extrabold">Aksi</th></tr>}
    >
      {query.data?.data.map((customer) => {
        const active = customer.user?.is_active !== false;
        return (
          <tr key={customer.id}>
            <td className={`${td} font-bold text-slate-900 dark:text-slate-100`}>{customer.user?.name ?? '—'}</td>
            <td className={td}>{customer.user?.email ?? '—'}</td>
            <td className={td}>{customer.phone ?? '—'}</td>
            <td className={`${td} capitalize`}>{customer.membership?.level ?? '—'} {customer.membership ? `· ${customer.membership.points} poin` : ''}</td>
            <td className={td}><Badge tone={active ? 'success' : 'danger'}>{active ? 'aktif' : 'nonaktif'}</Badge></td>
            <td className="py-3 text-right">
              <button
                onClick={() => toggleMutation.mutate({ id: customer.id, isActive: !active })}
                disabled={toggleMutation.isPending}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-extrabold transition disabled:opacity-60 ${active ? 'border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300'}`}
              >
                {active ? 'Nonaktifkan' : 'Aktifkan'}
              </button>
              {isOwner ? (
                <button
                  onClick={() => { if (confirm(`Hapus customer ${customer.user?.name ?? ''}? Riwayat tetap tersimpan (soft delete), akun login dinonaktifkan.`)) deleteMutation.mutate(customer.id); }}
                  disabled={deleteMutation.isPending}
                  className="ml-2 inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-rose-300 px-3 text-xs font-extrabold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900 dark:text-rose-300"
                >
                  Hapus
                </button>
              ) : null}
            </td>
          </tr>
        );
      })}
    </ResourceShell>
  );
}

// =============================== DRIVERS ===============================

const DRIVER_STATUSES = ['active', 'inactive', 'suspended', 'on_leave'];

export function AdminDriversPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [state, patch] = useListState();

  const query = useQuery({ queryKey: ['admin-drivers', state], queryFn: () => adminApi.drivers(state), placeholderData: keepPreviousData });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => adminApi.driverUpdate(id, { status }),
    onSuccess: () => {
      toast('Status driver diperbarui.', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-drivers'] });
    },
    onError: (error) => toast(extractApiError(error, 'Gagal memperbarui driver.'), 'error'),
  });

  return (
    <ResourceShell
      title="Drivers"
      description="Kelola status operasional driver (aktif, suspend, cuti)."
      state={state}
      onState={patch}
      statuses={DRIVER_STATUSES}
      query={query}
      header={<tr><th className={th}>Nama</th><th className={th}>Email</th><th className={th}>SIM</th><th className={th}>Status</th><th className="py-3 text-right font-extrabold">Ubah status</th></tr>}
    >
      {query.data?.data.map((driver) => (
        <tr key={driver.id}>
          <td className={`${td} font-bold text-slate-900 dark:text-slate-100`}>{driver.user?.name ?? '—'}</td>
          <td className={td}>{driver.user?.email ?? '—'}</td>
          <td className={`${td} font-mono text-xs`}>{driver.license_number ?? '—'}</td>
          <td className={td}><Badge tone={statusTone(driver.status)}>{driver.status?.replaceAll('_', ' ') ?? '—'}</Badge></td>
          <td className="py-3 text-right">
            <select
              value={driver.status ?? 'active'}
              onChange={(e) => statusMutation.mutate({ id: driver.id, status: e.target.value })}
              disabled={statusMutation.isPending}
              aria-label={`Ubah status ${driver.user?.name ?? 'driver'}`}
              className="min-h-9 rounded-xl border border-slate-200 bg-white px-2 text-xs font-extrabold dark:border-slate-800 dark:bg-slate-950"
            >
              {DRIVER_STATUSES.map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
            </select>
          </td>
        </tr>
      ))}
    </ResourceShell>
  );
}

// =============================== VEHICLES ===============================

const VEHICLE_STATUSES = ['active', 'maintenance', 'inactive', 'retired'];

export function AdminVehiclesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [state, patch] = useListState();

  const query = useQuery({ queryKey: ['admin-vehicles', state], queryFn: () => adminApi.vehicles(state), placeholderData: keepPreviousData });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => adminApi.vehicleUpdate(id, { status }),
    onSuccess: () => {
      toast('Status armada diperbarui.', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-vehicles'] });
    },
    onError: (error) => toast(extractApiError(error, 'Gagal memperbarui armada.'), 'error'),
  });

  return (
    <ResourceShell
      title="Vehicles"
      description="Kelola armada: armada berstatus non-aktif otomatis hilang dari katalog pemesanan."
      state={state}
      onState={patch}
      statuses={VEHICLE_STATUSES}
      query={query}
      header={<tr><th className={th}>Kode</th><th className={th}>Merek</th><th className={th}>Plat</th><th className={th}>Layout</th><th className={th}>Status</th><th className="py-3 text-right font-extrabold">Ubah status</th></tr>}
    >
      {query.data?.data.map((vehicle) => (
        <tr key={vehicle.id}>
          <td className={`${td} font-mono text-xs font-extrabold`}>{vehicle.code ?? '—'}</td>
          <td className={`${td} font-bold text-slate-900 dark:text-slate-100`}>{vehicle.brand ?? '—'}</td>
          <td className={td}>{vehicle.plate_number ?? '—'}</td>
          <td className={td}>{vehicle.layout?.name ?? '—'} {vehicle.layout?.capacity ? `(${vehicle.layout.capacity} kursi)` : ''}</td>
          <td className={td}>
            {vehicle.on_trip ? <Badge tone="warning">On Trip</Badge> : <Badge tone={statusTone(vehicle.status)}>{vehicle.status === 'active' ? 'Ready' : vehicle.status === 'maintenance' ? 'Perbaikan' : vehicle.status ?? '—'}</Badge>}
          </td>
          <td className="py-3 text-right">
            <select
              value={vehicle.status ?? 'active'}
              onChange={(e) => statusMutation.mutate({ id: vehicle.id, status: e.target.value })}
              disabled={statusMutation.isPending || vehicle.on_trip}
              aria-label={`Ubah status ${vehicle.code ?? 'armada'}`}
              title={vehicle.on_trip ? 'Armada sedang dalam perjalanan' : undefined}
              className="min-h-9 rounded-xl border border-slate-200 bg-white px-2 text-xs font-extrabold disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950"
            >
              {VEHICLE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </td>
        </tr>
      ))}
    </ResourceShell>
  );
}

// ============================ NOTIFICATIONS ============================

/** Broadcast history: delivered/read counts and delivery timestamp per blast. */
function BroadcastHistoryCard() {
  const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ['broadcast-history', page], queryFn: () => adminApi.broadcastHistory({ page }), placeholderData: keepPreviousData });
  const meta = query.data;

  return (
    <AppCard>
      <SectionHeader title="Riwayat broadcast" description="Status pengiriman: berapa notifikasi terkirim, berapa yang sudah dibaca, dan kapan dikirim." />
      {query.isLoading ? (
        <Skeleton className="mt-4 h-32" />
      ) : (meta?.data.length ?? 0) === 0 ? (
        <p className="mt-4 text-sm font-semibold text-slate-500">Belum ada broadcast terkirim.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500"><tr><th className={th}>Judul</th><th className={th}>Target</th><th className={th}>Pengirim</th><th className={th}>Terkirim</th><th className={th}>Dibaca</th><th className={th}>Status</th><th className={th}>Waktu kirim</th></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {meta!.data.map((b) => (
                <tr key={b.id}>
                  <td className={`${td} font-bold text-slate-900 dark:text-slate-100`}>{b.title}</td>
                  <td className={td}><Badge tone="neutral">{b.role === 'all' ? 'Semua' : b.role}</Badge></td>
                  <td className={td}>{b.sent_by ?? '—'}</td>
                  <td className={`${td} font-extrabold`}>{b.delivered}</td>
                  <td className={td}>{b.read} <span className="text-xs text-slate-400">({b.delivered > 0 ? Math.round((b.read / b.delivered) * 100) : 0}%)</span></td>
                  <td className={td}><Badge tone={b.delivered > 0 ? 'success' : 'warning'}>{b.delivered > 0 ? 'terkirim' : 'kosong'}</Badge></td>
                  <td className={`${td} text-slate-500`}>{formatDateTime(b.sent_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {meta && meta.last_page > 1 ? (
            <nav className="mt-4 flex items-center justify-between gap-3" aria-label="Paginasi riwayat broadcast">
              <p className="text-xs font-bold text-slate-500">Hal. {meta.current_page} dari {meta.last_page}</p>
              <div className="flex gap-2">
                <button disabled={meta.current_page <= 1} onClick={() => setPage((p) => p - 1)} className={pagerBtn} aria-label="Sebelumnya"><ChevronLeft size={15} /></button>
                <button disabled={meta.current_page >= meta.last_page} onClick={() => setPage((p) => p + 1)} className={pagerBtn} aria-label="Berikutnya"><ChevronRight size={15} /></button>
              </div>
            </nav>
          ) : null}
        </div>
      )}
    </AppCard>
  );
}

export function AdminNotificationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [state, patch] = useListState();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [role, setRole] = useState('all');

  const query = useQuery({ queryKey: ['admin-notifications', state], queryFn: () => adminApi.notifications(state), placeholderData: keepPreviousData });

  const broadcastMutation = useMutation({
    mutationFn: () => adminApi.notificationBroadcast({ title: title.trim(), body: body.trim(), role }),
    onSuccess: () => {
      toast('Broadcast terkirim.', 'success');
      setTitle('');
      setBody('');
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['broadcast-history'] });
    },
    onError: (error) => toast(extractApiError(error, 'Broadcast gagal.'), 'error'),
  });

  return (
    <div className="space-y-6">
      <AppCard>
        <SectionHeader title="Broadcast notifikasi" description="Kirim pengumuman ke seluruh pengguna atau peran tertentu." />
        <form
          className="mt-5 grid gap-3 sm:grid-cols-[1fr_180px]"
          onSubmit={(event) => {
            event.preventDefault();
            if (title.trim().length >= 3 && body.trim().length >= 3) broadcastMutation.mutate();
          }}
        >
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} required placeholder="Judul pengumuman" className={inputClass} aria-label="Judul" />
          <select value={role} onChange={(e) => setRole(e.target.value)} className={inputClass} aria-label="Target peran">
            {['all', 'customer', 'driver', 'admin', 'owner'].map((r) => <option key={r} value={r}>{r === 'all' ? 'Semua pengguna' : r}</option>)}
          </select>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} required rows={3} placeholder="Isi pesan…" className={`${inputClass} sm:col-span-2`} aria-label="Isi pesan" />
          <button type="submit" disabled={broadcastMutation.isPending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-extrabold text-white transition hover:bg-primary/90 disabled:opacity-60 sm:col-span-2">
            {broadcastMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Megaphone size={15} />} Kirim broadcast
          </button>
        </form>
      </AppCard>

      <BroadcastHistoryCard />

      <ResourceShell
        title="Riwayat notifikasi"
        description="Seluruh notifikasi yang pernah dikirim ke pengguna."
        state={state}
        onState={patch}
        query={query}
        header={<tr><th className={th}>Judul</th><th className={th}>Tipe</th><th className={th}>Penerima</th><th className={th}>Waktu</th></tr>}
      >
        {query.data?.data.map((item) => (
          <tr key={item.id}>
            <td className={`${td} font-bold text-slate-900 dark:text-slate-100`}>{item.title}</td>
            <td className={td}><Badge tone="neutral">{item.type}</Badge></td>
            <td className={td}>{item.user?.name ?? '—'} <span className="text-xs text-slate-400">({item.user?.role ?? '—'})</span></td>
            <td className={`${td} text-slate-500`}>{formatDateTime(item.created_at)}</td>
          </tr>
        ))}
      </ResourceShell>
    </div>
  );
}

// =============================== SETTINGS ===============================

export function AdminSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const query = useQuery({ queryKey: ['admin-settings'], queryFn: adminApi.settings });

  const saveMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) => adminApi.settingsUpdate({ key, value }),
    onSuccess: () => {
      toast('Pengaturan disimpan.', 'success');
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: (error) => toast(extractApiError(error, 'Gagal menyimpan pengaturan.'), 'error'),
  });

  function startEdit(key: string, value: unknown) {
    setEditing(key);
    setDraft(typeof value === 'string' ? value : JSON.stringify(value));
  }

  function save(key: string) {
    let value: unknown = draft;
    try {
      value = JSON.parse(draft);
    } catch {
      // Keep as plain string when it is not valid JSON.
    }
    saveMutation.mutate({ key, value });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="System Settings" description="Konfigurasi sistem — setiap perubahan tercatat di audit trail." />

      {query.isLoading ? (
        <div className="space-y-3"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
      ) : query.isError ? (
        <EmptyState title="Gagal memuat pengaturan" description={extractApiError(query.error, 'Terjadi kesalahan.')} />
      ) : (query.data?.length ?? 0) === 0 ? (
        <EmptyState title="Belum ada pengaturan" description="Pengaturan sistem akan muncul di sini." />
      ) : (
        <AppCard>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {query.data!.map((setting) => (
              <li key={setting.key} className="flex flex-wrap items-center gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-extrabold text-slate-900 dark:text-slate-100">{setting.key}</p>
                  {editing === setting.key ? (
                    <input value={draft} onChange={(e) => setDraft(e.target.value)} className={`${inputClass} mt-2`} aria-label={`Nilai ${setting.key}`} />
                  ) : (
                    <p className="mt-1 truncate font-mono text-xs text-slate-500">{typeof setting.value === 'string' ? setting.value : JSON.stringify(setting.value)}</p>
                  )}
                </div>
                {editing === setting.key ? (
                  <span className="flex gap-2">
                    <button onClick={() => save(setting.key)} disabled={saveMutation.isPending} className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-extrabold text-white transition hover:bg-primary/90 disabled:opacity-60">
                      {saveMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Simpan
                    </button>
                    <button onClick={() => setEditing(null)} aria-label="Batal" className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 dark:border-slate-800"><X size={13} /></button>
                  </span>
                ) : (
                  <button onClick={() => startEdit(setting.key, setting.value)} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-extrabold text-slate-600 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300">
                    <Pencil size={13} /> Ubah
                  </button>
                )}
              </li>
            ))}
          </ul>
        </AppCard>
      )}
    </div>
  );
}

const inputClass = 'min-h-11 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100';
