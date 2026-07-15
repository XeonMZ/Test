'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, ChevronDown, LogOut, Menu, Moon, Radio, Sun, User as UserIcon, UserCircle, X } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useConnection } from '@/shared/hooks/use-connection';
import { useAuth } from '@/shared/providers/auth-provider';
import { fetchNotifications } from '@/services/portal';
import { NotificationBadge } from '@/features/notification-center';
import { getMenuForRole, getRoleFromPath } from '../navigation';
import type { AppRole } from '../navigation/types';
import { AppCard, FloatingButton, ReconnectState } from '../components';
import { SiteFooter } from './site-footer';
import { useTheme } from '../theme/theme-provider';

export function GuestLayout({ children }: { children: ReactNode }) { return <AppShell forcedRole="guest">{children}</AppShell>; }
export function CustomerLayout({ children }: { children: ReactNode }) { return <AppShell forcedRole="customer">{children}</AppShell>; }
export function DriverLayout({ children }: { children: ReactNode }) { return <AppShell forcedRole="driver">{children}</AppShell>; }
export function AdminLayout({ children }: { children: ReactNode }) { return <AppShell forcedRole="admin">{children}</AppShell>; }
export function OwnerLayout({ children }: { children: ReactNode }) { return <AppShell forcedRole="owner">{children}</AppShell>; }

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/install', '/forbidden', '/unauthorized', '/jadwal'];
const roleHome: Record<AppRole, string> = { guest: '/', customer: '/customer', driver: '/driver', admin: '/admin', owner: '/owner' };
// Primary "quick action" the floating (+) button jumps to for each role.
const roleQuickAction: Record<AppRole, { href: string; label: string }> = {
  guest: { href: '/jadwal', label: 'Lihat jadwal' },
  customer: { href: '/customer/bookings', label: 'New booking' },
  driver: { href: '/driver/check-in', label: 'Check-in passenger' },
  admin: { href: '/admin/bookings', label: 'New booking' },
  owner: { href: '/owner/notifications', label: 'New broadcast' },
};

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/payment') || pathname.startsWith('/ticket/qr');
}

