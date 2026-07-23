import type { ReactNode } from 'react';
import Link from 'next/link';
import { CalendarClock } from 'lucide-react';
import { formatLegalDate } from '@/services/legal';
import { LEGAL_NAV, LEGAL_PAGES, type LegalDocument, type LegalSlug } from './legal-config';
import { LegalProse } from './legal-prose';
import { buildLegalJsonLd, serializeJsonLd } from './legal-seo';
import { Chevrons, ChevronMark } from '@/shared/ui/design/chevron';

/**
 * Shared shell for every legal page: hero, page title, "Terakhir diperbarui",
 * readable body copy, and cross-links to the other legal documents.
 *
 * Server component — the content is fetched and rendered on the server, so
 * there is no client-side state, no hydration mismatch, and nothing to leak.
 */
export function LegalPageShell({
  slug,
  doc,
  children,
}: {
  slug: LegalSlug;
  doc: LegalDocument;
  /** Optional extra content rendered above the document body (Contact page). */
  children?: ReactNode;
}) {
  const config = LEGAL_PAGES[slug];
  const title = doc.title?.trim() || config.title;
  const updatedAt = formatLegalDate(doc.updated_at);
  const others = LEGAL_NAV.filter((item) => item.href !== `/${slug}`);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildLegalJsonLd(slug, doc)) }} />

      <article className="mx-auto w-full max-w-4xl pb-8">
        {/* Hero — chevron eyebrow, ink headline (DESIGN.md) */}
        <header className="relative overflow-hidden rounded-2xl bg-canvas p-6 shadow-soft sm:p-10 dark:bg-ink">
          <Chevrons side="left" className="absolute right-6 top-0 hidden h-20 opacity-90 sm:flex" />
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-button text-primary">
            <ChevronMark /> Informasi Legal
          </p>
          <h1 className="mt-4 font-display text-4xl font-medium leading-none tracking-tight text-ink sm:text-6xl dark:text-white">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-charcoal sm:text-lg dark:text-slate-300">{config.tagline}</p>

          {updatedAt ? (
            <p className="mt-6 inline-flex items-center gap-2 rounded-lg bg-cloud px-4 py-2 text-sm font-medium text-charcoal dark:bg-ink-soft dark:text-slate-300">
              <CalendarClock size={16} aria-hidden="true" className="text-primary" />
              Terakhir diperbarui:{' '}
              <time dateTime={doc.updated_at} className="font-semibold text-ink dark:text-white">
                {updatedAt}
              </time>
            </p>
          ) : null}
        </header>

        {/* Body */}
        <section className="mt-6 rounded-2xl bg-canvas p-6 shadow-soft sm:p-10 dark:bg-ink">
          {children}
          <LegalProse body={doc.body} />
        </section>

        {/* Cross-links */}
        <nav aria-label="Dokumen legal lainnya" className="mt-6 rounded-2xl bg-canvas p-6 shadow-soft sm:p-8 dark:bg-ink">
          <h2 className="font-display text-lg font-medium tracking-tight text-ink dark:text-white">Dokumen legal lainnya</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {others.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-lg border border-steel px-4 text-sm font-medium text-charcoal transition hover:border-primary hover:text-primary dark:border-ink-soft dark:text-slate-300"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </article>
    </>
  );
}
