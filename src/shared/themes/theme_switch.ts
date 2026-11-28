import { theme_1 } from './presets/theme_1';
import { theme_2 } from './presets/theme_2';
import { theme_3 } from './presets/theme_3';
import { theme_4 } from './presets/theme_4';
import { theme_5 } from './presets/theme_5';
import { theme_6 } from './presets/theme_6';
import { theme_7 } from './presets/theme_7';

export const THEME_REGISTRY = [theme_1, theme_2, theme_3, theme_4, theme_5, theme_6, theme_7] as const;
export const ACTIVE_THEME = theme_3;
