'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { ACTIVE_THEME } from './theme_switch';

// =============================================================================
// THEME PROVIDER & HOOK (Defaults to Dark Mode, updates Tailwind vars live)
// =============================================================================
type ColorMode = 'dark' | 'light';

interface ThemeContextValue {
  mode: ColorMode;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  toggleMode: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ColorMode>('dark');

  useEffect(() => {
    const saved = window.localStorage.getItem('usa_color_mode') as ColorMode | null;
    if (saved === 'light' || saved === 'dark') {
      setMode(saved);
    }
  }, []);

  useEffect(() => {
    const palette = ACTIVE_THEME[mode];
    const root = document.documentElement;

    Object.entries(palette).forEach(([key, value]) => {
      // Converts '--color_1' -> '--color-color_1' so Tailwind v4 updates live!
      const tailwindVar = key.replace('--color_', '--color-color_');
      root.style.setProperty(tailwindVar, value);
    });

    root.classList.toggle('dark', mode === 'dark');
    window.localStorage.setItem('usa_color_mode', mode);
  }, [mode]);

  const toggleMode = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
