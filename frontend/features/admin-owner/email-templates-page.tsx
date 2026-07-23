'use client';

import { Eye, Loader2, Mail, RotateCcw, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, type EmailTemplateRow } from '@/services/portal';
import { extractApiError } from '@/services/stms';
import { useToast } from '@/shared/providers/toast-provider';
import { AppCard, Badge, EmptyState, PageHeader, SectionHeader, Skeleton } from '@/shared/ui/components';

const input = 'min-h-11 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100';

/** CMS editor for transactional email copy (subject/heading/intro) with live preview. */
export function EmailTemplatesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [active, setActive] = useState<string | null>(null);
  const [draft, setDraft] = useState({ subject: '', heading: '', intro: '' });
  const [preview, setPreview] = useState<{ subject: string; heading: string; intro: string } | null>(null);

  const query = useQuery({ queryKey: ['email-templates'], queryFn: adminApi.emailTemplates });
  const templates = query.data ?? [];
  const current = templates.find((t) => t.type === active) ?? null;

  useEffect(() => {
    if (!active && templates.length > 0) setActive(templates[0].type);
  }, [templates, active]);
  useEffect(() => {
    if (current) { setDraft({ subject: current.override.subject, heading: current.override.heading, intro: current.override.intro }); setPreview(null); }
  }, [current?.type]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useMutation({
    mutationFn: () => adminApi.emailTemplateUpdate({ type: active!, ...draft }),
    onSuccess: () => { toast('Template email tersimpan — langsung berlaku untuk email berikutnya.', 'success'); qc.invalidateQueries({ queryKey: ['email-templates'] }); },
    onError: (e) => toast(extractApiError(e, 'Gagal menyimpan template.'), 'error'),
  });
  const previewMutation = useMutation({
    mutationFn: () => adminApi.emailTemplatePreview({ type: active!, ...draft }),
    onSuccess: (res) => setPreview(res),
    onError: (e) => toast(extractApiError(e, 'Gagal membuat preview.'), 'error'),
  });

  if (query.isLoading) return <div className="space-y-4"><Skeleton className="h-40" /><Skeleton className="h-40" /></div>;
  if (query.isError || templates.length === 0) return <EmptyState title="Gagal memuat template" description={extractApiError(query.error, 'Terjadi kesalahan.')} />;

  const insertPlaceholder = (ph: string) => setDraft((d) => ({ ...d, intro: `${d.intro}{${ph}}` }));

  return (
    <div className="space-y-6">
      <PageHeader title="Template Email" description="Ubah subjek, judul, dan paragraf pembuka setiap email transaksional. Kosongkan sebuah kolom untuk memakai teks bawaan. Placeholder seperti {name} otomatis diisi saat email dikirim." />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <AppCard>
          <SectionHeader title="Jenis Email" />
          <ul className="mt-3 space-y-1">
            {templates.map((t: EmailTemplateRow) => {
              const customized = t.override.subject || t.override.heading || t.override.intro;
              return (
                <li key={t.type}>
                  <button onClick={() => setActive(t.type)} className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-extrabold transition ${active === t.type ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50'}`}>
                    <span className="flex items-center gap-2"><Mail size={14} /> {t.label}</span>
                    {customized ? <Badge tone="success">custom</Badge> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </AppCard>

        {current ? (
          <AppCard>
            <SectionHeader title={current.label} description={`Placeholder tersedia: ${current.placeholders.map((p) => `{${p}}`).join(', ') || '—'}`} />
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-extrabold text-slate-500">Subjek {!draft.subject ? <span className="font-semibold text-slate-400">(bawaan: {current.default.subject})</span> : null}</label>
                <input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} placeholder={current.default.subject} className={input} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-extrabold text-slate-500">Judul {!draft.heading ? <span className="font-semibold text-slate-400">(bawaan: {current.default.heading})</span> : null}</label>
                <input value={draft.heading} onChange={(e) => setDraft({ ...draft, heading: e.target.value })} placeholder={current.default.heading} className={input} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-extrabold text-slate-500">Paragraf Pembuka</label>
                <textarea value={draft.intro} onChange={(e) => setDraft({ ...draft, intro: e.target.value })} placeholder={current.default.intro} rows={3} className={`${input} py-2`} />
                {current.placeholders.length ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {current.placeholders.map((ph) => <button key={ph} type="button" onClick={() => insertPlaceholder(ph)} className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-extrabold text-slate-600 hover:bg-primary/10 hover:text-primary dark:bg-slate-800 dark:text-slate-300">+ {`{${ph}}`}</button>)}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={() => save.mutate()} disabled={save.isPending} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-extrabold text-white hover:bg-primary/90 disabled:opacity-60">{save.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Simpan</button>
                <button onClick={() => previewMutation.mutate()} disabled={previewMutation.isPending} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-extrabold text-slate-600 hover:border-primary hover:text-primary disabled:opacity-60 dark:border-slate-800 dark:text-slate-300">{previewMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />} Preview</button>
                <button onClick={() => { setDraft({ subject: '', heading: '', intro: '' }); }} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-extrabold text-slate-500 hover:border-rose-300 hover:text-rose-700 dark:border-slate-800"><RotateCcw size={15} /> Kembalikan ke bawaan</button>
              </div>

              {preview ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">Preview (data contoh)</p>
                  <p className="mt-2 text-xs font-bold text-slate-500">Subjek:</p>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{preview.subject}</p>
                  <div className="mt-3 rounded-xl bg-white p-4 dark:bg-slate-900">
                    <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">{preview.heading}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">{preview.intro}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </AppCard>
        ) : null}
      </div>
    </div>
  );
}
