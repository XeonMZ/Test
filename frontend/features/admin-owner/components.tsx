'use client';

import { useQuery } from '@tanstack/react-query';
import { AppCard, EmptyState, PageHeader, SectionHeader, StatsCard, Timeline } from '@/shared/ui/components';
import { fetchAdminOwnerSummary, fetchRecentActivity } from './api';
import { adminMetrics, ownerMetrics } from './data';

type Summary = {
  bookings_total?: number;
  bookings_by_status?: Record<string, number>;
  revenue_total?: number;
  payments_by_status?: Record<string, number>;
  active_customers?: number;
  active_drivers?: number;
  active_vehicles?: number;
  tickets_checked_in?: number;
};

function formatCurrency(value?: number) { return typeof value === 'number' ? `Rp ${value.toLocaleString('id-ID')}` : undefined; }

// Maps each dashboard metric label to a real value from /admin/reports where a direct field exists.
// Metrics without a dedicated aggregation yet are left as '--' rather than fabricated.
function metricValue(label: string, summary?: Summary): { value?: string; helper: string } {
  if (!summary) return { value: undefined, helper: 'Loading…' };
  switch (label) {
    case 'Total Booking Hari Ini':
    case 'Booking Aktif':
      return { value: String(summary.bookings_total ?? 0), helper: 'Last 30 days total' };
    case 'Waiting Payment':
    case 'Outstanding Payment':
      return { value: String(summary.payments_by_status?.pending ?? 0), helper: 'Payments pending' };
    case 'Pendapatan Hari Ini':
    case 'Pendapatan Bulan Ini':
    case 'Revenue':
      return { value: formatCurrency(summary.revenue_total) ?? '--', helper: 'Paid amount, last 30 days' };
    case 'Kendaraan Aktif':
    case 'Vehicle Utilization':
      return { value: String(summary.active_vehicles ?? 0), helper: 'Active vehicles' };
    case 'Driver Online':
    case 'Driver Performance':
      return { value: String(summary.active_drivers ?? 0), helper: 'Active drivers' };
    case 'Customer Baru':
    case 'Customer Growth':
      return { value: String(summary.active_customers ?? 0), helper: 'Active customers' };
    case 'Payment Status':
      return { value: String(Object.values(summary.payments_by_status ?? {}).reduce((a, b) => a + b, 0)), helper: 'Payments, last 30 days' };
    default:
      return { value: undefined, helper: 'No dedicated aggregation endpoint yet' };
  }
}

function MetricCard(props: { label: string; summary?: Summary }) {
  const { value, helper } = metricValue(props.label, props.summary);
  return <StatsCard label={props.label} value={value ?? '--'} helper={helper} />;
}

function ChartCard({ title, series }: { title: string; series?: { label: string; value: number }[] }) {
  const data = series && series.length > 0 ? series : [];
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <AppCard>
      <SectionHeader title={title} description="Data aktual dari laporan platform." />
      {data.length === 0 ? (
        <div className="mt-5 grid h-44 place-items-center rounded-3xl bg-slate-50 text-sm font-semibold text-slate-400 dark:bg-slate-950/60">Belum ada data</div>
      ) : (
        <div className="mt-5 flex h-44 items-end gap-2 rounded-3xl bg-slate-50 p-4 dark:bg-slate-950/60">
          {data.map((d) => (
            <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
              <span className="w-full rounded-t-2xl bg-gradient-to-t from-primary to-sky-300 shadow-sm transition hover:opacity-80" style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }} title={`${d.label}: ${d.value}`} />
              <span className="truncate text-[10px] font-bold text-slate-400">{d.label}</span>
            </div>
          ))}
        </div>
      )}
    </AppCard>
  );
}

function RecentActivityCard() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-owner-recent-activity'], queryFn: fetchRecentActivity, staleTime: 30_000, refetchInterval: 30_000 });
  const rows = (data?.data?.data ?? data?.data ?? []) as Array<{ action?: string; subject_type?: string; created_at?: string }>;
  const items = rows.length > 0
    ? rows.map((row) => `${row.action ?? 'activity'} — ${row.subject_type ?? ''}`.trim())
    : isLoading ? ['Loading…'] : ['No recent activity recorded yet'];
  return <AppCard><SectionHeader title="Aktivitas Terbaru" /><div className="mt-4"><Timeline items={items} /></div></AppCard>;
}

function LiveOpsCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['live-ops-summary'],
    queryFn: async () => (await import('@/services/portal')).adminApi.liveSummary(),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
  const items = [
    { label: 'Driver Aktif', value: data?.active_drivers ?? 0, color: 'text-emerald-600' },
    { label: 'Trip Aktif', value: data?.active_trips ?? 0, color: 'text-primary' },
    { label: 'Customer Dalam Perjalanan', value: data?.customers_in_transit ?? 0, color: 'text-amber-600' },
    { label: 'Paket Dalam Pengiriman', value: data?.packages_in_transit ?? 0, color: 'text-orange-600' },
  ];
  return (
    <AppCard>
      <div className="flex items-center justify-between">
        <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Operasional Live</p>
        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-600"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Realtime</span>
      </div>
      {isLoading ? (
        <Skeleton className="mt-4 h-20" />
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.label} className="rounded-2xl bg-slate-50 px-3 py-3 text-center dark:bg-slate-950/60">
              <p className={`text-2xl font-extrabold ${item.color}`}>{item.value}</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">{item.label}</p>
            </div>
          ))}
        </div>
      )}
    </AppCard>
  );
}

export function DashboardPage({ scope }: { scope: 'admin' | 'owner' }) {
  const metrics = scope === 'admin' ? adminMetrics : ownerMetrics;
  const { data: summaryData, isError, dataUpdatedAt } = useQuery({ queryKey: ['admin-owner-summary'], queryFn: fetchAdminOwnerSummary, staleTime: 30_000, refetchInterval: 30_000 });
  const summary: Summary | undefined = summaryData?.data;
  const paymentSeries = summary?.payments_by_status
    ? Object.entries(summary.payments_by_status).map(([label, value]) => ({ label, value: Number(value) }))
    : [];
  return <div className="space-y-6 sm:space-y-8"><PageHeader title={scope === 'admin' ? 'Admin Dashboard' : 'Owner Dashboard'} description={`Metrik live dari endpoint laporan — diperbarui otomatis tiap 30 detik${dataUpdatedAt ? ` (terakhir ${new Date(dataUpdatedAt).toLocaleTimeString('id-ID')})` : ''}.`} />
    {isError ? <EmptyState title="Gagal memuat metrik" description="Periksa koneksi ke endpoint laporan." /> : null}
    <LiveOpsCard />
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">{metrics.map((m) => <MetricCard key={m} label={m} summary={summary} />)}</div>
    <div className="grid gap-4 lg:grid-cols-2"><ChartCard title="Pembayaran per Status" series={paymentSeries} /><RecentActivityCard /></div>
  </div>;
}
