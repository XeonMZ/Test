'use client';

import { FlaskConical, Loader2, Map as MapIcon, Play, RefreshCw, Square } from 'lucide-react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/portal';
import { extractApiError } from '@/services/stms';
import { useToast } from '@/shared/providers/toast-provider';
import { ActionButton, AppCard, Badge, EmptyState, PageHeader, SectionHeader, Skeleton } from '@/shared/ui/components';

// =====================================================================
// SUPER ADMIN — Map Provider management.
// Runtime switch between Google / OSM / Beta (SystemSetting + cached
// feature flag — effective immediately), FEATURE_MAP_BETA toggle, health
// statuses, and simulator start/stop. Owner-only (server-enforced).
// =====================================================================

const PROVIDERS = [
  { id: 'google', label: 'Google Maps', desc: 'Full production — Maps JS API, Places Autocomplete, live tracking.' },
  { id: 'osm', label: 'OpenStreetMap', desc: 'Low-cost production — MapLibre GL + OSM tiles, Nominatim, OSRM.' },
  { id: 'beta', label: 'Beta / Simulation', desc: 'Dev, QA, Demo, UAT — mock map engine, tanpa API key & internet.' },
] as const;

function statusTone(value: string | boolean): 'success' | 'warning' | 'danger' | 'neutral' {
  if (value === true || value === 'configured' || value === 'reachable' || value === 'ready') return 'success';
  if (value === 'unknown') return 'warning';
  if (value === false || value === 'not_configured' || value === 'not_ready' || value === 'error') return 'danger';
  return 'neutral';
}

function statusLabel(value: string | boolean): string {
  if (value === true) return 'Aktif';
  if (value === false) return 'Nonaktif';
  return ({ configured: 'Terkonfigurasi', not_configured: 'Belum dikonfigurasi', reachable: 'Terjangkau', error: 'Error', unknown: 'Tidak diketahui (egress dibatasi)', ready: 'Siap', not_ready: 'Belum siap' } as Record<string, string>)[value] ?? value;
}

export function MapSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['map-settings'], queryFn: adminApi.mapSettings });
  const data = query.data;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['map-settings'] });
    queryClient.invalidateQueries({ queryKey: ['map-config'] });
  };

  const updateMutation = useMutation({
    mutationFn: adminApi.mapSettingsUpdate,
    onSuccess: () => { toast('Pengaturan map diperbarui — langsung berlaku.', 'success'); refresh(); },
    onError: (error) => toast(extractApiError(error, 'Gagal memperbarui pengaturan.'), 'error'),
  });

  const simulatorMutation = useMutation({
    mutationFn: adminApi.mapSimulator,
    onSuccess: (res) => { toast(res.running ? 'Simulator dimulai (tercatat di audit trail).' : 'Simulator dihentikan.', 'success'); refresh(); },
    onError: (error) => toast(extractApiError(error, 'Gagal mengubah status simulator.'), 'error'),
  });

  if (query.isLoading) return <div className="space-y-4"><Skeleton className="h-40" /><Skeleton className="h-40" /></div>;
  if (query.isError || !data) return <EmptyState title="Gagal memuat pengaturan map" description={extractApiError(query.error, 'Terjadi kesalahan.')} />;

  const { resolution, statuses } = data;
  const busy = updateMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Map Provider"
        description="Provider Pattern: seluruh halaman peta memakai abstraksi yang sama — ganti provider di sini tanpa menyentuh business logic. Perubahan tercatat di audit trail dan langsung berlaku."
        actions={<ActionButton onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw size={16} className={query.isFetching ? 'animate-spin' : ''} /> Refresh</ActionButton>}
      />

      {resolution.beta_blocked && resolution.message ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">⚠ {resolution.message}</div>
      ) : null}

      <AppCard>
        <SectionHeader title="Provider Aktif" description={`Diminta: ${resolution.requested} · Efektif: ${resolution.provider}`} />
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {PROVIDERS.map((p) => {
            const active = resolution.requested === p.id;
            return (
              <button
                key={p.id}
                onClick={() => updateMutation.mutate({ provider: p.id })}
                disabled={busy || active}
                aria-pressed={active}
                className={`rounded-2xl border p-4 text-left transition ${active ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary dark:border-slate-800'}`}
              >
                <p className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  {p.id === 'beta' ? <FlaskConical size={15} className="text-amber-600" /> : <MapIcon size={15} className="text-primary" />} {p.label}
                  {active ? <Badge tone={p.id === 'beta' && resolution.beta_blocked ? 'warning' : 'success'}>{p.id === 'beta' && resolution.beta_blocked ? 'Diblokir' : 'Aktif'}</Badge> : null}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{p.desc}</p>
              </button>
            );
          })}
        </div>
      </AppCard>

      <AppCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeader title="FEATURE_MAP_BETA" description="Beta Mode hanya berjalan bila flag ini aktif. Jika provider = beta tapi flag mati, sistem otomatis menolak dan fallback ke provider default." />
          <button
            onClick={() => updateMutation.mutate({ beta_enabled: !resolution.beta_enabled })}
            disabled={busy}
            className={`min-h-11 rounded-md px-5 text-sm font-semibold uppercase tracking-button text-white transition disabled:opacity-60 ${resolution.beta_enabled ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
          >
            {busy ? <Loader2 size={15} className="mx-auto animate-spin" /> : resolution.beta_enabled ? 'Disable Beta Mode' : 'Enable Beta Mode'}
          </button>
        </div>
      </AppCard>

      <AppCard>
        <SectionHeader title="Status" description="Kesehatan provider & dependensi. Probe koneksi bisa 'tidak diketahui' bila egress server dibatasi." />
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {([
            ['Provider aktif', statuses.active_provider],
            ['FEATURE_MAP_BETA', statuses.feature_map_beta],
            ['Google API', statuses.google_api],
            ['OSM Tiles', statuses.osm_tiles],
            ['OSRM', statuses.osrm],
            ['WebSocket (Reverb)', statuses.websocket],
          ] as Array<[string, string | boolean]>).map(([label, value]) => (
            <li key={label} className="flex items-center justify-between gap-2 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/60">
              <span className="text-xs font-bold text-slate-500">{label}</span>
              <Badge tone={statusTone(value)}><span className="capitalize">{statusLabel(value)}</span></Badge>
            </li>
          ))}
        </ul>
      </AppCard>

      <AppCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeader title="Simulator" description={`Status: ${statuses.simulator_running ? 'berjalan' : 'berhenti'}. Hanya tersedia saat Beta Mode aktif; seluruh data simulasi in-memory.`} />
          <div className="flex gap-2">
            <button onClick={() => simulatorMutation.mutate('start')} disabled={simulatorMutation.isPending} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold uppercase tracking-button text-white transition hover:bg-emerald-700 disabled:opacity-60"><Play size={14} /> Jalankan</button>
            <button onClick={() => simulatorMutation.mutate('stop')} disabled={simulatorMutation.isPending} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-semibold uppercase tracking-button text-slate-700 transition hover:border-rose-300 hover:text-rose-700 disabled:opacity-60 dark:border-slate-800 dark:text-slate-200"><Square size={14} /> Hentikan</button>
            <Link href="/owner/map-simulator" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold uppercase tracking-button text-white transition hover:bg-primary-deep"><FlaskConical size={14} /> Buka Simulator</Link>
          </div>
        </div>
      </AppCard>
    </div>
  );
}
