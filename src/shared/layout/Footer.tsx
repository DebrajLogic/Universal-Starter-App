import { cn } from '@/shared/utils/helpers';

// =============================================================================
// CONFIGURABLE DEFAULT FOOTER (Uses color_1..8 tokens)
// =============================================================================
interface FooterProps {
  appName?: string;
  className?: string;
}

export function Footer({ appName = 'UniversalStarterApp', className }: FooterProps) {
  return (
    <footer
      className={cn(
        'w-full border-t border-color_3 bg-color_2 px-6 py-6 text-center text-sm text-color_5',
        className
      )}
    >
      <p>
        {appName} &copy; {new Date().getFullYear()} — Directed with ❤️, Built with AI on the Universal Modular Engine
      </p>
    </footer>
  );
}
