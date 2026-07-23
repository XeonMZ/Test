'use client';

import { ImagePlus, Loader2, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/portal';
import { extractApiError } from '@/services/stms';
import { useToast } from '@/shared/providers/toast-provider';
import { AppCard, PageHeader, SectionHeader, Skeleton } from '@/shared/ui/components';

const input = 'min-h-11 w-full rounded-md border border-steel bg-canvas px-4 text-sm text-ink outline-none transition-colors placeholder:text-graphite focus:border-primary dark:border-ink-soft dark:bg-ink dark:text-slate-100';

// key, label, whether it's public (visible to customers), textarea?
const FIELDS: { key: string; label: string; hint?: string; public: boolean; area?: boolean }[] = [
  { key: 'company_name', label: 'Nama Perusahaan', public: true },
  { key: 'whatsapp_number', label: 'WhatsApp Utama', hint: 'Format: 08xx atau 62xx', public: true },
  { key: 'cs_whatsapp', label: 'WhatsApp Customer Service', hint: 'Tombol CS di footer', public: true },
  { key: 'jastip_whatsapp', label: 'WhatsApp Jastip', hint: 'Tombol jasa titip/paket', public: true },
  { key: 'social_instagram', label: 'URL Instagram', public: true },
  { key: 'social_tiktok', label: 'URL TikTok', public: true },
  { key: 'social_facebook', label: 'URL Facebook', public: true },
  { key: 'social_youtube', label: 'URL YouTube', public: true },
  { key: 'social_x', label: 'URL X (Twitter)', hint: 'Kosongkan bila tidak dipakai — ikon otomatis disembunyikan di footer', public: true },

  // --- DP Paket Wisata (khusus paket; booking travel punya setelan sendiri) ---
  { key: 'package_dp_enabled', label: 'DP Paket Wisata: Aktif', hint: 'Isi 1 untuk aktif, 0 untuk nonaktif. Hanya berlaku untuk paket wisata, bukan booking travel.', public: true },
  { key: 'package_dp_percent', label: 'DP Paket Wisata: Persen', hint: 'Contoh: 30 untuk DP 30%. Dibatasi 1–99. Persentase dikunci pada booking saat dibuat.', public: true },

  // --- Notifikasi sambutan (kartu inbox, dibuat saat registrasi) ---
  // The pop-up has its own richer panel below (toggle + image upload); these
  // three keys are the inbox notification only, and are deliberately private:
  // anonymous visitors have no reason to read them.
  { key: 'welcome_notification_enabled', label: 'Notifikasi Sambutan: Aktif', hint: 'Isi 1 untuk aktif, 0 untuk nonaktif. Default aktif bila dikosongkan.', public: false },
  { key: 'welcome_notification_title', label: 'Notifikasi Sambutan: Judul', hint: 'Default: Selamat datang di STMS', public: false },
  { key: 'welcome_notification_body', label: 'Notifikasi Sambutan: Isi', hint: 'Default: Akun customer Anda berhasil dibuat.', public: false, area: true },

  { key: 'welcome_notice', label: 'Banner Pengumuman (lama)', hint: 'Dipakai sebagai cadangan isi pop-up bila kolom di atas kosong', public: true, area: true },
];

// Welcome-notification popup: title, body, image, and enable switch.
/**
 * Keys for the welcome POP-UP — the modal on the public site, shown once per
 * browser session. It gets the richer panel (toggle + image upload) because it
 * is the only one of the two that renders an image.
 *
 * The welcome NOTIFICATION (the inbox card created at registration) is a
 * separate feature with separate keys, edited as plain fields above. Keeping
 * them apart means turning off the marketing modal never stops new customers
 * from being told their account was created.
 */
const WELCOME_KEYS = {
  enabled: 'welcome_popup_enabled',
  title: 'welcome_popup_title',
  body: 'welcome_popup_body',
  image: 'welcome_popup_image',
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
      <PageHeader title="Pengaturan" description="Atur kontak WhatsApp, media sosial, pop-up sambutan, dan notifikasi sambutan. Perubahan langsung tampil di footer & tombol CS." />

      {query.isLoading ? (
        <Skeleton className="h-96" />
      ) : (
        <>
          <AppCard>
            <SectionHeader title="Kontak & Media Sosial" description="Nomor WhatsApp cukup diketik, sistem otomatis membuat tautan wa.me. URL sosial media yang diisi otomatis muncul sebagai ikon di footer; yang dikosongkan disembunyikan. Pop-up Sambutan dan Notifikasi Sambutan adalah dua hal berbeda — pop-up adalah modal di situs publik yang muncul sekali tiap sesi browser, sedangkan notifikasi adalah kartu inbox yang dibuat sekali saat akun didaftarkan." />
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
                  <button onClick={() => saveMutation.mutate(field)} disabled={saveMutation.isPending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold uppercase tracking-button text-white transition hover:bg-primary-deep disabled:opacity-60">
                    {saveMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Simpan
                  </button>
                </div>
              ))}
            </div>
          </AppCard>

          <AppCard>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionHeader title="Pop-up Sambutan" description="Modal sambutan di situs publik: judul, isi, dan gambar. Muncul sekali tiap sesi browser — ditutup lalu buka browser lagi, ia muncul kembali. Ini terpisah dari Notifikasi Sambutan (kartu inbox saat registrasi) di panel atas." />
              <button
                type="button"
                role="switch"
                aria-checked={welcomeEnabled}
                aria-label="Aktifkan pop-up sambutan"
                onClick={toggleWelcome}
                disabled={saveMutation.isPending}
                className="text-primary transition disabled:opacity-50"
              >
                {welcomeEnabled ? <ToggleRight size={36} /> : <ToggleLeft size={36} className="text-slate-400" />}
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="grid gap-2 sm:grid-cols-[220px_1fr_auto] sm:items-start">
                <label className="pt-2 text-sm font-bold text-slate-700 dark:text-slate-200">Judul</label>
                <input value={values[WELCOME_KEYS.title] ?? ''} onChange={(e) => setValues({ ...values, [WELCOME_KEYS.title]: e.target.value })} maxLength={150} placeholder="Selamat datang!" className={input} />
                <button onClick={() => saveMutation.mutate({ key: WELCOME_KEYS.title, public: true })} disabled={saveMutation.isPending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold uppercase tracking-button text-white transition hover:bg-primary-deep disabled:opacity-60">
                  {saveMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Simpan
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-[220px_1fr_auto] sm:items-start">
                <label className="pt-2 text-sm font-bold text-slate-700 dark:text-slate-200">Isi</label>
                <textarea value={values[WELCOME_KEYS.body] ?? ''} onChange={(e) => setValues({ ...values, [WELCOME_KEYS.body]: e.target.value })} rows={3} maxLength={2000} placeholder="Terima kasih telah menggunakan layanan kami…" className={input} />
                <button onClick={() => saveMutation.mutate({ key: WELCOME_KEYS.body, public: true })} disabled={saveMutation.isPending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold uppercase tracking-button text-white transition hover:bg-primary-deep disabled:opacity-60">
                  {saveMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Simpan
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-[220px_1fr] sm:items-start">
                <span className="pt-2 text-sm font-bold text-slate-700 dark:text-slate-200">Gambar</span>
                <div className="flex flex-wrap items-center gap-3">
                  {values[WELCOME_KEYS.image] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={values[WELCOME_KEYS.image]} alt="Gambar pop-up sambutan" className="h-24 w-40 rounded-md object-cover ring-1 ring-slate-200 dark:ring-slate-800" />
                  ) : (
                    <span className="grid h-24 w-40 place-items-center rounded-md bg-slate-100 text-xs font-bold text-slate-400 dark:bg-slate-900">Belum ada gambar</span>
                  )}
                  <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadWelcomeImage(f); }} aria-label="Unggah gambar pop-up sambutan" />
                  <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-semibold uppercase tracking-button text-slate-700 transition hover:border-primary hover:text-primary disabled:opacity-60 dark:border-slate-800 dark:text-slate-200">
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
