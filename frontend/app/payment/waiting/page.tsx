import { Suspense } from 'react';
import { PaymentWaiting } from '@/features/payment/payment-flow';

export const metadata = { title: 'Menunggu Pembayaran — SJT' };

export default function WaitingPaymentPage() {
  return (
    <main className="min-h-screen bg-secondary px-4 py-10 dark:bg-slate-950">
      <Suspense fallback={null}>
        <PaymentWaiting />
      </Suspense>
    </main>
  );
}
