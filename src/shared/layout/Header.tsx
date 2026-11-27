import Link from 'next/link';
import { cn } from '@/shared/utils/helpers';

// =============================================================================
// CONFIGURABLE DEFAULT HEADER (Mini-apps pass their own links & styles)
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
    <header className={cn('w-full border-b bg-white px-6 py-4', className)}>
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href={brandHref} className="text-lg font-bold tracking-tight">
          {brandName}
        </Link>

        <nav className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              {item.label}
            </Link>
          ))}
          {rightSlot}
        </nav>
      </div>
    </header>
  );
}
