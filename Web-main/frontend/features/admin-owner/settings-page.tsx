'use client';

import { Loader2, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/portal';
import { extractApiError } from '@/services/stms';
import { useToast } from '@/shared/providers/toast-provider';
import { AppCard, PageHeader, SectionHeader, Skeleton } from '@/shared/ui/components';

const input = 'min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100';

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

export function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});

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
    mutationFn: async (field: { key: string; public: boolean }) => adminApi.settingsUpdate({ key: field.key, value: values[field.key] ?? '', is_public: field.public }),
    onSuccess: () => {
      toast('Pengaturan disimpan.', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      queryClient.invalidateQueries({ queryKey: ['public-settings'] });
    },
    onError: (error) => toast(extractApiError(error, 'Gagal menyimpan.'), 'error'),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Pengaturan" description="Atur kontak WhatsApp, media sosial, dan notifikasi awal. Perubahan langsung tampil di footer & tombol CS." />

      {query.isLoading ? (
        <Skeleton className="h-96" />
      ) : (
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
                <button onClick={() => saveMutation.mutate(field)} disabled={saveMutation.isPending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-extrabold text-white transition hover:bg-primary/90 disabled:opacity-60">
                  {saveMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Simpan
                </button>
              </div>
            ))}
          </div>
        </AppCard>
      )}
    </div>
  );
}
