'use client';

import { ArrowLeft, Eye, GripVertical, ImagePlus, Loader2, Monitor, Plus, Save, Settings2, Smartphone, Tablet, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, type CmsSectionRow } from '@/services/portal';
import { extractApiError } from '@/services/stms';
import { useToast } from '@/shared/providers/toast-provider';
import { AppCard, Badge, EmptyState, SectionHeader, Skeleton } from '@/shared/ui/components';
import { blockDef, CMS_BLOCKS, cmsImageUrl, type CmsBlock } from '@/features/cms/blocks';
import { BlockView } from '@/features/cms/cms-renderer';

type Viewport = 'desktop' | 'tablet' | 'mobile';
const VP: Record<Viewport, { w: number; icon: typeof Monitor }> = { desktop: { w: 0, icon: Monitor }, tablet: { w: 768, icon: Tablet }, mobile: { w: 390, icon: Smartphone } };
const input = 'min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100';

function rowToBlock(r: CmsSectionRow): CmsBlock {
  return { id: r.id, type: r.section_type, is_active: r.is_active, sort_order: r.sort_order, metadata: (r.metadata as Record<string, unknown>) ?? {} };
}

/**
 * Webflow-style visual builder. The page is a list of blocks; editors add
 * blocks from the palette, drag to reorder, edit fields in the inspector, and
 * see a live preview rendered by the SAME BlockView the public site uses.
 * Each block persists as one cms_sections row (metadata = block fields).
 */
