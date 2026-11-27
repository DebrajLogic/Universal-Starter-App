'use client';

import { useState } from 'react';
import { Palette } from 'lucide-react';
import { PLUGIN_SWITCHES } from '../plugin_switches';

// =============================================================================
// THEME PRESETS (Ask AI for new palettes and paste them right here!)
// =============================================================================
const THEME_PRESETS = {
  IndigoNight: {
    '--bg-main': '#09090b',
    '--bg-card': '#18181b',
    '--border-subtle': '#27272a',
    '--text-main': '#fafafa',
    '--text-muted': '#a1a1aa',
    '--brand-primary': '#6366f1',
    '--brand-secondary': '#10b981',
  },
  CyberEmerald: {
    '--bg-main': '#020617',
    '--bg-card': '#0f172a',
    '--border-subtle': '#1e293b',
    '--text-main': '#f8fafc',
    '--text-muted': '#94a3b8',
    '--brand-primary': '#10b981',
    '--brand-secondary': '#38bdf8',
  },
  AmberForge: {
    '--bg-main': '#0c0a09',
    '--bg-card': '#1c1917',
    '--border-subtle': '#292524',
    '--text-main': '#fafaf9',
    '--text-muted': '#a8a29e',
    '--brand-primary': '#f59e0b',
    '--brand-secondary': '#f43f5e',
  },
} as const;

type ThemeName = keyof typeof THEME_PRESETS;

// =============================================================================
// FLOATING THEME TESTER WIDGET
// =============================================================================
export function ThemeSwitcherPlugin() {
  const [activeTheme, setActiveTheme] = useState<ThemeName>('IndigoNight');
  const [isOpen, setIsOpen] = useState(false);

  if (!PLUGIN_SWITCHES.theme_switcher) return null;

  function applyTheme(name: ThemeName) {
    const vars = THEME_PRESETS[name];
    const root = document.documentElement;
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    setActiveTheme(name);
  }

  return (
    <div className="fixed bottom-5 left-5 z-50">
      {isOpen && (
        <div className="mb-2 flex flex-col gap-1.5 rounded-xl border border-border-subtle bg-bg-card p-2 shadow-xl">
          {(Object.keys(THEME_PRESETS) as ThemeName[]).map((name) => (
            <button
              key={name}
              onClick={() => applyTheme(name)}
              className={`rounded-lg px-3 py-1.5 text-left text-xs font-medium transition ${
                activeTheme === name
                  ? 'bg-primary text-white'
                  : 'text-text-muted hover:bg-bg-main hover:text-text-main'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-border-subtle bg-bg-card px-3.5 py-2 text-xs font-semibold text-text-main shadow-lg transition hover:border-primary"
        title="Switch Theme Preset"
      >
        <Palette className="h-4 w-4 text-primary" />
        <span>Theme</span>
      </button>
    </div>
  );
}
