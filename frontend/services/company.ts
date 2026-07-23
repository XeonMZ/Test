import { resolveApiBaseUrl } from '@/services/api-config';
import { DEFAULT_COMPANY_PROFILE, type CompanyProfile, type ProfileItem } from '@/features/company/company-profile';

/**
 * Company profile loader for React Server Components.
 *
 * Reads the editable profile from the API and merges it over the bundled
 * default, field by field. A missing or malformed field falls back rather
 * than blanking the page, so a partial edit in the CMS can never break the
 * landing or About page.
 */

// Server-side: prefer the runtime API_URL so the value can change without a
// rebuild (see services/api-config.ts).
const API_BASE = resolveApiBaseUrl().replace(/\/$/, '');
const REVALIDATE_SECONDS = 300;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(source: Record<string, unknown>, key: keyof CompanyProfile, fallback: string): string {
  const value = source[key as string];
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback;
}

function strList(source: Record<string, unknown>, key: keyof CompanyProfile, fallback: string[]): string[] {
  const value = source[key as string];
  if (!Array.isArray(value)) return fallback;
  const cleaned = value.filter((v): v is string => typeof v === 'string' && v.trim() !== '').map((v) => v.trim());
  return cleaned.length > 0 ? cleaned : fallback;
}

function itemList(source: Record<string, unknown>, key: keyof CompanyProfile, fallback: ProfileItem[]): ProfileItem[] {
  const value = source[key as string];
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .filter(isRecord)
    .map((raw) => ({
      icon: typeof raw.icon === 'string' ? raw.icon : undefined,
      title: typeof raw.title === 'string' ? raw.title.trim() : '',
      body: typeof raw.body === 'string' ? raw.body.trim() : '',
    }))
    .filter((item) => item.title !== '');
  return cleaned.length > 0 ? cleaned : fallback;
}

/** Never throws — any failure degrades to the seeded default profile. */
export async function fetchCompanyProfile(): Promise<CompanyProfile> {
  const d = DEFAULT_COMPANY_PROFILE;

  try {
    const res = await fetch(`${API_BASE}/catalog/site-content/company-profile`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: REVALIDATE_SECONDS, tags: ['company-profile'] },
    });
    if (!res.ok) return d;

    const json: unknown = await res.json();
    const data = isRecord(json) ? json.data : null;
    const p = isRecord(data) && isRecord(data.payload) ? data.payload : null;
    if (!p) return d;

    return {
      name: str(p, 'name', d.name),
      legal_name: str(p, 'legal_name', d.legal_name),
      location: str(p, 'location', d.location),
      tagline: str(p, 'tagline', d.tagline),
      intro: str(p, 'intro', d.intro),
      story: strList(p, 'story', d.story),
      vision: str(p, 'vision', d.vision),
      mission: strList(p, 'mission', d.mission),
      services: itemList(p, 'services', d.services),
      reasons_intro: str(p, 'reasons_intro', d.reasons_intro),
      reasons: itemList(p, 'reasons', d.reasons),
      areas_intro: str(p, 'areas_intro', d.areas_intro),
      areas: strList(p, 'areas', d.areas),
      commitment: str(p, 'commitment', d.commitment),
      closing: str(p, 'closing', d.closing),
    };
  } catch {
    return d;
  }
}
