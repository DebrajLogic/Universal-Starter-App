import { theme_1 } from './presets/theme_1';
import { theme_2 } from './presets/theme_2';
import { theme_3 } from './presets/theme_3';

export const THEME_REGISTRY = [theme_1, theme_2, theme_3] as const;
export const ACTIVE_THEME = theme_3;
