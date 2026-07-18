'use client';

import { BadgeCheck, Download, FileSpreadsheet, Loader2, Mail, Phone, Printer, Save, ShieldCheck, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/services/http';
import { adminApi } from '@/services/portal';
import { extractApiError, formatDateTime, formatIDR, type ApiEnvelope } from '@/services/stms';
import { useAuth } from '@/shared/providers/auth-provider';
import { useToast } from '@/shared/providers/toast-provider';
import { AppCard, Badge, EmptyState, PageHeader, SectionHeader, Skeleton, StatsCard } from '@/shared/ui/components';

// =============================== PROFILE ===============================

type ProfileData = {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active?: boolean;
  created_at?: string;
  customer?: { phone?: string | null; membership?: { level?: string; points?: number } | null } | null;
  driver?: { license_number?: string | null; status?: string | null } | null;
};

async function fetchProfile(): Promise<ProfileData> {
  const res = await http.get<ApiEnvelope<ProfileData>>('/profile');
  return res.data.data;
}

export function ProfilePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({ queryKey: ['profile'], queryFn: fetchProfile });
  const profile = query.data;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setPhone(profile.customer?.phone ?? '');
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, string> = {};
      if (name.trim() && name.trim() !== profile?.name) payload.name = name.trim();
      if (profile?.customer && phone.trim() !== (profile.customer.phone ?? '')) payload.phone = phone.trim();
      return http.put('/profile', payload);
    },
    onSuccess: () => {
      toast('Profil berhasil diperbarui.', 'success');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error) => toast(extractApiError(error, 'Gagal memperbarui profil.'), 'error'),
  });

  const role = profile?.role ?? user?.role ?? '—';

  return (
    <div className="space-y-6">
      <PageHeader title="Profil Saya" description="Kelola informasi akunmu. Perubahan tersimpan langsung ke server." />

      {query.isLoading ? (
        <div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
      ) : query.isError ? (
        <EmptyState title="Gagal memuat profil" description={extractApiError(query.error, 'Terjadi kesalahan.')} />
      ) : profile ? (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <AppCard className="text-center">
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-primary/10 text-primary"><UserRound size={36} /></span>
            <h2 className="mt-4 font-display text-xl font-extrabold text-slate-950 dark:text-white">{profile.name}</h2>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500"><Mail size={14} /> {profile.email}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Badge tone="neutral"><span className="capitalize">{role}</span></Badge>
              <Badge tone={profile.is_active !== false ? 'success' : 'danger'}>{profile.is_active !== false ? 'aktif' : 'nonaktif'}</Badge>
            </div>
            <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-slate-400"><ShieldCheck size={13} /> Terdaftar {formatDateTime(profile.created_at)}</p>
            {profile.customer?.membership ? (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-primary"><BadgeCheck size={13} /> Member {profile.customer.membership.level} · {profile.customer.membership.points} poin</p>
            ) : null}
            {profile.driver ? (
              <p className="mt-2 font-mono text-xs font-bold text-slate-500">SIM: {profile.driver.license_number ?? '—'}</p>
            ) : null}
          </AppCard>

          <AppCard>
            <SectionHeader title="Ubah data" description="Nama tampilan dan nomor telepon (khusus akun customer)." />
            <form
              className="mt-6 grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (name.trim().length >= 2) saveMutation.mutate();
              }}
            >
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">Nama lengkap</span>
                <input value={name} onChange={(e) => setName(e.target.value)} minLength={2} required className={inputClass} />
              </label>
              {profile.customer ? (
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200"><Phone size={14} /> Nomor telepon</span>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} placeholder="08xxxxxxxxxx" className={inputClass} />
                </label>
              ) : null}
              <button type="submit" disabled={saveMutation.isPending} className="inline-flex min-h-12 w-fit items-center gap-2 rounded-2xl bg-primary px-6 text-sm font-extrabold text-white shadow-sm shadow-primary/20 transition hover:bg-primary/90 disabled:opacity-60">
                {saveMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Simpan perubahan
              </button>
            </form>
          </AppCard>
        </div>
      ) : null}
    </div>
  );
}

// =============================== REPORTS ===============================

type OperationalReport = {
  from?: string;
  to?: string;
  bookings_total: number;
  bookings_by_status: Record<string, number>;
  revenue_total: number;
  payments_by_status: Record<string, number>;
  active_customers: number;
  active_drivers: number;
  active_vehicles: number;
  tickets_checked_in: number;
};

type ReportFilter = { period: string; from: string; to: string };

function reportParams(filter: ReportFilter): Record<string, string> {
  if (filter.period === 'custom') {
    const params: Record<string, string> = {};
    if (filter.from) params.from = filter.from;
    if (filter.to) params.to = filter.to;
    return params;
  }
  return filter.period ? { period: filter.period } : {};
}

