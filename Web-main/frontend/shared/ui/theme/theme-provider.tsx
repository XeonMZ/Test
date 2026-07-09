'use client';

import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ThemeContextValue = { theme: Theme; setTheme: (theme: Theme) => void; brandColor: string };
const ThemeContext = createContext<ThemeContextValue>({ theme: 'system', setTheme: () => undefined, brandColor: '#2563EB' });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const brandColor = '#2563EB';

  useEffect(() => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.setProperty('--brand-color', brandColor);
  }, [theme, brandColor]);

  const value = useMemo(() => ({ theme, setTheme, brandColor }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() { return useContext(ThemeContext); }
