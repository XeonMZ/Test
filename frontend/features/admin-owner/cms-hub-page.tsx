'use client';

import { History, Loader2, Monitor, Palette, RotateCcw, Save, Send, Smartphone, Tablet } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, type CmsBranding, type CmsVersionRow } from '@/services/portal';
import { extractApiError } from '@/services/stms';
import { useToast } from '@/shared/providers/toast-provider';
import { AppCard, Badge, EmptyState, PageHeader, SectionHeader, Skeleton } from '@/shared/ui/components';
import { CmsPage } from './cms-page';
import { CmsBuilderPage } from './cms-builder';
import { CompanyProfileEditor } from './company-profile-editor';
import { LegalEditor } from './legal-editor';
import { CoverUploader } from './image-uploader';

type Tab = 'builder' | 'content' | 'branding' | 'profile' | 'legal' | 'versions';
type Viewport = 'desktop' | 'tablet' | 'mobile';

const VIEWPORTS: Record<Viewport, { w: number; icon: typeof Monitor; label: string }> = {
  desktop: { w: 1280, icon: Monitor, label: 'Desktop' },
  tablet: { w: 768, icon: Tablet, label: 'Tablet' },
  mobile: { w: 390, icon: Smartphone, label: 'Mobile' },
};

const input = 'min-h-11 w-full rounded-md border border-steel bg-canvas px-4 text-sm text-ink outline-none transition-colors placeholder:text-graphite focus:border-primary dark:border-ink-soft dark:bg-ink dark:text-slate-100';

/**
 * Centralized CMS hub — one page to manage all site content, branding, and
 * versions with a live preview of the public home page. Content editing reuses
 * the existing CmsPage (sections + tour packages); this shell adds branding,
 * responsive live preview, and draft/publish + version history on real DB
 * storage (no hardcoded content).
 */
export function CmsHubPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('builder');
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [previewKey, setPreviewKey] = useState(0);

  const publishMutation = useMutation({
    mutationFn: (status: 'draft' | 'published') => adminApi.cmsSaveVersion({ status }),
    onSuccess: (_res, status) => { toast(status === 'published' ? 'Perubahan dipublikasikan ke situs.' : 'Draft tersimpan.', 'success'); qc.invalidateQueries({ queryKey: ['cms-versions'] }); setPreviewKey((k) => k + 1); },
    onError: (error) => toast(extractApiError(error, 'Gagal menyimpan versi.'), 'error'),
  });

  const homeUrl = '/';

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pusat CMS"
        description="Kelola seluruh konten situs, branding, dan SEO dari satu tempat — dengan pratinjau langsung, draft, publish, dan riwayat versi. Semua tersimpan di database."
        actions={
          <div className="flex flex-wrap gap-2">
            <button onClick={() => publishMutation.mutate('draft')} disabled={publishMutation.isPending} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-semibold uppercase tracking-button text-slate-600 hover:border-primary hover:text-primary disabled:opacity-60 dark:border-slate-800 dark:text-slate-300"><Save size={15} /> Simpan Draft</button>
            <button onClick={() => publishMutation.mutate('published')} disabled={publishMutation.isPending} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold uppercase tracking-button text-white hover:bg-primary-deep disabled:opacity-60">{publishMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Publish</button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {([['builder', 'Page Builder'], ['content', 'Konten (tabel)'], ['branding', 'Branding & SEO'], ['profile', 'Profil Perusahaan'], ['legal', 'Halaman Legal'], ['versions', 'Riwayat Versi']] as Array<[Tab, string]>).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`min-h-10 rounded-xl px-4 text-sm font-extrabold transition ${tab === key ? 'bg-primary text-white' : 'border border-slate-200 text-slate-600 hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300'}`}>{label}</button>
        ))}
      </div>

      <div className={`grid gap-5 ${tab === 'builder' ? '' : 'xl:grid-cols-[1fr_460px]'}`}>
        <div className="min-w-0 space-y-5">
          {tab === 'builder' ? <CmsBuilderPage /> : null}
          {tab === 'content' ? <CmsPage /> : null}
          {tab === 'branding' ? <BrandingEditor /> : null}
          {tab === 'profile' ? <CompanyProfileEditor /> : null}
          {tab === 'legal' ? <LegalEditor /> : null}
          {tab === 'versions' ? <VersionHistory onRestored={() => setPreviewKey((k) => k + 1)} /> : null}
        </div>

        {/* Live preview (hidden on builder tab — the builder has its own) */}
        <div className={tab === 'builder' ? 'hidden' : 'hidden xl:block'}>
          <AppCard className="sticky top-6">
            <div className="flex items-center justify-between">
              <SectionHeader title="Pratinjau Langsung" />
              <div className="flex gap-1">
                {(Object.keys(VIEWPORTS) as Viewport[]).map((v) => {
                  const Icon = VIEWPORTS[v].icon;
                  return <button key={v} onClick={() => setViewport(v)} title={VIEWPORTS[v].label} className={`grid h-9 w-9 place-items-center rounded-xl transition ${viewport === v ? 'bg-primary text-white' : 'text-slate-400 hover:text-primary'}`}><Icon size={16} /></button>;
                })}
                <button onClick={() => setPreviewKey((k) => k + 1)} title="Muat ulang" className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:text-primary"><RotateCcw size={15} /></button>
              </div>
            </div>
            <div className="mt-4 overflow-hidden rounded-md border border-slate-200 bg-slate-100 dark:border-slate-800">
              <div className="mx-auto transition-all duration-300" style={{ width: viewport === 'desktop' ? '100%' : VIEWPORTS[viewport].w, maxWidth: '100%' }}>
                <iframe key={previewKey} src={homeUrl} title="Pratinjau situs" className="h-[560px] w-full border-0 bg-white" style={{ width: VIEWPORTS[viewport].w, maxWidth: '100%' }} />
              </div>
            </div>
            <p className="mt-2 text-[11px] font-semibold text-slate-400">Pratinjau memuat halaman depan publik. Tekan Publish agar perubahan tampil ke pengunjung.</p>
          </AppCard>
        </div>
      </div>
    </div>
  );
}

