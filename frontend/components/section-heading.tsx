import { ChevronMark } from '@/shared/ui/design/chevron';

/**
 * Centered section header — DESIGN.md § Typography.
 * Blue eyebrow (with chevron mark) → display-500 headline → lead paragraph.
 */
export function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-button text-primary">
        <ChevronMark />
        {eyebrow}
      </p>
      <h2 className="mt-4 font-display text-4xl font-medium tracking-tight text-ink sm:text-6xl dark:text-white">{title}</h2>
      <p className="mt-5 text-lg leading-relaxed text-charcoal dark:text-slate-300">{description}</p>
    </div>
  );
}
