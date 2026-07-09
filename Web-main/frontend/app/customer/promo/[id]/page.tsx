import { PromoCard, VoucherCard } from '@/features/customer-portal/components';
import { promoCards } from '@/features/customer-portal/data';
import { PageHeader } from '@/shared/ui/components';

export default async function PromoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div className="space-y-6 sm:space-y-8"><PageHeader title={`Promo Detail ${id}`} description="Promo and voucher detail UI without duplicating promo business rules." /><div className="grid gap-4 lg:grid-cols-2"><PromoCard card={promoCards[0]} /><VoucherCard card={promoCards[1]} /></div></div>;
}
