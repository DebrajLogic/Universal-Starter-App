// Mini-app data queries. The app depends on the stable DB contract, never on a provider.
import { db } from '@/DB/db/db_switch';
import type { Product, Order } from './types';

export async function getProducts(): Promise<Product[]> {
  return db.getAll<Product>('ecom_products');
}
export async function getOrders(): Promise<Order[]> {
  return db.getAll<Order>('ecom_orders');
}
export async function getProductById(id: string): Promise<Product | null> {
  return db.getById<Product>('ecom_products', id);
}
