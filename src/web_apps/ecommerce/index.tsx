// src/web_apps/ecommerce/index.tsx
'use client';

import { Header } from '@/shared/layout/Header';
import { Footer } from '@/shared/layout/Footer';
import { notify } from '@/shared/plugins/toast/ToastPlugin';

// =============================================================================
// E-COMMERCE MINI-APP (Custom dark amber header & isolated ecom_* data)
// =============================================================================
export default function EcommerceApp({ slug }: { slug?: string[] }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header
        brandName="ShopCraft Store"
        brandHref="/ecommerce"
        className="border-amber-200 bg-amber-50"
        navItems={[
          { label: 'All Apps', href: '/' },
          { label: 'Catalog', href: '/ecommerce' },
          { label: 'Orders', href: '/ecommerce/orders' },
        ]}
        rightSlot={
          <button
            onClick={() => notify.success('Added sample item to cart!')}
            className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
          >
            Test Cart Toast
          </button>
        }
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-bold text-slate-900">E-Commerce Mini-App</h1>
        <p className="mt-2 text-slate-600">
          Active sub-route: <code className="rounded bg-slate-100 px-2 py-0.5">/{slug?.join('/') || ''}</code>
        </p>
      </main>

      <Footer appName="ShopCraft Store" className="bg-amber-50/50" />
    </div>
  );
}
