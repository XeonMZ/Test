import type { Metadata, Viewport } from 'next';
import { AppProviders } from '@/lib/query-client';
import { AppShell } from '@/shared/ui/layout/app-shell';
import '@/styles/globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sjt-travel.up.railway.app';
const siteName = 'SJT Travel & Tour — Sekawan Jaya Trans';
const siteDescription =
  'SJT Travel & Tour (Sekawan Jaya Trans): pesan tiket travel antar kota, lacak perjalanan real-time, dan jasa titip paket (jastip). Armada nyaman, driver profesional, harga transparan.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: '%s | SJT Travel & Tour',
  },
  description: siteDescription,
  applicationName: 'SJT Travel & Tour',
  manifest: '/manifest.json',
  keywords: [
    'travel', 'tiket travel', 'travel antar kota', 'sewa mobil', 'jasa titip', 'jastip',
    'Sekawan Jaya Trans', 'SJT', 'booking travel online', 'antar jemput', 'tour and travel',
  ],
  authors: [{ name: 'SJT Travel & Tour' }],
  creator: 'SJT Travel & Tour',
  publisher: 'Sekawan Jaya Trans',
  category: 'travel',
  alternates: { canonical: siteUrl },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: siteUrl,
    siteName,
    title: siteName,
    description: siteDescription,
    images: [{ url: '/sjt-logo.png', width: 1200, height: 630, alt: 'SJT Travel & Tour' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDescription,
    images: ['/sjt-logo.png'],
  },
  icons: { icon: '/sjt-logo.png', apple: '/sjt-logo.png' },
};

export const viewport: Viewport = {
  themeColor: '#2563EB',
  width: 'device-width',
  initialScale: 1,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TravelAgency',
  name: 'SJT Travel & Tour',
  legalName: 'Sekawan Jaya Trans',
  description: siteDescription,
  url: siteUrl,
  image: `${siteUrl}/sjt-logo.png`,
  areaServed: 'ID',
  priceRange: 'Rp',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="font-sans antialiased">
        <AppProviders><AppShell>{children}</AppShell></AppProviders>
      </body>
    </html>
  );
}
