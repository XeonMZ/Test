import Link from 'next/link';
import { AlertTriangle, Bell, CalendarClock, CheckCircle2, Clock3, CreditCard, Download, Gift, History, QrCode, ShieldCheck, Star, Ticket, UserRound } from 'lucide-react';
import { ActionButton, AppCard, Badge, EmptyState, Skeleton, Timeline } from '@/shared/ui/components';
import type { PortalCard, PortalMetric, PortalStatus, PortalTimelineItem } from './api';

const toneByStatus: Record<PortalStatus, 'neutral' | 'success' | 'warning' | 'danger'> = {
  active: 'success', waiting: 'warning', success: 'success', failed: 'danger', expired: 'danger', cancelled: 'danger', completed: 'success', info: 'neutral',
};

export function StatusBadge({ status }: { status: PortalStatus }) {
  return <Badge tone={toneByStatus[status]}>{status.replace('-', ' ')}</Badge>;
}

export function StatisticCard({ metric }: { metric: PortalMetric }) {
  return <AppCard className="min-h-36"><p className="text-sm font-bold text-slate-500">{metric.label}</p><p className="mt-3 font-display text-3xl font-extrabold">{metric.value}</p><p className="mt-3 text-sm text-slate-500">{metric.helper}</p></AppCard>;
}

function PortalCardShell({ card, icon }: { card: PortalCard; icon: React.ReactNode }) {
  const content = <AppCard className="h-full transition hover:-translate-y-0.5 hover:shadow-soft"><div className="flex items-start justify-between gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">{icon}</span><StatusBadge status={card.status} /></div><h3 className="mt-5 font-display text-xl font-bold">{card.title}</h3><p className="mt-2 text-sm text-slate-500">{card.description}</p>{card.meta ? <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{card.meta}</p> : null}</AppCard>;
  return card.href ? <Link href={card.href}>{content}</Link> : content;
}

export function BookingCard({ card }: { card: PortalCard }) { return <PortalCardShell card={card} icon={<CalendarClock size={22} />} />; }
export function TicketCardPortal({ card }: { card: PortalCard }) { return <PortalCardShell card={card} icon={<Ticket size={22} />} />; }
export function PaymentCard({ card }: { card: PortalCard }) { return <PortalCardShell card={card} icon={<CreditCard size={22} />} />; }
export function MembershipCardPortal({ card }: { card: PortalCard }) { return <PortalCardShell card={card} icon={<Star size={22} />} />; }
export function PromoCard({ card }: { card: PortalCard }) { return <PortalCardShell card={card} icon={<Gift size={22} />} />; }
export function VoucherCard({ card }: { card: PortalCard }) { return <PortalCardShell card={card} icon={<Gift size={22} />} />; }

export function CustomerTimeline({ items }: { items: PortalTimelineItem[] }) {
  return <AppCard><Timeline items={items.map((item) => `${item.label} — ${item.description}`)} /></AppCard>;
}

export function CustomerEmptyState({ title, description }: { title: string; description: string }) { return <EmptyState title={title} description={description} />; }
export function CustomerSkeleton() { return <div className="grid gap-4 md:grid-cols-3"><Skeleton /><Skeleton /><Skeleton /></div>; }
export function CustomerErrorState({ message }: { message: string }) { return <AppCard className="border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"><div className="flex gap-3"><AlertTriangle /><p className="font-bold">{message}</p></div></AppCard>; }

export function QuickActions() {
  const actions = [
    ['Book Trip', '/booking', CalendarClock], ['Pay Now', '/customer/payment', CreditCard], ['Show QR', '/customer/tickets', QrCode], ['Download Receipt', '/customer/trip-history', Download],
  ] as const;
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{actions.map(([label, href, Icon]) => <Link key={label} href={href} className="rounded-2xl border border-slate-200 bg-white p-4 font-bold shadow-sm hover:border-primary dark:border-slate-800 dark:bg-slate-900"><Icon className="mb-3 text-primary" />{label}</Link>)}</div>;
}

export function PortalFeatureGrid() {
  const rows = [
    ['Passenger, seat, invoice, cancel booking, and history', UserRound], ['Countdown, retry payment, polling, success, failed, expired', Clock3], ['QR ticket, PDF download, check-in, boarding, trip detail', QrCode], ['Notification read/unread, search, filter, infinite scroll, realtime', Bell], ['Rating, review, receipt, invoice', History], ['Sanctum, policy, permission, own-data access only', ShieldCheck], ['Status transitions follow existing state machines', CheckCircle2],
  ] as const;
  return <div className="grid gap-3 md:grid-cols-2">{rows.map(([label, Icon]) => <div key={label} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold dark:border-slate-800 dark:bg-slate-900"><Icon className="shrink-0 text-primary" size={20} />{label}</div>)}</div>;
}

export function ConfirmationDialogPreview() { return <AppCard><h3 className="font-display text-xl font-bold">Cancel Booking</h3><p className="mt-2 text-sm text-slate-500">Confirmation dialog is wired as a reusable component before calling the existing cancel endpoint.</p><ActionButton className="mt-4 bg-danger">Open confirmation</ActionButton></AppCard>; }
