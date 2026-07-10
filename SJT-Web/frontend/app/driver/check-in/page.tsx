import { CheckInConsole } from '@/features/driver-portal/check-in-console';
import { TripPassengersPanel } from '@/features/driver-portal/driver-pages';
import { PageHeader } from '@/shared/ui/components';

export const metadata = { title: 'Check-in — SJT Travel & Tour' };

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="Check-in Penumpang" description="Pindai QR (kamera / foto), tempel payload, atau masukkan kode tiket — semua langsung ke server." />
      <CheckInConsole />
      <TripPassengersPanel />
    </div>
  );
}
