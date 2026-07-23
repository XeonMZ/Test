import { resolveApiBaseUrl } from '@/services/api-config';
import { LEGAL_PAGES, type LegalDocument, type LegalSlug } from '@/features/legal/legal-config';

/**
 * Legal content loader for React Server Components.
 *
 * Uses native fetch (not the axios client, which is browser/auth oriented) so
 * Next can cache and revalidate the response. `revalidate: 300` means an edit
 * published from the CMS dashboard reaches visitors within five minutes with
 * no redeploy, while crawlers still get fully server-rendered text.
 */

// Server-side: prefer the runtime API_URL so the value can change without a
// rebuild (see services/api-config.ts).
const API_BASE = resolveApiBaseUrl().replace(/\/$/, '');

const REVALIDATE_SECONDS = 300;

function fallbackDocument(slug: LegalSlug): LegalDocument {
  const config = LEGAL_PAGES[slug];
  return {
    slug,
    title: config.title,
    meta_description: config.metaDescription,
    body: config.fallbackBody,
    // Static content has no authoritative edit date; the UI hides the label
    // rather than inventing one (see LegalPageShell).
    updated_at: '',
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Fetch one legal document. Never throws: any network/API failure degrades to
 * the bundled copy so the route always renders.
 */
export async function fetchLegalDocument(slug: LegalSlug): Promise<LegalDocument> {
  try {
    const res = await fetch(`${API_BASE}/catalog/legal/${slug}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: REVALIDATE_SECONDS, tags: ['legal', `legal:${slug}`] },
    });

    if (!res.ok) return fallbackDocument(slug);

    const json: unknown = await res.json();
    const data = isRecord(json) ? json.data : null;
    if (!isRecord(data) || typeof data.body !== 'string' || data.body.trim() === '') {
      return fallbackDocument(slug);
    }

    return {
      slug,
      title: typeof data.title === 'string' && data.title.trim() !== '' ? data.title : LEGAL_PAGES[slug].title,
      meta_description: typeof data.meta_description === 'string' ? data.meta_description : LEGAL_PAGES[slug].metaDescription,
      body: data.body,
      updated_at: typeof data.updated_at === 'string' ? data.updated_at : '',
    };
  } catch {
    return fallbackDocument(slug);
  }
}

/** Company profile for the Contact page — reuses the existing public settings endpoint. */
export type PublicCompanyProfile = {
  company_name: string | null;
  company_address: string | null;
  company_email: string | null;
  company_phone: string | null;
  company_hours: string | null;
  company_maps_embed: string | null;
  whatsapp_number: string | null;
  cs_whatsapp: string | null;
};

const EMPTY_PROFILE: PublicCompanyProfile = {
  company_name: null,
  company_address: null,
  company_email: null,
  company_phone: null,
  company_hours: null,
  company_maps_embed: null,
  whatsapp_number: null,
  cs_whatsapp: null,
};

function readString(source: Record<string, unknown>, key: string): string | null {
  const value = source[key];
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

export async function fetchCompanyProfile(): Promise<PublicCompanyProfile> {
  try {
    const res = await fetch(`${API_BASE}/catalog/settings`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: REVALIDATE_SECONDS, tags: ['public-settings'] },
    });
    if (!res.ok) return EMPTY_PROFILE;

    const json: unknown = await res.json();
    const data = isRecord(json) ? json.data : null;
    if (!isRecord(data)) return EMPTY_PROFILE;

    return {
      company_name: readString(data, 'company_name'),
      company_address: readString(data, 'company_address'),
      company_email: readString(data, 'company_email'),
      company_phone: readString(data, 'company_phone'),
      company_hours: readString(data, 'company_hours'),
      company_maps_embed: readString(data, 'company_maps_embed'),
      whatsapp_number: readString(data, 'whatsapp_number'),
      cs_whatsapp: readString(data, 'cs_whatsapp'),
    };
  } catch {
    return EMPTY_PROFILE;
  }
}

/** "20 Juli 2026" — returns null when the CMS has no authoritative date. */
export function formatLegalDate(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}
