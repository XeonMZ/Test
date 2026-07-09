import type { Metadata, Viewport } from 'next';
import { AppProviders } from '@/lib/query-client';
import { AppShell } from '@/shared/ui/layout/app-shell';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'SJT Travel Management System',
  description: 'Premium booking, fleet, driver, and travel operations platform for SJT.',
  applicationName: 'STMS',
  manifest: '/manifest.json',
  keywords: ['travel management', 'booking', 'fleet', 'SJT'],
};

export const viewport: Viewport = {
  themeColor: '#2563EB',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AppProviders><AppShell>{children}</AppShell></AppProviders>
      </body>
    </html>
  );
}
