'use client';

import { GripVertical, ImagePlus, Loader2, Star, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { adminApi } from '@/services/portal';
import { extractApiError } from '@/services/stms';
import { useToast } from '@/shared/providers/toast-provider';

/**
 * Client-side downscale + re-encode to keep uploads small (the "compress
 * otomatis" requirement) before hitting the existing storage endpoint.
 * Returns a webp/jpeg File no larger than maxDim on its longest edge.
 */
async function compress(file: File, maxDim = 1600, quality = 0.82): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', quality));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, '.webp'), { type: 'image/webp' });
}

function toUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const base = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/api\/?$/, '');
  return `${base}/storage/${path}`;
}

/** Single cover image picker. */
export function CoverUploader({ value, onChange }: { value: string; onChange: (path: string) => void }) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  async function pick(file: File) {
    setBusy(true);
    try {
      const res = await adminApi.cmsUpload(await compress(file));
      onChange(res.path);
    } catch (error) {
      toast(extractApiError(error, 'Gagal mengunggah gambar.'), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="mb-1.5 text-xs font-extrabold text-slate-500">Cover</p>
      <div className="relative grid h-40 place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60">
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={toUrl(value)} alt="Cover" className="h-full w-full object-cover" />
            <button onClick={() => onChange('')} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-slate-900/70 text-white" aria-label="Hapus cover"><X size={15} /></button>
          </>
        ) : (
          <button onClick={() => inputRef.current?.click()} disabled={busy} className="flex flex-col items-center gap-1 text-slate-400">
            {busy ? <Loader2 size={22} className="animate-spin" /> : <ImagePlus size={22} />}
            <span className="text-xs font-extrabold">{busy ? 'Mengunggah…' : 'Pilih cover'}</span>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void pick(f); e.currentTarget.value = ''; }} />
    </div>
  );
}

/** Multi-image gallery with drag-to-reorder and delete. */
export function GalleryUploader({ value, onChange }: { value: string[]; onChange: (paths: string[]) => void }) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  async function add(files: FileList) {
    setBusy(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const res = await adminApi.cmsUpload(await compress(file));
        uploaded.push(res.path);
      }
      onChange([...value, ...uploaded]);
    } catch (error) {
      toast(extractApiError(error, 'Gagal mengunggah galeri.'), 'error');
    } finally {
      setBusy(false);
    }
  }

  function reorder(from: number, to: number) {
    if (from === to) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-xs font-extrabold text-slate-500">Galeri ({value.length})</p>
        <button onClick={() => inputRef.current?.click()} disabled={busy} className="inline-flex items-center gap-1 text-xs font-extrabold text-primary disabled:opacity-60">
          {busy ? <Loader2 size={12} className="animate-spin" /> : <ImagePlus size={12} />} Tambah gambar
        </button>
      </div>
      {value.length === 0 ? (
        <button onClick={() => inputRef.current?.click()} disabled={busy} className="grid h-24 w-full place-items-center rounded-2xl border-2 border-dashed border-slate-200 text-xs font-extrabold text-slate-400 dark:border-slate-800">Belum ada gambar — klik untuk menambah</button>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((path, i) => (
            <div
              key={`${path}-${i}`}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragIndex !== null) reorder(dragIndex, i); setDragIndex(null); }}
              className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={toUrl(path)} alt={`Galeri ${i + 1}`} className="h-full w-full object-cover" />
              {i === 0 ? <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded-md bg-primary px-1.5 py-0.5 text-[9px] font-extrabold text-white"><Star size={9} /> Utama</span> : null}
              <span className="absolute left-1 bottom-1 grid h-5 w-5 place-items-center rounded bg-slate-900/60 text-white opacity-0 transition group-hover:opacity-100"><GripVertical size={11} /></span>
              <button onClick={() => onChange(value.filter((_, x) => x !== i))} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-rose-600 text-white opacity-0 transition group-hover:opacity-100" aria-label="Hapus gambar"><X size={11} /></button>
            </div>
          ))}
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => { if (e.target.files?.length) void add(e.target.files); e.currentTarget.value = ''; }} />
    </div>
  );
}
