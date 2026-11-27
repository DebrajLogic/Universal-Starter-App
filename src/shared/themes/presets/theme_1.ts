import { ThemePreset } from '../theme_contract';

// =============================================================================
// THEME 1: INDIGO NIGHT (Cool Slate & Electric Indigo)
// =============================================================================
export const theme_1: ThemePreset = {
  name: 'Indigo Night',
  dark: {
    '--color_1': '#09090b', // Deep zinc black
    '--color_2': '#18181b', // Elevated zinc card
    '--color_3': '#27272a', // Subtle border
    '--color_4': '#fafafa', // Crisp white text
    '--color_5': '#a1a1aa', // Muted silver text
    '--color_6': '#6366f1', // Electric Indigo primary
    '--color_7': '#a855f7', // Violet secondary
    '--color_8': '#ef4444', // Red danger
  },
  light: {
    '--color_1': '#eef2ff', // Soft indigo-tinted canvas
    '--color_2': '#ffffff', // Pure white cards
    '--color_3': '#c7d2fe', // Soft indigo border
    '--color_4': '#1e1b4b', // Deep indigo-ink text
    '--color_5': '#4338ca', // Muted indigo text
    '--color_6': '#4f46e5', // Bold Indigo primary
    '--color_7': '#9333ea', // Purple secondary
    '--color_8': '#dc2626', // Red danger
  },
};
