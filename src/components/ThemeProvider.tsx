'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export type ThemeId = 'mist' | 'midnight' | 'sand';

export interface ThemeMeta {
  id: ThemeId;
  label: string;
  /** Preview swatch color */
  swatch: string;
  /** Secondary swatch for 2-tone preview */
  swatch2: string;
}

export const THEMES: ThemeMeta[] = [
  { id: 'mist',     label: 'Mist',     swatch: '#e8eaef', swatch2: '#ffffff' },
  { id: 'midnight', label: 'Midnight', swatch: '#0b0f1a', swatch2: '#1e2640' },
  { id: 'sand',     label: 'Sand',     swatch: '#f5f0e8', swatch2: '#e8e1d5' },
];

const STORAGE_KEY = 'smap-theme';

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'sand',
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>('sand');
  // Read from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    if (stored && THEMES.some(t => t.id === stored)) {
      setThemeState(stored);
    }
  }, []);

  // Apply data-theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = useCallback((t: ThemeId) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  // Prevent flash by setting default theme attribute before hydration
  // The suppressHydrationWarning on <html> handles any mismatch
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