export function CmsBuilderPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [blocks, setBlocks] = useState<CmsBlock[]>([]);
  const [selectedId, setSelectedId] = useState<CmsBlock['id'] | null>(null);
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [dragId, setDragId] = useState<CmsBlock['id'] | null>(null);
  const [dirty, setDirty] = useState(false);
  const [showPalette, setShowPalette] = useState(false);

  const query = useQuery({ queryKey: ['cms-builder-sections'], queryFn: () => adminApi.cmsSections({ per_page: '200' }) });

  useEffect(() => {
    if (query.data?.data) {
      setBlocks(query.data.data.map(rowToBlock).sort((a, b) => a.sort_order - b.sort_order));
    }
  }, [query.data]);

  const selected = useMemo(() => blocks.find((b) => b.id === selectedId) ?? null, [blocks, selectedId]);

  function addBlock(type: string) {
    const def = blockDef(type);
    if (!def) return;
    const tempId = `new-${Date.now()}`;
    setBlocks((bs) => [...bs, { id: tempId, type, is_active: true, sort_order: bs.length, metadata: { ...def.defaults } }]);
    setSelectedId(tempId);
    setShowPalette(false);
    setDirty(true);
  }

  function updateField(key: string, value: unknown) {
    if (!selected) return;
    setBlocks((bs) => bs.map((b) => (b.id === selected.id ? { ...b, metadata: { ...b.metadata, [key]: value } } : b)));
    setDirty(true);
  }

  function removeBlock(id: CmsBlock['id']) {
    setBlocks((bs) => bs.filter((b) => b.id !== id).map((b, i) => ({ ...b, sort_order: i })));
    if (selectedId === id) setSelectedId(null);
    setDirty(true);
  }

  function toggleActive(id: CmsBlock['id']) {
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, is_active: !b.is_active } : b)));
    setDirty(true);
  }

  function reorder(from: CmsBlock['id'], to: CmsBlock['id']) {
    if (from === to) return;
    setBlocks((bs) => {
      const arr = [...bs];
      const fi = arr.findIndex((b) => b.id === from);
      const ti = arr.findIndex((b) => b.id === to);
      if (fi < 0 || ti < 0) return bs;
      const [moved] = arr.splice(fi, 1);
      arr.splice(ti, 0, moved);
      return arr.map((b, i) => ({ ...b, sort_order: i }));
    });
    setDirty(true);
  }

  // Persist: create new blocks, update existing, delete removed — then publish a version.
  const saveMutation = useMutation({
    mutationFn: async () => {
      const original = (query.data?.data ?? []).map(rowToBlock);
      const currentIds = new Set(blocks.filter((b) => typeof b.id === 'number').map((b) => b.id));
      // Deletions
      for (const o of original) {
        if (!currentIds.has(o.id)) await adminApi.cmsSectionDelete(o.id as number);
      }
      // Creates + updates
      for (const b of blocks) {
        const payload = { section_type: b.type, is_active: b.is_active, sort_order: b.sort_order, metadata: b.metadata, title: (b.metadata.title as string) ?? null };
        if (typeof b.id === 'number') await adminApi.cmsSectionUpdate(b.id, payload as Partial<CmsSectionRow>);
        else await adminApi.cmsSectionCreate(payload as Partial<CmsSectionRow>);
      }
      await adminApi.cmsSaveVersion({ status: 'published', label: `Publish ${new Date().toLocaleString('id-ID')}` });
    },
    onSuccess: () => { toast('Halaman dipublikasikan.', 'success'); setDirty(false); qc.invalidateQueries({ queryKey: ['cms-builder-sections'] }); },
    onError: (e) => toast(extractApiError(e, 'Gagal menyimpan halaman.'), 'error'),
  });

  const saveDraft = useMutation({
    mutationFn: async () => {
      // Same materialisation as publish, but snapshot as draft.
      const original = (query.data?.data ?? []).map(rowToBlock);
      const currentIds = new Set(blocks.filter((b) => typeof b.id === 'number').map((b) => b.id));
      for (const o of original) if (!currentIds.has(o.id)) await adminApi.cmsSectionDelete(o.id as number);
      for (const b of blocks) {
        const payload = { section_type: b.type, is_active: b.is_active, sort_order: b.sort_order, metadata: b.metadata, title: (b.metadata.title as string) ?? null };
        if (typeof b.id === 'number') await adminApi.cmsSectionUpdate(b.id, payload as Partial<CmsSectionRow>);
        else await adminApi.cmsSectionCreate(payload as Partial<CmsSectionRow>);
      }
      await adminApi.cmsSaveVersion({ status: 'draft', label: `Draft ${new Date().toLocaleString('id-ID')}` });
    },
    onSuccess: () => { toast('Draft tersimpan.', 'success'); setDirty(false); qc.invalidateQueries({ queryKey: ['cms-builder-sections'] }); },
    onError: (e) => toast(extractApiError(e, 'Gagal menyimpan draft.'), 'error'),
  });

  if (query.isLoading) return <div className="grid gap-4 lg:grid-cols-[280px_1fr_320px]"><Skeleton className="h-96" /><Skeleton className="h-96" /><Skeleton className="h-96" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-medium text-slate-950 dark:text-white">Page Builder</h1>
          <p className="text-sm font-semibold text-slate-500">Susun halaman depan blok demi blok. Pratinjau langsung sama persis dengan situs publik.</p>
        </div>
        <div className="flex items-center gap-2">
          {dirty ? <Badge tone="warning">belum disimpan</Badge> : <Badge tone="success">tersimpan</Badge>}
          <button onClick={() => saveDraft.mutate()} disabled={saveDraft.isPending} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-semibold uppercase tracking-button text-slate-600 hover:border-primary hover:text-primary disabled:opacity-60 dark:border-slate-800 dark:text-slate-300">{saveDraft.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Draft</button>
          <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold uppercase tracking-button text-white hover:bg-primary-deep disabled:opacity-60">{saveMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />} Publish</button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[260px_1fr_340px]">
        {/* Layers / block list */}
        <AppCard className="h-fit">
          <div className="flex items-center justify-between">
            <SectionHeader title="Blok Halaman" />
            <button onClick={() => setShowPalette(true)} className="inline-flex min-h-9 items-center gap-1 rounded-md bg-primary px-3 text-xs font-semibold uppercase tracking-button text-white hover:bg-primary-deep"><Plus size={13} /> Tambah</button>
          </div>
          {blocks.length === 0 ? (
            <EmptyState title="Halaman kosong" description="Tekan Tambah untuk menaruh blok pertama." />
          ) : (
            <ul className="mt-3 space-y-1.5">
              {blocks.map((b) => {
                const def = blockDef(b.type);
                return (
                  <li
                    key={b.id}
                    draggable
                    onDragStart={() => setDragId(b.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => { if (dragId !== null) reorder(dragId, b.id); setDragId(null); }}
                    onClick={() => setSelectedId(b.id)}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-extrabold transition ${selectedId === b.id ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 text-slate-600 hover:border-primary/40 dark:border-slate-800 dark:text-slate-300'} ${!b.is_active ? 'opacity-50' : ''}`}
                  >
                    <GripVertical size={14} className="shrink-0 cursor-grab text-slate-300" />
                    <span className="flex-1 truncate">{def?.label ?? b.type}</span>
                    <button onClick={(e) => { e.stopPropagation(); toggleActive(b.id); }} title={b.is_active ? 'Sembunyikan' : 'Tampilkan'} className="text-slate-400 hover:text-primary"><Eye size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); if (confirm('Hapus blok ini?')) removeBlock(b.id); }} className="text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
                  </li>
                );
              })}
            </ul>
          )}
        </AppCard>

        {/* Live preview */}
        <AppCard className="min-w-0">
          <div className="flex items-center justify-between">
            <SectionHeader title="Pratinjau Langsung" />
            <div className="flex gap-1">
              {(Object.keys(VP) as Viewport[]).map((v) => { const Icon = VP[v].icon; return <button key={v} onClick={() => setViewport(v)} className={`grid h-9 w-9 place-items-center rounded-xl transition ${viewport === v ? 'bg-primary text-white' : 'text-slate-400 hover:text-primary'}`}><Icon size={16} /></button>; })}
            </div>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-secondary dark:border-slate-800 dark:bg-slate-950">
            <div className="mx-auto overflow-y-auto" style={{ width: VP[viewport].w || '100%', maxWidth: '100%', maxHeight: '640px' }}>
              {blocks.filter((b) => b.is_active).length === 0 ? (
                <div className="grid h-64 place-items-center text-sm font-bold text-slate-400">Belum ada blok aktif</div>
              ) : (
                blocks.filter((b) => b.is_active).sort((a, b) => a.sort_order - b.sort_order).map((b) => (
                  <div key={b.id} onClick={() => setSelectedId(b.id)} className={`cursor-pointer transition ${selectedId === b.id ? 'ring-2 ring-inset ring-primary' : 'hover:ring-1 hover:ring-inset hover:ring-primary/30'}`}>
                    <BlockView block={b} />
                  </div>
                ))
              )}
            </div>
          </div>
        </AppCard>

        {/* Inspector */}
        <AppCard className="h-fit">
          <SectionHeader title={selected ? `Edit: ${blockDef(selected.type)?.label ?? selected.type}` : 'Inspektur'} />
          {!selected ? (
            <p className="mt-3 text-sm font-semibold text-slate-400">Pilih blok di kiri atau di pratinjau untuk mengeditnya.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {(blockDef(selected.type)?.fields ?? []).map((f) => (
                <FieldEditor key={f.key} field={f} value={selected.metadata[f.key]} onChange={(v) => updateField(f.key, v)} />
              ))}
            </div>
          )}
        </AppCard>
      </div>

      {/* Palette modal */}
      {showPalette ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4" onClick={() => setShowPalette(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Tambah Blok</h2>
              <button onClick={() => setShowPalette(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {CMS_BLOCKS.map((def) => (
                <button key={def.type} onClick={() => addBlock(def.type)} className="rounded-2xl border border-slate-200 p-4 text-left transition hover:border-primary hover:bg-primary/5 dark:border-slate-800">
                  <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{def.label}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{def.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ------------------------------- Field editors -------------------------------

function FieldEditor({ field, value, onChange }: { field: import('@/features/cms/blocks').CmsFieldSpec; value: unknown; onChange: (v: unknown) => void }) {
  if (field.type === 'list') {
    const items = Array.isArray(value) ? (value as Array<Record<string, string>>) : [];
    return (
      <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-500">{field.label} ({items.length})</span>
          <button onClick={() => onChange([...items, Object.fromEntries((field.itemFields ?? []).map((f) => [f.key, '']))])} className="inline-flex items-center gap-1 text-xs font-extrabold text-primary"><Plus size={12} /> Item</button>
        </div>
        <div className="mt-2 space-y-3">
          {items.map((item, i) => (
            <div key={i} className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-950/60">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-400">#{i + 1}</span>
                <button onClick={() => onChange(items.filter((_, x) => x !== i))} className="text-slate-400 hover:text-rose-600"><Trash2 size={12} /></button>
              </div>
              <div className="space-y-2">
                {(field.itemFields ?? []).map((sf) => (
                  <ScalarField key={sf.key} type={sf.type} label={sf.label} value={item[sf.key] ?? ''} onChange={(v) => { const next = [...items]; next[i] = { ...next[i], [sf.key]: v }; onChange(next); }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return <ScalarField type={field.type} label={field.label} value={(value as string) ?? ''} onChange={onChange} placeholder={field.placeholder} />;
}

function ScalarField({ type, label, value, onChange, placeholder }: { type: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    setBusy(true);
    try { const res = await adminApi.cmsUpload(file); onChange(res.path); }
    catch (e) { toast(extractApiError(e, 'Gagal mengunggah.'), 'error'); }
    finally { setBusy(false); }
  }

  if (type === 'image') {
    const url = cmsImageUrl(value);
    return (
      <div>
        <label className="mb-1 block text-xs font-extrabold text-slate-500">{label}</label>
        <div className="relative grid h-24 place-items-center overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60">
          {url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button onClick={() => onChange('')} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-slate-900/70 text-white"><X size={12} /></button>
            </>
          ) : (
            <button onClick={() => inputRef.current?.click()} disabled={busy} className="flex flex-col items-center gap-1 text-slate-400">{busy ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}<span className="text-[11px] font-extrabold">{busy ? 'Mengunggah…' : 'Pilih gambar'}</span></button>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.currentTarget.value = ''; }} />
      </div>
    );
  }
  if (type === 'color') {
    return (
      <div>
        <label className="mb-1 block text-xs font-extrabold text-slate-500">{label}</label>
        <div className="flex items-center gap-2">
          <input type="color" value={value || '#024ad8'} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 rounded-lg border border-slate-200" />
          <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="#024ad8" className={input} />
        </div>
      </div>
    );
  }
  if (type === 'textarea') {
    return (
      <div>
        <label className="mb-1 block text-xs font-extrabold text-slate-500">{label}</label>
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className={`${input} py-2`} />
      </div>
    );
  }
  return (
    <div>
      <label className="mb-1 block text-xs font-extrabold text-slate-500">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={input} />
    </div>
  );
}
