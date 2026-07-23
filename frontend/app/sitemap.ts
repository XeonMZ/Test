import type { MetadataRoute } from 'next';
import { LEGAL_SLUGS } from '@/features/legal/legal-config';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: siteUrl, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/jadwal`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/tentang`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${siteUrl}/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    // Legal pages — indexable and linked from every page footer.
    ...LEGAL_SLUGS.map((slug) => ({
      url: `${siteUrl}/${slug}`,
      lastModified: now,
      changeFrequency: 'yearly' as const,
      priority: 0.4,
    })),
  ];
}
