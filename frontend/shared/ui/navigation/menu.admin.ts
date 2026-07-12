import { BarChart3, Bell, BookOpen, Bus, CalendarClock, CalendarPlus, CreditCard, LayoutDashboard, MapPinned, Package, Settings, Tag, Ticket, Users, Armchair, UserRound } from 'lucide-react';
import type { MenuItem } from './types';

// Bottom mobile nav uses the first 4 items — keep the most-used admin actions there.
export const adminMenu: MenuItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Booking Management', href: '/admin/bookings', icon: BookOpen },
  { label: 'Payment Monitoring', href: '/admin/payments', icon: CreditCard },
  { label: 'Reports & Logs', href: '/admin/reports', icon: BarChart3 },
  { label: 'Kelola Rute', href: '/admin/manage/routes', icon: MapPinned },
  { label: 'Kelola Jadwal & Harga', href: '/admin/manage/schedules', icon: CalendarPlus },
  { label: 'Aturan Harga', href: '/admin/manage/pricing', icon: Tag },
  { label: 'Kelola Armada', href: '/admin/manage/fleet', icon: Bus },
  { label: 'Denah Kursi', href: '/admin/manage/seat-builder', icon: Armchair },
  { label: 'Kursi Kendaraan', href: '/admin/manage/seats', icon: Armchair },
  { label: 'Kelola Driver', href: '/admin/manage/drivers-staff', icon: UserRound },
  { label: 'Jastip / Paket', href: '/admin/manage/jastip', icon: Package },
  { label: 'Pengaturan CS & Sosmed', href: '/admin/settings-cs', icon: Settings },
  { label: 'Customer Management', href: '/admin/customers', icon: UserRound },
  { label: 'Driver Management', href: '/admin/drivers', icon: Users },
  { label: 'Vehicle Management', href: '/admin/vehicles', icon: Bus },
  { label: 'Trip & Route Scheduling', href: '/admin/operations', icon: CalendarClock },
  { label: 'Ticket Monitoring', href: '/admin/tickets', icon: Ticket },
  { label: 'Notification Center', href: '/admin/notifications', icon: Bell },
  { label: 'System Settings', href: '/admin/settings', icon: Settings },
];
