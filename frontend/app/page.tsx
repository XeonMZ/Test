import { Button } from '@/components/button';
import { SectionHeading } from '@/components/section-heading';
import { HeroSearch } from '@/features/booking/hero-search';
import { ArrowRight, Car, QrCode, ShieldCheck, Sparkles, Users, type LucideIcon } from 'lucide-react';

const stats: Array<[string, string]> = [
  ['End-to-end', 'Booking sampai boarding'],
  ['Real-time', 'Ketersediaan kursi'],
  ['4 peran', 'Customer, driver, admin, owner'],
  ['24/7', 'Dukungan operasional'],
];

const benefits: Array<[string, string, LucideIcon]> = [
  ['Kursi terkunci aman', 'Pemilihan kursi transaksional dengan penguncian sementara dan rilis otomatis saat pembayaran kedaluwarsa.', Car],
  ['Pembayaran terverifikasi', 'Webhook gateway diverifikasi tanda tangan dan idempoten, sehingga status pembayaran selalu konsisten.', ShieldCheck],
  ['E-ticket QR', 'Tiket digital dengan payload QR bertanda tangan server, dipindai driver saat check-in.', QrCode],
];

const faqs: Array<[string, string]> = [
  ['Apakah pemesanan benar-benar berjalan?', 'Ya. Pencarian jadwal, denah kursi, penguncian kursi, pembayaran, dan penerbitan tiket semuanya terhubung ke API Laravel yang sebenarnya.'],
  ['Bagaimana kursi dijaga agar tidak dobel?', 'Kursi dikunci di dalam transaksi database selama proses pembayaran, lalu dirilis otomatis oleh job kedaluwarsa bila pembayaran tidak selesai.'],
  ['Apakah aksesnya berbasis peran?', 'Setiap endpoint sensitif dilindungi autentikasi Sanctum dan middleware peran: customer, driver, admin, dan owner.'],
];

function StaticHome() {
  return (
    <div className="overflow-hidden bg-secondary text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <section className="relative px-4 pb-20 pt-36 sm:pt-44">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.22),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(22,163,74,0.16),transparent_26%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-primary shadow-soft"><Sparkles size={16} /> SJT Travel &amp; Tour · Sekawan Jaya Trans</div>
            <h1 className="mt-7 font-display text-5xl font-extrabold leading-tight tracking-tight sm:text-7xl">Perjalanan yang mulus, dari pemesanan hingga tiba di tujuan.</h1>
            <p className="mt-6 max-w-2xl text-xl leading-9 text-slate-600 dark:text-slate-300">SJT menyatukan pemesanan pelanggan, pengelolaan armada, alur kerja driver, dan visibilitas bisnis dalam satu platform yang siap produksi.</p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a href="/jadwal"><Button>Lihat jadwal <ArrowRight className="ml-2" size={18} /></Button></a>
              <a href="#solutions" className="rounded-2xl bg-white px-6 py-3 text-center text-sm font-bold text-slate-900 shadow-soft">Jelajahi platform</a>
            </div>
          </div>

          <div id="booking"><HeroSearch /></div>
        </div>
      </section>

      <section id="solutions" className="px-4 py-20">
        <SectionHeading eyebrow="Kenapa SJT" title="Dibangun untuk operasional nyata" description="Bukan tampilan kosong: setiap alur terhubung ke basis data, transaksi, dan kontrol akses yang sesungguhnya." />
        <div className="mx-auto mt-12 grid max-w-7xl gap-6 md:grid-cols-3">
          {benefits.map(([title, description, Icon]) => (
            <article key={title} className="rounded-[2rem] bg-white p-8 shadow-soft dark:bg-slate-900">
              <Icon className="text-primary" size={34} />
              <h3 className="mt-6 font-display text-2xl font-bold">{title}</h3>
              <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-4 py-12">
        <div className="mx-auto grid max-w-7xl gap-4 rounded-[2rem] bg-primary p-6 text-white shadow-soft md:grid-cols-4">
          {stats.map(([value, label]) => (
            <div key={label} className="p-6 text-center">
              <p className="font-display text-4xl font-extrabold">{value}</p>
              <p className="mt-2 text-blue-100">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="px-4 py-20">
        <SectionHeading eyebrow="FAQ" title="Pertanyaan yang sering diajukan" description="Ringkasan cara kerja sistem pemesanan, keamanan, dan peran pengguna." />
        <div className="mx-auto mt-10 max-w-4xl space-y-4">
          {faqs.map(([q, a]) => (
            <details key={q} className="group rounded-2xl bg-white p-6 shadow-soft dark:bg-slate-900">
              <summary className="cursor-pointer list-none font-display text-xl font-bold">{q}</summary>
              <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="px-4 pb-20">
        <div className="mx-auto rounded-[2rem] bg-slate-950 p-10 text-center text-white shadow-soft">
          <Users className="mx-auto text-warning" size={36} />
          <h2 className="mt-5 font-display text-4xl font-bold">Jalankan operasional perjalananmu hari ini.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">Daftar akun, pesan kursi pertamamu, dan kelola seluruh armada dari satu dasbor.</p>
          <a href="/register" className="mt-8 inline-flex rounded-2xl bg-white px-6 py-3 font-bold text-slate-950">Buat akun</a>
        </div>
      </section>
    </div>
  );
}

import { CmsHome } from '@/features/cms/cms-home';

export default function Home() {
  // CMS-driven landing: renders published Page Builder blocks; falls back to
  // the built-in layout until an editor publishes their first page.
  return <CmsHome fallback={<StaticHome />} />;
}
