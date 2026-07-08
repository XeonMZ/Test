import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}', './features/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        secondary: '#F8FAFC',
        success: '#16A34A',
        danger: '#DC2626',
        warning: '#F59E0B',
      },
      borderRadius: { '2xl': '16px' },
      boxShadow: { soft: '0 24px 80px rgba(15, 23, 42, 0.12)' },
      fontFamily: { sans: ['var(--font-inter)', 'Inter', 'sans-serif'], display: ['var(--font-poppins)', 'Poppins', 'sans-serif'] },
    },
  },
  plugins: [],
};
export default config;
