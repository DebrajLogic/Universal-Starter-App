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

export async function createReview(data: Omit<Partial<import('./types').Review>, 'id'>) {
  if (!data.user_id || !data.product_id || !data.order_id || !data.customer_name) {
    throw new Error('Review details are incomplete.');
  }
  if (!Number.isInteger(data.rating) || (data.rating ?? 0) < 1 || (data.rating ?? 0) > 5) {
    throw new Error('Choose a rating from 1 to 5 stars.');
  }
  if (typeof data.body !== 'string' || data.body.length > 1000) {
    throw new Error('Review text must be 1,000 characters or fewer.');
  }
  const [orders, reviews] = await Promise.all([
    db.getAll<import('./types').Order>('ecom_orders'),
    db.getAll<import('./types').Review>('ecom_reviews'),
  ]);
  const eligibleOrder = orders.find(order =>
    order.id === data.order_id &&
    order.user_id === data.user_id &&
    order.status === 'delivered' &&
    order.items?.some(item => item.product_id === data.product_id)
  );
  if (!eligibleOrder) throw new Error('A delivered order containing this product is required to review it.');
  if (reviews.some(review => review.user_id === data.user_id && review.product_id === data.product_id)) {
    throw new Error('You have already reviewed this product. Edit your existing review instead.');
  }
  return db.insert('ecom_reviews', { ...data, visible: true, verified_purchase: true });
}
export async function updateReview(id: string, data: Partial<import('./types').Review>) {
  return db.update('ecom_reviews', id, data);
}
export async function deleteReview(id: string): Promise<void> {
  return db.remove('ecom_reviews', id);
}
