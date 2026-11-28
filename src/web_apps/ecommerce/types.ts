import type { BaseRecord } from '@/DB/db/db_contract';

export type Product = BaseRecord & {
  name: string; description: string; category: string; price: number;
  compare_at_price?: number; discount_percent?: number; image?: string;
  stock: number; active: boolean; featured?: boolean;
};
export type CartLine = { product_id: string; quantity: number };
export type OrderItem = { product_id: string; name: string; price: number; quantity: number };
export type Order = BaseRecord & {
  user_id: string; customer_name: string; customer_email: string; items: OrderItem[];
  subtotal: number; shipping: number; total: number;
  status: 'placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'; address: string;
};
export type Address = BaseRecord & { user_id: string; full_name: string; phone: string; line1: string; city: string; postal_code: string; is_default: boolean };

export type CartRecord = BaseRecord & { user_id: string; items: CartLine[] };
