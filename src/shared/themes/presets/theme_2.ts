import { ThemePreset } from '../theme_contract';

// =============================================================================
// THEME 2: CYBER EMERALD (Deep Forest Navy & Mint)
// =============================================================================
export const theme_2: ThemePreset = {
  name: 'Cyber Emerald',
  dark: {
    '--color_1': '#022c22', // Deep forest black
    '--color_2': '#064e3b', // Dark emerald card
    '--color_3': '#065f46', // Emerald border
    '--color_4': '#ecfdf5', // Mint-white text
    '--color_5': '#6ee7b7', // Soft mint muted text
    '--color_6': '#10b981', // Bright Emerald primary
    '--color_7': '#06b6d4', // Cyan secondary
    '--color_8': '#f43f5e', // Rose danger
  },
  light: {
    '--color_1': '#ecfdf5', // Soft mint-tinted canvas
    '--color_2': '#ffffff', // Pure white cards
    '--color_3': '#a7f3d0', // Mint border
    '--color_4': '#022c22', // Deep forest-ink text
    '--color_5': '#047857', // Muted emerald text
    '--color_6': '#059669', // Rich Emerald primary
    '--color_7': '#0891b2', // Cyan secondary
    '--color_8': '#e11d48', // Rose danger
  },
};
