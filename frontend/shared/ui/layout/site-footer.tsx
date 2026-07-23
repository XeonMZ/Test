'use client';

import { Facebook, Instagram, MapPin, MessageCircle, Package } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { LEGAL_NAV } from '@/features/legal/legal-config';
import { fetchPublicSettings } from '@/services/stms';
import { Chevrons } from '@/shared/ui/design/chevron';

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

const company = [
  { href: '/', label: 'Beranda' },
  { href: '/tentang', label: 'Tentang Kami' },
  { href: '/jadwal', label: 'Jadwal Tersedia' },
  { href: '/contact', label: 'Kontak' },
];

/**
 * Site footer — DESIGN.md ink slab that closes the page rhythm.
 * Dark navy surface, white text, one bright-blue signal on links, chevron
 * artifact top-left. Company data (name, socials, WhatsApp) stays CMS-driven.
 */
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
    <footer className="relative overflow-hidden bg-ink text-on-ink">
      <Chevrons side="left" className="absolute left-0 top-0 h-24 opacity-90" />
      <div className="mx-auto max-w-7xl px-4 py-section-sm">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          {/* Brand */}
          <div>
            <p className="font-display text-2xl font-medium tracking-tight text-white">{data?.company_name || 'SJT Tour & Travel'}</p>
            <p className="mt-1 text-sm font-medium text-primary-bright">PT. Sekawan Jaya Trans</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              Mitra perjalanan tepercaya untuk layanan travel reguler, tour &amp; wisata, carter kendaraan, serta jasa titip dan
              pengiriman paket.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-slate-400">
              <MapPin size={14} className="text-primary-bright" /> Sumenep, Jawa Timur
            </p>
            {socials.length > 0 ? (
              <div className="mt-5 flex items-center gap-2">
                {socials.map(({ href, icon: Icon, label }) => (
                  <a key={label} href={href as string} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid h-10 w-10 place-items-center rounded-lg border border-ink-soft text-slate-300 transition hover:border-primary-bright hover:text-primary-bright">
                    <Icon />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          {/* Company */}
          <nav aria-label="Menu perusahaan">
            <p className="text-xs font-semibold uppercase tracking-button text-slate-500">Perusahaan</p>
            <ul className="mt-4 space-y-2.5">
              {company.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm font-medium text-slate-300 transition hover:text-primary-bright">{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Legal */}
          <nav aria-label="Menu legal">
            <p className="text-xs font-semibold uppercase tracking-button text-slate-500">Legal</p>
            <ul className="mt-4 space-y-2.5">
              {LEGAL_NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm font-medium text-slate-300 transition hover:text-primary-bright">{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact CTAs */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-button text-slate-500">Bantuan</p>
            <div className="mt-4 flex flex-col gap-3">
              {cs ? (
                <a href={cs} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold uppercase tracking-button text-white transition hover:bg-primary-bright">
                  <MessageCircle size={16} /> Customer Service
                </a>
              ) : null}
              {jastip ? (
                <a href={jastip} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-ink-soft px-5 text-sm font-semibold uppercase tracking-button text-slate-200 transition hover:border-primary-bright hover:text-primary-bright">
                  <Package size={16} /> Jastip / Kirim Paket
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-ink-soft pt-6 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} {data?.company_name || 'SJT Tour & Travel'} · PT. Sekawan Jaya Trans. Seluruh Hak Dilindungi Undang-Undang.
          </p>
          <Link href="/copyright" className="text-xs font-medium text-slate-400 transition hover:text-primary-bright">Hak Cipta</Link>
        </div>
      </div>
    </footer>
  );
}
