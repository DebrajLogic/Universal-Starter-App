export interface ThemePalette {
  '--color_1': string; // Main background
  '--color_2': string; // Card / Header / Footer background
  '--color_3': string; // Borders & dividers
  '--color_4': string; // Primary text
  '--color_5': string; // Muted text
  '--color_6': string; // Primary brand accent
  '--color_7': string; // Secondary brand accent
  '--color_8': string; // Danger / delete accent
}

export interface ThemePreset {
  name: string;
  dark: ThemePalette;
  light: ThemePalette;
}
