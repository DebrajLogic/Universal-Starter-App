// Mini-app writes. Swap the active DB adapter centrally; callers stay unchanged.
import { db } from '@/DB/db/db_switch';
import type { Product, Order } from './types';

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
