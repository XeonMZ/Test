import { BadgePercent, Bell, BookOpen, CreditCard, LayoutDashboard, Star, Ticket, UserCircle } from 'lucide-react';
import type { MenuItem } from './types';

export const customerMenu: MenuItem[] = [
  { label: 'Dashboard', href: '/customer', icon: LayoutDashboard },
  { label: 'Booking', href: '/customer/bookings', icon: BookOpen },
  { label: 'Tickets', href: '/customer/tickets', icon: Ticket },
  { label: 'Payments', href: '/customer/payment', icon: CreditCard },
  { label: 'Membership', href: '/customer/membership', icon: Star },
  { label: 'Promo', href: '/customer/promo', icon: BadgePercent },
  { label: 'Notifications', href: '/customer/notifications', icon: Bell },
  { label: 'Profile', href: '/customer/profile', icon: UserCircle },
];
