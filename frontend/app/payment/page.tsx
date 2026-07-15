import { Suspense } from 'react';
import { PaymentFlow } from '@/features/payment/payment-flow';

export const metadata = { title: 'Pembayaran — SJT' };

export default function PaymentPage() {
  return (
    <main className="min-h-screen bg-secondary px-4 py-10 dark:bg-slate-950 sm:py-14">
      <Suspense fallback={null}>
        <PaymentFlow />
      </Suspense>
    </main>
  );
}
