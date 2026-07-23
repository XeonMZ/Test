'use client';

import { ExternalLink, Loader2, Save, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, type LegalDocumentRow } from '@/services/portal';
import { extractApiError } from '@/services/stms';
import { useToast } from '@/shared/providers/toast-provider';
import { AppCard, Badge, EmptyState, SectionHeader, Skeleton } from '@/shared/ui/components';

const input =
  'min-h-11 w-full rounded-md border border-steel bg-canvas px-4 text-sm text-ink outline-none transition-colors placeholder:text-graphite focus:border-primary dark:border-ink-soft dark:bg-ink dark:text-slate-100';

/**
 * Legal pages editor.
 *
 * Owner & admin edit the five legal documents here; saving writes to the
 * database and refreshes the public "Terakhir diperbarui" date automatically,
 * with no redeploy. Content is stored as plain text with a small markdown
 * subset and rendered as React elements on the public site, so pasted markup
 * is never executed.
 */
/** Only the fields an editor may change. */
type LegalDraft = Partial<Pick<LegalDocumentRow, 'title' | 'meta_description' | 'body' | 'is_published'>>;

export function LegalEditor() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['legal-documents'], queryFn: adminApi.legalDocuments });
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [draft, setDraft] = useState<LegalDraft>({});

  const save = useMutation({
    mutationFn: ({ slug, payload }: { slug: string; payload: LegalDraft }) => adminApi.legalDocumentUpdate(slug, payload),
    onSuccess: () => {
      toast('Dokumen legal tersimpan dan langsung tayang.', 'success');
      qc.invalidateQueries({ queryKey: ['legal-documents'] });
      setDraft({});
    },
    onError: (error) => toast(extractApiError(error, 'Gagal menyimpan dokumen legal.'), 'error'),
  });

  if (query.isLoading) return <Skeleton className="h-96" />;

  const docs = query.data ?? [];
  if (docs.length === 0) {
    return (
      <EmptyState
        title="Belum ada dokumen legal"
        description="Jalankan seeder database (php artisan db:seed) untuk mengisi kelima dokumen legal awal."
      />
    );
  }

  const current = docs.find((doc) => doc.slug === activeSlug) ?? docs[0];
  const value = { ...current, ...draft };

  const set = (patch: LegalDraft) => setDraft({ ...draft, ...patch });

  return (
    <AppCard>
      <SectionHeader
        title="Halaman Legal"
        description="Kebijakan Privasi, Syarat & Ketentuan, Refund, Kontak, dan Hak Cipta. Perubahan tersimpan di database dan tayang tanpa deploy ulang."
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {docs.map((doc) => (
          <button
            key={doc.slug}
            onClick={() => {
              setActiveSlug(doc.slug);
              setDraft({});
            }}
            className={`min-h-10 rounded-xl px-4 text-sm font-extrabold transition ${
              doc.slug === current.slug
                ? 'bg-primary text-white'
                : 'border border-slate-200 text-slate-600 hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300'
            }`}
          >
            {doc.title}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Badge tone={value.is_published ? 'success' : 'neutral'}>{value.is_published ? 'published' : 'draft'}</Badge>
        <p className="text-xs font-semibold text-slate-500">
          Terakhir diperbarui: {new Date(current.updated_at).toLocaleString('id-ID')}
          {current.updated_by ? ` · ${current.updated_by.name}` : ''}
        </p>
        <a
          href={`/${current.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-extrabold text-primary hover:underline"
        >
          Lihat halaman <ExternalLink size={12} />
        </a>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="legal-title" className="mb-1.5 block text-xs font-extrabold text-slate-500">
            Judul Halaman
          </label>
          <input id="legal-title" value={value.title ?? ''} onChange={(e) => set({ title: e.target.value })} className={input} />
        </div>

        <div>
          <label htmlFor="legal-meta" className="mb-1.5 block text-xs font-extrabold text-slate-500">
            Meta Description (SEO)
          </label>
          <input
            id="legal-meta"
            value={value.meta_description ?? ''}
            onChange={(e) => set({ meta_description: e.target.value })}
            maxLength={300}
            placeholder="Ringkasan halaman untuk hasil pencarian Google"
            className={input}
          />
        </div>

        <div>
          <label htmlFor="legal-body" className="mb-1.5 block text-xs font-extrabold text-slate-500">
            Isi Dokumen
          </label>
          <textarea
            id="legal-body"
            value={value.body ?? ''}
            onChange={(e) => set({ body: e.target.value })}
            rows={20}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm leading-6 text-slate-900 shadow-sm outline-none transition focus:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          />
          <p className="mt-2 flex items-start gap-2 text-xs font-semibold text-slate-500">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
            Format: <code className="font-mono">## Judul Bagian</code>, <code className="font-mono">- poin daftar</code>, dan baris kosong
            untuk paragraf baru. Tag HTML akan dihapus otomatis demi keamanan.
          </p>
        </div>

        <label className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={value.is_published ?? true}
            onChange={(e) => set({ is_published: e.target.checked })}
            className="h-5 w-5 cursor-pointer rounded border-slate-300 accent-primary dark:border-slate-700"
          />
          Tampilkan halaman ini untuk publik
        </label>
      </div>

      <button
        onClick={() =>
          save.mutate({
            slug: current.slug,
            payload: {
              title: value.title,
              meta_description: value.meta_description,
              body: value.body,
              is_published: value.is_published,
            },
          })
        }
        disabled={save.isPending}
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold uppercase tracking-button text-white transition hover:bg-primary-deep disabled:opacity-60"
      >
        {save.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Simpan Dokumen
      </button>
    </AppCard>
  );
}
