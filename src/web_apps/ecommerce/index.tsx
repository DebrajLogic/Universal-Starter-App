'use client';

import { useEffect, useState } from 'react';
import { db } from '@/DB/db/db_switch';
import type { BaseRecord } from '@/DB/db/db_contract';
import { Header } from '@/shared/layout/Header';
import { Footer } from '@/shared/layout/Footer';
import { notify } from '@/shared/plugins/toast/ToastPlugin';

interface Product extends BaseRecord {
  item: string;
  price: string;
  discount: number;
}

// =============================================================================
// E-COMMERCE MINI-APP (Uses color_1..8 tokens & isolated ecom_* data)
// =============================================================================
function EcommerceContent({ slug }: { slug?: string[] }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    try {
      const items = await db.getAll<Product>('ecom_products');
      setProducts(items);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleAddTestSneaker = async () => {
    try {
      await db.insert('ecom_products', {
        item: `sneaker_${products.length + 1}`,
        price: '$234',
        discount: 30,
      });
      notify.success('Saved sneaker to LocalStorage!');
      await loadProducts();
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Insert failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await db.remove('ecom_products', id);
      notify.success('Removed sneaker!');
      await loadProducts();
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Delete failed');
    }
  };

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
            onClick={handleAddTestSneaker}
            className="rounded-md bg-color_6 px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
          >
            + Add Test Sneaker
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

        {/* LocalStorage DB Test Panel */}
        <div className="mt-8 rounded-lg border border-color_3 bg-color_2 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-color_4">
              DB Test: <span className="text-color_6">ecom_products</span> ({products.length})
            </h2>
            <button
              onClick={handleAddTestSneaker}
              className="rounded-md bg-color_6 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Insert Sneaker
            </button>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-color_5">Loading from LocalStorage...</p>
          ) : products.length === 0 ? (
            <p className="mt-4 text-sm text-color_5">
              No products yet. Click &quot;Insert Sneaker&quot; and refresh the page to verify persistence.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {products.map((product) => (
                <li
                  key={product.id}
                  className="flex items-center justify-between rounded border border-color_3 bg-color_1 px-4 py-3 text-sm"
                >
                  <div>
                    <span className="font-semibold text-color_4">{product.item}</span> —{' '}
                    <span className="text-color_6">{product.price}</span> ({product.discount}% off)
                    <div className="text-xs text-color_5">
                      id: {product.id} | created_at: {product.created_at}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="rounded border border-color_3 px-2.5 py-1 text-xs text-color_5 transition hover:text-color_4"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <Footer appName="ShopCraft Store" />
    </div>
  );
}


import { AuthGate } from '@/AUTH/components/AuthGate';

export default function EcommerceApp({ slug }: { slug?: string[] }) {
  return (
    <AuthGate>
      <EcommerceContent slug={slug} />
    </AuthGate>
  );
}
