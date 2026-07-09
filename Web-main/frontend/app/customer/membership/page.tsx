import { MembershipCardPortal } from '@/features/customer-portal/components';
import { AppCard, DataTable, PageHeader, SectionHeader } from '@/shared/ui/components';

export default function MembershipPage() {
  return <div className="space-y-6"><PageHeader title="Membership" description="Membership card, level, points, benefits, point history, and upgrade progress." /><MembershipCardPortal card={{ id: 'MBR-GOLD', title: 'Gold Member', description: '12.450 points with lounge and priority boarding benefits.', status: 'active', meta: '78% upgrade progress' }} /><AppCard><SectionHeader title="Point History & Benefit" /><div className="mt-4"><DataTable columns={['Date', 'Activity', 'Point']} rows={[[ '2026-07-06', 'Completed trip', '+450' ], [ '2026-07-01', 'Voucher redemption', '-1000' ]]} /></div></AppCard></div>;
}
