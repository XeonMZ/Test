import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight, Bus, Car, CheckCircle2, Clock, Heart, MapPin, Package,
  Route, ShieldCheck, Sparkles, Target, Users, Wallet, type LucideIcon,
} from 'lucide-react';
import { Chevrons, ChevronMark } from '@/shared/ui/design/chevron';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'Tentang Kami',
  description:
    'Mengenal SJT Tour & Travel (PT. Sekawan Jaya Trans) — mitra perjalanan dari Sumenep, Jawa Timur untuk layanan travel, wisata, carter kendaraan, dan pengiriman paket.',
  keywords: ['tentang SJT', 'profil perusahaan', 'Sekawan Jaya Trans', 'travel Sumenep', 'visi misi SJT'],
  alternates: { canonical: `${SITE_URL}/tentang` },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: `${SITE_URL}/tentang`,
    siteName: 'SJT Travel & Tour — Sekawan Jaya Trans',
    title: 'Tentang Kami | SJT Travel & Tour',
    description: 'Mitra perjalanan dari Sumenep, Jawa Timur untuk travel, wisata, carter, dan pengiriman paket.',
    images: [{ url: '/sjt-logo.png', width: 1200, height: 630, alt: 'SJT Tour & Travel' }],
  },
  twitter: { card: 'summary_large_image', title: 'Tentang Kami | SJT Travel & Tour', description: 'Mitra perjalanan tepercaya dari Sumenep, Jawa Timur.', images: ['/sjt-logo.png'] },
};

const missions = [
  'Memberikan layanan transportasi yang aman, nyaman, dan tepat waktu.',
  'Mengutamakan kepuasan pelanggan dalam setiap perjalanan.',
  'Menjaga kualitas armada melalui perawatan yang rutin dan berkelanjutan.',
  'Mengembangkan layanan berbasis teknologi agar proses pemesanan menjadi lebih mudah dan efisien.',
  'Membangun hubungan jangka panjang dengan pelanggan melalui pelayanan yang konsisten dan dapat diandalkan.',
];

const services: Array<{ title: string; body: string; icon: LucideIcon }> = [
  { title: 'Travel Reguler', body: 'Melayani perjalanan antarkota dengan jadwal keberangkatan yang teratur dan armada yang nyaman.', icon: Bus },
  { title: 'Tour & Wisata', body: 'Perjalanan wisata untuk keluarga, sekolah, instansi, komunitas, maupun perusahaan dengan layanan yang dapat disesuaikan.', icon: MapPin },
  { title: 'Carter Kendaraan', body: 'Penyewaan kendaraan untuk berbagai keperluan, mulai dari perjalanan pribadi hingga kegiatan bisnis dan acara khusus.', icon: Car },
  { title: 'Jasa Titip & Pengiriman Paket', body: 'Layanan pengiriman barang dan titipan yang praktis, cepat, dan aman mengikuti rute perjalanan kami.', icon: Package },
];

const reasons: Array<{ title: string; icon: LucideIcon }> = [
  { title: 'Armada yang bersih dan terawat.', icon: ShieldCheck },
  { title: 'Pengemudi yang berpengalaman dan bertanggung jawab.', icon: Users },
  { title: 'Pelayanan yang ramah serta responsif.', icon: Sparkles },
  { title: 'Jadwal perjalanan yang teratur.', icon: Clock },
  { title: 'Harga yang transparan tanpa biaya tersembunyi.', icon: Wallet },
  { title: 'Komitmen untuk terus meningkatkan kualitas layanan.', icon: Heart },
];

const areas = ['Sumenep', 'Surabaya', 'Sidoarjo', 'Pasuruan', 'Malang', 'Mojokerto', 'Jombang'];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'Tentang SJT Tour & Travel',
  url: `${SITE_URL}/tentang`,
  mainEntity: {
    '@type': 'TravelAgency',
    name: 'SJT Tour & Travel',
    legalName: 'PT. Sekawan Jaya Trans',
    address: { '@type': 'PostalAddress', addressLocality: 'Sumenep', addressRegion: 'Jawa Timur', addressCountry: 'ID' },
  },
};

// Escape `<` so the JSON island can't break out of the <script> tag.
const jsonLdHtml = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

