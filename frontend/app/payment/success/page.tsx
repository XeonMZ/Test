import { CheckCircle2, Ticket, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Pembayaran Berhasil — SJT' };

export default function PaymentSuccessPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-emerald-50 px-4 dark:bg-slate-950">
      <section className="w-full max-w-xl rounded-2xl border border-emerald-100 bg-white p-10 text-center shadow-sm dark:border-emerald-900/50 dark:bg-slate-900">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60">
          <CheckCircle2 size={32} aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-medium text-slate-950 dark:text-white">Pembayaran Berhasil</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
          Tiketmu sedang diterbitkan dan akan muncul di menu tiket dalam beberapa saat. Notifikasi juga dikirim ke akunmu.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/customer/tickets" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold uppercase tracking-button text-white transition hover:bg-primary-deep">
            <Ticket size={16} /> Lihat tiket saya
          </Link>
          <Link href="/customer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 px-6 text-sm font-semibold uppercase tracking-button text-slate-700 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-200">
            Ke dashboard <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </main>
  );
}
