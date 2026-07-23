import { Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Pembayaran Kedaluwarsa — SJT' };

export default function PaymentExpiredPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 dark:bg-slate-950">
      <section className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-slate-200 text-slate-500 dark:bg-slate-800">
          <Clock size={32} aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-medium text-slate-950 dark:text-white">Waktu Pembayaran Habis</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
          Kursi telah dirilis otomatis agar dapat dipesan pelanggan lain. Silakan buat pemesanan baru — jadwalmu mungkin masih tersedia.
        </p>
        <div className="mt-8 flex justify-center">
          <Link href="/booking" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-extrabold text-white shadow-sm shadow-primary/20 transition hover:bg-primary/90">
            Pesan ulang <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}
