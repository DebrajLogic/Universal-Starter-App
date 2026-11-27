'use client';

import { Header } from '@/shared/layout/Header';
import { Footer } from '@/shared/layout/Footer';
import { notify } from '@/shared/plugins/toast/ToastPlugin';

// =============================================================================
// E-COMMERCE MINI-APP (Uses color_1..8 tokens & isolated ecom_* data)
// =============================================================================
export default function EcommerceApp({ slug }: { slug?: string[] }) {
  return (
    <div className="flex min-h-screen flex-col bg-color_1 text-color_4">
      <Header
        brandName="ShopCraft Store"
        brandHref="/ecommerce"
        navItems={[
          { label: 'All Apps', href: '/' },
          { label: 'Catalog', href: '/ecommerce' },
          { label: 'Orders', href: '/ecommerce/orders' },
        ]}
        rightSlot={
          <button
            onClick={() => notify.success('Added sample item to cart!')}
            className="rounded-md bg-color_6 px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
          >
            Test Cart Toast
          </button>
        }
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-bold text-color_4">E-Commerce Mini-App</h1>
        <p className="mt-2 text-color_5">
          Active sub-route:{' '}
          <code className="rounded border border-color_3 bg-color_2 px-2 py-0.5 text-color_6">
            /{slug?.join('/') || ''}
          </code>
        </p>
      </main>

      <Footer appName="ShopCraft Store" />
    </div>
  );
}
