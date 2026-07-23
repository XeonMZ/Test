import type { Metadata } from 'next';
import { LegalPageShell } from '@/features/legal/legal-page-shell';
import { buildLegalMetadata } from '@/features/legal/legal-seo';
import { fetchLegalDocument } from '@/services/legal';

const SLUG = 'refund-policy' as const;

/** Metadata is derived from the live CMS document so edits update SEO too. */
export async function generateMetadata(): Promise<Metadata> {
  const doc = await fetchLegalDocument(SLUG);
  return buildLegalMetadata(SLUG, doc);
}

export default async function RefundPolicyPage() {
  const doc = await fetchLegalDocument(SLUG);
  return <LegalPageShell slug={SLUG} doc={doc} />;
}
