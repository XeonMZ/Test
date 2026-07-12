'use client';

import { AlertTriangle, Archive, Download, FlaskConical, Loader2, RefreshCw, ShieldCheck, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/services/http';
import { extractApiError, formatDateTime, type ApiEnvelope } from '@/services/stms';
import { useToast } from '@/shared/providers/toast-provider';
import { ActionButton, AppCard, Badge, EmptyState, PageHeader, SectionHeader, Skeleton } from '@/shared/ui/components';

type FeatureFlag = { id: number; key: string; enabled: boolean; updated_at?: string };

export function FeatureFlagsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['owner-feature-flags'],
    queryFn: async () => (await http.get<ApiEnvelope<FeatureFlag[]>>('/owner/feature-flags')).data.data,
  });

  const toggleMutation = useMutation({
    mutationFn: (flag: FeatureFlag) => http.patch('/owner/feature-flags', { key: flag.key, enabled: !flag.enabled }),
    onSuccess: (_result, flag) => {
      toast(`Flag "${flag.key}" ${flag.enabled ? 'dimatikan' : 'diaktifkan'}.`, 'success');
      queryClient.invalidateQueries({ queryKey: ['owner-feature-flags'] });
    },
    onError: (error) => toast(extractApiError(error, 'Gagal mengubah flag.'), 'error'),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feature Flags"
        description="Aktif/nonaktifkan fitur sistem secara live. Perubahan langsung menghapus cache flag terkait."
        actions={
          <ActionButton onClick={() => query.refetch()} disabled={query.isFetching}>
            <RefreshCw size={16} className={query.isFetching ? 'animate-spin' : ''} /> Refresh
          </ActionButton>
        }
      />

      {query.isLoading ? (
        <div className="space-y-3"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
      ) : query.isError ? (
        <EmptyState title="Gagal memuat flags" description={extractApiError(query.error, 'Terjadi kesalahan.')} />
      ) : (query.data?.length ?? 0) === 0 ? (
        <EmptyState title="Belum ada feature flag" description="Flag akan muncul setelah seeder dijalankan atau flag pertama dibuat." />
      ) : (
        <AppCard>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {query.data!.map((flag) => (
              <li key={flag.id} className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-mono text-sm font-extrabold tracking-wide text-slate-900 dark:text-slate-100">
                    <FlaskConical size={15} className="shrink-0 text-primary" /> {flag.key}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Diubah {formatDateTime(flag.updated_at)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge tone={flag.enabled ? 'success' : 'neutral'}>{flag.enabled ? 'aktif' : 'nonaktif'}</Badge>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={flag.enabled}
                    aria-label={`Toggle ${flag.key}`}
                    disabled={toggleMutation.isPending}
                    onClick={() => toggleMutation.mutate(flag)}
                    className="text-primary transition hover:scale-105 disabled:opacity-50"
                  >
                    {flag.enabled ? <ToggleRight size={34} /> : <ToggleLeft size={34} className="text-slate-400" />}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </AppCard>
      )}
    </div>
  );
}

type BackupResult = Record<string, unknown>;

export function BackupPage() {
  const { toast } = useToast();
  const [lastBackup, setLastBackup] = useState<BackupResult | null>(null);
  const [confirmingWipe, setConfirmingWipe] = useState(false);

  const healthQuery = useQuery({
    queryKey: ['owner-backup-health'],
    queryFn: async () => (await http.get<{ data: Record<string, unknown> }>('/owner/production-readiness/health')).data.data,
  });

  const backupMutation = useMutation({
    mutationFn: async () => (await http.post<{ data: BackupResult }>('/owner/production-readiness/configuration/backup')).data.data,
    onSuccess: (data) => {
      setLastBackup(data);
      toast('Backup konfigurasi berhasil dibuat.', 'success');
    },
    onError: (error) => toast(extractApiError(error, 'Backup gagal.'), 'error'),
  });

  const wipeDemoMutation = useMutation({
    mutationFn: async () => (await http.delete('/owner/production-readiness/demo-data', { data: { confirm: true } })).data,
    onSuccess: () => {
      setConfirmingWipe(false);
      toast('Data demo berhasil dihapus.', 'success');
    },
    onError: (error) => toast(extractApiError(error, 'Gagal menghapus data demo.'), 'error'),
  });

  async function downloadExport() {
    try {
      const response = await http.get('/owner/production-readiness/configuration/export', { responseType: 'blob' });
      const url = URL.createObjectURL(response.data as Blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'stms-configuration.json';
      anchor.click();
      URL.revokeObjectURL(url);
      toast('Konfigurasi berhasil diekspor.', 'success');
    } catch (error) {
      toast(extractApiError(error, 'Ekspor gagal.'), 'error');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Backup & Konfigurasi" description="Backup konfigurasi sistem, ekspor pengaturan, dan pembersihan data demo sebelum go-live." />

      <div className="grid gap-6 lg:grid-cols-2">
        <AppCard>
          <SectionHeader title="Backup konfigurasi" description="Membuat snapshot pengaturan & feature flags di server (endpoint dibatasi 6 permintaan/menit)." />
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={() => backupMutation.mutate()} disabled={backupMutation.isPending} className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-primary px-5 text-sm font-extrabold text-white transition hover:bg-primary/90 disabled:opacity-60">
              {backupMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Archive size={16} />} Buat backup
            </button>
            <button onClick={downloadExport} className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 px-5 text-sm font-extrabold text-slate-700 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-200">
              <Download size={16} /> Ekspor JSON
            </button>
          </div>
          {lastBackup ? (
            <pre className="mt-5 max-h-48 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-5 text-emerald-300">{JSON.stringify(lastBackup, null, 2)}</pre>
          ) : null}
        </AppCard>

        <AppCard>
          <SectionHeader title="Kesehatan sistem" description="Status live database, cache, dan komponen inti." />
          {healthQuery.isLoading ? (
            <Skeleton className="mt-5 h-32" />
          ) : healthQuery.isError ? (
            <p className="mt-4 text-sm font-semibold text-rose-600">{extractApiError(healthQuery.error, 'Gagal memuat status.')}</p>
          ) : (
            <dl className="mt-5 space-y-2">
              {Object.entries(healthQuery.data ?? {}).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/60">
                  <dt className="flex items-center gap-2 text-sm font-bold capitalize text-slate-700 dark:text-slate-200"><ShieldCheck size={15} className="text-emerald-500" /> {key.replaceAll('_', ' ')}</dt>
                  <dd className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd>
                </div>
              ))}
            </dl>
          )}
        </AppCard>
      </div>

      <AppCard className="border-rose-200 dark:border-rose-900">
        <SectionHeader title="Zona berbahaya" description="Hapus seluruh data demo (akun & transaksi contoh) sebelum sistem dipakai produksi." />
        {confirmingWipe ? (
          <div className="mt-5 space-y-3">
            <p className="flex items-start gap-2 text-sm font-bold text-rose-700 dark:text-rose-300">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" /> Tindakan ini permanen dan tidak dapat dibatalkan. Lanjutkan?
            </p>
            <div className="flex gap-2">
              <button onClick={() => wipeDemoMutation.mutate()} disabled={wipeDemoMutation.isPending} className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-rose-600 px-5 text-sm font-extrabold text-white transition hover:bg-rose-700 disabled:opacity-60">
                {wipeDemoMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Ya, hapus data demo
              </button>
              <button onClick={() => setConfirmingWipe(false)} className="inline-flex min-h-11 items-center rounded-2xl border border-slate-200 px-5 text-sm font-extrabold text-slate-700 dark:border-slate-800 dark:text-slate-200">Batal</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setConfirmingWipe(true)} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-2xl border border-rose-200 px-5 text-sm font-extrabold text-rose-700 transition hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40">
            <Trash2 size={15} /> Hapus data demo
          </button>
        )}
      </AppCard>
    </div>
  );
}
