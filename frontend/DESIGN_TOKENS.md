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
