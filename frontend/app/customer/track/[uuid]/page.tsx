import { CustomerTrackPage } from '@/features/live-trip/track-pages';

export const metadata = { title: 'Track Driver — SJT' };

export default async function Page({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  return <CustomerTrackPage bookingUuid={uuid} />;
}
