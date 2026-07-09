import Link from 'next/link';

const methods = ['Midtrans Snap', 'QRIS Sandbox', 'Virtual Account', 'Bank Transfer'];

export default function PaymentPage() {
  return (
    <main className="min-h-screen bg-secondary px-4 py-12">
      <section className="mx-auto max-w-4xl rounded-[2rem] bg-white p-8 shadow-soft">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary">STMS Payment</p>
        <h1 className="mt-4 font-display text-4xl font-bold text-slate-950">Pilih Metode Pembayaran</h1>
        <p className="mt-3 text-slate-600">Midtrans Sandbox mendukung Snap, QRIS, VA, dan bank transfer dengan retry serta expiry otomatis.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {methods.map((method) => <div key={method} className="rounded-2xl border border-slate-200 p-5"><h2 className="font-bold text-slate-900">{method}</h2><p className="mt-2 text-sm text-slate-500">Status dipantau via polling dan realtime webhook.</p></div>)}
        </div>
        <Link href="/payment/waiting" className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 font-bold text-white">Lanjutkan pembayaran</Link>
      </section>
    </main>
  );
}