export function AppShell({ children, forcedRole }: { children: ReactNode; forcedRole?: AppRole }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, status, isAuthenticated, logout } = useAuth();
  // Role priority: explicit layout role → signed-in user's real role → path guess.
  // Fixes the bug where a logged-in user on "/" was treated as guest. Owner is a
  // super-role that may browse any area.
  const role: AppRole = forcedRole ?? (isAuthenticated && user ? (user.role as AppRole) : getRoleFromPath(pathname));
  const menu = getMenuForRole(role);
  const { online, realtimeConnected, realtimeEnabled } = useConnection();
  const { setTheme, resolvedTheme } = useTheme();
  const [panelOpen, setPanelOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const crumbs = useMemo(() => pathname.split('/').filter(Boolean), [pathname]);
  const isGuestHome = role === 'guest' && pathname === '/';
  const needsAuth = !isPublicPath(pathname);

  useEffect(() => {
    if (status === 'loading') return;
    if (needsAuth && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (isAuthenticated && user && needsAuth && user.role !== 'owner' && role !== 'guest' && user.role !== role) {
      router.replace(roleHome[user.role] ?? '/');
    }
  }, [status, isAuthenticated, needsAuth, pathname, role, router, user]);

  // Close the desktop/tablet nav drawer automatically whenever the route changes.
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  // Close the nav drawer with Escape for keyboard users.
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setSidebarOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);

  if (needsAuth && (status === 'loading' || !isAuthenticated)) {
    return <div className="grid min-h-screen place-items-center bg-secondary text-sm font-bold text-slate-500 dark:bg-slate-950 dark:text-slate-400">Memuat...</div>;
  }

  return (
    <div className="min-h-screen bg-secondary text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      {!online ? <div className="fixed inset-x-0 top-0 z-[60] bg-danger px-4 py-2 text-center text-sm font-bold text-white">Offline mode active. Changes may be delayed.</div> : null}
      {realtimeEnabled && !realtimeConnected ? <div className="fixed inset-x-0 top-0 z-[55] px-4 pt-3"><div className="mx-auto max-w-4xl"><ReconnectState /></div></div> : null}

      {/* Navigation drawer — opened via the hamburger on BOTH mobile and desktop. */}
      {sidebarOpen ? <button aria-label="Close menu overlay" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm" /> : null}
      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] -translate-x-full flex-col border-r border-slate-200 bg-white p-4 shadow-2xl transition-transform duration-200 ease-out dark:border-slate-800 dark:bg-slate-950 ${sidebarOpen ? 'translate-x-0' : ''}`}
      >
        <div className="flex items-center justify-between">
          <Logo />
          <button onClick={() => setSidebarOpen(false)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900" aria-label="Close menu"><X size={18} /></button>
        </div>
        <nav className="mt-8 space-y-1 overflow-y-auto" aria-label={`${role} navigation`}>{menu.map((item) => <NavItem key={item.href} item={item} active={pathname === item.href} onNavigate={() => setSidebarOpen(false)} />)}</nav>
      </aside>

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="inline-flex rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            aria-controls="app-sidebar"
            aria-expanded={sidebarOpen}
          >
            <Menu />
          </button>
          <Logo compact />
          <div className="flex-1" />
          <span className="hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-bold md:inline-flex dark:bg-slate-800"><Radio size={14} className={realtimeConnected ? 'text-success' : 'text-warning'} /> {realtimeConnected ? 'Realtime' : 'Connecting'}</span>
          <span className="hidden rounded-full bg-slate-100 px-3 py-2 text-xs font-bold md:inline-flex dark:bg-slate-800">{online ? 'Online' : 'Offline'}</span>
          <button onClick={() => setPanelOpen((v) => !v)} className="relative rounded-xl p-2" aria-label="Notifications"><Bell /></button>
          <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900" aria-label={resolvedTheme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'} title={resolvedTheme === 'dark' ? 'Mode terang' : 'Mode gelap'}>{resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
          <div className="relative">
            <button onClick={() => setAccountOpen((v) => !v)} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-bold dark:border-slate-800" aria-haspopup="menu" aria-expanded={accountOpen}>
              <UserCircle size={20} /> <span className="hidden max-w-[10rem] truncate sm:inline">{user ? user.name : role}</span><ChevronDown size={14} />
            </button>
            {accountOpen ? (
              <div role="menu" className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                {user ? <div className="px-3 py-2"><p className="truncate text-sm font-bold text-slate-900 dark:text-white">{user.name}</p><p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p></div> : null}
                <Link href={`/${role === 'guest' ? 'customer' : role}/profile`} onClick={() => setAccountOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"><UserIcon size={16} /> Profile</Link>
                {isAuthenticated ? (
                  <button onClick={() => logout()} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"><LogOut size={16} /> Logout</button>
                ) : (
                  <Link href="/login" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10"><LogOut size={16} /> Login</Link>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div>
        <div className="mx-auto max-w-7xl px-4 py-4">
          {!isGuestHome ? <Breadcrumb crumbs={crumbs} /> : null}
          <main className={isGuestHome ? '' : 'py-4'}>{children}</main>
        </div>
      </div>

      <NotificationPanel open={panelOpen} role={role} />
      <FloatingButton aria-label={roleQuickAction[role].label} title={roleQuickAction[role].label} onClick={() => router.push(roleQuickAction[role].href)} />
      <SiteFooter />
      <div id="loading-overlay" className="pointer-events-none fixed inset-0 z-[70] hidden place-items-center bg-white/60 backdrop-blur">Loading...</div>
    </div>
  );
}

function Logo({ compact }: { compact?: boolean }) { return <Link href="/" className="flex items-center gap-2"><Image src="/sjt-logo.png" alt="SJT Travel & Tour" width={compact ? 44 : 132} height={compact ? 30 : 88} className={compact ? 'h-8 w-auto' : 'h-14 w-auto'} priority /><span className="sr-only">SJT Travel & Tour</span></Link>; }
function NavItem({ item, active, onNavigate }: { item: ReturnType<typeof getMenuForRole>[number]; active: boolean; onNavigate?: () => void }) { return <Link href={item.href} onClick={onNavigate} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold ${active ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'}`}><item.icon size={18} />{item.label}</Link>; }
function Breadcrumb({ crumbs }: { crumbs: string[] }) { return <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500"><Link href="/">Home</Link>{crumbs.map((crumb, index) => <span key={crumb} className="flex items-center gap-2"><span>/</span><span className="capitalize text-slate-700 dark:text-slate-200">{crumb.replaceAll('-', ' ')}</span></span>)}</div>; }
function NotificationPanel({ open, role }: { open: boolean; role: AppRole }) {
  const { isAuthenticated } = useAuth();
  const href = role === 'guest' ? '/customer/notifications' : `/${role}/notifications`;
  const query = useQuery({ queryKey: ['user-notifications'], queryFn: fetchNotifications, enabled: open && isAuthenticated, staleTime: 15_000 });
  const unread = query.data?.unread ?? 0;
  const latest = (query.data?.items ?? []).slice(0, 3);
  return open ? <div className="fixed right-4 top-20 z-50 w-[min(24rem,calc(100vw-2rem))]"><AppCard><div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">Notifications</h2><Link href={href} className="rounded-2xl bg-primary px-4 py-2 text-sm font-bold text-white">Open center</Link></div><div className="mt-4"><NotificationBadge unread={unread} /></div>{latest.length > 0 ? <ul className="mt-4 space-y-2">{latest.map((item) => <li key={item.uuid} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-900"><p className="font-bold text-slate-800 dark:text-slate-100">{item.title}</p><p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{item.body}</p></li>)}</ul> : <p className="mt-6 text-sm text-slate-500">{isAuthenticated ? 'Belum ada notifikasi.' : 'Masuk untuk melihat notifikasi kamu.'}</p>}</AppCard></div> : null;
}