async function fetchReports(filter: ReportFilter): Promise<OperationalReport> {
  const res = await http.get<{ data: OperationalReport }>('/admin/reports', { params: reportParams(filter) });
  return res.data.data;
}

const REPORT_PERIODS = [
  { key: '', label: '30 Hari' },
  { key: 'today', label: 'Hari Ini' },
  { key: 'week', label: 'Minggu Ini' },
  { key: 'month', label: 'Bulan Ini' },
  { key: 'custom', label: 'Custom' },
];

export function ReportsPage() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<ReportFilter>({ period: '', from: '', to: '' });
  const [exporting, setExporting] = useState<string | null>(null);
  const query = useQuery({ queryKey: ['operational-reports', filter], queryFn: () => fetchReports(filter), refetchInterval: 60_000 });
  const data = query.data;

  async function exportReport(format: 'csv' | 'excel') {
    setExporting(format);
    try {
      await adminApi.downloadFile('/admin/reports/export', `stms-report.${format === 'excel' ? 'xls.csv' : 'csv'}`, { ...reportParams(filter), format });
      toast('Laporan berhasil diekspor.', 'success');
    } catch (error) {
      toast(extractApiError(error, 'Ekspor gagal.'), 'error');
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Operasional"
        description="Ringkasan operasional dihitung langsung dari tabel operasional. Pilih periode lalu ekspor bila perlu."
        actions={
          <div className="flex flex-wrap gap-2">
            <button onClick={() => exportReport('csv')} disabled={exporting !== null} className={exportBtn}>{exporting === 'csv' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} CSV</button>
            <button onClick={() => exportReport('excel')} disabled={exporting !== null} className={exportBtn}>{exporting === 'excel' ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />} Excel</button>
            <button onClick={() => window.print()} className={exportBtn}><Printer size={14} /> PDF</button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {REPORT_PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setFilter((f) => ({ ...f, period: p.key }))}
            className={`min-h-10 rounded-2xl px-4 text-sm font-extrabold transition ${filter.period === p.key ? 'bg-primary text-white shadow-sm shadow-primary/20' : 'border border-slate-200 text-slate-600 hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300'}`}
          >
            {p.label}
          </button>
        ))}
        {filter.period === 'custom' ? (
          <span className="flex items-center gap-2">
            <input type="date" value={filter.from} onChange={(e) => setFilter((f) => ({ ...f, from: e.target.value }))} aria-label="Dari tanggal" className="min-h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold dark:border-slate-800 dark:bg-slate-950" />
            <span className="text-sm font-bold text-slate-400">s/d</span>
            <input type="date" value={filter.to} onChange={(e) => setFilter((f) => ({ ...f, to: e.target.value }))} aria-label="Sampai tanggal" className="min-h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold dark:border-slate-800 dark:bg-slate-950" />
          </span>
        ) : null}
      </div>

      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div>
      ) : query.isError ? (
        <EmptyState title="Gagal memuat laporan" description={extractApiError(query.error, 'Terjadi kesalahan.')} />
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard label="Total booking" value={String(data.bookings_total)} helper="Pada periode terpilih" />
            <StatsCard label="Revenue" value={formatIDR(data.revenue_total)} helper="Pembayaran berstatus paid" />
            <StatsCard label="Customer aktif" value={String(data.active_customers)} helper={`${data.active_drivers} driver · ${data.active_vehicles} armada aktif`} />
            <StatsCard label="Check-in tiket" value={String(data.tickets_checked_in)} helper="Penumpang ter-check-in" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <AppCard>
              <SectionHeader title="Booking per status" />
              <StatusList entries={data.bookings_by_status} />
            </AppCard>
            <AppCard>
              <SectionHeader title="Pembayaran per status" />
              <StatusList entries={data.payments_by_status} />
            </AppCard>
          </div>
        </>
      ) : null}
    </div>
  );
}

const exportBtn = 'inline-flex min-h-10 items-center gap-1.5 rounded-2xl border border-slate-200 px-4 text-xs font-extrabold text-slate-700 transition hover:border-primary hover:text-primary disabled:opacity-50 dark:border-slate-800 dark:text-slate-200';

function StatusList({ entries }: { entries: Record<string, number> }) {
  const items = Object.entries(entries ?? {});
  if (items.length === 0) {
    return <p className="mt-4 text-sm font-semibold text-slate-500">Belum ada data pada rentang ini.</p>;
  }
  const max = Math.max(...items.map(([, total]) => total), 1);
  return (
    <ul className="mt-5 space-y-3">
      {items.map(([status, total]) => (
        <li key={status}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-bold capitalize text-slate-700 dark:text-slate-200">{status.replaceAll('_', ' ')}</span>
            <span className="font-extrabold text-slate-900 dark:text-slate-100">{total}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-primary/80" style={{ width: `${(total / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const inputClass = 'min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100';
