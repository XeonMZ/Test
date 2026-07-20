'use client';

import { ArrowRight, BarChart3, Car, HelpCircle, MapPin, Package, Phone, Quote, Sparkles, Tag, type LucideIcon } from 'lucide-react';
import { cmsImageUrl, type CmsBlock } from './blocks';

const ICONS: Record<string, LucideIcon> = { Car, Package, MapPin, Sparkles, Tag, BarChart3, Quote, HelpCircle, Phone };

function m(block: CmsBlock, key: string, fallback = ''): string {
  const v = block.metadata?.[key];
  return typeof v === 'string' ? v : fallback;
}
function list(block: CmsBlock, key: string): Array<Record<string, string>> {
  const v = block.metadata?.[key];
  return Array.isArray(v) ? (v as Array<Record<string, string>>) : [];
}

/**
 * Renders a single CMS block. This exact component is used by the public
 * landing page AND the builder's live preview, so what an editor sees is
 * pixel-identical to what visitors get.
 */
export function BlockView({ block }: { block: CmsBlock }) {
  switch (block.type) {
    case 'hero': {
      const img = cmsImageUrl(m(block, 'image'));
      return (
        <section className="relative px-4 pb-16 pt-20">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.18),transparent_32%)]" />
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              {m(block, 'eyebrow') ? <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-primary shadow-soft"><Sparkles size={16} /> {m(block, 'eyebrow')}</div> : null}
              <h1 className="mt-6 font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">{m(block, 'title')}</h1>
              {m(block, 'subtitle') ? <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">{m(block, 'subtitle')}</p> : null}
              {m(block, 'cta_label') ? <a href={m(block, 'cta_link', '#')} className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-soft">{m(block, 'cta_label')} <ArrowRight size={18} /></a> : null}
            </div>
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt="" className="w-full rounded-[2rem] object-cover shadow-soft" />
            ) : <div className="grid h-64 place-items-center rounded-[2rem] bg-primary/10 text-primary"><Car size={56} /></div>}
          </div>
        </section>
      );
    }
    case 'banner':
      return (
        <section className="px-4 py-4">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 rounded-2xl px-6 py-4 text-white shadow-soft" style={{ backgroundColor: m(block, 'bg_color', '#2563EB') }}>
            <p className="text-sm font-extrabold sm:text-base">{m(block, 'title')}</p>
            {m(block, 'cta_label') ? <a href={m(block, 'cta_link', '#')} className="rounded-xl bg-white/95 px-4 py-2 text-sm font-extrabold text-slate-900">{m(block, 'cta_label')}</a> : null}
          </div>
        </section>
      );
    case 'about': {
      const img = cmsImageUrl(m(block, 'image'));
      return (
        <section className="px-4 py-16">
          <div className="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-2">
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt="" className="w-full rounded-[2rem] object-cover shadow-soft" />
            ) : <div className="grid h-56 place-items-center rounded-[2rem] bg-slate-100 text-slate-400 dark:bg-slate-800">Gambar</div>}
            <div>
              <h2 className="font-display text-3xl font-extrabold">{m(block, 'title')}</h2>
              <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">{m(block, 'body')}</p>
            </div>
          </div>
        </section>
      );
    }
    case 'services':
      return (
        <section className="px-4 py-16">
          <div className="mx-auto max-w-7xl">
            {m(block, 'title') ? <h2 className="text-center font-display text-3xl font-extrabold">{m(block, 'title')}</h2> : null}
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {list(block, 'items').map((it, i) => {
                const Icon = ICONS[it.icon] ?? Sparkles;
                return (
                  <article key={i} className="rounded-[2rem] bg-white p-8 shadow-soft dark:bg-slate-900">
                    <Icon className="text-primary" size={32} />
                    <h3 className="mt-5 font-display text-xl font-bold">{it.title}</h3>
                    <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{it.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      );
    case 'stats':
      return (
        <section className="px-4 py-10">
          <div className="mx-auto grid max-w-7xl gap-4 rounded-[2rem] bg-primary p-6 text-white shadow-soft sm:grid-cols-2 md:grid-cols-4">
            {list(block, 'items').map((it, i) => (
              <div key={i}><p className="font-display text-2xl font-extrabold">{it.value}</p><p className="mt-1 text-sm text-white/80">{it.label}</p></div>
            ))}
          </div>
        </section>
      );
    case 'promo': {
      const img = cmsImageUrl(m(block, 'image'));
      return (
        <section className="px-4 py-16">
          <div className="mx-auto grid max-w-7xl items-center gap-8 rounded-[2rem] bg-white p-8 shadow-soft dark:bg-slate-900 md:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-extrabold">{m(block, 'title')}</h2>
              <p className="mt-3 leading-8 text-slate-600 dark:text-slate-300">{m(block, 'body')}</p>
              {m(block, 'cta_label') ? <a href={m(block, 'cta_link', '#')} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-extrabold text-white">{m(block, 'cta_label')} <ArrowRight size={18} /></a> : null}
            </div>
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt="" className="w-full rounded-[1.5rem] object-cover" />
            ) : <div className="grid h-48 place-items-center rounded-[1.5rem] bg-amber-100 text-amber-500"><Tag size={44} /></div>}
          </div>
        </section>
      );
    }
    case 'testimonial':
      return (
        <section className="px-4 py-16">
          <div className="mx-auto max-w-7xl">
            {m(block, 'title') ? <h2 className="text-center font-display text-3xl font-extrabold">{m(block, 'title')}</h2> : null}
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {list(block, 'items').map((it, i) => (
                <figure key={i} className="rounded-[2rem] bg-slate-50 p-8 dark:bg-slate-900">
                  <Quote className="text-primary/40" size={28} />
                  <blockquote className="mt-4 text-lg font-semibold leading-8 text-slate-800 dark:text-slate-100">“{it.quote}”</blockquote>
                  <figcaption className="mt-4 text-sm font-bold text-slate-500">— {it.author}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      );
    case 'faq':
      return (
        <section className="px-4 py-16">
          <div className="mx-auto max-w-3xl">
            {m(block, 'title') ? <h2 className="text-center font-display text-3xl font-extrabold">{m(block, 'title')}</h2> : null}
            <div className="mt-8 space-y-3">
              {list(block, 'items').map((it, i) => (
                <details key={i} className="group rounded-2xl bg-white p-5 shadow-soft dark:bg-slate-900">
                  <summary className="cursor-pointer list-none font-bold text-slate-900 dark:text-slate-100">{it.q}</summary>
                  <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{it.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      );
    case 'contact':
      return (
        <section className="px-4 py-16">
          <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 text-center shadow-soft dark:bg-slate-900">
            <h2 className="font-display text-3xl font-extrabold">{m(block, 'title')}</h2>
            <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">{m(block, 'address')}</p>
            <p className="mt-2 font-bold text-primary">{m(block, 'phone')} · {m(block, 'email')}</p>
          </div>
        </section>
      );
    case 'footer':
      return (
        <footer className="bg-slate-950 px-4 py-12 text-white">
          <div className="mx-auto max-w-7xl">
            <p className="font-display text-lg font-extrabold">{m(block, 'company')}</p>
            <p className="mt-1 text-sm text-slate-400">{m(block, 'tagline')}</p>
            <p className="mt-4 text-xs text-slate-500">{m(block, 'note')}</p>
          </div>
        </footer>
      );
    default:
      return null;
  }
}

/** Renders an ordered list of active blocks — the whole page. */
export function CmsRenderer({ blocks }: { blocks: CmsBlock[] }) {
  const visible = blocks.filter((b) => b.is_active).sort((a, b) => a.sort_order - b.sort_order);
  return <>{visible.map((b) => <BlockView key={b.id} block={b} />)}</>;
}
