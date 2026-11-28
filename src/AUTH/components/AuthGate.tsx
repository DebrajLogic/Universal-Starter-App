'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/AUTH/auth/auth_switch';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    auth.getCurrentUser().then(user => {
      if (!mounted) return;
      if (user) {
        setAllowed(true);
      } else {
        router.replace('/login?next=' + encodeURIComponent(pathname || '/ecommerce'));
      }
    }).catch(() => {
      if (mounted) router.replace('/login?next=' + encodeURIComponent(pathname || '/ecommerce'));
    }).finally(() => {
      if (mounted) setChecking(false);
    });
    return () => { mounted = false; };
  }, [pathname, router]);

  if (checking || !allowed) {
    return <div className="flex min-h-[60vh] items-center justify-center bg-color_1 text-sm text-color_5">Checking your local session...</div>;
  }
  return <>{children}</>;
}
