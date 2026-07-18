import { Archive, BarChart3, Bell, BookOpen, Bus, CalendarClock, CalendarPlus, CreditCard, Flag, HeartPulse, LayoutDashboard, ListChecks, MapPinned, Package, Receipt, ShieldCheck, Settings, Tag, Ticket, TrendingUp, Users, Armchair, UserCog, UserPlus, UserRound } from 'lucide-react';
import type { MenuItem } from './types';

// Bottom mobile nav uses the first 4 items — keep the most-used owner actions there.
// Owner = super admin: every admin menu is mirrored here, plus owner-only tools.
export const ownerMenu: MenuItem[] = [
  { label: 'Dashboard', href: '/owner', icon: LayoutDashboard },
  { label: 'Revenue', href: '/owner/revenue', icon: Receipt },
  { label: 'Analytics', href: '/owner/analytics', icon: TrendingUp },
  { label: 'Reports', href: '/owner/reports', icon: BarChart3 },
  // ----- Admin parity -----
  { label: 'Booking Management', href: '/owner/bookings', icon: BookOpen },
  { label: 'Payment Monitoring', href: '/owner/payments', icon: CreditCard },
  { label: 'Customer Management', href: '/owner/customers', icon: UserRound },
  { label: 'Vehicle Management', href: '/owner/vehicles', icon: Bus },
  { label: 'Trip & Route Scheduling', href: '/owner/operations', icon: CalendarClock },
  { label: 'Ticket Monitoring', href: '/owner/tickets', icon: Ticket },
  { label: 'Kelola Rute', href: '/owner/manage/routes', icon: MapPinned },
  { label: 'Kelola Jadwal & Harga', href: '/owner/manage/schedules', icon: CalendarPlus },
  { label: 'Aturan Harga', href: '/owner/manage/pricing', icon: Tag },
  { label: 'Kelola Armada', href: '/owner/manage/fleet', icon: Bus },
  { label: 'Denah Kursi', href: '/owner/manage/seat-builder', icon: Armchair },
  { label: 'Kelola Admin', href: '/owner/manage/admins', icon: UserCog },
  { label: 'Kelola Driver', href: '/owner/manage/drivers-staff', icon: UserPlus },
  { label: 'Jastip / Paket', href: '/owner/manage/jastip', icon: Package },
  { label: 'Pengaturan CS & Sosmed', href: '/owner/settings-cs', icon: Settings },
  { label: 'Notification Center', href: '/owner/notifications', icon: Bell },
  { label: 'System Settings', href: '/owner/settings', icon: Settings },
  // ----- Owner-only -----
  { label: 'Fleet Performance', href: '/owner/fleet', icon: Bus },
  { label: 'Driver Performance', href: '/owner/drivers', icon: Users },
  { label: 'Feature Flags', href: '/owner/feature-flags', icon: Flag },
  { label: 'Map Provider', href: '/owner/map-settings', icon: MapPinned },
  { label: 'System Health', href: '/owner/health', icon: HeartPulse },
  { label: 'Backup & Restore', href: '/owner/backup', icon: Archive },
  { label: 'Production Readiness', href: '/owner/production-readiness', icon: ShieldCheck },
  { label: 'Audit Logs', href: '/owner/logs', icon: ListChecks },
];
