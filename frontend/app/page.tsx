import { Button } from '@/components/button';
import { SectionHeading } from '@/components/section-heading';
import { HeroSearch } from '@/features/booking/hero-search';
import { Chevrons, ChevronMark } from '@/shared/ui/design/chevron';
import { CmsHome } from '@/features/cms/cms-home';
import {
  ArrowRight, Bus, Car, CheckCircle2, Clock, MapPin, Package,
  Route, ShieldCheck, Sparkles, Users, Wallet, type LucideIcon,
} from 'lucide-react';

// Content sourced from the SJT company profile (PT. Sekawan Jaya Trans).
const services: Array<{ title: string; body: string; icon: LucideIcon }> = [
  { title: 'Travel Reguler', body: 'Perjalanan antarkota dengan jadwal keberangkatan yang teratur dan armada yang nyaman.', icon: Bus },
  { title: 'Tour & Wisata', body: 'Perjalanan wisata untuk keluarga, sekolah, instansi, komunitas, maupun perusahaan — disesuaikan dengan kebutuhan.', icon: MapPin },
  { title: 'Carter Kendaraan', body: 'Penyewaan kendaraan untuk perjalanan pribadi hingga kegiatan bisnis dan acara khusus.', icon: Car },
  { title: 'Jasa Titip & Pengiriman', body: 'Pengiriman barang dan titipan yang praktis, cepat, dan aman mengikuti rute perjalanan kami.', icon: Package },
];

const reasons: Array<{ title: string; body: string; icon: LucideIcon }> = [
  { title: 'Armada terawat', body: 'Kendaraan bersih dan dirawat rutin agar setiap perjalanan terasa nyaman dan aman.', icon: ShieldCheck },
  { title: 'Pengemudi berpengalaman', body: 'Driver yang bertanggung jawab dan memahami rute demi keselamatan Anda.', icon: Users },
  { title: 'Jadwal teratur', body: 'Keberangkatan yang tertata sehingga waktu perjalanan Anda lebih pasti.', icon: Clock },
  { title: 'Harga transparan', body: 'Tarif yang jelas tanpa biaya tersembunyi, disepakati sejak awal.', icon: Wallet },
  { title: 'Pelayanan responsif', body: 'Tim yang ramah dan sigap membantu kebutuhan perjalanan Anda.', icon: Sparkles },
  { title: 'Jangkauan luas', body: 'Melayani banyak kota di Jawa Timur dan terus memperluas rute.', icon: Route },
];

const areas = ['Sumenep', 'Surabaya', 'Sidoarjo', 'Pasuruan', 'Malang', 'Mojokerto', 'Jombang'];

const faqs: Array<[string, string]> = [
  ['Layanan apa saja yang tersedia?', 'Kami melayani travel reguler antarkota, tour & wisata, carter kendaraan, serta jasa titip dan pengiriman paket mengikuti rute perjalanan kami.'],
  ['Kota mana saja yang dilayani?', 'Saat ini kami melayani rute dari dan menuju Sumenep, Surabaya, Sidoarjo, Pasuruan, Malang, Mojokerto, dan Jombang, dan terus memperluas jangkauan.'],
  ['Bagaimana cara memesan?', 'Pilih jadwal keberangkatan, tentukan kursi, lalu selesaikan pembayaran. Tiket digital diterbitkan otomatis dan dipindai saat keberangkatan.'],
];

