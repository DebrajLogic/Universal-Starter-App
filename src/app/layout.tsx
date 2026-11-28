import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/shared/plugins/toast/ToastPlugin';
import { ThemeProvider } from '@/shared/themes/ThemeProvider';
import { ControlCenter } from '@/shared/control-center/ControlCenter';

export const metadata: Metadata = {
  title: 'Universal Starter App',
  description: 'Modular Next.js starter platform for building focused web apps.',
};

// =============================================================================
// ROOT SHELL
// Global providers and the Control Center are available across every route.
// =============================================================================
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
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
