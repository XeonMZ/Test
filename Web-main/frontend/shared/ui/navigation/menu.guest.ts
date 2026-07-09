import { Home, Info, LogIn, MapPinned, Phone, Search, UserPlus } from 'lucide-react';
import type { MenuItem } from './types';

// Bottom mobile nav uses the first 4 items — keep the most-used guest actions there.
export const guestMenu: MenuItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Search', href: '/booking', icon: Search },
  { label: 'Track Booking', href: '/customer/tracking', icon: MapPinned },
  { label: 'Login', href: '/login', icon: LogIn },
  { label: 'Register', href: '/register', icon: UserPlus },
  { label: 'About', href: '/#solutions', icon: Info },
  { label: 'Contact', href: '/#faq', icon: Phone },
];
