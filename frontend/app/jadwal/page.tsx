import { Suspense } from 'react';
import { PublicSchedules } from '@/features/booking/public-schedules';

export const metadata = { title: 'Jadwal Tersedia — SJT Travel & Tour' };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PublicSchedules />
    </Suspense>
  );
}
