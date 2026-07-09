import { BarChart3, Bell, BookOpen, Bus, CalendarClock, CreditCard, LayoutDashboard, Settings, Ticket, Users, UserRound } from 'lucide-react';
import type { MenuItem } from './types';

// Bottom mobile nav uses the first 4 items — keep the most-used admin actions there.
export const adminMenu: MenuItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Booking Management', href: '/admin/bookings', icon: BookOpen },
  { label: 'Payment Monitoring', href: '/admin/payments', icon: CreditCard },
  { label: 'Reports & Logs', href: '/admin/reports', icon: BarChart3 },
  { label: 'Customer Management', href: '/admin/customers', icon: UserRound },
  { label: 'Driver Management', href: '/admin/drivers', icon: Users },
  { label: 'Vehicle Management', href: '/admin/vehicles', icon: Bus },
  { label: 'Trip & Route Scheduling', href: '/admin/operations', icon: CalendarClock },
  { label: 'Ticket Monitoring', href: '/admin/tickets', icon: Ticket },
  { label: 'Notification Center', href: '/admin/notifications', icon: Bell },
  { label: 'System Settings', href: '/admin/settings', icon: Settings },
];