function StaticHome() {
  return (
    <div className="overflow-hidden bg-canvas text-ink dark:bg-ink-deep dark:text-white">
      {/* ── Hero — chevron pair flanks the banner (DESIGN.md § Decorative Depth) ── */}
      <section className="relative px-4 pb-section-sm pt-32 sm:pb-section sm:pt-44">
        <Chevrons side="left" className="absolute inset-y-16 left-0 hidden lg:flex" />
        <Chevrons side="right" className="absolute inset-y-16 right-0 hidden lg:flex" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-button text-primary">
              <ChevronMark /> SJT Tour &amp; Travel · PT. Sekawan Jaya Trans
            </p>
            <h1 className="mt-6 font-display text-5xl font-medium leading-none tracking-tight sm:text-7xl">
              Teman perjalanan yang dapat diandalkan.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-charcoal dark:text-slate-300">
              Berlokasi di Sumenep, Jawa Timur, kami menghadirkan layanan travel, wisata, carter, dan pengiriman paket dengan
              mengutamakan kenyamanan, keamanan, dan ketepatan waktu.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="/jadwal"><Button>Lihat jadwal <ArrowRight className="ml-1" size={16} /></Button></a>
              <a href="#layanan" className="sjt-btn-outline-ink">Layanan kami</a>
            </div>
          </div>
          <div id="booking"><HeroSearch /></div>
        </div>
      </section>

      {/* ── Services — cloud band, 4-up cards ── */}
      <section id="layanan" className="bg-cloud px-4 py-section-sm sm:py-section dark:bg-ink">
        <SectionHeading eyebrow="Layanan Kami" title="Satu mitra untuk setiap perjalanan" description="Dari perjalanan harian antarkota hingga pengiriman titipan, kami siap membantu kebutuhan Anda." />
        <div className="mx-auto mt-12 grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map(({ title, body, icon: Icon }) => (
            <article key={title} className="flex flex-col rounded-2xl bg-canvas p-6 shadow-soft dark:bg-ink-deep">
              <span className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary"><Icon size={24} /></span>
              <h3 className="mt-5 font-display text-xl font-medium tracking-tight">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-charcoal dark:text-slate-300">{body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Why choose us — white body, 3×2 cards ── */}
      <section className="px-4 py-section-sm sm:py-section">
        <SectionHeading eyebrow="Mengapa Memilih Kami" title="Kepercayaan Anda adalah prioritas" description="Memilih jasa transportasi berarti mempercayakan keselamatan dan kenyamanan perjalanan. Kami menjawabnya dengan pelayanan terbaik." />
        <div className="mx-auto mt-12 grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reasons.map(({ title, body, icon: Icon }) => (
            <article key={title} className="rounded-2xl border border-hairline bg-canvas p-6 dark:border-ink-soft dark:bg-ink">
              <Icon className="text-primary" size={28} />
              <h3 className="mt-5 font-display text-xl font-medium tracking-tight">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-charcoal dark:text-slate-300">{body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Vision slab — dark navy (DESIGN.md § dark slab closes rhythm) ── */}
      <section className="px-4 py-section-sm sm:py-section">
        <div className="mx-auto max-w-7xl rounded-2xl bg-ink px-6 py-12 text-on-ink sm:px-12 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="sjt-eyebrow text-primary-bright">Visi</p>
              <p className="mt-4 font-display text-2xl font-medium leading-snug sm:text-3xl">
                Menjadi perusahaan transportasi dan perjalanan yang dipercaya masyarakat melalui pelayanan yang jujur, profesional,
                dan terus berkembang mengikuti kebutuhan zaman.
              </p>
              <a href="/tentang" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-button text-primary-bright hover:underline">
                Tentang kami <ArrowRight size={16} />
              </a>
            </div>
            <div>
              <p className="sjt-eyebrow text-primary-bright">Misi</p>
              <ul className="mt-4 space-y-3">
                {[
                  'Memberikan layanan transportasi yang aman, nyaman, dan tepat waktu.',
                  'Mengutamakan kepuasan pelanggan dalam setiap perjalanan.',
                  'Menjaga kualitas armada melalui perawatan yang rutin dan berkelanjutan.',
                  'Mengembangkan layanan berbasis teknologi agar pemesanan makin mudah.',
                ].map((m) => (
                  <li key={m} className="flex gap-3 text-sm leading-relaxed text-slate-300">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary-bright" /> <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Area served — cloud band, city chips ── */}
      <section className="bg-cloud px-4 py-section-sm sm:py-section dark:bg-ink">
        <SectionHeading eyebrow="Area Layanan" title="Menjangkau kota-kota di Jawa Timur" description="Rute perjalanan kami terus bertambah agar semakin banyak pelanggan dapat menikmati perjalanan yang aman dan nyaman." />
        <div className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-3">
          {areas.map((city) => (
            <span key={city} className="inline-flex items-center gap-2 rounded-lg border border-steel bg-canvas px-4 py-2 text-sm font-medium text-ink dark:border-ink-soft dark:bg-ink-deep dark:text-white">
              <MapPin size={14} className="text-primary" /> {city}
            </span>
          ))}
        </div>
      </section>

      {/* ── FAQ — white body, accordion ── */}
      <section id="faq" className="px-4 py-section-sm sm:py-section">
        <SectionHeading eyebrow="FAQ" title="Pertanyaan yang sering diajukan" description="Ringkasan layanan, jangkauan, dan cara pemesanan bersama SJT." />
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

      {/* ── Closing CTA — ink slab (footer-prelude) ── */}
      <section className="px-4 pb-section-sm sm:pb-section">
        <div className="mx-auto max-w-7xl rounded-2xl bg-ink px-6 py-14 text-center text-on-ink sm:py-20">
          <Users className="mx-auto text-primary-bright" size={36} />
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-medium tracking-tight sm:text-5xl">
            Siap menemani perjalanan Anda berikutnya.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">Daftar akun, pesan kursi pertama Anda, dan rasakan perjalanan yang nyaman bersama SJT Tour &amp; Travel.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="/register" className="sjt-btn-on-ink">Buat akun</a>
            <a href="/jadwal" className="sjt-btn bg-primary text-white hover:bg-primary-bright">Lihat jadwal</a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  // CMS-driven landing: renders published Page Builder blocks; falls back to
  // the built-in layout until an editor publishes their first page.
  return <CmsHome fallback={<StaticHome />} />;
}
