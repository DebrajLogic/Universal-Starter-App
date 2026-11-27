'use client';

import { Moon, Sun } from 'lucide-react';
import { useThemeMode } from '@/shared/themes/ThemeProvider';

// =============================================================================
// LIGHT / DARK MODE TOGGLE BUTTON (Switches active theme between dark & light)
// =============================================================================
export function ThemeToggleButton() {
  const { mode, toggleMode } = useThemeMode();

  return (
    <button
      onClick={toggleMode}
      aria-label="Toggle color mode"
      className="rounded-lg border border-color_3 bg-color_1 p-2 text-color_5 transition hover:border-color_6 hover:text-color_4"
      title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {mode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
