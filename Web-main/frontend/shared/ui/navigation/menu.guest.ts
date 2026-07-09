import { Home, Info, LogIn, MapPinned, Phone, Search, UserPlus } from 'lucide-react';
import type { MenuItem } from './types';

export const guestMenu: MenuItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Search', href: '/booking', icon: Search },
  { label: 'Track Booking', href: '/customer/tracking', icon: MapPinned },
  { label: 'About', href: '/#solutions', icon: Info },
  { label: 'Contact', href: '/#faq', icon: Phone },
  { label: 'Login', href: '/login', icon: LogIn },
  { label: 'Register', href: '/register', icon: UserPlus },
];