export default function TentangPage() {
  return (
    <div className="bg-canvas text-ink dark:bg-ink-deep dark:text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml }} />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-section-sm pt-16 sm:pb-section sm:pt-24">
        <Chevrons side="left" className="absolute inset-y-10 left-0 hidden md:flex" />
        <Chevrons side="right" className="absolute inset-y-10 right-0 hidden md:flex" />
        <div className="mx-auto max-w-4xl text-center">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-button text-primary">
            <ChevronMark /> PT. Sekawan Jaya Trans
          </p>
          <h1 className="mt-6 font-display text-4xl font-medium leading-none tracking-tight sm:text-7xl">SJT Tour &amp; Travel</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-charcoal dark:text-slate-300">
            Berawal dari keinginan menghadirkan layanan transportasi yang lebih nyaman dan dapat dipercaya, kami hadir sebagai
            mitra perjalanan bagi masyarakat yang membutuhkan layanan travel, wisata, maupun pengiriman paket.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="bg-cloud px-4 py-section-sm sm:py-section dark:bg-ink">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
          {[
            'Berlokasi di Sumenep, Jawa Timur, kami melayani berbagai kebutuhan perjalanan dengan mengutamakan kenyamanan, keamanan, dan ketepatan waktu.',
            'Kami percaya setiap perjalanan bukan sekadar berpindah tempat, tetapi juga tentang memberikan rasa tenang kepada setiap pelanggan.',
            'Karena itu kami terus berupaya memberikan pelayanan yang ramah, armada yang terawat, serta pengemudi yang berpengalaman.',
          ].map((p, i) => (
            <article key={i} className="rounded-2xl bg-canvas p-6 shadow-soft dark:bg-ink-deep">
              <span className="font-display text-2xl font-medium text-primary">0{i + 1}</span>
              <p className="mt-4 text-sm leading-relaxed text-charcoal dark:text-slate-300">{p}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="px-4 py-section-sm sm:py-section">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-hairline bg-canvas p-8 dark:border-ink-soft dark:bg-ink">
            <Target className="text-primary" size={30} />
            <h2 className="mt-5 font-display text-2xl font-medium tracking-tight">Visi</h2>
            <p className="mt-4 leading-relaxed text-charcoal dark:text-slate-300">
              Menjadi perusahaan transportasi dan perjalanan yang dipercaya masyarakat melalui pelayanan yang jujur, profesional,
              dan terus berkembang mengikuti kebutuhan zaman.
            </p>
          </div>
          <div className="rounded-2xl bg-ink p-8 text-on-ink">
            <p className="sjt-eyebrow text-primary-bright">Misi</p>
            <ul className="mt-5 space-y-3">
              {missions.map((m) => (
                <li key={m} className="flex gap-3 text-sm leading-relaxed text-slate-300">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary-bright" /> <span>{m}</span>
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
          <h2 className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-5xl">Empat layanan utama</h2>
        </div>
        <div className="mx-auto mt-12 grid max-w-6xl gap-6 sm:grid-cols-2">
          {services.map(({ title, body, icon: Icon }) => (
            <article key={title} className="flex gap-4 rounded-2xl bg-canvas p-6 shadow-soft dark:bg-ink-deep">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Icon size={24} /></span>
              <div>
                <h3 className="font-display text-xl font-medium tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-charcoal dark:text-slate-300">{body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Why choose us */}
      <section className="px-4 py-section-sm sm:py-section">
        <div className="mx-auto max-w-3xl text-center">
          <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-button text-primary"><ChevronMark /> Mengapa Memilih Kami</p>
          <h2 className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-5xl">Pelayanan terbaik untuk Anda</h2>
        </div>
        <div className="mx-auto mt-12 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map(({ title, icon: Icon }) => (
            <div key={title} className="flex items-start gap-3 rounded-2xl border border-hairline bg-canvas p-5 dark:border-ink-soft dark:bg-ink">
              <Icon className="mt-0.5 shrink-0 text-primary" size={22} />
              <p className="text-sm font-medium leading-relaxed text-ink dark:text-slate-100">{title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Area served */}
      <section className="bg-cloud px-4 py-section-sm sm:py-section dark:bg-ink">
        <div className="mx-auto max-w-3xl text-center">
          <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-button text-primary"><Route size={14} className="text-primary" /> Area Layanan</p>
          <h2 className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-5xl">Rute di Jawa Timur</h2>
          <p className="mt-4 leading-relaxed text-charcoal dark:text-slate-300">Kami terus memperluas jangkauan agar semakin banyak pelanggan dapat menikmati perjalanan bersama kami.</p>
        </div>
        <div className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-3">
          {areas.map((city) => (
            <span key={city} className="inline-flex items-center gap-2 rounded-lg border border-steel bg-canvas px-4 py-2 text-sm font-medium dark:border-ink-soft dark:bg-ink-deep">
              <MapPin size={14} className="text-primary" /> {city}
            </span>
          ))}
        </div>
      </section>

      {/* Commitment + CTA */}
      <section className="px-4 py-section-sm sm:py-section">
        <div className="mx-auto max-w-5xl rounded-2xl bg-ink px-6 py-14 text-center text-on-ink sm:px-12 sm:py-16">
          <p className="sjt-eyebrow text-primary-bright">Komitmen Kami</p>
          <p className="mx-auto mt-5 max-w-3xl font-display text-2xl font-medium leading-snug sm:text-3xl">
            Kepercayaan pelanggan adalah hal yang paling berharga bagi kami. Kami akan terus menjaga kualitas pelayanan dan
            berinovasi agar setiap pelanggan mendapatkan pengalaman terbaik.
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-slate-400">
            Terima kasih atas kepercayaan Anda. Kami siap menjadi teman perjalanan yang dapat diandalkan, kapan pun dan ke mana pun tujuan Anda.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/jadwal" className="sjt-btn bg-primary text-white hover:bg-primary-bright">Lihat jadwal <ArrowRight size={16} /></Link>
            <Link href="/contact" className="sjt-btn-on-ink">Hubungi kami</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
