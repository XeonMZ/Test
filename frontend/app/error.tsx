'use client';

import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface the failure for observability tooling without leaking details to the UI.
    console.error('[stms] unhandled error', error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-secondary px-4 dark:bg-slate-950">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60">
          <AlertTriangle size={30} aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-medium text-slate-950 dark:text-white">Terjadi kesalahan</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
          Sistem gagal memproses halaman ini. Coba muat ulang — jika masih bermasalah, hubungi tim operasional.
        </p>
        {error.digest ? <p className="mt-3 font-mono text-xs text-slate-400">Ref: {error.digest}</p> : null}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button onClick={reset} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold uppercase tracking-button text-white transition hover:bg-primary-deep">
            <RefreshCw size={16} /> Coba lagi
          </button>
          <Link href="/" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 px-6 text-sm font-semibold uppercase tracking-button text-slate-700 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-200">
            <Home size={15} /> Beranda
          </Link>
        </div>
      </section>
    </main>
  );
}
