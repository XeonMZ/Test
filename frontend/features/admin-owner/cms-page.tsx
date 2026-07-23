'use client';

import { GripVertical, Loader2, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, type CmsSectionRow, type TourPackageRow } from '@/services/portal';
import { CoverUploader, GalleryUploader } from './image-uploader';
import { extractApiError, formatIDR } from '@/services/stms';
import { useToast } from '@/shared/providers/toast-provider';
import { AppCard, Badge, EmptyState, PageHeader, SectionHeader, Skeleton } from '@/shared/ui/components';

const input = 'min-h-11 w-full rounded-md border border-steel bg-canvas px-4 text-sm text-ink outline-none transition-colors placeholder:text-graphite focus:border-primary dark:border-ink-soft dark:bg-ink dark:text-slate-100';
const btn = 'inline-flex min-h-9 items-center gap-1 rounded-xl border px-3 text-xs font-extrabold transition disabled:opacity-60';
const SECTION_TYPES = ['hero', 'service', 'promo', 'testimonial', 'gallery', 'faq', 'contact', 'footer', 'seo'] as const;

const emptyPkg = { name: '', destination: '', duration_days: '1', price: '', capacity: '10', description: '', facilities: '', badge: '', cover_path: '', status: 'active', is_featured: false, is_recommended: false, is_best_seller: false, is_promo: false };
const emptySec = { section_type: 'hero', title: '', body: '', image_path: '', link: '', sort_order: '0', is_active: true, publish_start: '', publish_end: '' };

