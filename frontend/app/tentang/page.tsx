import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, MapPin, Route, Target } from 'lucide-react';
import { Chevrons, ChevronMark } from '@/shared/ui/design/chevron';
import { profileIcon } from '@/features/company/company-profile';
import { fetchCompanyProfile } from '@/services/company';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

/** Metadata follows the editable profile, so renaming the company updates SEO too. */
export async function generateMetadata(): Promise<Metadata> {
  const p = await fetchCompanyProfile();
  const title = 'Tentang Kami';
  const description = `Mengenal ${p.name} (${p.legal_name}) — mitra perjalanan dari ${p.location} untuk layanan travel, wisata, carter kendaraan, dan pengiriman paket.`;

  return {
    title,
    description,
    keywords: ['tentang ' + p.name, 'profil perusahaan', p.legal_name, 'travel ' + p.location, 'visi misi'],
    alternates: { canonical: `${SITE_URL}/tentang` },
    openGraph: {
      type: 'website',
      locale: 'id_ID',
      url: `${SITE_URL}/tentang`,
      siteName: `${p.name} — ${p.legal_name}`,
      title: `${title} | ${p.name}`,
      description,
      images: [{ url: '/sjt-logo.png', width: 1200, height: 630, alt: p.name }],
    },
    twitter: { card: 'summary_large_image', title: `${title} | ${p.name}`, description, images: ['/sjt-logo.png'] },
  };
}

export default async function TentangPage() {
  const profile = await fetchCompanyProfile();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: `Tentang ${profile.name}`,
    url: `${SITE_URL}/tentang`,
    mainEntity: {
      '@type': 'TravelAgency',
      name: profile.name,
      legalName: profile.legal_name,
      description: profile.intro,
      areaServed: profile.areas.map((c) => ({ '@type': 'City', name: c })),
      makesOffer: profile.services.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.title } })),
    },
  };
  // Escape `<` so the JSON island cannot break out of the <script> tag.
  const jsonLdHtml = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

  return (
    <div className="bg-canvas text-ink dark:bg-ink-deep dark:text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml }} />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-section-sm pt-16 sm:pb-section sm:pt-24">
        <Chevrons side="left" className="absolute inset-y-10 left-0 hidden md:flex" />
        <Chevrons side="right" className="absolute inset-y-10 right-0 hidden md:flex" />
        <div className="mx-auto max-w-4xl text-center">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-button text-primary">
            <ChevronMark /> {profile.legal_name}
          </p>
          <h1 className="mt-6 font-display text-4xl font-medium leading-none tracking-tight sm:text-7xl">{profile.name}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-charcoal dark:text-slate-300">{profile.intro}</p>
        </div>
      </section>

      {/* Story */}
      <section className="bg-cloud px-4 py-section-sm sm:py-section dark:bg-ink">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
          {profile.story.map((paragraph, i) => (
            <article key={i} className="rounded-2xl bg-canvas p-6 shadow-soft dark:bg-ink-deep">
              <span className="font-display text-2xl font-medium text-primary">{String(i + 1).padStart(2, '0')}</span>
              <p className="mt-4 text-sm leading-relaxed text-charcoal dark:text-slate-300">{paragraph}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="px-4 py-section-sm sm:py-section">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-hairline bg-canvas p-8 dark:border-ink-soft dark:bg-ink">
            <Target className="text-primary" size={30} aria-hidden="true" />
            <h2 className="mt-5 font-display text-2xl font-medium tracking-tight">Visi</h2>
            <p className="mt-4 leading-relaxed text-charcoal dark:text-slate-300">{profile.vision}</p>
          </div>
          <div className="rounded-2xl bg-ink p-8 text-on-ink">
            <p className="sjt-eyebrow text-primary-bright">Misi</p>
            <ul className="mt-5 space-y-3">
              {profile.mission.map((m) => (
                <li key={m} className="flex gap-3 text-sm leading-relaxed text-slate-300">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary-bright" aria-hidden="true" /> <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-cloud px-4 py-section-sm sm:py-section dark:bg-ink">
        <div className="mx-auto max-w-3xl text-center">
          <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-button text-primary"><ChevronMark /> Layanan Kami</p>
          <h2 className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-5xl">Layanan yang kami sediakan</h2>
        </div>
        <div className="mx-auto mt-12 grid max-w-6xl gap-6 sm:grid-cols-2">
          {profile.services.map((service) => {
            const Icon = profileIcon(service.icon);
            return (
              <article key={service.title} className="flex gap-4 rounded-2xl bg-canvas p-6 shadow-soft dark:bg-ink-deep">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Icon size={24} aria-hidden="true" /></span>
                <div>
                  <h3 className="font-display text-xl font-medium tracking-tight">{service.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-charcoal dark:text-slate-300">{service.body}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Why choose us */}
      <section className="px-4 py-section-sm sm:py-section">
        <div className="mx-auto max-w-3xl text-center">
          <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-button text-primary"><ChevronMark /> Mengapa Memilih Kami</p>
          <h2 className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-5xl">Pelayanan terbaik untuk Anda</h2>
          <p className="mt-5 leading-relaxed text-charcoal dark:text-slate-300">{profile.reasons_intro}</p>
        </div>
        <div className="mx-auto mt-12 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profile.reasons.map((reason) => {
            const Icon = profileIcon(reason.icon);
            return (
              <div key={reason.title} className="flex items-start gap-3 rounded-2xl border border-hairline bg-canvas p-5 dark:border-ink-soft dark:bg-ink">
                <Icon className="mt-0.5 shrink-0 text-primary" size={22} aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-ink dark:text-slate-100">{reason.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-charcoal dark:text-slate-400">{reason.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Area served */}
      <section className="bg-cloud px-4 py-section-sm sm:py-section dark:bg-ink">
        <div className="mx-auto max-w-3xl text-center">
          <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-button text-primary"><Route size={14} aria-hidden="true" /> Area Layanan</p>
          <h2 className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-5xl">Rute perjalanan kami</h2>
          <p className="mt-4 leading-relaxed text-charcoal dark:text-slate-300">{profile.areas_intro}</p>
        </div>
        <div className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-3">
          {profile.areas.map((city) => (
            <span key={city} className="inline-flex items-center gap-2 rounded-lg border border-steel bg-canvas px-4 py-2 text-sm font-medium dark:border-ink-soft dark:bg-ink-deep">
              <MapPin size={14} className="text-primary" aria-hidden="true" /> {city}
            </span>
          ))}
        </div>
      </section>

      {/* Commitment + CTA */}
      <section className="px-4 py-section-sm sm:py-section">
        <div className="mx-auto max-w-5xl rounded-2xl bg-ink px-6 py-14 text-center text-on-ink sm:px-12 sm:py-16">
          <p className="sjt-eyebrow text-primary-bright">Komitmen Kami</p>
          <p className="mx-auto mt-5 max-w-3xl font-display text-2xl font-medium leading-snug sm:text-3xl">{profile.commitment}</p>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-slate-400">{profile.closing}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/jadwal" className="sjt-btn bg-primary text-white hover:bg-primary-bright">Lihat jadwal <ArrowRight size={16} /></Link>
            <Link href="/contact" className="sjt-btn-on-ink">Hubungi kami</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
