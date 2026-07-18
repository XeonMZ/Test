import { Compass, Home, Ticket } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Halaman Tidak Ditemukan — SJT' };

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-secondary px-4 dark:bg-slate-950">
      <section className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Compass size={30} aria-hidden="true" />
        </span>
        <p className="mt-5 font-display text-5xl font-extrabold text-slate-950 dark:text-white">404</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold text-slate-950 dark:text-white">Halaman tidak ditemukan</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
          Alamat yang kamu tuju sudah dipindahkan atau tidak pernah ada. Mari kembali ke jalur yang benar.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-extrabold text-white transition hover:bg-primary/90">
            <Home size={16} /> Beranda
          </Link>
          <Link href="/booking" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-6 text-sm font-extrabold text-slate-700 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-200">
            <Ticket size={15} /> Pesan perjalanan
          </Link>
        </div>
      </section>
    </main>
  );
}
