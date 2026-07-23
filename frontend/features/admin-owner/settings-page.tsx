'use client';

import { ImagePlus, Loader2, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/portal';
import { extractApiError } from '@/services/stms';
import { useToast } from '@/shared/providers/toast-provider';
import { AppCard, PageHeader, SectionHeader, Skeleton } from '@/shared/ui/components';

const input = 'min-h-11 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100';

// key, label, whether it's public (visible to customers), textarea?
const FIELDS: { key: string; label: string; hint?: string; public: boolean; area?: boolean }[] = [
  { key: 'company_name', label: 'Nama Perusahaan', public: true },
  { key: 'whatsapp_number', label: 'WhatsApp Utama', hint: 'Format: 08xx atau 62xx', public: true },
  { key: 'cs_whatsapp', label: 'WhatsApp Customer Service', hint: 'Tombol CS di footer', public: true },
  { key: 'jastip_whatsapp', label: 'WhatsApp Jastip', hint: 'Tombol jasa titip/paket', public: true },
  { key: 'social_instagram', label: 'URL Instagram', public: true },
  { key: 'social_tiktok', label: 'URL TikTok', public: true },
  { key: 'social_facebook', label: 'URL Facebook', public: true },
  { key: 'welcome_notice', label: 'Notifikasi Awal (banner)', hint: 'Pesan sambutan yang tampil untuk pengguna', public: true, area: true },
];

// Welcome-notification popup: title, body, image, and enable switch.
const WELCOME_KEYS = {
  enabled: 'welcome_notification_enabled',
  title: 'welcome_notification_title',
  body: 'welcome_notification_body',
  image: 'welcome_notification_image',
} as const;

export function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const query = useQuery({ queryKey: ['admin-settings'], queryFn: adminApi.settings });

  useEffect(() => {
    if (!query.data) return;
    const map: Record<string, string> = {};
    for (const row of query.data) {
      const v = row.value;
      map[row.key] = typeof v === 'object' && v !== null && 'value' in (v as Record<string, unknown>) ? String((v as Record<string, unknown>).value ?? '') : String(v ?? '');
    }
    setValues(map);
  }, [query.data]);

  const saveMutation = useMutation({
    mutationFn: async (field: { key: string; public: boolean; value?: string }) =>
      adminApi.settingsUpdate({ key: field.key, value: field.value ?? values[field.key] ?? '', is_public: field.public }),
    onSuccess: () => {
      toast('Pengaturan disimpan.', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      queryClient.invalidateQueries({ queryKey: ['public-settings'] });
    },
    onError: (error) => toast(extractApiError(error, 'Gagal menyimpan.'), 'error'),
  });

  const welcomeEnabled = values[WELCOME_KEYS.enabled] === 'true' || values[WELCOME_KEYS.enabled] === '1';

  function toggleWelcome() {
    const next = welcomeEnabled ? 'false' : 'true';
    setValues((v) => ({ ...v, [WELCOME_KEYS.enabled]: next }));
    saveMutation.mutate({ key: WELCOME_KEYS.enabled, public: true, value: next });
  }

  async function uploadWelcomeImage(file: File) {
    setUploading(true);
    try {
      const { url } = await adminApi.settingsUpload(file);
      setValues((v) => ({ ...v, [WELCOME_KEYS.image]: url }));
      saveMutation.mutate({ key: WELCOME_KEYS.image, public: true, value: url });
    } catch (error) {
      toast(extractApiError(error, 'Gagal mengunggah gambar.'), 'error');
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Pengaturan" description="Atur kontak WhatsApp, media sosial, notifikasi awal, dan welcome notification. Perubahan langsung tampil di footer & tombol CS." />

      {query.isLoading ? (
        <Skeleton className="h-96" />
      ) : (
        <>
          <AppCard>
            <SectionHeader title="Kontak & Media Sosial" description="Nomor WhatsApp cukup diketik, sistem otomatis membuat tautan wa.me." />
            <div className="mt-5 space-y-4">
              {FIELDS.map((field) => (
                <div key={field.key} className="grid gap-2 sm:grid-cols-[220px_1fr_auto] sm:items-start">
                  <label className="pt-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                    {field.label}
                    {field.hint ? <span className="mt-0.5 block text-xs font-semibold text-slate-400">{field.hint}</span> : null}
                  </label>
                  {field.area ? (
                    <textarea value={values[field.key] ?? ''} onChange={(e) => setValues({ ...values, [field.key]: e.target.value })} rows={2} className={input} />
                  ) : (
                    <input value={values[field.key] ?? ''} onChange={(e) => setValues({ ...values, [field.key]: e.target.value })} className={input} />
                  )}
                  <button onClick={() => saveMutation.mutate(field)} disabled={saveMutation.isPending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-extrabold text-white transition hover:bg-primary/90 disabled:opacity-60">
                    {saveMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Simpan
                  </button>
                </div>
              ))}
            </div>
          </AppCard>

          <AppCard>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionHeader title="Welcome Notification" description="Popup sambutan untuk pengguna: judul, isi, dan gambar. Aktif/nonaktifkan kapan saja." />
              <button
                type="button"
                role="switch"
                aria-checked={welcomeEnabled}
                aria-label="Aktifkan welcome notification"
                onClick={toggleWelcome}
                disabled={saveMutation.isPending}
                className="text-primary transition hover:scale-105 disabled:opacity-50"
              >
                {welcomeEnabled ? <ToggleRight size={36} /> : <ToggleLeft size={36} className="text-slate-400" />}
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="grid gap-2 sm:grid-cols-[220px_1fr_auto] sm:items-start">
                <label className="pt-2 text-sm font-bold text-slate-700 dark:text-slate-200">Judul</label>
                <input value={values[WELCOME_KEYS.title] ?? ''} onChange={(e) => setValues({ ...values, [WELCOME_KEYS.title]: e.target.value })} maxLength={150} placeholder="Selamat datang!" className={input} />
                <button onClick={() => saveMutation.mutate({ key: WELCOME_KEYS.title, public: true })} disabled={saveMutation.isPending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-extrabold text-white transition hover:bg-primary/90 disabled:opacity-60">
                  {saveMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Simpan
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-[220px_1fr_auto] sm:items-start">
                <label className="pt-2 text-sm font-bold text-slate-700 dark:text-slate-200">Isi</label>
                <textarea value={values[WELCOME_KEYS.body] ?? ''} onChange={(e) => setValues({ ...values, [WELCOME_KEYS.body]: e.target.value })} rows={3} maxLength={2000} placeholder="Terima kasih telah menggunakan layanan kami…" className={input} />
                <button onClick={() => saveMutation.mutate({ key: WELCOME_KEYS.body, public: true })} disabled={saveMutation.isPending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-extrabold text-white transition hover:bg-primary/90 disabled:opacity-60">
                  {saveMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Simpan
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-[220px_1fr] sm:items-start">
                <span className="pt-2 text-sm font-bold text-slate-700 dark:text-slate-200">Gambar</span>
                <div className="flex flex-wrap items-center gap-3">
                  {values[WELCOME_KEYS.image] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={values[WELCOME_KEYS.image]} alt="Gambar welcome notification" className="h-24 w-40 rounded-md object-cover ring-1 ring-slate-200 dark:ring-slate-800" />
                  ) : (
                    <span className="grid h-24 w-40 place-items-center rounded-md bg-slate-100 text-xs font-bold text-slate-400 dark:bg-slate-900">Belum ada gambar</span>
                  )}
                  <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadWelcomeImage(f); }} aria-label="Unggah gambar welcome notification" />
                  <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-extrabold text-slate-700 transition hover:border-primary hover:text-primary disabled:opacity-60 dark:border-slate-800 dark:text-slate-200">
                    {uploading ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />} {values[WELCOME_KEYS.image] ? 'Ganti gambar' : 'Unggah gambar'}
                  </button>
                  <p className="w-full text-xs font-semibold text-slate-400">JPG/PNG/WebP, maks 4 MB. Tersimpan otomatis setelah unggah.</p>
                </div>
              </div>
            </div>
          </AppCard>
        </>
      )}
    </div>
  );
}
