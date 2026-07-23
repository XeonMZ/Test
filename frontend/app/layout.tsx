import type { Metadata, Viewport } from 'next';
import { AppProviders } from '@/lib/query-client';
import { AppShell } from '@/shared/ui/layout/app-shell';
import { fetchCompanyProfile } from '@/services/company';
import '@/styles/globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
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
  themeColor: '#024ad8',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Organisation structured data follows the editable company profile, so
  // renaming the company or changing its service areas updates SEO too.
  const profile = await fetchCompanyProfile();
  const [city, region] = profile.location.split(',').map((part) => part.trim());

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    name: profile.name,
    legalName: profile.legal_name,
    description: profile.intro || siteDescription,
    url: siteUrl,
    image: `${siteUrl}/sjt-logo.png`,
    address: { '@type': 'PostalAddress', addressLocality: city || 'Sumenep', addressRegion: region || 'Jawa Timur', addressCountry: 'ID' },
    areaServed: profile.areas.map((c) => ({ '@type': 'City', name: c })),
    makesOffer: profile.services.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.title } })),
    priceRange: 'Rp',
  };

  // Runtime API URL. NEXT_PUBLIC_* is inlined at build time, so changing it on
  // the host does nothing without a rebuild — a common cause of "Network Error"
  // in production. Injecting the value here makes it configurable with a plain
  // restart: set API_URL on the frontend service.
  const runtimeApiUrl = process.env.API_URL?.trim() || '';
  const runtimeConfig = `window.__STMS_API_URL__=${JSON.stringify(runtimeApiUrl)};`;

  return (
    <html lang="id">
      <head>
        <script dangerouslySetInnerHTML={{ __html: runtimeConfig }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      </head>
      <body className="font-sans antialiased">
        <AppProviders><AppShell>{children}</AppShell></AppProviders>
      </body>
    </html>
  );
}
