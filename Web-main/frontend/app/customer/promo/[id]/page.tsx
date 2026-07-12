import { PromoDetailPage } from '@/features/customer-portal/portal-pages';

export const metadata = { title: 'Detail Promo — SJT' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PromoDetailPage id={id} />;
}
