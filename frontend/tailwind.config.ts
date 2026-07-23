import type { Config } from 'tailwindcss';

/**
 * SJT design system — implementation of DESIGN.md.
 *
 * Strategy: the DESIGN.md tokens are exposed as first-class utilities
 * (`bg-canvas`, `text-ink`, `bg-cloud`, …) AND the stock Tailwind ramps this
 * codebase already uses (`slate-*`, `rose-*`, `emerald-*`, `amber-*`, plus the
 * radius / shadow / type scales) are remapped onto the same tokens. Every
 * existing screen therefore adopts the new visual language without a rewrite,
 * and new screens written against either vocabulary stay on-system.
 *
 * DESIGN.md reference:
 *   primary #024ad8 · ink #1a1a1a · canvas #ffffff · cloud #f7f7f7 · fog #e8e8e8
 *   Radius: buttons 4px (sharp) · cards 16px (soft)
 *   Elevation: Soft Lift 0 2px 8px rgba(26,26,26,.08) · Float 0 8px 24px rgba(26,26,26,.12)
 */

// ---- DESIGN.md raw values -------------------------------------------------
const INK = '#1a1a1a';
const INK_DEEP = '#000000';
const INK_SOFT = '#292929';
const CANVAS = '#ffffff';
const CLOUD = '#f7f7f7';
const FOG = '#e8e8e8';
const STEEL = '#c2c2c2';
const CHARCOAL = '#3d3d3d';
const GRAPHITE = '#636363';

const PRIMARY = '#024ad8';
const PRIMARY_BRIGHT = '#296ef9';
const PRIMARY_DEEP = '#0e3191';
const PRIMARY_SOFT = '#c9e0fc';

const BLOOM_CORAL = '#ff5050';
const BLOOM_ROSE = '#f9d4d2';
const BLOOM_DEEP = '#b3262b';
const BLOOM_WINE = '#5a1313';

const STORM_MIST = '#8ebdce';
const STORM_SEA = '#7fadbe';
const STORM_DEEP = '#356373';

/** Neutral ramp — DESIGN.md greys mapped onto the `slate-*` scale in use. */
const NEUTRAL = {
  50: '#fafafa',
  100: CLOUD,
  200: FOG,
  300: STEEL,
  400: '#9b9b9b',
  500: GRAPHITE,
  600: CHARCOAL,
  700: INK_SOFT,
  800: '#1f1f1f',
  900: INK,
  950: INK_DEEP,
};

/** Brand-blue ramp — backs `blue-*`, `sky-*`, `indigo-*`. */
const BLUE = {
  50: '#eff5ff',
  100: PRIMARY_SOFT,
  200: '#a9cbfa',
  300: '#7fb0f8',
  400: PRIMARY_BRIGHT,
  500: '#0b5ce8',
  600: PRIMARY,
  700: '#023bad',
  800: PRIMARY_DEEP,
  900: '#0b2570',
  950: '#061640',
};

/** Bloom ramp — error / destructive / sale emphasis (`rose-*`, `red-*`). */
const BLOOM = {
  50: '#fdf3f3',
  100: BLOOM_ROSE,
  200: '#f4b7b4',
  300: '#ef918c',
  400: '#ff6b6b',
  500: BLOOM_CORAL,
  600: '#dd3a3d',
  700: BLOOM_DEEP,
  800: '#8c1e22',
  900: BLOOM_WINE,
  950: '#3d0c0c',
};

/** Storm ramp — positive / neutral status accent (`emerald-*`, `green-*`). */
const STORM = {
  50: '#f2f8fa',
  100: '#ddedf2',
  200: '#c4dfe8',
  300: STORM_MIST,
  400: STORM_SEA,
  500: '#5c8fa1',
  600: STORM_DEEP,
  700: '#2c515e',
  800: '#23404a',
  900: '#1a2f37',
  950: '#101d22',
};

