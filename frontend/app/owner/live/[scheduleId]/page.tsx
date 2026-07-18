import { LiveMonitorPage } from '@/features/live-trip/track-pages';

export const metadata = { title: 'Live Trip Monitoring — SJT' };

export default async function Page({ params }: { params: Promise<{ scheduleId: string }> }) {
  const { scheduleId } = await params;
  return <LiveMonitorPage scheduleId={Number(scheduleId)} backHref="/owner/manage/schedules" />;
}
