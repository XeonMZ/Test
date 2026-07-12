'use client';

import {
  ClipboardList,
  Coffee,
  Loader2,
  LogIn,
  LogOut,
  Play,
  RefreshCw,
  Square,
} from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  driverShiftAction,
  driverTripAction,
  fetchDriverDashboard,
  fetchDriverEarnings,
  fetchDriverTrips,
  fetchTripPassengers,
} from '@/services/portal';
import { extractApiError, formatDateTime, formatIDR } from '@/services/stms';
import { useToast } from '@/shared/providers/toast-provider';
import { ActionButton, AppCard, Badge, EmptyState, PageHeader, SectionHeader, Skeleton, StatsCard } from '@/shared/ui/components';

function tripTone(status?: string): 'neutral' | 'success' | 'warning' | 'danger' {
  if (status === 'completed') return 'success';
  if (status === 'cancelled' || status === 'failed') return 'danger';
  if (status) return 'warning';
  return 'neutral';
}

// ========================== DRIVER DASHBOARD ==========================

export function DriverDashboardPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const dashboardQuery = useQuery({ queryKey: ['driver-dashboard'], queryFn: fetchDriverDashboard, refetchInterval: 30_000 });
  const tripsQuery = useQuery({ queryKey: ['driver-trips'], queryFn: fetchDriverTrips });
  const earningsQuery = useQuery({ queryKey: ['driver-earnings'], queryFn: fetchDriverEarnings });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['driver-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['driver-trips'] });
    queryClient.invalidateQueries({ queryKey: ['driver-earnings'] });
  };

  const shiftMutation = useMutation({
    mutationFn: driverShiftAction,
    onSuccess: (_r, action) => {
      toast({ 'start-shift': 'Shift dimulai.', 'end-shift': 'Shift diakhiri.', break: 'Istirahat dimulai.', resume: 'Shift dilanjutkan.' }[action] ?? 'Berhasil.', 'success');
      refresh();
    },
    onError: (error) => toast(extractApiError(error, 'Aksi shift gagal.'), 'error'),
  });

  const tripMutation = useMutation({
    mutationFn: ({ action, tripId }: { action: 'start-trip' | 'finish-trip'; tripId: number }) => driverTripAction(action, tripId),
    onSuccess: (_r, vars) => {
      toast(vars.action === 'start-trip' ? 'Perjalanan dimulai.' : 'Perjalanan diselesaikan.', 'success');
      refresh();
    },
    onError: (error) => toast(extractApiError(error, 'Aksi trip gagal.'), 'error'),
  });

  const dashboard = dashboardQuery.data;
  const shift = dashboard?.shift as { status?: string } | null | undefined;
  const shiftStatus = shift?.status ?? null;
  const onShift = shiftStatus !== null && shiftStatus !== 'ended';
  const earnings = earningsQuery.data;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Dashboard Driver"
        description="Kelola shift, perjalanan hari ini, dan pendapatanmu — semua data live."
        actions={
          <ActionButton onClick={refresh} disabled={dashboardQuery.isFetching}>
            <RefreshCw size={16} className={dashboardQuery.isFetching ? 'animate-spin' : ''} /> Refresh
          </ActionButton>
        }
      />

      {dashboardQuery.isError ? (
        <EmptyState title="Gagal memuat dashboard" description={extractApiError(dashboardQuery.error, 'Pastikan akunmu terdaftar sebagai driver.')} />
      ) : (
        <>
          <AppCard>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <SectionHeader title="Status shift" description={shiftStatus ? `Status saat ini: ${shiftStatus.replaceAll('_', ' ')}` : 'Belum ada shift aktif hari ini.'} />
              </div>
              <div className="flex flex-wrap gap-2">
                {!onShift ? (
                  <button onClick={() => shiftMutation.mutate('start-shift')} disabled={shiftMutation.isPending} className={btnPrimary}>
                    {shiftMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />} Mulai shift
                  </button>
                ) : (
                  <>
                    {shiftStatus === 'on_break' ? (
                      <button onClick={() => shiftMutation.mutate('resume')} disabled={shiftMutation.isPending} className={btnPrimary}><Play size={15} /> Lanjutkan</button>
                    ) : (
                      <button onClick={() => shiftMutation.mutate('break')} disabled={shiftMutation.isPending} className={btnOutline}><Coffee size={15} /> Istirahat</button>
                    )}
                    <button onClick={() => shiftMutation.mutate('end-shift')} disabled={shiftMutation.isPending} className={btnDanger}><LogOut size={15} /> Akhiri shift</button>
                  </>
                )}
              </div>
            </div>
          </AppCard>

          {dashboardQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard label="Trip hari ini" value={String(dashboard?.today_trips ?? 0)} helper="Trip yang ditugaskan hari ini" />
              <StatsCard label="Pendapatan hari ini" value={formatIDR(dashboard?.earnings_today ?? 0)} helper="Akumulasi trip hari ini" />
              <StatsCard label="Pendapatan bulan ini" value={formatIDR(earnings?.pendapatan_bulan_ini ?? 0)} helper={`Completion rate ${earnings?.completion_rate ?? 0}%`} />
              <StatsCard label="Total kilometer" value={`${(earnings?.total_kilometer ?? 0).toLocaleString('id-ID')} km`} helper={`${earnings?.total_trip ?? 0} trip sepanjang waktu`} />
            </div>
          )}

          <AppCard>
            <SectionHeader title="Trip hari ini" description="Mulai dan selesaikan perjalanan langsung dari sini." />
            {tripsQuery.isLoading ? (
              <div className="mt-5 space-y-3"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
            ) : (tripsQuery.data?.length ?? 0) === 0 ? (
              <p className="mt-4 text-sm font-semibold text-slate-500">Belum ada trip yang ditugaskan hari ini.</p>
            ) : (
              <ul className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
                {tripsQuery.data!.map((trip) => {
                  const canStart = !['started', 'on_route', 'pickup', 'completed', 'cancelled', 'failed'].includes(trip.status);
                  const canFinish = ['started', 'on_route', 'pickup', 'accepted'].includes(trip.status);
                  return (
                    <li key={trip.uuid} className="flex flex-wrap items-center justify-between gap-3 py-4">
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-extrabold text-slate-500">TRIP #{trip.id}</p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-500">{formatDateTime(trip.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={tripTone(trip.status)}>{trip.status?.replaceAll('_', ' ') || 'ready'}</Badge>
                        {canStart ? (
                          <button onClick={() => tripMutation.mutate({ action: 'start-trip', tripId: trip.id })} disabled={tripMutation.isPending} className={btnPrimarySm}><Play size={13} /> Mulai</button>
                        ) : null}
                        {canFinish ? (
                          <button onClick={() => tripMutation.mutate({ action: 'finish-trip', tripId: trip.id })} disabled={tripMutation.isPending} className={btnSuccessSm}><Square size={13} /> Selesai</button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </AppCard>
        </>
      )}
    </div>
  );
}

// =========================== CHECK-IN CONSOLE ===========================

export function TripPassengersPanel() {
  const tripsQuery = useQuery({ queryKey: ['driver-trips'], queryFn: fetchDriverTrips });
  const [selected, setSelected] = useState<string | null>(null);
  const activeTrip = selected ?? tripsQuery.data?.[0]?.uuid ?? null;

  const passengersQuery = useQuery({
    queryKey: ['trip-passengers', activeTrip],
    queryFn: () => fetchTripPassengers(activeTrip!),
    enabled: Boolean(activeTrip),
    refetchInterval: 20_000,
  });

  return (
    <AppCard>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHeader title="Manifes penumpang" description="Daftar tiket pada trip, diperbarui otomatis." />
        {(tripsQuery.data?.length ?? 0) > 1 ? (
          <select
            value={activeTrip ?? ''}
            onChange={(e) => setSelected(e.target.value)}
            className="min-h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold dark:border-slate-800 dark:bg-slate-950"
            aria-label="Pilih trip"
          >
            {tripsQuery.data!.map((trip) => (
              <option key={trip.uuid} value={trip.uuid}>Trip #{trip.id} — {trip.status}</option>
            ))}
          </select>
        ) : null}
      </div>

      {tripsQuery.isLoading || passengersQuery.isLoading ? (
        <div className="mt-5 space-y-3"><Skeleton className="h-14" /><Skeleton className="h-14" /></div>
      ) : !activeTrip ? (
        <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-500"><ClipboardList size={16} /> Belum ada trip hari ini.</p>
      ) : passengersQuery.isError ? (
        <p className="mt-4 text-sm font-semibold text-rose-600">{extractApiError(passengersQuery.error, 'Gagal memuat manifes.')}</p>
      ) : (passengersQuery.data?.length ?? 0) === 0 ? (
        <p className="mt-4 text-sm font-semibold text-slate-500">Belum ada tiket pada trip ini.</p>
      ) : (
        <ul className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
          {passengersQuery.data!.map((ticket) => (
            <li key={String(ticket.uuid ?? ticket.id)} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-900 dark:text-slate-100">{ticket.passenger?.name ?? '—'}</p>
                <p className="truncate font-mono text-xs font-semibold text-slate-500">{ticket.ticket_number ?? ticket.uuid} · {ticket.booking?.code ?? ''}</p>
              </div>
              <Badge tone={ticket.status === 'boarded' || ticket.status === 'checked_in' ? 'success' : ticket.status === 'no_show' ? 'danger' : 'neutral'}>
                {String(ticket.status ?? 'issued').replaceAll('_', ' ')}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </AppCard>
  );
}

export function DriverEarningsPage() {
  const query = useQuery({ queryKey: ['driver-earnings'], queryFn: fetchDriverEarnings });
  const data = query.data;

  return (
    <div className="space-y-6">
      <PageHeader title="Pendapatan" description="Statistik pendapatan dan performa dihitung dari data trip nyata." />
      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div>
      ) : query.isError ? (
        <EmptyState title="Gagal memuat pendapatan" description={extractApiError(query.error, 'Terjadi kesalahan.')} />
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard label="Pendapatan hari ini" value={formatIDR(data.pendapatan_hari_ini)} helper={`${data.trip_hari_ini} trip hari ini`} />
            <StatsCard label="Pendapatan bulan ini" value={formatIDR(data.pendapatan_bulan_ini)} helper="Akumulasi bulan berjalan" />
            <StatsCard label="Total trip" value={String(data.total_trip)} helper={`${data.total_kilometer.toLocaleString('id-ID')} km ditempuh`} />
            <StatsCard label="Completion rate" value={`${data.completion_rate}%`} helper={`Pembatalan ${data.cancellation_rate}% · No-show ${data.no_show}`} />
          </div>
        </>
      ) : null}
    </div>
  );
}

const btnPrimary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-extrabold text-white shadow-sm shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60';
const btnPrimarySm = 'inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-extrabold text-white transition hover:bg-primary/90 disabled:opacity-60';
const btnSuccess = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-extrabold text-white transition hover:bg-emerald-700 disabled:opacity-60';
const btnSuccessSm = 'inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-extrabold text-white transition hover:bg-emerald-700 disabled:opacity-60';
const btnDanger = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 text-sm font-extrabold text-white transition hover:bg-rose-700 disabled:opacity-60';
const btnOutline = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 text-sm font-extrabold text-slate-700 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-200 disabled:opacity-60';
