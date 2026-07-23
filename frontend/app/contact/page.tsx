import type { Metadata } from 'next';
import { ContactDetails } from '@/features/legal/contact-details';
import { LegalPageShell } from '@/features/legal/legal-page-shell';
import { buildLegalMetadata } from '@/features/legal/legal-seo';
import { fetchCompanyProfile, fetchLegalDocument } from '@/services/legal';

const SLUG = 'contact' as const;

export async function generateMetadata(): Promise<Metadata> {
  const doc = await fetchLegalDocument(SLUG);
  return buildLegalMetadata(SLUG, doc);
}

export default async function ContactPage() {
  // Both reads are cached and revalidated by Next, so this stays a single
  // fast render even though it draws from two endpoints.
  const [doc, profile] = await Promise.all([fetchLegalDocument(SLUG), fetchCompanyProfile()]);

  return (
    <LegalPageShell slug={SLUG} doc={doc}>
      <ContactDetails profile={profile} />
    </LegalPageShell>
  );
}
