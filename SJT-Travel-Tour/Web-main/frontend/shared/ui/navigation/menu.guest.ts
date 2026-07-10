import { CalendarSearch, Home, Info, LogIn, Phone, UserPlus } from 'lucide-react';
import type { MenuItem } from './types';

export const guestMenu: MenuItem[] = [
  { label: 'Beranda', href: '/', icon: Home },
  { label: 'Jadwal Tersedia', href: '/jadwal', icon: CalendarSearch },
  { label: 'Masuk', href: '/login', icon: LogIn },
  { label: 'Daftar', href: '/register', icon: UserPlus },
  { label: 'Tentang', href: '/#solutions', icon: Info },
  { label: 'Kontak', href: '/#faq', icon: Phone },
];
