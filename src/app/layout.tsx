import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/shared/plugins/toast/ToastPlugin';
import { ThemeProvider } from '@/shared/themes/ThemeProvider';

export const metadata: Metadata = {
  title: 'Universal Starter App',
  description: 'Modular Next.js Engine — Directed with ❤️, Built with AI',
};

// =============================================================================
// BARE ROOT SHELL (Mounts ThemeProvider & global plugins ONLY)
// =============================================================================
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-color_1 text-color_4 antialiased">
        <ThemeProvider>
          <ToastProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
