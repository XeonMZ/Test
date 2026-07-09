'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, ChevronDown, LogOut, Menu, Moon, Radio, User as UserIcon, UserCircle, X } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useConnection } from '@/shared/hooks/use-connection';
import { useAuth } from '@/shared/providers/auth-provider';
import { NotificationBadge } from '@/features/notification-center';
import { getMenuForRole, getRoleFromPath } from '../navigation';
import type { AppRole } from '../navigation/types';
import { AppCard, FloatingButton, ReconnectState, SearchBar } from '../components';
import { useTheme } from '../theme/theme-provider';

export function GuestLayout({ children }: { children: ReactNode }) { return <AppShell forcedRole="guest">{children}</AppShell>; }
export function CustomerLayout({ children }: { children: ReactNode }) { return <AppShell forcedRole="customer">{children}</AppShell>; }
export function DriverLayout({ children }: { children: ReactNode }) { return <AppShell forcedRole="driver">{children}</AppShell>; }
export function AdminLayout({ children }: { children: ReactNode }) { return <AppShell forcedRole="admin">{children}</AppShell>; }
export function OwnerLayout({ children }: { children: ReactNode }) { return <AppShell forcedRole="owner">{children}</AppShell>; }

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password', '/install', '/forbidden', '/unauthorized'];
const roleHome: Record<AppRole, string> = { guest: '/', customer: '/customer', driver: '/driver', admin: '/admin', owner: '/owner' };
// Primary "quick action" the floating (+) button jumps to for each role.
const roleQuickAction: Record<AppRole, { href: string; label: string }> = {
  guest: { href: '/booking', label: 'Search a trip' },
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
  const role = forcedRole ?? getRoleFromPath(pathname);
  const menu = getMenuForRole(role);
  const { online, realtimeConnected, realtimeEnabled } = useConnection();
  const { theme, setTheme } = useTheme();
  const { user, status, isAuthenticated, logout } = useAuth();
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

      {/* Desktop/tablet navigation drawer — hidden entirely on mobile, opened only via the hamburger button. Mobile relies solely on the bottom tab bar. */}
      {sidebarOpen ? <button aria-label="Close menu overlay" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 hidden bg-slate-950/40 backdrop-blur-sm md:block" /> : null}
      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-50 hidden w-72 -translate-x-full border-r border-slate-200 bg-white p-4 shadow-2xl transition-transform duration-200 ease-out md:flex md:flex-col dark:border-slate-800 dark:bg-slate-950 ${sidebarOpen ? 'md:translate-x-0' : ''}`}
      >
        <div className="flex items-center justify-between">
          <Logo />
          <button onClick={() => setSidebarOpen(false)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900" aria-label="Close menu"><X size={18} /></button>
        </div>
        <nav className="mt-8 space-y-1 overflow-y-auto" aria-label={`${role} navigation`}>{menu.map((item) => <NavItem key={item.href} item={item} active={pathname === item.href} />)}</nav>
      </aside>

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="hidden rounded-xl p-2 text-slate-600 hover:bg-slate-100 md:inline-flex dark:text-slate-300 dark:hover:bg-slate-900"
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            aria-controls="app-sidebar"
            aria-expanded={sidebarOpen}
          >
            <Menu />
          </button>
          <Logo compact />
          <SearchBar className="hidden flex-1 md:flex" />
          <span className="hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-bold md:inline-flex dark:bg-slate-800"><Radio size={14} className={realtimeConnected ? 'text-success' : 'text-warning'} /> {realtimeConnected ? 'Realtime' : 'Connecting'}</span>
          <span className="hidden rounded-full bg-slate-100 px-3 py-2 text-xs font-bold md:inline-flex dark:bg-slate-800">{online ? 'Online' : 'Offline'}</span>
          <button onClick={() => setPanelOpen((v) => !v)} className="relative rounded-xl p-2" aria-label="Notifications"><Bell /></button>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-xl p-2" aria-label="Switch theme"><Moon /></button>
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
        <div className="mx-auto max-w-7xl px-4 py-4 pb-24 md:pb-4">
          {!isGuestHome ? <Breadcrumb crumbs={crumbs} /> : null}
          <main className={isGuestHome ? '' : 'py-4'}>{children}</main>
        </div>
      </div>

      <NotificationPanel open={panelOpen} role={role} />
      {/* Mobile-only bottom tab bar. No hamburger is shown below md — this bar is the entire mobile nav. */}
      <nav aria-label={`${role} mobile navigation`} className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-slate-200 bg-white p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden dark:border-slate-800 dark:bg-slate-950">{menu.slice(0, 4).map((item) => <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 rounded-xl py-1 text-[11px] font-bold ${pathname === item.href ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}><item.icon size={18} />{item.label}</Link>)}</nav>
      <FloatingButton aria-label={roleQuickAction[role].label} title={roleQuickAction[role].label} onClick={() => router.push(roleQuickAction[role].href)} />
      <footer className="border-t border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-800">© 2026 STMS UI Foundation</footer>
      <div id="loading-overlay" className="pointer-events-none fixed inset-0 z-[70] hidden place-items-center bg-white/60 backdrop-blur">Loading...</div>
    </div>
  );
}

function Logo({ compact }: { compact?: boolean }) { return <Link href="/" className="flex items-center gap-2 font-display text-lg font-extrabold"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-white">S</span>{compact ? null : <span>STMS</span>}</Link>; }
function NavItem({ item, active }: { item: ReturnType<typeof getMenuForRole>[number]; active: boolean }) { return <Link href={item.href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold ${active ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'}`}><item.icon size={18} />{item.label}</Link>; }
function Breadcrumb({ crumbs }: { crumbs: string[] }) { return <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500"><Link href="/">Home</Link>{crumbs.map((crumb, index) => <span key={crumb} className="flex items-center gap-2"><span>/</span><span className="capitalize text-slate-700 dark:text-slate-200">{crumb.replaceAll('-', ' ')}</span></span>)}</div>; }
function NotificationPanel({ open, role }: { open: boolean; role: AppRole }) { const href = role === 'guest' ? '/customer/notifications' : `/${role}/notifications`; return open ? <div className="fixed right-4 top-20 z-50 w-[min(24rem,calc(100vw-2rem))]"><AppCard><div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">Notifications</h2><Link href={href} className="rounded-2xl bg-primary px-4 py-2 text-sm font-bold text-white">Open center</Link></div><div className="mt-4"><NotificationBadge unread={0} /></div><p className="mt-6 text-sm text-slate-500">Use the shared notification center for inbox, filters, actions, settings, and realtime updates.</p></AppCard></div> : null; }
