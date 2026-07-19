'use client';

import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { extractApiError, fetchOwnerAnalytics, fetchOwnerRevenue, formatIDR } from '@/services/stms';
import { ActionButton, AppCard, Badge, EmptyState, PageHeader, SectionHeader, Skeleton, StatsCard } from '@/shared/ui/components';

/** Lightweight dependency-free bar chart (pure CSS/flex). */
function BarChart({ data, format }: { data: Array<{ date: string; total: number }>; format?: (n: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.total));
  return (
    <div className="mt-5">
      <div className="flex h-44 items-end gap-1" role="img" aria-label="Grafik batang harian">
        {data.map((item) => (
          <div key={item.date} className="group relative flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t-lg bg-primary/80 transition group-hover:bg-primary"
              style={{ height: `${Math.max(2, (item.total / max) * 100)}%` }}
            />
            <span className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-950 px-2 py-1 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100 dark:bg-white dark:text-slate-950">
              {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}: {format ? format(item.total) : item.total}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] font-bold text-slate-400">
        <span>{new Date(data[0]?.date ?? Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
        <span>{new Date(data[data.length - 1]?.date ?? Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
      </div>
    </div>
  );
}

export function OwnerAnalyticsPage() {
  const [period, setPeriod] = useState('month');
  const query = useQuery({ queryKey: ['owner-analytics', period], queryFn: () => fetchOwnerAnalytics(period), refetchInterval: 60_000 });
  const data = query.data;

  const PERIODS = [
    { key: 'today', label: 'Hari Ini' },
    { key: 'week', label: 'Minggu Ini' },
    { key: 'month', label: 'Bulan Ini' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Analytics"
        description="KPI bisnis dihitung langsung dari tabel operasional — booking, pembayaran, armada, dan tiket."
        actions={
          <div className="flex items-center gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                className={`min-h-10 rounded-2xl px-4 text-sm font-extrabold transition ${period === p.key ? 'bg-primary text-white shadow-sm shadow-primary/20' : 'border border-slate-200 text-slate-600 hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300'}`}
              >
                {p.label}
              </button>
            ))}
            <ActionButton onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw size={16} className={query.isFetching ? 'animate-spin' : ''} /> Refresh</ActionButton>
          </div>
        }
      />

      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div>
      ) : query.isError ? (
        <EmptyState title="Gagal memuat analytics" description={extractApiError(query.error, 'Terjadi kesalahan.')} />
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard label="Total revenue" value={formatIDR(data.kpis.total_revenue)} helper={`Bulan ini: ${formatIDR(data.kpis.revenue_this_month)}`} />
            <StatsCard label="Booking lunas" value={String(data.kpis.paid_bookings)} helper={`Dari total ${data.kpis.total_bookings} booking`} />
            <StatsCard label="Customer" value={String(data.kpis.total_customers)} helper={`${data.kpis.total_drivers} driver aktif terdaftar`} />
            <StatsCard label="Armada aktif" value={String(data.kpis.active_vehicles)} helper={`${data.kpis.upcoming_schedules} jadwal mendatang · ${data.kpis.tickets_issued} tiket terbit`} />
          </div>

          {data.period ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard label={`Booking (${PERIODS.find((p) => p.key === period)?.label})`} value={String(data.period.bookings)} helper={`${data.period.schedules} jadwal · ${data.period.jastip_orders} paket jastip`} />
              <StatsCard label="Revenue periode" value={formatIDR(data.period.revenue)} helper="Booking lunas pada periode" />
              <StatsCard label="Cancel rate" value={`${data.period.cancel_rate}%`} helper={`${data.period.cancelled} booking batal/kedaluwarsa`} />
              <StatsCard label="Occupancy" value={`${data.period.occupancy_rate}%`} helper="Kursi terisi dari kapasitas jadwal periode" />
            </div>
          ) : null}

          {data.fleet && data.drivers ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <AppCard>
                <SectionHeader title="Fleet" description="Status armada saat ini." />
                <ul className="mt-5 grid grid-cols-2 gap-3">
                  <li className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/60"><p className="text-xs font-bold text-slate-500">Ready</p><p className="text-xl font-extrabold text-emerald-600">{data.fleet.active}</p></li>
                  <li className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/60"><p className="text-xs font-bold text-slate-500">On Trip</p><p className="text-xl font-extrabold text-amber-600">{data.fleet.on_trip}</p></li>
                  <li className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/60"><p className="text-xs font-bold text-slate-500">Perbaikan</p><p className="text-xl font-extrabold text-orange-600">{data.fleet.maintenance}</p></li>
                  <li className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/60"><p className="text-xs font-bold text-slate-500">Nonaktif</p><p className="text-xl font-extrabold text-slate-500">{data.fleet.inactive}</p></li>
                </ul>
              </AppCard>
              <AppCard>
                <SectionHeader title="Driver" description="Status driver saat ini." />
                <ul className="mt-5 grid grid-cols-3 gap-3">
                  <li className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/60"><p className="text-xs font-bold text-slate-500">Aktif</p><p className="text-xl font-extrabold text-emerald-600">{data.drivers.available}</p></li>
                  <li className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/60"><p className="text-xs font-bold text-slate-500">Nonaktif</p><p className="text-xl font-extrabold text-amber-600">{data.drivers.offline}</p></li>
                  <li className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/60"><p className="text-xs font-bold text-slate-500">Suspended</p><p className="text-xl font-extrabold text-rose-600">{data.drivers.suspended}</p></li>
                </ul>
              </AppCard>
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <AppCard>
              <SectionHeader title="Booking harian (14 hari)" description="Volume pemesanan per hari." />
              <BarChart data={data.daily_bookings} />
            </AppCard>
            <AppCard>
              <SectionHeader title="Status booking" />
              <ul className="mt-5 space-y-3">
                {Object.entries(data.bookings_by_status).length === 0 ? (
                  <li className="text-sm font-semibold text-slate-500">Belum ada data booking.</li>
                ) : (
                  Object.entries(data.bookings_by_status).map(([status, total]) => (
                    <li key={status} className="flex items-center justify-between gap-3">
                      <Badge tone={['paid', 'ticket_generated', 'completed'].includes(status) ? 'success' : ['cancelled', 'expired'].includes(status) ? 'danger' : 'warning'}>{status.replaceAll('_', ' ')}</Badge>
                      <span className="font-extrabold text-slate-900 dark:text-slate-100">{total}</span>
                    </li>
                  ))
                )}
              </ul>
            </AppCard>
          </div>

          <AppCard>
            <SectionHeader title="Rute terlaris" description="Lima rute dengan revenue tertinggi." />
            {data.top_routes.length === 0 ? (
              <p className="mt-4 text-sm font-semibold text-slate-500">Belum ada booking lunas.</p>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-slate-500">
                    <tr><th className="py-2 pr-4 font-extrabold">Rute</th><th className="py-2 pr-4 font-extrabold">Booking</th><th className="py-2 text-right font-extrabold">Revenue</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.top_routes.map((route) => (
                      <tr key={route.code}>
                        <td className="py-3 pr-4 font-bold text-slate-900 dark:text-slate-100">{route.origin} → {route.destination} <span className="ml-1 text-xs font-extrabold text-slate-400">{route.code}</span></td>
                        <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{route.bookings}</td>
                        <td className="py-3 text-right font-extrabold text-primary">{formatIDR(route.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AppCard>
        </>
      ) : null}
    </div>
  );
}

export function OwnerRevenuePage() {
  const [days, setDays] = useState(30);
  const query = useQuery({ queryKey: ['owner-revenue', days], queryFn: () => fetchOwnerRevenue(days) });
  const data = query.data;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Revenue"
        description="Rincian pendapatan harian, per rute, dan status pembayaran."
        actions={
          <div className="flex items-center gap-2">
            {[14, 30, 90].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDays(option)}
                className={`min-h-10 rounded-2xl px-4 text-sm font-extrabold transition ${days === option ? 'bg-primary text-white shadow-sm shadow-primary/20' : 'border border-slate-200 text-slate-600 hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300'}`}
              >
                {option} hari
              </button>
            ))}
          </div>
        }
      />

      {query.isLoading ? (
        <div className="space-y-4"><Skeleton className="h-24" /><Skeleton className="h-60" /></div>
      ) : query.isError ? (
        <EmptyState title="Gagal memuat revenue" description={extractApiError(query.error, 'Terjadi kesalahan.')} />
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard label={`Total revenue ${data.range_days} hari terakhir`} value={formatIDR(data.total)} helper="Booking dengan status lunas, tiket terbit, atau selesai." />
            {data.summary ? (
              <>
                <StatsCard label="Hari Ini" value={formatIDR(data.summary.today.revenue)} helper={`${data.summary.today.bookings} booking · ${data.summary.today.schedules} jadwal · ${data.summary.today.growth_pct >= 0 ? '▲' : '▼'} ${Math.abs(data.summary.today.growth_pct)}% vs kemarin`} />
                <StatsCard label="Minggu Ini" value={formatIDR(data.summary.week.revenue)} helper={`${data.summary.week.bookings} booking · ${data.summary.week.schedules} jadwal · ${data.summary.week.growth_pct >= 0 ? '▲' : '▼'} ${Math.abs(data.summary.week.growth_pct)}% vs minggu lalu`} />
                <StatsCard label="Bulan Ini" value={formatIDR(data.summary.month.revenue)} helper={`${data.summary.month.bookings} booking · ${data.summary.month.schedules} jadwal · ${data.summary.month.growth_pct >= 0 ? '▲' : '▼'} ${Math.abs(data.summary.month.growth_pct)}% vs bulan lalu`} />
              </>
            ) : null}
          </div>

          {data.resources ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatsCard label="Driver aktif" value={String(data.resources.active_drivers)} helper="Driver yang tidak disuspend" />
              <StatsCard label="Armada aktif" value={String(data.resources.active_vehicles)} helper="Kendaraan berstatus Ready" />
              <StatsCard label="Rute" value={String(data.resources.routes)} helper="Total rute terdaftar" />
            </div>
          ) : null}

          <AppCard>
            <SectionHeader title="Revenue harian" />
            <BarChart data={data.daily} format={(n) => formatIDR(n)} />
          </AppCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <AppCard>
              <SectionHeader title="Revenue per rute" />
              {data.by_route.length === 0 ? (
                <p className="mt-4 text-sm font-semibold text-slate-500">Belum ada data.</p>
              ) : (
                <ul className="mt-5 space-y-3">
                  {data.by_route.map((route) => (
                    <li key={route.code} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/60">
                      <span className="min-w-0 truncate font-bold text-slate-900 dark:text-slate-100">{route.origin} → {route.destination}</span>
                      <span className="shrink-0 font-extrabold text-primary">{formatIDR(route.revenue)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </AppCard>
            <AppCard>
              <SectionHeader title="Status pembayaran" />
              {data.by_payment_status.length === 0 ? (
                <p className="mt-4 text-sm font-semibold text-slate-500">Belum ada data pembayaran.</p>
              ) : (
                <ul className="mt-5 space-y-3">
                  {data.by_payment_status.map((row) => (
                    <li key={row.status} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/60">
                      <Badge tone={row.status === 'paid' ? 'success' : ['failed', 'expired'].includes(row.status) ? 'danger' : 'warning'}>{row.status}</Badge>
                      <span className="text-sm font-semibold text-slate-500">{row.total} transaksi</span>
                      <span className="font-extrabold text-slate-900 dark:text-slate-100">{formatIDR(row.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </AppCard>
          </div>
        </>
      ) : null}
    </div>
  );
}
