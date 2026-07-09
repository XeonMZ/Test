import { PromoCard, VoucherCard } from '@/features/customer-portal/components';
import { promoCards } from '@/features/customer-portal/data';
import { AppCard, DataTable, PageHeader, SectionHeader } from '@/shared/ui/components';

export default function PromoPage() {
  return <div className="space-y-6"><PageHeader title="Promo & Voucher" description="Promo list, voucher list, detail, and voucher history." /><div className="grid gap-4 lg:grid-cols-2"><PromoCard card={promoCards[0]} /><VoucherCard card={promoCards[1]} /></div><AppCard><SectionHeader title="Voucher History" /><div className="mt-4"><DataTable columns={['Voucher', 'Status', 'Usage']} rows={promoCards.map((card) => [card.id, card.status, card.meta ?? '-'])} /></div></AppCard></div>;
}
