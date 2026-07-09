import { BadgePercent, Bell, BookOpen, CreditCard, History, LayoutDashboard, MapPinned, Star, Ticket, UserCircle } from 'lucide-react';
import type { MenuItem } from './types';

// Bottom mobile nav uses the first 4 items — keep the most-used customer actions there.
export const customerMenu: MenuItem[] = [
  { label: 'Dashboard', href: '/customer', icon: LayoutDashboard },
  { label: 'Booking', href: '/customer/bookings', icon: BookOpen },
  { label: 'Tickets', href: '/customer/tickets', icon: Ticket },
  { label: 'Profile', href: '/customer/profile', icon: UserCircle },
  { label: 'Trip History', href: '/customer/trip-history', icon: History },
  { label: 'Track My Ride', href: '/customer/tracking', icon: MapPinned },
  { label: 'Payments', href: '/customer/payment', icon: CreditCard },
  { label: 'Membership', href: '/customer/membership', icon: Star },
  { label: 'Promo', href: '/customer/promo', icon: BadgePercent },
  { label: 'Notifications', href: '/customer/notifications', icon: Bell },
];
