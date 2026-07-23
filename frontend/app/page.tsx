import { Button } from '@/components/button';
import { SectionHeading } from '@/components/section-heading';
import { HeroSearch } from '@/features/booking/hero-search';
import { Chevrons, ChevronMark } from '@/shared/ui/design/chevron';
import { CmsHome } from '@/features/cms/cms-home';
import { profileIcon, type CompanyProfile } from '@/features/company/company-profile';
import { fetchCompanyProfile } from '@/services/company';
import { ArrowRight, CheckCircle2, MapPin, Users } from 'lucide-react';

const faqs: Array<[string, string]> = [
  ['Layanan apa saja yang tersedia?', 'Kami melayani travel reguler antarkota, tour & wisata, carter kendaraan, serta jasa titip dan pengiriman paket mengikuti rute perjalanan kami.'],
  ['Kota mana saja yang dilayani?', 'Rute kami mencakup beberapa kota di Jawa Timur dan terus diperluas. Daftar lengkapnya ada pada bagian Area Layanan di atas.'],
  ['Bagaimana cara memesan?', 'Pilih jadwal keberangkatan, tentukan kursi, lalu selesaikan pembayaran. Tiket digital diterbitkan otomatis dan dipindai saat keberangkatan.'],
];

/**
 * Built-in landing layout. Every company-facing string comes from the editable
 * company profile, so an owner can reword the site without a redeploy.
 */
function StaticHome({ profile }: { profile: CompanyProfile }) {
  return (
    <div className="overflow-hidden bg-canvas text-ink dark:bg-ink-deep dark:text-white">
      {/* ── Hero — chevron pair flanks the banner (DESIGN.md § Decorative Depth) ── */}
      <section className="relative px-4 pb-section-sm pt-32 sm:pb-section sm:pt-44">
        <Chevrons side="left" className="absolute inset-y-16 left-0 hidden lg:flex" />
        <Chevrons side="right" className="absolute inset-y-16 right-0 hidden lg:flex" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-button text-primary">
              <ChevronMark /> {profile.name} · {profile.legal_name}
            </p>
            <h1 className="mt-6 font-display text-5xl font-medium leading-none tracking-tight sm:text-7xl">{profile.tagline}</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-charcoal dark:text-slate-300">{profile.intro}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="/jadwal"><Button>Lihat jadwal <ArrowRight className="ml-1" size={16} /></Button></a>
              <a href="#layanan" className="sjt-btn-outline-ink">Layanan kami</a>
            </div>
          </div>
          <div id="booking"><HeroSearch /></div>
        </div>
      </section>

      {/* ── Services — cloud band ── */}
      <section id="layanan" className="bg-cloud px-4 py-section-sm sm:py-section dark:bg-ink">
        <SectionHeading eyebrow="Layanan Kami" title="Satu mitra untuk setiap perjalanan" description="Dari perjalanan harian antarkota hingga pengiriman titipan, kami siap membantu kebutuhan Anda." />
        <div className="mx-auto mt-12 grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {profile.services.map((service) => {
            const Icon = profileIcon(service.icon);
            return (
              <article key={service.title} className="flex flex-col rounded-2xl bg-canvas p-6 shadow-soft dark:bg-ink-deep">
                <span className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary"><Icon size={24} aria-hidden="true" /></span>
                <h3 className="mt-5 font-display text-xl font-medium tracking-tight">{service.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-charcoal dark:text-slate-300">{service.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Why choose us ── */}
      <section className="px-4 py-section-sm sm:py-section">
        <SectionHeading eyebrow="Mengapa Memilih Kami" title="Kepercayaan Anda adalah prioritas" description={profile.reasons_intro} />
        <div className="mx-auto mt-12 grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {profile.reasons.map((reason) => {
            const Icon = profileIcon(reason.icon);
            return (
              <article key={reason.title} className="rounded-2xl border border-hairline bg-canvas p-6 dark:border-ink-soft dark:bg-ink">
                <Icon className="text-primary" size={28} aria-hidden="true" />
                <h3 className="mt-5 font-display text-xl font-medium tracking-tight">{reason.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-charcoal dark:text-slate-300">{reason.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Vision & mission — ink slab ── */}
      <section className="px-4 py-section-sm sm:py-section">
        <div className="mx-auto max-w-7xl rounded-2xl bg-ink px-6 py-12 text-on-ink sm:px-12 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="sjt-eyebrow text-primary-bright">Visi</p>
              <p className="mt-4 font-display text-2xl font-medium leading-snug sm:text-3xl">{profile.vision}</p>
              <a href="/tentang" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-button text-primary-bright hover:underline">
                Tentang kami <ArrowRight size={16} />
              </a>
            </div>
            <div>
              <p className="sjt-eyebrow text-primary-bright">Misi</p>
              <ul className="mt-4 space-y-3">
                {profile.mission.map((m) => (
                  <li key={m} className="flex gap-3 text-sm leading-relaxed text-slate-300">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary-bright" aria-hidden="true" /> <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Area served ── */}
      <section className="bg-cloud px-4 py-section-sm sm:py-section dark:bg-ink">
        <SectionHeading eyebrow="Area Layanan" title="Menjangkau kota-kota di Jawa Timur" description={profile.areas_intro} />
        <div className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-3">
          {profile.areas.map((city) => (
            <span key={city} className="inline-flex items-center gap-2 rounded-lg border border-steel bg-canvas px-4 py-2 text-sm font-medium text-ink dark:border-ink-soft dark:bg-ink-deep dark:text-white">
              <MapPin size={14} className="text-primary" aria-hidden="true" /> {city}
            </span>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="px-4 py-section-sm sm:py-section">
        <SectionHeading eyebrow="FAQ" title="Pertanyaan yang sering diajukan" description={`Ringkasan layanan, jangkauan, dan cara pemesanan bersama ${profile.name}.`} />
        <div className="mx-auto mt-10 max-w-4xl space-y-3">
          {faqs.map(([q, a]) => (
            <details key={q} className="group rounded-lg border border-hairline bg-canvas p-6 dark:border-ink-soft dark:bg-ink">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-medium tracking-tight">
                {q} <span className="text-primary transition group-open:rotate-45">＋</span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-charcoal dark:text-slate-300">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Closing CTA — ink slab ── */}
      <section className="px-4 pb-section-sm sm:pb-section">
        <div className="mx-auto max-w-7xl rounded-2xl bg-ink px-6 py-14 text-center text-on-ink sm:py-20">
          <Users className="mx-auto text-primary-bright" size={36} aria-hidden="true" />
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-medium tracking-tight sm:text-5xl">Siap menemani perjalanan Anda berikutnya.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">{profile.closing}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="/register" className="sjt-btn-on-ink">Buat akun</a>
            <a href="/jadwal" className="sjt-btn bg-primary text-white hover:bg-primary-bright">Lihat jadwal</a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default async function Home() {
  // Company copy is editable from the dashboard; this read is cached and
  // revalidated by Next, so edits appear without a redeploy.
  const profile = await fetchCompanyProfile();

  // CMS-driven landing: renders published Page Builder blocks; falls back to
  // the built-in layout until an editor publishes their first page.
  return <CmsHome fallback={<StaticHome profile={profile} />} />;
}
