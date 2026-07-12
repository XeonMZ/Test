import { XCircle, RefreshCw, LifeBuoy } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Pembayaran Gagal — SJT' };

export default function PaymentFailedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-rose-50 px-4 dark:bg-slate-950">
      <section className="w-full max-w-xl rounded-[2rem] border border-rose-100 bg-white p-10 text-center shadow-sm dark:border-rose-900/50 dark:bg-slate-900">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60">
          <XCircle size={32} aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-extrabold text-slate-950 dark:text-white">Pembayaran Gagal</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
          Pembayaranmu tidak dapat diproses. Selama booking belum kedaluwarsa, kamu masih bisa mencoba metode pembayaran lain.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/customer/bookings" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-extrabold text-white shadow-sm shadow-primary/20 transition hover:bg-primary/90">
            <RefreshCw size={16} /> Coba bayar lagi
          </Link>
          <Link href="/customer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-6 text-sm font-extrabold text-slate-700 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-200">
            <LifeBuoy size={15} /> Kembali ke dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