/** Coral ramp — warning / pending attention (`amber-*`, `yellow-*`). */
const CORAL = {
  50: '#fff5f4',
  100: '#ffe4e2',
  200: '#ffcac6',
  300: '#ffa9a3',
  400: '#ff7a72',
  500: BLOOM_CORAL,
  600: '#ed3f3f',
  700: BLOOM_DEEP,
  800: '#8c1e22',
  900: BLOOM_WINE,
  950: '#3d0c0c',
};

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
    './shared/**/*.{js,ts,jsx,tsx,mdx}',
    './services/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ---- DESIGN.md named tokens ----
        canvas: CANVAS,
        paper: CANVAS,
        cloud: CLOUD,
        fog: FOG,
        steel: STEEL,
        hairline: FOG,
        charcoal: CHARCOAL,
        graphite: GRAPHITE,
        'on-ink': CANVAS,
        'on-primary': CANVAS,
        ink: { DEFAULT: INK, deep: INK_DEEP, soft: INK_SOFT },
        primary: { DEFAULT: PRIMARY, bright: PRIMARY_BRIGHT, deep: PRIMARY_DEEP, soft: PRIMARY_SOFT },
        bloom: { coral: BLOOM_CORAL, rose: BLOOM_ROSE, deep: BLOOM_DEEP, wine: BLOOM_WINE },
        storm: { mist: STORM_MIST, sea: STORM_SEA, deep: STORM_DEEP },

        // ---- Legacy aliases so existing screens keep compiling ----
        secondary: CLOUD,
        success: STORM_DEEP,
        danger: BLOOM_DEEP,
        warning: BLOOM_CORAL,

        // ---- Stock ramps remapped onto the system palette ----
        slate: NEUTRAL,
        gray: NEUTRAL,
        zinc: NEUTRAL,
        neutral: NEUTRAL,
        stone: NEUTRAL,
        blue: BLUE,
        sky: BLUE,
        indigo: BLUE,
        violet: BLUE,
        purple: BLUE,
        cyan: BLUE,
        rose: BLOOM,
        red: BLOOM,
        pink: BLOOM,
        fuchsia: BLOOM,
        emerald: STORM,
        green: STORM,
        teal: STORM,
        lime: STORM,
        amber: CORAL,
        yellow: CORAL,
        orange: CORAL,
      },

      // Buttons stay sharp (4px); cards stay soft (16px). DESIGN.md § Shapes.
      borderRadius: {
        none: '0px',
        xs: '2px',
        sm: '3px',
        DEFAULT: '4px',
        md: '4px',
        lg: '8px',
        xl: '8px',
        '2xl': '16px',
        '3xl': '16px',
        '4xl': '16px',
        pill: '9999px',
        full: '9999px',
      },

      // DESIGN.md § Elevation — mostly flat; two real levels.
      boxShadow: {
        none: 'none',
        hairline: '0 0 0 1px ' + FOG,
        sm: '0 1px 2px rgba(26, 26, 26, 0.04)',
        DEFAULT: '0 2px 8px rgba(26, 26, 26, 0.08)',
        md: '0 2px 8px rgba(26, 26, 26, 0.08)',
        lg: '0 2px 8px rgba(26, 26, 26, 0.08)',
        soft: '0 2px 8px rgba(26, 26, 26, 0.08)',
        lift: '0 2px 8px rgba(26, 26, 26, 0.08)',
        xl: '0 8px 24px rgba(26, 26, 26, 0.12)',
        '2xl': '0 8px 24px rgba(26, 26, 26, 0.12)',
        float: '0 8px 24px rgba(26, 26, 26, 0.12)',
      },

      // Single-family voice — Manrope stands in for Forma DJR Micro
      // (DESIGN.md § Note on Font Substitutes: use directly, no metric adjustment).
      fontFamily: {
        sans: ['var(--font-sjt)', 'Manrope', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-sjt)', 'Manrope', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },

      // DESIGN.md § Typography — display line-height 1.0, body 1.38–1.5.
      fontSize: {
        xs: ['12px', { lineHeight: '1.33' }],
        sm: ['14px', { lineHeight: '1.5' }],
        base: ['16px', { lineHeight: '1.38' }],
        lg: ['18px', { lineHeight: '1.33' }],
        xl: ['20px', { lineHeight: '1.15' }],
        '2xl': ['24px', { lineHeight: '1.17' }],
        '3xl': ['28px', { lineHeight: '1.1' }],
        '4xl': ['32px', { lineHeight: '1.0' }],
        '5xl': ['44px', { lineHeight: '1.0' }],
        '6xl': ['56px', { lineHeight: '1.0' }],
        '7xl': ['72px', { lineHeight: '1.0' }],
        '8xl': ['80px', { lineHeight: '1.0' }],
      },

      // DESIGN.md runs display at 500 and never above 700.
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '600',
        extrabold: '700',
        black: '700',
      },

      // 8px base unit, 4px half-step, 80px section rhythm.
      spacing: { section: '80px', 'section-sm': '48px' },

      letterSpacing: { button: '0.7px' },

      // DESIGN.md § Grid — 1366px content container (`max-w-7xl` already used everywhere).
      maxWidth: { container: '1366px', '7xl': '1366px' },

      keyframes: {
        'fade-rise': { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: { 'fade-rise': 'fade-rise 0.4s ease-out both' },
    },
  },
  plugins: [],
};

export default config;
