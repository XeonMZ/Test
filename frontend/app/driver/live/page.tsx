'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { DriverLiveTripPage } from '@/features/live-trip/driver-live';
import { EmptyState, Skeleton } from '@/shared/ui/components';

function LiveTripInner() {
  const params = useSearchParams();
  const tripId = Number(params.get('trip'));
  if (!Number.isFinite(tripId) || tripId <= 0) {
    return <EmptyState title="Trip tidak ditemukan" description="Buka halaman ini melalui tombol Live Trip pada dashboard driver." />;
  }
  return <DriverLiveTripPage tripId={tripId} />;
}

export default function Page() {
  return <Suspense fallback={<Skeleton className="h-96" />}><LiveTripInner /></Suspense>;
}
