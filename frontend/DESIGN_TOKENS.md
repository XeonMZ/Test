# SJT Design Tokens — how DESIGN.md maps to code

`DESIGN.md` is the source of truth for the SJT visual language. This file records
how those tokens are implemented so every **new** screen stays on-system.

## Where the system lives
- **`tailwind.config.ts`** — all tokens. DESIGN.md colors are exposed as named
  utilities (`bg-canvas`, `text-ink`, `bg-cloud`, `bg-primary`, …) **and** the
  stock Tailwind ramps already used across the app (`slate-*`, `rose-*`,
  `emerald-*`, `amber-*`, `blue-*`) are remapped onto the same palette. Either
  vocabulary is safe.
- **`styles/globals.css`** — the primitive component classes:
  `.sjt-btn-primary`, `.sjt-btn-ink`, `.sjt-btn-outline`, `.sjt-btn-outline-ink`,
  `.sjt-btn-on-ink`, `.sjt-input`, `.sjt-card`, `.sjt-section`, `.sjt-container`,
  `.sjt-eyebrow`, `.sjt-chevron`.
- **`shared/ui/design/chevron.tsx`** — the brand chevron artifact
  (`<Chevrons/>`, `<ChevronMark/>`).

## The rules that matter
| Token | Value | Utility |
|---|---|---|
| Primary (only signal) | `#024ad8` | `primary`, `bg-primary`, `text-primary` |
| Ink (all body text) | `#1a1a1a` | `ink`, `text-ink` |
| Canvas / Cloud / Fog | `#fff` / `#f7f7f7` / `#e8e8e8` | `canvas` `cloud` `fog` |
| Dark slab | ink `#1a1a1a` + `on-ink` white | `bg-ink text-on-ink` |
| Button radius | **4px** (sharp) | `rounded-md` |
| Card radius | **16px** (soft) | `rounded-2xl` |
| Soft Lift | `0 2px 8px rgba(26,26,26,.08)` | `shadow-soft` |
| Section rhythm | 80px / 48px mobile | `py-section` / `py-section-sm` |
| Display weight | **500** (never >700) | `font-medium` |
| Button label | uppercase, 0.7px | `uppercase tracking-button` |
| Font | Manrope (Forma DJR Micro substitute) | `font-sans` / `font-display` |

## Do / Don't
- **Do** use blue at most ~twice per viewport: filled CTA + links/eyebrow.
- **Do** close page rhythm with an ink slab (see homepage / footer).
- **Do** flank heroes with `<Chevrons/>`.
- **Don't** use multi-hue decorative gradients — blue is a signal, not a wash.
- **Don't** round buttons past 4px or cards below 16px.
- **Don't** introduce a second type family.

---

## Pass 3 — structural rewrite (applies to all new work)

The chrome and the shared primitives were rewritten, so **most screens inherit
the system for free**. Build new screens from these, don't hand-roll:

| Need | Use |
|---|---|
| Page title block | `<PageHeader title description actions />` (chevron eyebrow + display-500 + hairline rule) |
| Any panel | `<AppCard>` — 16px white paper, Soft Lift, no border |
| KPI figure | `<StatsCard label value helper />` — solid primary top rule |
| Section title | `<SectionHeader title description />` |
| Table | `<DataTable columns rows />` — uppercase micro heads, hairline dividers |
| Status tag | `<Badge tone="neutral|success|warning|danger" />` — sharp 4px, uppercase |
| Primary action | `<ActionButton>` — 44px, 4px, uppercase 0.7px, hover = `primary-deep` |
| Search field | `<SearchBar />` |
| Empty / loading | `<EmptyState />`, `<Loading />`, `<Skeleton />` |
| Brand accent | `<Chevrons />` (hero flank), `<ChevronMark />` (inline eyebrow) |

### Non-negotiables encoded in the system
- **Motion:** colour transitions only — no `hover:-translate-y`, no `hover:scale-*`.
- **Hover:** darker shade (`hover:bg-primary-deep`), never `bg-primary/90`.
- **Elevation:** `shadow-soft` / `shadow-float` only. No coloured glows, no `backdrop-blur`.
- **Focus (inputs):** border colour change only — no `ring-primary/20` halo.
  Keyboard focus rings on buttons stay (accessibility).
- **Radius:** interactive `rounded-md` (4px) · cards `rounded-2xl` (16px) · icon chips `rounded-lg` (8px). Never arbitrary `rounded-[…]`.
- **Letter-spacing:** `tracking-button` is the only spacing token (mono ticket codes may use `tracking-widest`).

### Careful: named tokens are 3–4 stops, not full ramps
`storm` is only `mist/sea/deep`; `bloom` is only `coral/rose/deep/wine`.
For a 50–950 scale use the remapped ramps instead — `emerald-*` **is** the storm
ramp and `rose-*` **is** the bloom ramp. Unknown classes fail silently in
`className`, so prefer the ramps when you need light/dark stops.
