'use client';

import { Facebook, Instagram, MessageCircle, Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchPublicSettings } from '@/services/stms';

function waLink(number?: string | null, text?: string): string | null {
  if (!number) return null;
  const digits = number.replace(/[^0-9]/g, '');
  if (!digits) return null;
  const normalized = digits.startsWith('0') ? '62' + digits.slice(1) : digits;
  return `https://wa.me/${normalized}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

// TikTok isn't in lucide; small inline glyph.
function TiktokIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M16.5 3a5 5 0 0 0 4 4v3a8 8 0 0 1-4-1.1V15a6 6 0 1 1-6-6c.3 0 .7 0 1 .1v3.2a3 3 0 1 0 2 2.8V3h3Z" />
    </svg>
  );
}

export function SiteFooter() {
  const { data } = useQuery({ queryKey: ['public-settings'], queryFn: fetchPublicSettings, staleTime: 5 * 60_000 });

  const cs = waLink(data?.cs_whatsapp ?? data?.whatsapp_number, 'Halo SJT, saya butuh bantuan.');
  const jastip = waLink(data?.jastip_whatsapp ?? data?.whatsapp_number, 'Halo SJT, saya mau jasa titip / kirim paket.');
  const socials = [
    { href: data?.social_instagram, icon: Instagram, label: 'Instagram' },
    { href: data?.social_facebook, icon: Facebook, label: 'Facebook' },
    { href: data?.social_tiktok, icon: TiktokIcon, label: 'TikTok' },
  ].filter((s) => Boolean(s.href));

  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-display text-lg font-extrabold text-slate-900 dark:text-white">{data?.company_name || 'SJT Travel & Tour'}</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">Sekawan Jaya Trans — travel antar kota, antar jemput, dan jasa titip paket.</p>

            {socials.length > 0 ? (
              <div className="mt-4 flex items-center gap-2">
                {socials.map(({ href, icon: Icon, label }) => (
                  <a key={label} href={href as string} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300">
                    <Icon />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            {cs ? (
              <a href={cs} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-extrabold text-white transition hover:bg-emerald-700">
                <MessageCircle size={16} /> Customer Service
              </a>
            ) : null}
            {jastip ? (
              <a href={jastip} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-600 px-5 text-sm font-extrabold text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40">
                <Package size={16} /> Jastip / Kirim Paket
              </a>
            ) : null}
          </div>
        </div>

        <p className="mt-8 border-t border-slate-100 pt-6 text-center text-sm text-slate-400 dark:border-slate-800">© {new Date().getFullYear()} {data?.company_name || 'SJT Travel & Tour'} · Sekawan Jaya Trans</p>
      </div>
    </footer>
  );
}
