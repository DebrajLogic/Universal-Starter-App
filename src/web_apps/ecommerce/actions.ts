// Mini-app writes. Swap the active DB adapter centrally; callers stay unchanged.
import { db } from '@/DB/db/db_switch';
import type { Product, Order, CartLine, CartRecord } from './types';

export async function createProduct(data: Partial<Product>) {
  return db.insert('ecom_products', data);
}
export async function updateProduct(id: string, data: Partial<Product>) {
  return db.update('ecom_products', id, data);
}
export async function deleteProduct(id: string) {
  return db.remove('ecom_products', id);
}
export async function createOrder(data: Omit<Partial<Order>, 'id'>) {
  return db.insert('ecom_orders', data);
}
export async function updateOrder(id: string, data: Partial<Order>) {
  return db.update('ecom_orders', id, data);
}

export async function saveCart(userId: string, items: CartLine[]): Promise<void> {
  const carts = await db.getAll<CartRecord>('ecom_carts');
  const matching = carts.filter(cart => cart.user_id === userId);
  const [primary, ...duplicates] = matching;
  if (primary) await db.update('ecom_carts', primary.id, { items });
  else await db.insert('ecom_carts', { user_id: userId, items });
  // Clean up duplicate records left by older overlapping saves.
  for (const duplicate of duplicates) await db.remove('ecom_carts', duplicate.id);
}

export async function deleteOrder(id: string): Promise<void> {
  return db.remove('ecom_orders', id);
}
