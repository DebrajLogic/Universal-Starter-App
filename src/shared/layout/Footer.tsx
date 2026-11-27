import { cn } from '@/shared/utils/helpers';

// =============================================================================
// CONFIGURABLE DEFAULT FOOTER (Mini-apps can customize or replace this)
// =============================================================================
interface FooterProps {
  appName?: string;
  className?: string;
}

export function Footer({ appName = 'UniversalStarterApp', className }: FooterProps) {
  return (
    <footer className={cn('w-full border-t bg-slate-50 px-6 py-6 text-center text-sm text-slate-500', className)}>
      <p>
        {appName} &copy; {new Date().getFullYear()} — Directed with ❤️, Built with AI on the Universal Modular Engine
      </p>
    </footer>
  );
}
