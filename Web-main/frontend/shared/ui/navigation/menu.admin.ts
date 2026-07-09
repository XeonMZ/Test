import { BarChart3, Bell, BookOpen, Bus, CalendarClock, ClipboardList, CreditCard, LayoutDashboard, Megaphone, Receipt, Settings, ShieldCheck, Ticket, Users, UserRound, Route } from 'lucide-react';
import type { MenuItem } from './types';

export const adminMenu: MenuItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Booking Management', href: '/admin/bookings', icon: BookOpen },
  { label: 'Customer Management', href: '/admin/customers', icon: UserRound },
  { label: 'Driver Management', href: '/admin/drivers', icon: Users },
  { label: 'Vehicle Management', href: '/admin/vehicles', icon: Bus },
  { label: 'Trip & Schedule', href: '/admin/operations', icon: CalendarClock },
  { label: 'Route Management', href: '/admin/operations', icon: Route },
  { label: 'Payment Monitoring', href: '/admin/payments', icon: Receipt },
  { label: 'Ticket Monitoring', href: '/admin/tickets', icon: Ticket },
  { label: 'Membership', href: '/admin/customers', icon: ShieldCheck },
  { label: 'Promo & Voucher', href: '/admin/customers', icon: Megaphone },
  { label: 'Notification Center', href: '/admin/notifications', icon: Bell },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { label: 'Activity Logs', href: '/admin/reports', icon: ClipboardList },
  { label: 'System Settings', href: '/admin/settings', icon: Settings },
  { label: 'Existing Payment Flow', href: '/payment', icon: CreditCard },
];
