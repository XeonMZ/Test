import { Building2, Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import type { PublicCompanyProfile } from '@/services/legal';

/**
 * Company profile block for the Contact page.
 *
 * Every value comes from System Settings in the database (editable by owner &
 * admin from Dashboard → Pengaturan), so nothing here is hardcoded. Rows with
 * no value stored yet are omitted rather than rendered empty.
 */

function waHref(number: string): string {
  const digits = number.replace(/[^0-9]/g, '');
  const normalized = digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}`;
}

const MAPS_HOSTS = ['www.google.com', 'google.com', 'maps.google.com', 'www.openstreetmap.org'];

/**
 * Only render an embed when the stored value is an https URL on a known map
 * host. Prevents a compromised settings row from pointing the iframe at an
 * attacker-controlled origin.
 */
function safeMapsEmbed(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    return MAPS_HOSTS.includes(url.hostname) ? url.toString() : null;
  } catch {
    return null;
  }
}

export function ContactDetails({ profile }: { profile: PublicCompanyProfile }) {
  const companyName = profile.company_name || 'SJT Tour & Travel';
  const whatsapp = profile.cs_whatsapp || profile.whatsapp_number;
  const mapsEmbed = safeMapsEmbed(profile.company_maps_embed);

  const rows = [
    { icon: Building2, label: 'Nama perusahaan', value: `${companyName} (PT. Sekawan Jaya Trans)`, href: null },
    { icon: MapPin, label: 'Alamat', value: profile.company_address, href: null },
    { icon: Mail, label: 'Email', value: profile.company_email, href: profile.company_email ? `mailto:${profile.company_email}` : null },
    { icon: Phone, label: 'Telepon', value: profile.company_phone, href: profile.company_phone ? `tel:${profile.company_phone.replace(/\s+/g, '')}` : null },
    { icon: Clock, label: 'Jam operasional', value: profile.company_hours, href: null },
  ].filter((row) => Boolean(row.value));

  return (
    <section aria-labelledby="kontak-perusahaan" className="mb-8">
      <h2 id="kontak-perusahaan" className="font-display text-2xl font-medium tracking-tight text-ink sm:text-3xl dark:text-white">
        Informasi Kontak
      </h2>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        {rows.map(({ icon: Icon, label, value, href }) => (
          <div key={label} className="rounded-md border border-hairline p-4 dark:border-ink-soft">
            <dt className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-button text-slate-500 dark:text-slate-400">
              <Icon size={14} aria-hidden="true" className="text-primary" />
              {label}
            </dt>
            <dd className="mt-2 text-sm font-bold leading-6 text-slate-900 dark:text-slate-100">
              {href ? (
                <a href={href} className="transition hover:text-primary hover:underline">
                  {value}
                </a>
              ) : (
                value
              )}
            </dd>
          </div>
        ))}
      </dl>

      {whatsapp ? (
        <a
          href={waHref(whatsapp)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-storm-deep px-5 text-sm font-semibold uppercase tracking-button text-white transition hover:opacity-90"
        >
          <MessageCircle size={16} aria-hidden="true" /> Hubungi via WhatsApp
        </a>
      ) : null}

      {mapsEmbed ? (
        <div className="mt-6 overflow-hidden rounded-md border border-hairline dark:border-ink-soft">
          <iframe
            src={mapsEmbed}
            title={`Peta lokasi ${companyName}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            className="h-[320px] w-full border-0"
          />
        </div>
      ) : null}
    </section>
  );
}