function BrandingEditor() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['cms-branding'], queryFn: adminApi.cmsBranding });
  const [form, setForm] = useState<CmsBranding | null>(null);
  const b = form ?? query.data ?? {};

  const save = useMutation({
    mutationFn: () => adminApi.cmsBrandingUpdate(b),
    onSuccess: () => { toast('Branding tersimpan.', 'success'); qc.invalidateQueries({ queryKey: ['cms-branding'] }); },
    onError: (error) => toast(extractApiError(error, 'Gagal menyimpan branding.'), 'error'),
  });
  const set = (patch: Partial<CmsBranding>) => setForm({ ...b, ...patch });

  if (query.isLoading) return <Skeleton className="h-72" />;

  return (
    <AppCard>
      <SectionHeader title="Branding, Typography & SEO" description="Logo, warna utama, font, profil perusahaan, sosial media, dan meta SEO — dipakai di seluruh situs." />
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><CoverUploader value={b.logo_path ?? ''} onChange={(path) => set({ logo_path: path })} /></div>
        <div>
          <label className="mb-1.5 block text-xs font-extrabold text-slate-500">Warna Utama</label>
          <div className="flex items-center gap-2">
            <input type="color" value={b.primary_color ?? '#024ad8'} onChange={(e) => set({ primary_color: e.target.value })} className="h-11 w-14 rounded-xl border border-slate-200" />
            <input value={b.primary_color ?? ''} onChange={(e) => set({ primary_color: e.target.value })} placeholder="#024ad8" className={input} />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-extrabold text-slate-500">Font</label>
          <select value={b.font_family ?? 'Inter'} onChange={(e) => set({ font_family: e.target.value })} className={input}>
            {['Inter', 'Poppins', 'Roboto', 'Nunito', 'Manrope', 'Plus Jakarta Sans'].map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <input value={b.company_name ?? ''} onChange={(e) => set({ company_name: e.target.value })} placeholder="Nama perusahaan" className={input} />
        <input value={b.company_tagline ?? ''} onChange={(e) => set({ company_tagline: e.target.value })} placeholder="Tagline" className={input} />
        <input value={b.social?.instagram ?? ''} onChange={(e) => set({ social: { ...b.social, instagram: e.target.value } })} placeholder="Instagram URL" className={input} />
        <input value={b.social?.whatsapp ?? ''} onChange={(e) => set({ social: { ...b.social, whatsapp: e.target.value } })} placeholder="WhatsApp" className={input} />
        <input value={b.seo?.title ?? ''} onChange={(e) => set({ seo: { ...b.seo, title: e.target.value } })} placeholder="SEO Title" className={input} />
        <input value={b.seo?.description ?? ''} onChange={(e) => set({ seo: { ...b.seo, description: e.target.value } })} placeholder="SEO Meta Description" className={`${input} sm:col-span-2`} />
      </div>
      <button onClick={() => save.mutate()} disabled={save.isPending} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold uppercase tracking-button text-white hover:bg-primary-deep disabled:opacity-60">
        {save.isPending ? <Loader2 size={15} className="animate-spin" /> : <Palette size={15} />} Simpan Branding
      </button>
    </AppCard>
  );
}

function VersionHistory({ onRestored }: { onRestored: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['cms-versions'], queryFn: adminApi.cmsVersions });

  const restore = useMutation({
    mutationFn: adminApi.cmsRestoreVersion,
    onSuccess: (res) => { toast(`Versi dipulihkan (${res.sections} section).`, 'success'); qc.invalidateQueries({ queryKey: ['cms-sections'] }); onRestored(); },
    onError: (error) => toast(extractApiError(error, 'Gagal memulihkan versi.'), 'error'),
  });

  if (query.isLoading) return <Skeleton className="h-60" />;
  const rows = query.data?.data ?? [];

  return (
    <AppCard>
      <SectionHeader title="Riwayat Versi" description="Setiap Simpan Draft / Publish membuat snapshot. Pulihkan versi mana pun kapan saja." />
      {rows.length === 0 ? (
        <EmptyState title="Belum ada versi" description="Tekan Simpan Draft atau Publish untuk membuat snapshot pertama." />
      ) : (
        <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((v: CmsVersionRow) => (
            <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-slate-100"><History size={14} className="text-primary" /> {v.label ?? `Versi #${v.id}`} <Badge tone={v.status === 'published' ? 'success' : 'neutral'}>{v.status === 'published' ? 'published' : 'draft'}</Badge></p>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">{new Date(v.created_at).toLocaleString('id-ID')}{v.created_by ? ` · ${v.created_by.name}` : ''}</p>
              </div>
              <button onClick={() => { if (confirm('Pulihkan versi ini? Konten section akan diganti dengan snapshot ini.')) restore.mutate(v.id); }} disabled={restore.isPending} className="inline-flex min-h-9 items-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-extrabold text-slate-600 hover:border-primary hover:text-primary disabled:opacity-60 dark:border-slate-800 dark:text-slate-300"><RotateCcw size={12} /> Pulihkan</button>
            </li>
          ))}
        </ul>
      )}
    </AppCard>
  );
}
