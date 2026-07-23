import type { JSX } from 'react';

/**
 * Renders CMS-authored legal copy as React elements.
 *
 * Security: this parser never emits HTML — no `dangerouslySetInnerHTML`
 * anywhere — so markup inside stored content can only ever appear as literal
 * text. Combined with the server-side sanitizer in LegalController, editable
 * content is XSS-safe by construction rather than by escaping.
 *
 * Supported grammar (markdown-lite, matching what the CMS editor documents):
 *   `## Heading`      → <h2>
 *   `### Sub-heading` → <h3>
 *   `- item`          → <ul><li>
 *   `1. item`         → <ol><li>
 *   blank-line blocks → <p>
 */

type Block =
  | { kind: 'h2' | 'h3' | 'p'; text: string }
  | { kind: 'ul' | 'ol'; items: string[] };

function parse(body: string): Block[] {
  const blocks: Block[] = [];
  const lines = body.replace(/\r\n/g, '\n').split('\n');

  let paragraph: string[] = [];

  const flushParagraph = (): void => {
    if (paragraph.length > 0) {
      blocks.push({ kind: 'p', text: paragraph.join(' ').trim() });
      paragraph = [];
    }
  };

  /** Append to the previous list when it has the same kind, else start one. */
  const pushListItem = (kind: 'ul' | 'ol', item: string): void => {
    flushParagraph();
    const last = blocks[blocks.length - 1];
    if (last !== undefined && last.kind === kind) {
      last.items.push(item);
      return;
    }
    blocks.push({ kind, items: [item] });
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (line === '') {
      flushParagraph();
      continue;
    }

    const heading = /^(#{2,3})\s+(.*)$/.exec(line);
    if (heading !== null) {
      flushParagraph();
      blocks.push({ kind: heading[1].length === 2 ? 'h2' : 'h3', text: heading[2].trim() });
      continue;
    }

    const bullet = /^[-*]\s+(.*)$/.exec(line);
    if (bullet !== null) {
      pushListItem('ul', bullet[1].trim());
      continue;
    }

    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);
    if (numbered !== null) {
      pushListItem('ol', numbered[1].trim());
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  return blocks;
}

/**
 * Legal body copy. Heading levels start at <h2> because the page itself owns
 * the single <h1>, keeping the document outline valid for screen readers.
 */
export function LegalProse({ body }: { body: string }): JSX.Element {
  const blocks = parse(body);

  return (
    <div className="space-y-5 text-[15px] leading-relaxed text-charcoal sm:text-base dark:text-slate-300">
      {blocks.map((block, index) => {
        const key = `${block.kind}-${index}`;

        if (block.kind === 'h2') {
          return (
            <h2 key={key} className="pt-4 font-display text-2xl font-medium tracking-tight text-ink sm:text-3xl dark:text-white">
              {block.text}
            </h2>
          );
        }

        if (block.kind === 'h3') {
          return (
            <h3 key={key} className="pt-2 font-display text-xl font-medium tracking-tight text-ink dark:text-white">
              {block.text}
            </h3>
          );
        }

        if (block.kind === 'ul') {
          return (
            <ul key={key} className="ml-1 space-y-2.5">
              {block.items.map((item, i) => (
                <li key={`${key}-${i}`} className="flex gap-3">
                  <span aria-hidden="true" className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.kind === 'ol') {
          return (
            <ol key={key} className="ml-1 space-y-2.5">
              {block.items.map((item, i) => (
                <li key={`${key}-${i}`} className="flex gap-3">
                  <span aria-hidden="true" className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-extrabold text-primary">
                    {i + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          );
        }

        return <p key={key}>{block.text}</p>;
      })}
    </div>
  );
}
