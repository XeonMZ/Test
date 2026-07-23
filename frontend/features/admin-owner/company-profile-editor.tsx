'use client';

import { ExternalLink, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/portal';
import { extractApiError } from '@/services/stms';
import { useToast } from '@/shared/providers/toast-provider';
import { AppCard, SectionHeader, Skeleton } from '@/shared/ui/components';
import {
  DEFAULT_COMPANY_PROFILE,
  PROFILE_ICON_KEYS,
  type CompanyProfile,
  type ProfileItem,
} from '@/features/company/company-profile';

const input =
  'h-11 w-full rounded-md border border-steel bg-canvas px-4 text-sm text-ink outline-none transition-colors placeholder:text-graphite focus:border-primary dark:border-ink-soft dark:bg-ink dark:text-slate-100';
const area =
  'w-full rounded-md border border-steel bg-canvas px-4 py-3 text-sm leading-relaxed text-ink outline-none transition-colors placeholder:text-graphite focus:border-primary dark:border-ink-soft dark:bg-ink dark:text-slate-100';
const label = 'mb-2 block text-xs font-semibold uppercase tracking-button text-graphite';
const ghostBtn =
  'inline-flex h-9 items-center gap-1.5 rounded-md border border-steel px-3 text-xs font-semibold uppercase tracking-button text-charcoal transition-colors hover:border-primary hover:text-primary dark:border-ink-soft dark:text-slate-300';

/**
 * Company profile editor.
 *
 * Everything the public site says about the company — name, tagline, story,
 * vision, mission, services, reasons, service areas, commitment — is edited
 * here and stored in the database. The seeded company profile is only the
 * default; saving publishes immediately, no redeploy.
 */
export function CompanyProfileEditor() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['site-content', 'company-profile'], queryFn: () => adminApi.siteContent('company-profile') });
  const [draft, setDraft] = useState<CompanyProfile | null>(null);

  // Seed the form once the stored payload arrives; unknown/missing fields fall
  // back to the default so a partial payload can never blank the form.
  useEffect(() => {
    if (!query.data) return;
    const p = query.data.payload as Partial<CompanyProfile>;
    setDraft({ ...DEFAULT_COMPANY_PROFILE, ...p });
  }, [query.data]);

  const save = useMutation({
    mutationFn: (payload: CompanyProfile) => adminApi.siteContentUpdate('company-profile', payload as unknown as Record<string, unknown>),
    onSuccess: () => {
      toast('Profil perusahaan tersimpan dan langsung tayang.', 'success');
      qc.invalidateQueries({ queryKey: ['site-content', 'company-profile'] });
    },
    onError: (error) => toast(extractApiError(error, 'Gagal menyimpan profil perusahaan.'), 'error'),
  });

  if (query.isLoading || !draft) return <Skeleton className="h-96" />;

  const set = <K extends keyof CompanyProfile>(key: K, value: CompanyProfile[K]) => setDraft({ ...draft, [key]: value });

  const setListItem = (key: 'story' | 'mission' | 'areas', index: number, value: string) => {
    const next = [...draft[key]];
    next[index] = value;
    set(key, next);
  };
  const addListItem = (key: 'story' | 'mission' | 'areas') => set(key, [...draft[key], '']);
  const removeListItem = (key: 'story' | 'mission' | 'areas', index: number) =>
    set(key, draft[key].filter((_, i) => i !== index));

  const setItem = (key: 'services' | 'reasons', index: number, patch: Partial<ProfileItem>) => {
    const next = draft[key].map((item, i) => (i === index ? { ...item, ...patch } : item));
    set(key, next);
  };
  const addItem = (key: 'services' | 'reasons') => set(key, [...draft[key], { icon: 'sparkles', title: '', body: '' }]);
  const removeItem = (key: 'services' | 'reasons', index: number) => set(key, draft[key].filter((_, i) => i !== index));

  return (
    <AppCard>
      <SectionHeader
        title="Profil Perusahaan"
        description="Nama, kata-kata, dan informasi perusahaan yang tampil di Beranda dan halaman Tentang. Tersimpan di database — dapat diubah kapan saja tanpa deploy ulang."
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <p className="text-xs text-graphite">
          Terakhir diperbarui: {new Date(query.data!.updated_at).toLocaleString('id-ID')}
          {query.data!.updated_by ? ` · ${query.data!.updated_by.name}` : ''}
        </p>
        <a href="/tentang" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-button text-primary hover:underline">
          Lihat halaman <ExternalLink size={12} />
        </a>
      </div>

      {/* Identity */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cp-name" className={label}>Nama Perusahaan</label>
          <input id="cp-name" value={draft.name} onChange={(e) => set('name', e.target.value)} className={input} />
        </div>
        <div>
          <label htmlFor="cp-legal" className={label}>Nama Badan Hukum</label>
          <input id="cp-legal" value={draft.legal_name} onChange={(e) => set('legal_name', e.target.value)} className={input} />
        </div>
        <div>
          <label htmlFor="cp-loc" className={label}>Lokasi</label>
          <input id="cp-loc" value={draft.location} onChange={(e) => set('location', e.target.value)} className={input} />
        </div>
        <div>
          <label htmlFor="cp-tagline" className={label}>Tagline (judul utama Beranda)</label>
          <input id="cp-tagline" value={draft.tagline} onChange={(e) => set('tagline', e.target.value)} className={input} />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="cp-intro" className={label}>Paragraf Pembuka</label>
        <textarea id="cp-intro" rows={3} value={draft.intro} onChange={(e) => set('intro', e.target.value)} className={area} />
      </div>

      {/* Simple string lists */}
      <StringList title="Kisah Perusahaan" itemLabel="Paragraf" values={draft.story}
        onChange={(i, v) => setListItem('story', i, v)} onAdd={() => addListItem('story')} onRemove={(i) => removeListItem('story', i)} multiline />

      <div className="mt-6">
        <label htmlFor="cp-vision" className={label}>Visi</label>
        <textarea id="cp-vision" rows={3} value={draft.vision} onChange={(e) => set('vision', e.target.value)} className={area} />
      </div>

      <StringList title="Misi" itemLabel="Poin misi" values={draft.mission}
        onChange={(i, v) => setListItem('mission', i, v)} onAdd={() => addListItem('mission')} onRemove={(i) => removeListItem('mission', i)} multiline />

      {/* Item lists */}
      <ItemList title="Layanan Kami" items={draft.services}
        onChange={(i, patch) => setItem('services', i, patch)} onAdd={() => addItem('services')} onRemove={(i) => removeItem('services', i)} />

      <div className="mt-6">
        <label htmlFor="cp-reasons-intro" className={label}>Pengantar “Mengapa Memilih Kami”</label>
        <textarea id="cp-reasons-intro" rows={2} value={draft.reasons_intro} onChange={(e) => set('reasons_intro', e.target.value)} className={area} />
      </div>

      <ItemList title="Mengapa Memilih Kami" items={draft.reasons}
        onChange={(i, patch) => setItem('reasons', i, patch)} onAdd={() => addItem('reasons')} onRemove={(i) => removeItem('reasons', i)} />

      <div className="mt-6">
        <label htmlFor="cp-areas-intro" className={label}>Pengantar Area Layanan</label>
        <textarea id="cp-areas-intro" rows={2} value={draft.areas_intro} onChange={(e) => set('areas_intro', e.target.value)} className={area} />
      </div>

      <StringList title="Kota / Area Layanan" itemLabel="Kota" values={draft.areas}
        onChange={(i, v) => setListItem('areas', i, v)} onAdd={() => addListItem('areas')} onRemove={(i) => removeListItem('areas', i)} />

      <div className="mt-6 grid gap-4">
        <div>
          <label htmlFor="cp-commitment" className={label}>Komitmen Kami</label>
          <textarea id="cp-commitment" rows={3} value={draft.commitment} onChange={(e) => set('commitment', e.target.value)} className={area} />
        </div>
        <div>
          <label htmlFor="cp-closing" className={label}>Kalimat Penutup</label>
          <textarea id="cp-closing" rows={2} value={draft.closing} onChange={(e) => set('closing', e.target.value)} className={area} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={() => save.mutate(draft)}
          disabled={save.isPending}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold uppercase tracking-button text-white transition-colors hover:bg-primary-deep disabled:bg-steel"
        >
          {save.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Simpan Profil
        </button>
        <button onClick={() => setDraft({ ...DEFAULT_COMPANY_PROFILE })} className={ghostBtn}>
          Kembalikan ke default
        </button>
      </div>
    </AppCard>
  );
}

function StringList({
  title, itemLabel, values, onChange, onAdd, onRemove, multiline,
}: {
  title: string; itemLabel: string; values: string[];
  onChange: (index: number, value: string) => void; onAdd: () => void; onRemove: (index: number) => void; multiline?: boolean;
}) {
  return (
    <fieldset className="mt-6">
      <legend className={label}>{title}</legend>
      <div className="space-y-2">
        {values.map((value, i) => (
          <div key={i} className="flex items-start gap-2">
            {multiline ? (
              <textarea rows={2} value={value} onChange={(e) => onChange(i, e.target.value)} className={area} aria-label={`${itemLabel} ${i + 1}`} />
            ) : (
              <input value={value} onChange={(e) => onChange(i, e.target.value)} className={input} aria-label={`${itemLabel} ${i + 1}`} />
            )}
            <button type="button" onClick={() => onRemove(i)} aria-label={`Hapus ${itemLabel} ${i + 1}`} className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-md text-graphite transition-colors hover:bg-cloud hover:text-bloom-deep dark:hover:bg-ink-soft">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={onAdd} className={`mt-2 ${ghostBtn}`}><Plus size={14} /> Tambah {itemLabel}</button>
    </fieldset>
  );
}

function ItemList({
  title, items, onChange, onAdd, onRemove,
}: {
  title: string; items: ProfileItem[];
  onChange: (index: number, patch: Partial<ProfileItem>) => void; onAdd: () => void; onRemove: (index: number) => void;
}) {
  return (
    <fieldset className="mt-6">
      <legend className={label}>{title}</legend>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-lg border border-hairline p-3 dark:border-ink-soft">
            <div className="flex gap-2">
              <select value={item.icon ?? 'sparkles'} onChange={(e) => onChange(i, { icon: e.target.value })} className={`${input} w-32 shrink-0`} aria-label={`Ikon item ${i + 1}`}>
                {PROFILE_ICON_KEYS.map((key) => <option key={key} value={key}>{key}</option>)}
              </select>
              <input value={item.title} onChange={(e) => onChange(i, { title: e.target.value })} placeholder="Judul" className={input} aria-label={`Judul item ${i + 1}`} />
              <button type="button" onClick={() => onRemove(i)} aria-label={`Hapus item ${i + 1}`} className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-graphite transition-colors hover:bg-cloud hover:text-bloom-deep dark:hover:bg-ink-soft">
                <Trash2 size={16} />
              </button>
            </div>
            <textarea rows={2} value={item.body} onChange={(e) => onChange(i, { body: e.target.value })} placeholder="Deskripsi" className={`${area} mt-2`} aria-label={`Deskripsi item ${i + 1}`} />
          </div>
        ))}
      </div>
      <button type="button" onClick={onAdd} className={`mt-2 ${ghostBtn}`}><Plus size={14} /> Tambah item</button>
    </fieldset>
  );
}
