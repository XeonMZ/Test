import { Suspense } from 'react';
import { BookingWizard } from '@/features/booking/booking-wizard';

export const metadata = { title: 'Pesan Perjalanan — SJT' };

export default function BookingPage() {
  return (
    <Suspense fallback={null}>
      <BookingWizard />
    </Suspense>
  );
}
