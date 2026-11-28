'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ACTIVE_THEME, THEME_REGISTRY } from './theme_switch';
import type { ThemePreset } from './theme_contract';

type ColorMode = 'dark' | 'light';
interface ThemeContextValue {
  mode: ColorMode;
  toggleMode: () => void;
  theme: ThemePreset;
  setTheme: (name: string) => void;
  themes: readonly ThemePreset[];
}
const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark', toggleMode: () => {}, theme: ACTIVE_THEME,
  setTheme: () => {}, themes: THEME_REGISTRY,
});
export const useThemeMode = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ColorMode>('dark');
  const [themeName, setThemeName] = useState<string>(ACTIVE_THEME.name);
  const theme = useMemo(() => THEME_REGISTRY.find(item => item.name === themeName) ?? ACTIVE_THEME, [themeName]);

  useEffect(() => {
    const savedMode = window.localStorage.getItem('usa_color_mode');
    const savedTheme = window.localStorage.getItem('usa_theme_name');
    if (savedMode === 'light' || savedMode === 'dark') setMode(savedMode);
    if (savedTheme && THEME_REGISTRY.some(item => item.name === savedTheme)) setThemeName(savedTheme);
  }, []);

  useEffect(() => {
    const palette = theme[mode];
    const root = document.documentElement;
    Object.entries(palette).forEach(([key, value]) => {
      root.style.setProperty(key.replace('--color_', '--color-color_'), value);
    });
    root.classList.toggle('dark', mode === 'dark');
    root.classList.toggle('theme-pure-black-glass', theme.name === 'Pure Black Glass');
    root.style.colorScheme = mode;
    window.localStorage.setItem('usa_color_mode', mode);
    window.localStorage.setItem('usa_theme_name', theme.name);
  }, [mode, theme]);

  const value = useMemo(() => ({
    mode,
    toggleMode: () => setMode(prev => prev === 'dark' ? 'light' : 'dark'),
    theme,
    setTheme: (name: string) => {
      if (THEME_REGISTRY.some(item => item.name === name)) setThemeName(name);
    },
    themes: THEME_REGISTRY,
  }), [mode, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
