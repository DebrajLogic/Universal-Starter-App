import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/shared/plugins/toast/ToastPlugin';
import { ThemeProvider } from '@/shared/themes/ThemeProvider';
import { ControlCenter } from '@/shared/control-center/ControlCenter';
import { ACTIVE_THEME, THEME_REGISTRY } from '@/shared/themes/theme_switch';

export const metadata: Metadata = {
  title: 'Universal Starter App',
  description: 'Modular Next.js starter platform for building focused web apps.',
};

const themeBootData = JSON.stringify({ themes: THEME_REGISTRY, activeThemeName: ACTIVE_THEME.name }).replace(/</g, '\\u003c');
const themeBootScript = `(() => {
  try {
    const data = ${themeBootData};
    const savedMode = localStorage.getItem('usa_color_mode');
    const mode = savedMode === 'light' ? 'light' : 'dark';
    const savedName = localStorage.getItem('usa_theme_name');
    const selected = data.themes.find((item) => item.name === savedName)
      || data.themes.find((item) => item.name === data.activeThemeName);
    if (!selected) return;
    const root = document.documentElement;
    Object.entries(selected[mode]).forEach(([key, value]) => {
      root.style.setProperty(key.replace('--color_', '--color-color_'), value);
    });
    root.classList.toggle('dark', mode === 'dark');
    root.classList.toggle('theme-pure-black-glass', selected.name === 'Pure Black Glass');
    root.style.colorScheme = mode;
  } catch (_) {}
})();`;

// =============================================================================
// ROOT SHELL
// Global providers and the Control Center are available across every route.
// =============================================================================
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeBootScript }} /></head>
      <body className="bg-color_1 text-color_4 antialiased">
        <ThemeProvider>
          <ToastProvider />
          {children}
          <ControlCenter />
        </ThemeProvider>
      </body>
    </html>
  );
}
