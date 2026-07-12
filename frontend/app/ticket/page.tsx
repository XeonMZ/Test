import { redirect } from 'next/navigation';

// Legacy static route — the real ticket list lives in the customer portal.
export default function Page() {
  redirect('/customer/tickets');
}
