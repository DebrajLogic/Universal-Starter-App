// Mini-app data queries. The app depends on the stable DB contract, never on a provider.
import { db } from '@/DB/db/db_switch';
import type { Product, Order, CartRecord, CartLine } from './types';

export async function getProducts(): Promise<Product[]> {
  return db.getAll<Product>('ecom_products');
}
export async function getOrders(): Promise<Order[]> {
  return db.getAll<Order>('ecom_orders');
}
export async function getProductById(id: string): Promise<Product | null> {
  return db.getById<Product>('ecom_products', id);
}

export async function getCart(userId: string): Promise<CartLine[]> {
  const carts = await db.getAll<CartRecord>('ecom_carts');
  const matching = carts.filter(cart => cart.user_id === userId);
  const quantities = new Map<string, number>();
  for (const cart of matching) {
    for (const item of cart.items ?? []) {
      if (!item || typeof item.product_id !== 'string' || !Number.isInteger(item.quantity) || item.quantity < 1) continue;
      quantities.set(item.product_id, Math.max(quantities.get(item.product_id) ?? 0, item.quantity));
    }
  }
  return Array.from(quantities, ([product_id, quantity]) => ({ product_id, quantity }));
}
