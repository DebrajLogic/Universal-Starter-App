// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/shared/plugins/toast/ToastPlugin';

export const metadata: Metadata = {
  title: 'Universal Starter App',
  description: 'Modular Next.js Engine — Directed with ❤️, Built with AI',
};

// =============================================================================
// BARE ROOT SHELL (Mounts global plugins ONLY — each web_app owns its chrome)
// =============================================================================
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-900 antialiased">
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
