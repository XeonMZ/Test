import type { Metadata } from 'next';
import { LEGAL_PAGES, type LegalDocument, type LegalSlug } from './legal-config';

/**
 * SEO for the legal pages. Every page gets its own title, description,
 * canonical URL, Open Graph, Twitter card, robots directives, and a
 * Schema.org WebPage node — no values are shared between pages.
 */

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
const SITE_NAME = 'SJT Travel & Tour — Sekawan Jaya Trans';
const OG_IMAGE = '/sjt-logo.png';

export function legalCanonical(slug: LegalSlug): string {
  return `${SITE_URL}/${slug}`;
}

export function buildLegalMetadata(slug: LegalSlug, doc?: LegalDocument): Metadata {
  const config = LEGAL_PAGES[slug];
  const title = doc?.title?.trim() || config.metaTitle;
  const description = doc?.meta_description?.trim() || config.metaDescription;
  const url = legalCanonical(slug);

  return {
    title,
    description,
    keywords: config.keywords,
    alternates: { canonical: url },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    openGraph: {
      type: 'article',
      locale: 'id_ID',
      url,
      siteName: SITE_NAME,
      title: `${title} | SJT Travel & Tour`,
      description,
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: `${title} — SJT Travel & Tour` }],
      ...(doc?.updated_at ? { modifiedTime: doc.updated_at } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | SJT Travel & Tour`,
      description,
      images: [OG_IMAGE],
    },
  };
}

/**
 * Serialize structured data for a <script type="application/ld+json"> tag.
 *
 * Escapes `<`, so CMS-authored text containing `</script>` (or any other
 * markup) can never break out of the JSON island and become executable.
 */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/**
 * WebPage + BreadcrumbList structured data. The breadcrumb node mirrors the
 * visible breadcrumb rendered by the app shell.
 */
export function buildLegalJsonLd(slug: LegalSlug, doc?: LegalDocument): Record<string, unknown> {
  const config = LEGAL_PAGES[slug];
  const title = doc?.title?.trim() || config.metaTitle;
  const description = doc?.meta_description?.trim() || config.metaDescription;
  const url = legalCanonical(slug);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': url,
        url,
        name: title,
        description,
        inLanguage: 'id-ID',
        isPartOf: { '@type': 'WebSite', url: SITE_URL, name: SITE_NAME },
        publisher: {
          '@type': 'Organization',
          name: 'SJT Tour & Travel',
          legalName: 'PT. Sekawan Jaya Trans',
          url: SITE_URL,
          logo: `${SITE_URL}${OG_IMAGE}`,
        },
        ...(doc?.updated_at ? { dateModified: doc.updated_at } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Beranda', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: config.navLabel, item: url },
        ],
      },
    ],
  };
}
