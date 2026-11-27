import Link from 'next/link';
import { cn } from '@/shared/utils/helpers';
import { ThemeToggleButton } from '@/shared/ui/ThemeToggleButton';

// =============================================================================
// CONFIGURABLE DEFAULT HEADER (Uses color_1..8 tokens + Light/Dark switch)
// =============================================================================
export interface NavItem {
  label: string;
  href: string;
}

interface HeaderProps {
  brandName?: string;
  brandHref?: string;
  navItems?: NavItem[];
  className?: string;
  rightSlot?: React.ReactNode;
}

export function Header({
  brandName = 'UniversalStarterApp',
  brandHref = '/',
  navItems = [],
  className,
  rightSlot,
}: HeaderProps) {
  return (
    <header className={cn('w-full border-b border-color_3 bg-color_2 px-6 py-4', className)}>
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href={brandHref} className="text-lg font-bold tracking-tight text-color_4">
          {brandName}
        </Link>

        <nav className="flex items-center gap-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-color_5 transition hover:text-color_4"
            >
              {item.label}
            </Link>
          ))}
          {rightSlot}
          <ThemeToggleButton />
        </nav>
      </div>
    </header>
  );
}
