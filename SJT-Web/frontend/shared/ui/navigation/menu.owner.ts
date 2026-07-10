import { Archive, BarChart3, Bell, Bus, CalendarPlus, Flag, HeartPulse, LayoutDashboard, ListChecks, MapPinned, Receipt, ShieldCheck, Settings, Tag, TrendingUp, Users, Armchair } from 'lucide-react';
import type { MenuItem } from './types';

// Bottom mobile nav uses the first 4 items — keep the most-used owner actions there.
export const ownerMenu: MenuItem[] = [
  { label: 'Dashboard', href: '/owner', icon: LayoutDashboard },
  { label: 'Revenue', href: '/owner/revenue', icon: Receipt },
  { label: 'Analytics', href: '/owner/analytics', icon: TrendingUp },
  { label: 'Reports', href: '/owner/reports', icon: BarChart3 },
  { label: 'Kelola Rute', href: '/owner/manage/routes', icon: MapPinned },
  { label: 'Kelola Jadwal & Harga', href: '/owner/manage/schedules', icon: CalendarPlus },
  { label: 'Aturan Harga', href: '/owner/manage/pricing', icon: Tag },
  { label: 'Kursi Kendaraan', href: '/owner/manage/seats', icon: Armchair },
  { label: 'Fleet Performance', href: '/owner/fleet', icon: Bus },
  { label: 'Driver Performance', href: '/owner/drivers', icon: Users },
  { label: 'Notification Center', href: '/owner/notifications', icon: Bell },
  { label: 'Feature Flags', href: '/owner/feature-flags', icon: Flag },
  { label: 'System Health', href: '/owner/health', icon: HeartPulse },
  { label: 'Backup & Restore', href: '/owner/backup', icon: Archive },
  { label: 'Production Readiness', href: '/owner/production-readiness', icon: ShieldCheck },
  { label: 'Settings', href: '/owner/settings', icon: Settings },
  { label: 'Audit Logs', href: '/owner/logs', icon: ListChecks },
];
