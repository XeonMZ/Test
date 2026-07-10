import { TripPassengersPanel } from '@/features/driver-portal/driver-pages';
import { PageHeader } from '@/shared/ui/components';

export const metadata = { title: 'Manifes Penumpang — SJT' };

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="Manifes Penumpang" description="Status seluruh tiket pada trip yang kamu bawa." />
      <TripPassengersPanel />
    </div>
  );
}