/** Tour Package CMS + Home CMS — full CRUD for admin & owner. */
export function CmsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [pkgForm, setPkgForm] = useState<typeof emptyPkg>(emptyPkg);
  const [pkgEdit, setPkgEdit] = useState<number | null>(null);
  const [pkgGallery, setPkgGallery] = useState<string[]>([]);
  const [secForm, setSecForm] = useState<typeof emptySec>(emptySec);
  const [secEdit, setSecEdit] = useState<number | null>(null);
  const [dragSec, setDragSec] = useState<number | null>(null);

  const packages = useQuery({ queryKey: ['cms-packages'], queryFn: () => adminApi.tourPackages() });
  const sections = useQuery({ queryKey: ['cms-sections'], queryFn: () => adminApi.cmsSections() });

  const pkgPayload = () => ({
    name: pkgForm.name, destination: pkgForm.destination || null, duration_days: Number(pkgForm.duration_days || 1),
    price: Number(pkgForm.price || 0), capacity: Number(pkgForm.capacity || 0), description: pkgForm.description || null,
    facilities: pkgForm.facilities ? pkgForm.facilities.split(',').map((s) => s.trim()).filter(Boolean) : null,
    badge: pkgForm.badge || null, cover_path: pkgForm.cover_path || null, gallery: pkgGallery.length ? pkgGallery : null, status: pkgForm.status as 'active' | 'inactive',
    is_featured: pkgForm.is_featured, is_recommended: pkgForm.is_recommended, is_best_seller: pkgForm.is_best_seller, is_promo: pkgForm.is_promo,
  });
  const savePkg = useMutation({
    mutationFn: () => (pkgEdit ? adminApi.tourPackageUpdate(pkgEdit, pkgPayload()) : adminApi.tourPackageCreate(pkgPayload())),
    onSuccess: () => { toast('Paket wisata tersimpan.', 'success'); setPkgForm(emptyPkg); setPkgGallery([]); setPkgEdit(null); qc.invalidateQueries({ queryKey: ['cms-packages'] }); },
    onError: (e) => toast(extractApiError(e, 'Gagal menyimpan paket.'), 'error'),
  });
  const delPkg = useMutation({
    mutationFn: adminApi.tourPackageDelete,
    onSuccess: () => { toast('Paket dihapus.', 'success'); qc.invalidateQueries({ queryKey: ['cms-packages'] }); },
    onError: (e) => toast(extractApiError(e, 'Gagal menghapus paket.'), 'error'),
  });

  const secPayload = () => ({
    section_type: secForm.section_type, title: secForm.title || null, body: secForm.body || null,
    image_path: secForm.image_path || null, link: secForm.link || null, sort_order: Number(secForm.sort_order || 0),
    is_active: secForm.is_active, publish_start: secForm.publish_start || null, publish_end: secForm.publish_end || null,
  });
  const saveSec = useMutation({
    mutationFn: () => (secEdit ? adminApi.cmsSectionUpdate(secEdit, secPayload()) : adminApi.cmsSectionCreate(secPayload())),
    onSuccess: () => { toast('Section tersimpan.', 'success'); setSecForm(emptySec); setSecEdit(null); qc.invalidateQueries({ queryKey: ['cms-sections'] }); },
    onError: (e) => toast(extractApiError(e, 'Gagal menyimpan section.'), 'error'),
  });
  const delSec = useMutation({
    mutationFn: adminApi.cmsSectionDelete,
    onSuccess: () => { toast('Section dihapus.', 'success'); qc.invalidateQueries({ queryKey: ['cms-sections'] }); },
    onError: (e) => toast(extractApiError(e, 'Gagal menghapus section.'), 'error'),
  });

  function reorderSections(from: number, to: number) {
    if (from === to) return;
    const list = [...secRows];
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    // Persist new sort_order for every affected section (autosave).
    list.forEach((s, idx) => {
      if (s.sort_order !== idx) adminApi.cmsSectionUpdate(s.id, { sort_order: idx }).catch(() => undefined);
    });
    qc.setQueryData(['cms-sections'], (old: typeof sections.data) => old ? { ...old, data: list.map((s, idx) => ({ ...s, sort_order: idx })) } : old);
    toast('Urutan section diperbarui.', 'success');
  }

  const pkgRows = packages.data?.data ?? [];
  const secRows = sections.data?.data ?? [];

  const flagLabel = (p: TourPackageRow) => [p.is_featured && 'Featured', p.is_recommended && 'Recommended', p.is_best_seller && 'Best Seller', p.is_promo && 'Promo'].filter(Boolean).join(' · ');

  return (
    <div className="space-y-6">
      <PageHeader title="Tour Package & Home CMS" description="Kelola paket wisata dan seluruh konten halaman depan (hero, layanan, promo, testimoni, galeri, FAQ, kontak, footer, SEO) — urutan, status aktif, dan jadwal publish. Upload gambar via System Settings lalu tempel path-nya." />

      {/* ------------------------- Tour Packages ------------------------- */}
      <AppCard>
        <SectionHeader title={pkgEdit ? `Edit paket #${pkgEdit}` : 'Paket wisata baru'} description="Flag Recommended / Best Seller / Promo / Featured menentukan section di halaman customer." />
        <form className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(e) => { e.preventDefault(); savePkg.mutate(); }}>
          <input required value={pkgForm.name} onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })} placeholder="Nama paket" className={input} />
          <input value={pkgForm.destination} onChange={(e) => setPkgForm({ ...pkgForm, destination: e.target.value })} placeholder="Destinasi" className={input} />
          <input required type="number" min={0} value={pkgForm.price} onChange={(e) => setPkgForm({ ...pkgForm, price: e.target.value })} placeholder="Harga (Rp)" className={input} />
          <input type="number" min={1} max={60} value={pkgForm.duration_days} onChange={(e) => setPkgForm({ ...pkgForm, duration_days: e.target.value })} placeholder="Durasi (hari)" className={input} />
          <input type="number" min={0} value={pkgForm.capacity} onChange={(e) => setPkgForm({ ...pkgForm, capacity: e.target.value })} placeholder="Kapasitas" className={input} />
          <input value={pkgForm.badge} onChange={(e) => setPkgForm({ ...pkgForm, badge: e.target.value })} placeholder="Badge (mis. HOT)" className={input} />
          <select value={pkgForm.status} onChange={(e) => setPkgForm({ ...pkgForm, status: e.target.value })} className={input}><option value="active">Aktif</option><option value="inactive">Nonaktif</option></select>
          <input value={pkgForm.facilities} onChange={(e) => setPkgForm({ ...pkgForm, facilities: e.target.value })} placeholder="Fasilitas (pisahkan koma)" className={`${input} sm:col-span-2`} />
          <textarea value={pkgForm.description} onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })} placeholder="Deskripsi & itinerary singkat" rows={2} className={`${input} sm:col-span-2`} />
          <div className="sm:col-span-2 lg:col-span-4 grid gap-4 sm:grid-cols-2">
            <CoverUploader value={pkgForm.cover_path} onChange={(path) => setPkgForm((f) => ({ ...f, cover_path: path }))} />
            <GalleryUploader value={pkgGallery} onChange={setPkgGallery} />
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:col-span-2 lg:col-span-4">
            {([['is_featured', 'Featured'], ['is_recommended', 'Recommended'], ['is_best_seller', 'Best Seller'], ['is_promo', 'Promo']] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-xs font-extrabold text-slate-600 dark:text-slate-300">
                <input type="checkbox" checked={pkgForm[key]} onChange={(e) => setPkgForm({ ...pkgForm, [key]: e.target.checked })} className="h-4 w-4 rounded" /> {label}
              </label>
            ))}
            <button type="submit" disabled={savePkg.isPending} className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold uppercase tracking-button text-white hover:bg-primary-deep disabled:opacity-60">
              {savePkg.isPending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} {pkgEdit ? 'Simpan' : 'Buat paket'}
            </button>
            {pkgEdit ? <button type="button" onClick={() => { setPkgEdit(null); setPkgForm(emptyPkg); setPkgGallery([]); }} className="min-h-11 rounded-md border border-slate-200 px-4 text-sm font-semibold uppercase tracking-button text-slate-600 dark:border-slate-800 dark:text-slate-300">Batal</button> : null}
          </div>
        </form>
        {packages.isLoading ? <Skeleton className="mt-4 h-32" /> : packages.isError ? <EmptyState title="Gagal memuat paket" description={extractApiError(packages.error, 'Terjadi kesalahan.')} /> : pkgRows.length === 0 ? <EmptyState title="Belum ada paket wisata" description="Buat paket pertama lewat form di atas." /> : (
          <ul className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
            {pkgRows.map((p: TourPackageRow) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-slate-100"><Package size={14} className="text-primary" /> {p.name} <Badge tone={p.status === 'active' ? 'success' : 'neutral'}>{p.status}</Badge>{p.badge ? <Badge tone="warning">{p.badge}</Badge> : null}</p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500">{p.destination ?? '—'} · {p.duration_days} hari · {formatIDR(p.price)} · kapasitas {p.capacity}{flagLabel(p) ? ` · ${flagLabel(p)}` : ''}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setPkgEdit(p.id); setPkgForm({ name: p.name, destination: p.destination ?? '', duration_days: String(p.duration_days), price: String(p.price), capacity: String(p.capacity), description: p.description ?? '', facilities: (p.facilities ?? []).join(', '), badge: p.badge ?? '', cover_path: p.cover_path ?? '', status: p.status, is_featured: p.is_featured, is_recommended: p.is_recommended, is_best_seller: p.is_best_seller, is_promo: p.is_promo }); setPkgGallery(p.gallery ?? []); }} className={`${btn} border-slate-200 text-slate-600 hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300`}><Pencil size={12} /> Edit</button>
                  <button onClick={() => { if (confirm(`Hapus paket ${p.name}?`)) delPkg.mutate(p.id); }} disabled={delPkg.isPending} className={`${btn} border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300`}><Trash2 size={12} /> Hapus</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AppCard>

      {/* --------------------------- Home CMS --------------------------- */}
      <AppCard>
        <SectionHeader title={secEdit ? `Edit section #${secEdit}` : 'Section halaman depan baru'} description="Halaman depan membaca /catalog/home: hanya section aktif & dalam jendela publish yang tampil, diurutkan sort order." />
        <form className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(e) => { e.preventDefault(); saveSec.mutate(); }}>
          <select value={secForm.section_type} onChange={(e) => setSecForm({ ...secForm, section_type: e.target.value })} className={input} aria-label="Tipe section">
            {SECTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input value={secForm.title} onChange={(e) => setSecForm({ ...secForm, title: e.target.value })} placeholder="Judul" className={input} />
          <input value={secForm.image_path} onChange={(e) => setSecForm({ ...secForm, image_path: e.target.value })} placeholder="Path/URL gambar" className={input} />
          <input value={secForm.link} onChange={(e) => setSecForm({ ...secForm, link: e.target.value })} placeholder="Link (opsional)" className={input} />
          <input type="number" min={0} value={secForm.sort_order} onChange={(e) => setSecForm({ ...secForm, sort_order: e.target.value })} placeholder="Urutan" className={input} />
          <input type="datetime-local" value={secForm.publish_start} onChange={(e) => setSecForm({ ...secForm, publish_start: e.target.value })} className={input} aria-label="Publish mulai" />
          <input type="datetime-local" value={secForm.publish_end} onChange={(e) => setSecForm({ ...secForm, publish_end: e.target.value })} className={input} aria-label="Publish selesai" />
          <label className="flex items-center gap-2 text-xs font-extrabold text-slate-600 dark:text-slate-300"><input type="checkbox" checked={secForm.is_active} onChange={(e) => setSecForm({ ...secForm, is_active: e.target.checked })} className="h-4 w-4 rounded" /> Aktif</label>
          <textarea value={secForm.body} onChange={(e) => setSecForm({ ...secForm, body: e.target.value })} placeholder="Isi/teks section (untuk FAQ: jawaban; SEO: meta description; kontak/footer: konten)" rows={2} className={`${input} sm:col-span-2 lg:col-span-4`} />
          <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
            <button type="submit" disabled={saveSec.isPending} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold uppercase tracking-button text-white hover:bg-primary-deep disabled:opacity-60">
              {saveSec.isPending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} {secEdit ? 'Simpan' : 'Tambah section'}
            </button>
            {secEdit ? <button type="button" onClick={() => { setSecEdit(null); setSecForm(emptySec); }} className="min-h-11 rounded-md border border-slate-200 px-4 text-sm font-semibold uppercase tracking-button text-slate-600 dark:border-slate-800 dark:text-slate-300">Batal</button> : null}
          </div>
        </form>
        {sections.isLoading ? <Skeleton className="mt-4 h-32" /> : sections.isError ? <EmptyState title="Gagal memuat sections" description={extractApiError(sections.error, 'Terjadi kesalahan.')} /> : secRows.length === 0 ? <EmptyState title="Belum ada konten" description="Tambahkan hero, layanan, FAQ, dan lainnya lewat form di atas." /> : (
          <>
            <p className="mt-4 text-[11px] font-semibold text-slate-400">Seret <GripVertical size={11} className="inline" /> untuk mengubah urutan tampil — tersimpan otomatis.</p>
            <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
              {secRows.map((s: CmsSectionRow, i: number) => (
                <li
                  key={s.id}
                  draggable
                  onDragStart={() => setDragSec(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { if (dragSec !== null) reorderSections(dragSec, i); setDragSec(null); }}
                  className={`flex flex-wrap items-center justify-between gap-3 py-3 ${dragSec === i ? 'opacity-50' : ''}`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <GripVertical size={15} className="shrink-0 cursor-grab text-slate-300" />
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-slate-100"><span className="rounded-lg bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-button text-primary">{s.section_type}</span> {s.title || '(tanpa judul)'} <Badge tone={s.is_active ? 'success' : 'neutral'}>{s.is_active ? 'aktif' : 'nonaktif'}</Badge></p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-500">urutan {s.sort_order}{s.publish_start ? ` · publish ${new Date(s.publish_start).toLocaleDateString('id-ID')}` : ''}{s.publish_end ? ` — ${new Date(s.publish_end).toLocaleDateString('id-ID')}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setSecEdit(s.id); setSecForm({ section_type: s.section_type, title: s.title ?? '', body: s.body ?? '', image_path: s.image_path ?? '', link: s.link ?? '', sort_order: String(s.sort_order), is_active: s.is_active, publish_start: s.publish_start?.slice(0, 16) ?? '', publish_end: s.publish_end?.slice(0, 16) ?? '' }); }} className={`${btn} border-slate-200 text-slate-600 hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300`}><Pencil size={12} /> Edit</button>
                    <button onClick={() => { if (confirm('Hapus section ini?')) delSec.mutate(s.id); }} disabled={delSec.isPending} className={`${btn} border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300`}><Trash2 size={12} /> Hapus</button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </AppCard>
    </div>
  );
}
