'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Search, ShoppingBag, UserRound, LayoutDashboard,
  Package, Plus, Minus, Trash2, Pencil, Check, Truck, ShieldCheck, LogOut, LoaderCircle, ChevronDown, Star,
} from 'lucide-react';
import { getProducts, getOrders, getCart, getReviews } from '../queries';
import { createProduct, updateProduct, deleteProduct as removeProduct, createOrder, updateOrder as persistOrderUpdate, deleteOrder as removeOrder, saveCart, createReview, updateReview } from '../actions';
import type { Product, Order, OrderItem, CartLine, Review } from '../types';
import { auth } from '@/AUTH/auth/auth_switch';
import type { AuthUser } from '@/AUTH/auth/auth_contract';
import { Header } from '@/shared/layout/Header';
import { Footer } from '@/shared/layout/Footer';
import { notify } from '@/shared/plugins/toast/ToastPlugin';

const PRODUCTS = [
  { name: 'Everyday Runner', description: 'A light, cushioned shoe built for daily miles and long walks.', category: 'Footwear', price: 3499, compare_at_price: 4299, stock: 18, featured: true },
  { name: 'Canvas Weekender', description: 'A roomy carry-all for quick trips, gym days, and busy weekends.', category: 'Bags', price: 2199, compare_at_price: 2799, stock: 12, featured: true },
  { name: 'Studio Headphones', description: 'Clear sound, soft ear cups, and a battery that keeps up.', category: 'Tech', price: 4999, compare_at_price: 5999, stock: 9, featured: true },
  { name: 'Field Watch', description: 'A clean everyday watch with a durable stainless-steel case.', category: 'Accessories', price: 2899, stock: 15 },
  { name: 'Classic Hoodie', description: 'A soft cotton-blend layer for cool mornings and late nights.', category: 'Clothing', price: 1799, compare_at_price: 2199, stock: 24 },
  { name: 'Minimal Desk Lamp', description: 'Warm, focused light for your desk, bedside, or reading corner.', category: 'Home', price: 1599, stock: 7 },
];

const money = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

function formatReviewDate(value?: string) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  const elapsed = Math.max(0, Date.now() - date.getTime());
  const days = elapsed / 86_400_000;
  const relative = new Intl.RelativeTimeFormat('en', { numeric: 'always' });

  if (days < 1) {
    const hours = Math.floor(elapsed / 3_600_000);
    if (hours < 1) {
      const minutes = Math.floor(elapsed / 60_000);
      return minutes < 1 ? 'Just now' : relative.format(-minutes, 'minute');
    }
    return relative.format(-hours, 'hour');
  }
  if (days < 7) return relative.format(-Math.floor(days), 'day');
  if (days < 30) return relative.format(-Math.floor(days / 7), 'week');
  if (days < 365) return relative.format(-Math.max(1, Math.floor(days / 30.4375)), 'month');
  if (days < 730) return relative.format(-Math.floor(days / 365.25), 'year');
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(date);
}
const discountPercent = (product: Product) => Number.isFinite(product.discount_percent) ? Math.min(95, Math.max(0, Number(product.discount_percent))) : product.compare_at_price && product.compare_at_price > product.price ? Math.round((1 - product.price / product.compare_at_price) * 100) : 0;
const salePrice = (product: Product) => product.price;

function ProductArt({ product, large = false, square = false, imageOverride }: { product?: Product | null; large?: boolean; square?: boolean; imageOverride?: string }) {
  const safeProduct = product && typeof product === 'object' ? product : null;
  const productName = typeof safeProduct?.name === 'string' && safeProduct.name.trim() ? safeProduct.name : 'ShopCraft Product';
  const productCategory = typeof safeProduct?.category === 'string' ? safeProduct.category : '';
  const productImage = imageOverride || (Array.isArray(safeProduct?.images) && safeProduct.images.length ? safeProduct.images[0] : typeof safeProduct?.image === 'string' ? safeProduct.image : '');
  const palettes: Record<string, string> = {
    Footwear: 'from-orange-100 to-amber-200', Bags: 'from-stone-200 to-orange-100',
    Tech: 'from-slate-200 to-blue-100', Accessories: 'from-amber-100 to-yellow-200',
    Clothing: 'from-rose-100 to-orange-100', Home: 'from-emerald-100 to-teal-100',
  };
  const symbols: Record<string, string> = { Footwear: 'SNEAKERS', Bags: 'WEEKENDER', Tech: 'AUDIO', Accessories: 'TIME', Clothing: 'ESSENTIALS', Home: 'LIGHT' };
  return (
    <div className={'relative flex items-center justify-center overflow-hidden bg-gradient-to-br ' + (palettes[productCategory] || 'from-stone-100 to-stone-200') + (large ? ' aspect-[5/4]' : square ? ' aspect-square' : ' aspect-[4/3]')}>
      {productImage ? <img src={productImage} alt={productName} className="h-full w-full object-cover" /> : (
        <div className="text-center text-color_4">
          <div className="mb-2 text-[10px] font-bold tracking-[0.35em] opacity-60">{symbols[productCategory] || 'SHOPCRAFT'}</div>
          <div className="font-serif text-4xl italic sm:text-5xl">{productName.split(' ').slice(0, 2).join(' ')}</div>
          <div className="mt-3 text-[9px] tracking-[0.3em] opacity-60">SHOPCRAFT / OBJECTS FOR EVERY DAY</div>
        </div>
      )}
      {safeProduct?.featured && <span className="absolute left-3 top-3 rounded-full bg-color_2/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-color_4">Featured</span>}
    </div>
  );
}

function StatusPill({ status }: { status: Order['status'] }) {
  const styles: Record<Order['status'], string> = {
    placed: 'bg-blue-50 text-blue-700', processing: 'bg-amber-50 text-amber-700',
    shipped: 'bg-violet-50 text-violet-700', delivered: 'bg-emerald-50 text-emerald-700',
    cancelled: 'bg-red-50 text-red-700',
  };
  return <span className={'rounded-full px-3 py-1 text-xs font-semibold capitalize ' + styles[status]}>{status}</span>;
}

function EcommerceContent({ slug = [] }: { slug?: string[] }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewBody, setReviewBody] = useState('');
  const [orderReviewProductId, setOrderReviewProductId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [cartLoaded, setCartLoaded] = useState(false);
  const cartSaveQueue = useMemo(() => ({ current: Promise.resolve() as Promise<void> }), []);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('featured');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutCity, setCheckoutCity] = useState('');
  const [checkoutPostal, setCheckoutPostal] = useState('');
  const [formError, setFormError] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({ name: '', description: '', category: 'Footwear', price: '1999', discount: '0', stock: '10', image: '', images: [''] });
  const [selectedProductImage, setSelectedProductImage] = useState(0);
  const [productEntryMode, setProductEntryMode] = useState<'manual' | 'json'>('manual');
  const [productJson, setProductJson] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [adminTab, setAdminTab] = useState<'products' | 'orders' | 'reviews' | 'analytics'>('products');
  const [accountTab, setAccountTab] = useState<'overview' | 'orders'>(slug[0] === 'orders' ? 'orders' : 'overview');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);

  const page = slug[0] || 'home';
  const productSlug = slug[1] || '';
  const isAdmin = user?.role === 'admin';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [foundProducts, foundOrders, foundReviews] = await Promise.all([
        getProducts(),
        getOrders(),
        getReviews(),
      ]);
      const validProducts = foundProducts.filter((product): product is Product =>
        Boolean(product && typeof product === 'object' && typeof product.id === 'string' &&
          typeof product.name === 'string' && typeof product.description === 'string' &&
          typeof product.category === 'string' && typeof product.price === 'number' &&
          typeof product.stock === 'number')
      );
      if (validProducts.length === 0) {
        for (const product of PRODUCTS) await createProduct({ ...product, active: true });
        const seededProducts = await getProducts();
        setProducts(seededProducts.filter((product): product is Product => Boolean(product && typeof product === 'object' && typeof product.id === 'string' && typeof product.name === 'string')));
      } else {
        setProducts(validProducts);
      }
      setOrders(foundOrders.filter((order): order is Order => Boolean(order && typeof order === 'object' && typeof order.id === 'string')));
      setReviews(foundReviews.filter((review): review is Review => Boolean(review && typeof review === 'object' && typeof review.id === 'string' && typeof review.product_id === 'string' && Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5)));
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Could not load the store.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    auth.getCurrentUser().then(async current => { if (mounted) { setUser(current); try { setCart(await getCart(current?.id ?? 'guest')); } catch { setCart([]); } setCartLoaded(true); setAuthChecked(true); } }).catch(() => { if (mounted) { setUser(null); setCart([]); setCartLoaded(true); setAuthChecked(true); } });
    void loadData();
    return () => { mounted = false; };
  }, [loadData]);

  useEffect(() => {
    if (!cartLoaded) return;
    const ownerId = user?.id ?? 'guest';
    const snapshot = cart.map(line => ({ ...line }));
    cartSaveQueue.current = cartSaveQueue.current
      .catch(() => undefined)
      .then(() => saveCart(ownerId, snapshot))
      .catch(error => notify.error(error instanceof Error ? error.message : 'Could not save your bag.'));
  }, [cart, cartLoaded, user, cartSaveQueue]);

  useEffect(() => {
    if (!user || (page !== 'orders' && !(page === 'dashboard' && accountTab === 'orders'))) return;
    // Fetch only when the customer opens order history. No background polling.
    void getOrders().then(setOrders).catch(() => undefined);
  }, [user, page, accountTab]);

  useEffect(() => {
    const productId = page === 'product' ? productSlug : '';
    const own = user && productId ? reviews.find(review => review.product_id === productId && review.user_id === user.id) : undefined;
    setReviewRating(own?.rating ?? 5);
    setReviewBody(own?.body ?? '');
  }, [user?.id, page, productSlug, reviews]);

  useEffect(() => {
    if (user) {
      setCheckoutName(user.name);
    }
  }, [user]);

  useEffect(() => {
    if (!authChecked) return;
    const protectedPage = ['checkout', 'dashboard', 'orders', 'thank-you'].includes(page) || page === 'admin';
    if (protectedPage && !user) window.location.replace('/login?next=' + encodeURIComponent('/ecommerce/' + page));
  }, [authChecked, page, user]);

  const activeProducts = useMemo(() => {
    let result = products.filter(p => p.active);
    if (category !== 'All') result = result.filter(p => p.category === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(p => (p.name + ' ' + p.description + ' ' + p.category).toLowerCase().includes(q));
    }
    if (sort === 'price-low') result.sort((a, b) => a.price - b.price);
    if (sort === 'price-high') result.sort((a, b) => b.price - a.price);
    if (sort === 'newest') result.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    if (sort === 'featured') result.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
    return result;
  }, [products, category, query, sort]);

  const cartDetails = useMemo(() => cart.map(line => {
    const product = products.find(p => p.id === line.product_id);
    return product ? { ...line, product } : null;
  }).filter(Boolean) as (CartLine & { product: Product })[], [cart, products]);
  const subtotal = cartDetails.reduce((sum, line) => sum + salePrice(line.product) * line.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= 3000 ? 0 : 99;
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  // Analytics are derived from delivered orders only.
  const deliveredOrders = orders.filter(order => order.status === 'delivered');
  const deliveredRevenue = deliveredOrders.reduce((sum, order) => sum + order.total, 0);
  const deliveredUnits = deliveredOrders.reduce((sum, order) => sum + order.items.reduce((total, item) => total + item.quantity, 0), 0);
  const bestSellers = useMemo(() => {
    const sold = new Map<string, number>();
    for (const order of orders) {
      if (order.status !== 'delivered') continue;
      for (const item of order.items) sold.set(item.product_id, (sold.get(item.product_id) || 0) + item.quantity);
    }
    return products.filter(product => product.active)
      .map(product => ({ product, units: sold.get(product.id) || 0 }))
      .filter(entry => entry.units > 0)
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);
  }, [orders, products]);
  const categorySales = useMemo(() => {
    const totals = new Map<string, number>();
    for (const order of orders) {
      if (order.status !== 'delivered') continue;
      for (const item of order.items) {
        const category = item.category || products.find(product => product.id === item.product_id)?.category || 'Other';
        totals.set(category, (totals.get(category) || 0) + item.price * item.quantity);
      }
    }
    return [...totals.entries()].map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue);
  }, [orders, products]);
  const averageOrderValue = deliveredOrders.length ? deliveredRevenue / deliveredOrders.length : 0;

  function addToCart(product: Product) {
    if (product.stock < 1) return notify.error('This item is out of stock.');
    setCart(current => {
      const found = current.find(line => line.product_id === product.id);
      if (found) return current.map(line => line.product_id === product.id ? { ...line, quantity: Math.min(line.quantity + 1, product.stock) } : line);
      return [...current, { product_id: product.id, quantity: 1 }];
    });
    notify.success('Added to your bag.');
  }

  function updateQuantity(productId: string, quantity: number) {
    const product = products.find(p => p.id === productId);
    if (quantity <= 0) return setCart(current => current.filter(line => line.product_id !== productId));
    if (product && quantity > product.stock) return notify.error('You have reached the available stock.');
    setCart(current => current.map(line => line.product_id === productId ? { ...line, quantity } : line));
  }

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    if (!checkoutName.trim() || !checkoutPhone.trim() || !checkoutAddress.trim() || !checkoutCity.trim() || !checkoutPostal.trim()) {
      setFormError('Complete every delivery field before placing your order.'); return;
    }
    if (cartDetails.length === 0) { setFormError('Your bag is empty.'); return; }
    setBusy(true);
    try {
      const freshProducts = await getProducts();
      const orderItems: OrderItem[] = [];
      for (const line of cartDetails) {
        const latest = freshProducts.find(p => p.id === line.product.id);
        if (!latest || !latest.active || latest.stock < line.quantity) throw new Error(latest ? latest.name + ' does not have enough stock.' : 'A product in your bag is no longer available.');
        orderItems.push({ product_id: latest.id, name: latest.name, price: salePrice(latest), quantity: line.quantity, image: latest.image, category: latest.category });
      }
      for (const item of orderItems) {
        const latest = freshProducts.find(p => p.id === item.product_id)!;
        await updateProduct(latest.id, { stock: latest.stock - item.quantity });
      }
      const order = await createOrder({
        user_id: user!.id, customer_name: checkoutName.trim(), customer_email: user!.email,
        items: orderItems, subtotal, shipping, total: subtotal + shipping,
        status: 'placed', address: [checkoutAddress, checkoutCity, checkoutPostal].join(', '),
      });
      setCart([]);
      await loadData();
      window.location.href = '/ecommerce/thank-you/' + order.id;
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'We could not place your order. Please try again.');
      await loadData();
    } finally { setBusy(false); }
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = {
        name: productForm.name.trim(), description: productForm.description.trim(),
        category: productForm.category, price: Math.round(Number(productForm.price) * (1 - Number(productForm.discount) / 100)), compare_at_price: Number(productForm.discount) > 0 ? Number(productForm.price) : undefined, discount_percent: Number(productForm.discount),
        stock: Number(productForm.stock), images: productForm.images.map(url => url.trim()).filter(Boolean), image: productForm.images.map(url => url.trim()).filter(Boolean)[0] || productForm.image.trim(),
        active: true,
      };
      if (!payload.name || !payload.description || !Number.isFinite(payload.price) || payload.price <= 0 || !Number.isInteger(payload.stock) || payload.stock < 0 || !Number.isInteger(payload.discount_percent) || payload.discount_percent < 0 || payload.discount_percent > 95) throw new Error('Enter valid product details. Discount must be a whole number from 0 to 95.');
      if (editing) await updateProduct(editing.id, payload);
      else await createProduct(payload);
      setEditing(null);
      setProductForm({ name: '', description: '', category: 'Footwear', price: '1999', discount: '0', stock: '10', image: '', images: [''] });
      await loadData();
      notify.success(editing ? 'Product updated.' : 'Product created.');
    } catch (error) { notify.error(error instanceof Error ? error.message : 'Could not save product.'); }
    finally { setBusy(false); }
  }

  async function importProductsFromJson() {
    setJsonError('');
    let parsed: unknown;
    try {
      parsed = JSON.parse(productJson);
    } catch {
      setJsonError('That JSON is not valid. Check commas, quotes, and brackets.');
      return;
    }

    const entries = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object' && Array.isArray((parsed as { products?: unknown }).products)
        ? (parsed as { products: unknown[] }).products
        : null;

    if (!entries || entries.length === 0) {
      setJsonError('Paste a JSON array of products, or an object with a "products" array.');
      return;
    }

    const allowedCategories = ['Footwear', 'Bags', 'Tech', 'Accessories', 'Clothing', 'Home'];
    const validated: Array<{
      name: string; description: string; category: string; price: number;
      stock: number; image?: string; images?: string[]; discount_percent: number; active: boolean; featured: boolean;
    }> = [];

    for (let index = 0; index < entries.length; index++) {
      const item = entries[index];
      const label = 'Product ' + (index + 1);
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        setJsonError(label + ' must be a JSON object.');
        return;
      }
      const row = item as Record<string, unknown>;
      const name = typeof row.name === 'string' ? row.name.trim() : '';
      const description = typeof row.description === 'string' ? row.description.trim() : '';
      const categoryValue = typeof row.category === 'string' ? row.category.trim() : '';
      const price = row.price;
      const stock = row.stock;
      const discount = row.discount_percent === undefined ? 0 : row.discount_percent;
      const image = row.image;
      const images = row.images;
      if (images !== undefined && (!Array.isArray(images) || images.some(value => typeof value !== 'string'))) {
        setJsonError(label + ': "images" must be an array of image URL strings.');
        return;
      }
      if (!name || !description) {
        setJsonError(label + ': "name" and "description" are required text fields.');
        return;
      }
      if (!allowedCategories.includes(categoryValue)) {
        setJsonError(label + ': category must be one of ' + allowedCategories.join(', ') + '.');
        return;
      }
      if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
        setJsonError(label + ': "price" must be a number greater than zero.');
        return;
      }
      if (typeof stock !== 'number' || !Number.isInteger(stock) || stock < 0) {
        setJsonError(label + ': "stock" must be a whole number (zero or more).');
        return;
      }
      if (typeof discount !== 'number' || !Number.isInteger(discount) || discount < 0 || discount > 95) {
        setJsonError(label + ': "discount_percent" must be a whole number from 0 to 95.');
        return;
      }
      if (image !== undefined && typeof image !== 'string') {
        setJsonError(label + ': "image" must be a URL string or omitted.');
        return;
      }
      if (row.active !== undefined && typeof row.active !== 'boolean') {
        setJsonError(label + ': "active" must be true or false.');
        return;
      }
      if (row.featured !== undefined && typeof row.featured !== 'boolean') {
        setJsonError(label + ': "featured" must be true or false.');
        return;
      }
      validated.push({
        name, description, category: categoryValue, price, stock,
        ...(typeof image === 'string' && image.trim() ? { image: image.trim() } : {}),
        ...(Array.isArray(images) && images.length ? { images: images.map(value => value.trim()).filter(Boolean) } : {}),
        discount_percent: discount,
        active: typeof row.active === 'boolean' ? row.active : true,
        featured: typeof row.featured === 'boolean' ? row.featured : false,
      });
    }

    setBusy(true);
    try {
      for (const product of validated) {
        await createProduct({ ...product, price: Math.round(product.price * (1 - product.discount_percent / 100)), compare_at_price: product.discount_percent > 0 ? product.price : undefined });
      }
      setProductJson('');
      await loadData();
      notify.success(validated.length + ' product' + (validated.length === 1 ? '' : 's') + ' imported.');
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Product import stopped. Some earlier products may already have been added.');
      await loadData();
    } finally {
      setBusy(false);
    }
  }

  async function toggleProduct(product: Product) {
    try {
      await updateProduct(product.id, { active: !product.active });
      await loadData();
      notify.success(product.active ? 'Product hidden from the store.' : 'Product is live in the store.');
    } catch (error) { notify.error(error instanceof Error ? error.message : 'Update failed.'); }
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm('Delete “' + product.name + '”? This cannot be undone.')) return;
    setBusy(true);
    try {
      await removeProduct(product.id);
      setEditing(current => current?.id === product.id ? null : current);
      await loadData();
      notify.success('Product deleted.');
    } catch (error) { notify.error(error instanceof Error ? error.message : 'Could not delete product.'); }
    finally { setBusy(false); }
  }

  async function submitProductReview(product: Product) {
    if (!user) { notify.error('Sign in to write a review.'); return; }
    const eligibleOrder = orders.find(order => order.user_id === user.id && order.status === 'delivered' && order.items.some(item => item.product_id === product.id));
    if (!eligibleOrder) { notify.error('You can review this product after its order is delivered.'); return; }
    const existing = reviews.find(review => review.product_id === product.id && review.user_id === user.id);
    const body = reviewBody.trim();
    if (body.length > 1000) { notify.error('Keep your review under 1,000 characters.'); return; }
    setBusy(true);
    try {
      if (existing) {
        await updateReview(existing.id, { rating: reviewRating, body, customer_name: user.name });
        setReviews(current => current.map(review => review.id === existing.id ? { ...review, rating: reviewRating, body, customer_name: user.name } : review));
      } else {
        const saved = await createReview({ product_id: product.id, user_id: user.id, order_id: eligibleOrder.id, customer_name: user.name, rating: reviewRating, body, visible: true, verified_purchase: true });
        setReviews(current => [...current, saved as Review]);
      }
      notify.success(existing ? 'Your review was updated.' : 'Thanks for sharing your review.');
    } catch (error) { notify.error(error instanceof Error ? error.message : 'Could not save your review.'); }
    finally { setBusy(false); }
  }

  async function toggleReviewVisibility(review: Review) {
    try {
      await updateReview(review.id, { visible: review.visible === false });
      setReviews(current => current.map(item => item.id === review.id ? { ...item, visible: item.visible === false } : item));
      notify.success(review.visible === false ? 'Review is now public.' : 'Review hidden from the store.');
    } catch (error) { notify.error(error instanceof Error ? error.message : 'Could not update review.'); }
  }

  async function changeOrderStatus(order: Order, status: Order['status']) {
    try {
      await persistOrderUpdate(order.id, { status });
      setOrders(current => current.map(item => item.id === order.id ? { ...item, status } : item));
      notify.success('Order status updated.');
    } catch (error) { notify.error(error instanceof Error ? error.message : 'Could not update order.'); }
  }

  async function removeOrderRecord(order: Order) {
    if (!window.confirm('Delete order #' + order.id.slice(0, 8) + '? This cannot be undone.')) return;
    try {
      await removeOrder(order.id);
      setOrders(current => current.filter(item => item.id !== order.id));
      notify.success('Order deleted.');
    } catch (error) { notify.error(error instanceof Error ? error.message : 'Could not delete order.'); }
  }

  async function changeAccountPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError('');
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Your new passwords do not match.');
      return;
    }
    setPasswordBusy(true);
    try {
      await auth.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      notify.success('Your password has been changed.');
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Could not change your password.');
    } finally {
      setPasswordBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    try { await auth.signOut(); window.location.href = '/login?next=%2Fecommerce'; }
    catch (error) { notify.error(error instanceof Error ? error.message : 'Sign out failed.'); setBusy(false); }
  }

  function startEdit(product: Product) {
    setEditing(product);
    const existingImages = Array.isArray(product.images) && product.images.length ? product.images : product.image ? [product.image] : [''];
    setProductForm({ name: product.name, description: product.description, category: product.category, price: String(product.compare_at_price || product.price), discount: String(discountPercent(product)), stock: String(product.stock), image: existingImages[0] || '', images: existingImages });
    setSelectedProductImage(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const categories = ['All', ...Array.from(new Set(products.filter(p => p.active).map(p => p.category)))];

  const nav = (
    <div className="flex items-center gap-3">
      <Link href="/ecommerce/cart" className="relative rounded-full border border-color_3 p-2.5 text-color_4 hover:bg-color_3" aria-label="Shopping bag">
        <ShoppingBag size={18} />
        {cartCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-color_6 px-1 text-[10px] font-bold text-white">{cartCount}</span>}
      </Link>
      <div className="relative">
        <button type="button" onClick={() => setAccountMenuOpen(open => !open)} aria-expanded={accountMenuOpen} aria-label="Open account menu" className={'relative flex h-10 w-10 items-center justify-center rounded-full border-2 bg-color_2 text-color_4 transition hover:bg-color_3 ' + (isAdmin ? 'border-amber-400 ring-2 ring-amber-100' : 'border-color_3')}>
          <UserRound size={18}/>
          {isAdmin && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white ring-2 ring-white"><ShieldCheck size={10}/></span>}
        </button>
        {accountMenuOpen && <div className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-xl border border-color_3 bg-color_2 py-2 shadow-xl">
          <div className="border-b border-color_3 px-4 py-3"><p className="text-sm font-semibold text-color_4">{user?.name || 'Your account'}</p><p className="mt-0.5 truncate text-xs text-color_5">{user?.email}</p>{isAdmin && <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800"><ShieldCheck size={11}/> Administrator</span>}</div>
          <Link onClick={() => setAccountMenuOpen(false)} href="/ecommerce/dashboard" className="block px-4 py-2.5 text-sm text-color_4 hover:bg-color_3">My account</Link>
          <Link onClick={() => setAccountMenuOpen(false)} href="/ecommerce/orders" className="block px-4 py-2.5 text-sm text-color_4 hover:bg-color_3">My orders</Link>
          {isAdmin && <Link onClick={() => setAccountMenuOpen(false)} href="/ecommerce/admin" className="block px-4 py-2.5 text-sm text-color_4 hover:bg-color_3">Admin dashboard</Link>}
          <button type="button" onClick={() => { setAccountMenuOpen(false); void signOut(); }} className="mt-1 flex w-full items-center gap-2 border-t border-color_3 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"><LogOut size={15}/> Sign out</button>
        </div>}
      </div>
    </div>
  );

  if (loading || !authChecked) return <div className="flex min-h-screen items-center justify-center gap-3 bg-color_1 text-sm text-color_5"><LoaderCircle className="animate-spin" size={20}/> Loading ShopCraft...</div>;

  if (page === 'admin' && !isAdmin) return (
    <div className="min-h-screen bg-color_1 px-6 py-24 text-center"><ShieldCheck className="mx-auto mb-4" size={36}/><h1 className="text-2xl font-semibold">Admin access required</h1><p className="mt-2 text-color_5">This local account is not on the admin allowlist.</p><Link className="mt-6 inline-flex rounded-full bg-color_6 px-5 py-3 text-sm text-white" href="/ecommerce">Back to store</Link></div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-color_1 text-color_4">
      <Header brandName="SHOPCRAFT" brandHref="/ecommerce" navItems={[{ label: 'Shop', href: '/ecommerce' }]} rightSlot={nav} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8 lg:px-10">
        {page !== 'home' && <div className="mb-6"><Link href={page === 'product' ? '/ecommerce' : page === 'checkout' ? '/ecommerce/cart' : '/ecommerce'} className="inline-flex items-center gap-2 rounded-full border border-color_3 bg-color_2 px-4 py-2.5 text-sm font-medium text-color_4 transition hover:border-color_6 hover:bg-color_3"><ArrowLeft size={16}/> {page === 'product' ? 'Back to shop' : page === 'checkout' ? 'Back to cart' : 'Back to shop'}</Link></div>}
        {page === 'home' && <>
          <section className="relative overflow-hidden rounded-[2rem] border border-color_3 bg-color_2 px-7 py-14 text-color_4 shadow-sm sm:px-14 sm:py-20">
            <div className="relative z-10 max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-color_5">The everyday edit / 2026</p>
              <h1 className="mt-5 font-serif text-5xl leading-[1.05] tracking-tight sm:text-7xl">Good things.<br/><i>Made to last.</i></h1>
              <p className="mt-5 max-w-md text-sm leading-6 text-color_5">Thoughtful essentials for the way you live, work, and move. Find your next everyday favourite.</p>
              <a href="#shop" className="mt-8 inline-flex items-center gap-3 rounded-full bg-stone-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-stone-700 hover:shadow-md active:translate-y-0 dark:bg-color_6 dark:hover:bg-color_6">Explore the collection <ArrowRight size={16}/></a>
            </div>
            <div className="pointer-events-none absolute -right-8 -top-10 hidden h-[440px] w-[440px] rounded-full border border-color_3/70 lg:block"/>
            <div className="pointer-events-none absolute right-16 top-12 hidden h-[310px] w-[310px] rounded-full border border-color_3/70 lg:block"/>
            <div className="pointer-events-none absolute bottom-0 right-20 hidden h-72 w-56 rotate-12 rounded-t-full bg-gradient-to-br from-color_7/50 to-color_6/20 opacity-70 lg:block"/>
          </section>
          {bestSellers.length > 0 && <section className="pt-16"><div><p className="text-xs font-bold uppercase tracking-[0.25em] text-color_5">Loved by customers</p><h2 className="mt-2 font-serif text-4xl">Best sellers</h2><p className="mt-2 text-sm text-color_5">Ranked by delivered orders.</p></div><div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{bestSellers.slice(0,3).map(({product,units},index) => <article key={product.id} className="group"><Link href={'/ecommerce/product/'+product.id} className="block overflow-hidden rounded-2xl"><div className="relative transition duration-500 group-hover:scale-[1.02]"><ProductArt product={product}/><span className="absolute left-3 top-3 rounded-full bg-emerald-700 px-3 py-1 text-[10px] font-semibold text-white">#{index+1} bestseller</span></div></Link><div className="flex items-start justify-between gap-3 pt-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-color_5">{product.category} · {units} sold</p><Link href={'/ecommerce/product/'+product.id} className="mt-1 block font-medium hover:underline">{product.name}</Link><p className="mt-1 text-sm text-color_5">{money(salePrice(product))}</p></div><button onClick={() => addToCart(product)} disabled={product.stock<1} className="rounded-full border border-color_3 p-3 transition hover:bg-color_6 hover:text-white disabled:opacity-40" aria-label={'Add '+product.name+' to bag'}><Plus size={17}/></button></div></article>)}</div></section>}
          <section id="shop" className="pt-16">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div><p className="text-xs font-bold uppercase tracking-[0.25em] text-color_5">Curated for you</p><h2 className="mt-2 font-serif text-4xl">The collection</h2></div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="flex items-center gap-2 rounded-full border border-color_3 bg-color_2 px-4 py-2.5"><Search size={16} className="text-color_5"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products..." className="w-48 bg-transparent text-sm outline-none"/></label>
                <select value={sort} onChange={e => setSort(e.target.value)} className="rounded-full border border-color_3 bg-color_2 px-4 py-2.5 text-sm outline-none"><option value="featured">Featured first</option><option value="newest">Newest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select>
              </div>
            </div>
            <div className="mt-7 flex flex-wrap gap-2">{categories.map(c => <button key={c} onClick={() => setCategory(c)} className={'rounded-full px-4 py-2 text-xs font-semibold transition ' + (category === c ? 'bg-color_6 text-white' : 'border border-color_3 bg-color_2 text-color_5 hover:border-color_6')}>{c}</button>)}</div>
            <div className="mt-7 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {activeProducts.map(product => <article key={product.id} className="group">
                <Link href={'/ecommerce/product/' + product.id} className="block overflow-hidden rounded-2xl"><div className="transition duration-500 group-hover:scale-[1.02]"><ProductArt product={product}/></div></Link>
                <div className="flex items-start justify-between gap-3 pt-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-color_5">{product.category}</p><Link href={'/ecommerce/product/' + product.id} className="mt-1 block font-medium hover:underline">{product.name}</Link>{(() => { const visibleReviews = reviews.filter(review => review.product_id === product.id && review.visible !== false); const average = visibleReviews.length ? visibleReviews.reduce((sum, review) => sum + review.rating, 0) / visibleReviews.length : 0; return visibleReviews.length ? <div className="mt-1 flex items-center gap-1.5"><Star size={12} className="fill-amber-400 text-amber-500"/><span className="text-xs font-semibold">{average.toFixed(1)}</span><span className="text-[11px] text-color_5">({visibleReviews.length})</span></div> : <p className="mt-1 text-[11px] text-color_5">No reviews yet</p>; })()}<p className="mt-1 text-sm text-color_5">{money(salePrice(product))} {discountPercent(product) > 0 && <><del className="ml-1 text-xs text-color_5">{money(product.compare_at_price || product.price)}</del><span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">{discountPercent(product)}% OFF</span></>}</p></div><button onClick={() => addToCart(product)} disabled={product.stock < 1} className="rounded-full border border-color_3 p-3 transition hover:bg-color_6 hover:text-white disabled:opacity-40" aria-label={'Add ' + product.name + ' to bag'}><Plus size={17}/></button></div>
                <p className="mt-2 text-xs text-color_5">{product.stock > 0 ? (product.stock < 5 ? 'Only ' + product.stock + ' left' : 'In stock') : 'Sold out'}</p>
              </article>)}
            </div>
            {activeProducts.length === 0 && <div className="py-20 text-center text-sm text-color_5">No products match that search. Try another term.</div>}
          </section>
        </>}

        {page === 'product' && (() => {
          const product = products.find(p => p.id === slug[1] && p.active);
          if (!product) return <div className="py-24 text-center"><h1 className="font-serif text-3xl">Product not found</h1><Link href="/ecommerce" className="mt-5 inline-block underline">Back to the store</Link></div>;
          const productReviews = reviews.filter(review => review.product_id === product.id && review.visible !== false);
          const averageRating = productReviews.length ? productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length : 0;
          const customerOrder = user ? orders.find(order => order.user_id === user.id && order.status === 'delivered' && order.items.some(item => item.product_id === product.id)) : undefined;
          const ownReview = user ? reviews.find(review => review.product_id === product.id && review.user_id === user.id) : undefined;
          return <><div className="grid gap-10 py-8 md:grid-cols-2"><div className="space-y-3"><button type="button" onClick={() => setSelectedProductImage(current => current === 0 ? 0 : current)} className="block w-full overflow-hidden rounded-3xl"><ProductArt product={product} large imageOverride={(product.images?.length ? product.images : product.image ? [product.image] : [])[selectedProductImage]}/></button>{(product.images?.length ? product.images : product.image ? [product.image] : []).length > 1 && <div className="grid grid-cols-4 gap-3">{(product.images?.length ? product.images : product.image ? [product.image] : []).map((image,index) => <button key={image+index} type="button" onClick={() => setSelectedProductImage(index)} className={'aspect-square overflow-hidden rounded-xl border-2 transition ' + (selectedProductImage===index?'border-color_6':'border-color_3 hover:border-color_5')} aria-label={'View product image '+(index+1)}><img src={image} alt={product.name+' view '+(index+1)} className="h-full w-full object-cover"/></button>)}</div>}</div><div className="flex flex-col justify-center"><p className="text-xs font-bold uppercase tracking-[0.25em] text-color_5">{product.category}</p><h1 className="mt-3 font-serif text-5xl">{product.name}</h1><div className="mt-3 flex items-center gap-2">{productReviews.length ? <><div className="flex items-center gap-0.5">{[1,2,3,4,5].map(n => <Star key={n} size={15} className={n <= Math.round(averageRating) ? 'fill-amber-400 text-amber-500' : 'text-color_5'}/>)}</div><span className="text-sm font-semibold">{averageRating.toFixed(1)}</span><a href="#product-reviews" className="text-xs text-color_5 underline">{productReviews.length} {productReviews.length === 1 ? 'review' : 'reviews'}</a></> : <span className="text-xs text-color_5">No reviews yet</span>}</div><p className="mt-5 text-2xl">{money(salePrice(product))} {discountPercent(product) > 0 && <><del className="ml-2 text-base text-color_5">{money(product.compare_at_price || product.price)}</del><span className="ml-2 rounded-full bg-amber-100 px-2 py-1 align-middle text-xs font-semibold text-amber-900">{discountPercent(product)}% OFF</span></>}</p><p className="mt-6 max-w-lg leading-7 text-color_5">{product.description}</p><div className="mt-6">{product.stock > 0 ? <span className={'inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ' + (product.stock < 5 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700')}>{product.stock < 5 ? 'Only ' + product.stock + ' left' : product.stock + ' available'}</span> : <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700"><span className="h-1.5 w-1.5 rounded-full bg-rose-500"/>Currently sold out</span>}</div>{(() => { const bagLine = cart.find(line => line.product_id === product.id); return bagLine ? <div className="mt-8 flex w-full max-w-sm items-center justify-between rounded-full border border-color_3 bg-color_2 p-1.5 shadow-sm"><button type="button" onClick={() => updateQuantity(product.id, bagLine.quantity - 1)} className="flex h-12 w-12 items-center justify-center rounded-full text-color_4 transition hover:bg-color_3 hover:text-color_6 active:scale-95" aria-label="Remove one from bag"><Minus size={18}/></button><span className="min-w-20 text-center text-sm font-semibold tabular-nums">{bagLine.quantity} in bag</span><button type="button" onClick={() => updateQuantity(product.id, bagLine.quantity + 1)} disabled={bagLine.quantity >= product.stock} className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-900 text-white transition hover:scale-105 hover:bg-stone-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-color_6 dark:hover:bg-color_6" aria-label="Add one to bag"><Plus size={18}/></button></div> : <button disabled={product.stock < 1} onClick={() => addToCart(product)} className="mt-8 inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-full bg-stone-900 px-6 py-4 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-stone-700 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-color_6 dark:hover:bg-color_6"><ShoppingBag size={17}/> Add to bag</button>; })()}<div className="mt-8 grid max-w-sm grid-cols-2 gap-4 border-t border-color_3 pt-6 text-xs text-color_5"><p>Free shipping<br/><b className="mt-1 inline-block text-color_4">Orders over ₹3,000</b></p><p>Easy support<br/><b className="mt-1 inline-block text-color_4">We're here to help</b></p></div></div></div><section id="product-reviews" className="border-t border-color_3 py-12"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-color_5">Customer feedback</p><h2 className="mt-2 font-serif text-3xl">Reviews</h2></div>{productReviews.length > 0 && <div className="text-right"><p className="text-3xl font-semibold">{averageRating.toFixed(1)} / 5</p><p className="text-xs text-color_5">From {productReviews.length} verified {productReviews.length === 1 ? 'review' : 'reviews'}</p></div>}</div><div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]"><div className="space-y-4">{productReviews.length === 0 ? <p className="rounded-xl bg-color_2 p-6 text-sm text-color_5">No reviews yet. Be the first verified customer to share your experience.</p> : productReviews.slice().sort((a,b) => (b.created_at || '').localeCompare(a.created_at || '')).map(review => <article key={review.id} className="rounded-xl border border-color_3 bg-color_2 p-4 transition-colors"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-color_3 text-sm font-semibold text-color_4">{(review.customer_name || 'C').trim().charAt(0).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm"><span className="font-semibold text-color_4">{review.customer_name}</span><span className="text-xs text-color_5">·</span><span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700"><Check size={12}/> Verified purchase</span><span className="text-xs text-color_5">·</span><time className="text-xs text-color_5" dateTime={review.created_at || undefined}>{formatReviewDate(review.created_at)}</time></div><div className="mt-1.5 flex items-center gap-0.5">{[1,2,3,4,5].map(n => <Star key={n} size={13} className={n <= review.rating ? 'fill-amber-400 text-amber-500' : 'text-color_5'}/>)}</div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-color_4">{review.body?.trim() || 'This customer left a rating without a written comment.'}</p></div></div></article>)}</div><aside className="h-fit rounded-2xl bg-color_2 p-5"><h3 className="font-semibold">{ownReview ? 'Edit your review' : 'Write a review'}</h3>{customerOrder || ownReview ? <><p className="mt-2 text-xs leading-5 text-color_5">Only customers with a delivered order can review this product.</p><div className="mt-4 flex gap-1" role="group" aria-label="Your rating">{[1,2,3,4,5].map(n => <button key={n} type="button" onClick={() => setReviewRating(n)} aria-label={n + ' stars'}><Star size={25} className={n <= reviewRating ? 'fill-amber-400 text-amber-500' : 'text-color_5'}/></button>)}</div><textarea value={reviewBody} onChange={e => setReviewBody(e.target.value)} maxLength={1000} rows={5} placeholder="What did you think of this product?" className="mt-4 w-full rounded-lg border border-color_3 bg-color_1 p-3 text-sm"/><p className="mt-1 text-right text-[11px] text-color_5">{reviewBody.length}/1000</p><button type="button" disabled={busy} onClick={() => void submitProductReview(product)} className="mt-3 w-full rounded-full bg-color_6 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{ownReview ? 'Update review' : 'Submit review'}</button></> : <p className="mt-2 text-sm leading-6 text-color_5">{user ? 'You can leave a review after this product is delivered.' : 'Sign in and order this product. You can review it after delivery.'}</p>}</aside></div></section></>;
        })()}

        {page === 'cart' && <section className="mx-auto max-w-4xl py-8"><p className="text-xs font-bold uppercase tracking-[0.25em] text-color_5">Your selection</p><h1 className="mt-2 font-serif text-5xl">Shopping bag</h1>{cartDetails.length === 0 ? <div className="py-20 text-center"><ShoppingBag className="mx-auto mb-4 text-stone-300" size={42}/><p className="text-color_5">Your bag is waiting for something good.</p><Link href="/ecommerce" className="mt-6 inline-flex rounded-full bg-color_6 px-6 py-3 text-sm text-white">Explore the store</Link></div> : <div className="mt-10 grid gap-10 md:grid-cols-[1fr_300px]"><div className="space-y-5">{cartDetails.map(line => <div key={line.product.id} className="flex gap-4 border-b border-color_3 pb-5"><div className="w-28 shrink-0 overflow-hidden rounded-xl"><ProductArt product={line.product}/></div><div className="min-w-0 flex-1"><p className="font-medium">{line.product.name}</p><p className="mt-1 text-sm text-color_5">{money(salePrice(line.product))}</p><div className="mt-4 inline-flex items-center gap-3 rounded-full border border-color_3 px-3 py-1.5"><button onClick={() => updateQuantity(line.product.id, line.quantity - 1)} aria-label="Decrease quantity"><Minus size={13}/></button><span className="text-sm tabular-nums">{line.quantity}</span><button onClick={() => updateQuantity(line.product.id, line.quantity + 1)} aria-label="Increase quantity"><Plus size={13}/></button></div></div><div className="text-right"><p className="font-medium">{money(salePrice(line.product) * line.quantity)}</p><button onClick={() => updateQuantity(line.product.id, 0)} className="mt-3 text-xs text-color_5 hover:text-red-600"><Trash2 size={15}/></button></div></div>)}</div><aside className="h-fit rounded-2xl bg-color_2 p-6"><h2 className="font-semibold">Order summary</h2><div className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><span className="text-color_5">Subtotal</span><span>{money(subtotal)}</span></div><div className="flex justify-between"><span className="text-color_5">Shipping</span><span>{shipping ? money(shipping) : 'Free'}</span></div><div className="flex justify-between border-t border-color_3 pt-4 text-base font-semibold"><span>Total</span><span>{money(subtotal + shipping)}</span></div></div><Link href="/ecommerce/checkout" className="mt-6 flex items-center justify-center rounded-full bg-color_6 px-5 py-3.5 text-sm font-semibold text-white">Continue to checkout <ArrowRight size={15} className="ml-2"/></Link><p className="mt-4 text-center text-[11px] text-color_5">Shipping is free on orders over ₹3,000.</p></aside></div>}</section>}

        {page === 'checkout' && <section className="mx-auto max-w-5xl py-8"><p className="text-xs font-bold uppercase tracking-[0.25em] text-color_5">Almost yours</p><h1 className="mt-2 font-serif text-5xl">Checkout</h1>{cartDetails.length === 0 ? <div className="py-16 text-center text-color_5">Your bag is empty. <Link className="underline" href="/ecommerce">Shop now</Link></div> : <div className="mt-10 grid gap-10 md:grid-cols-[1fr_340px]"><form onSubmit={placeOrder} className="space-y-5 rounded-2xl bg-color_2 p-6 sm:p-8"><h2 className="text-lg font-semibold">Delivery details</h2>{formError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</p>}<label className="block text-sm">Full name<input required value={checkoutName} onChange={e => setCheckoutName(e.target.value)} className="mt-2 w-full rounded-lg border border-color_3 px-3 py-3 outline-none focus:border-color_6"/></label><label className="block text-sm">Phone number<input required value={checkoutPhone} onChange={e => setCheckoutPhone(e.target.value)} className="mt-2 w-full rounded-lg border border-color_3 px-3 py-3 outline-none focus:border-color_6" placeholder="Your contact number"/></label><label className="block text-sm">Street address<textarea required value={checkoutAddress} onChange={e => setCheckoutAddress(e.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-color_3 px-3 py-3 outline-none focus:border-color_6"/></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm">City<input required value={checkoutCity} onChange={e => setCheckoutCity(e.target.value)} className="mt-2 w-full rounded-lg border border-color_3 px-3 py-3 outline-none"/></label><label className="block text-sm">PIN code<input required value={checkoutPostal} onChange={e => setCheckoutPostal(e.target.value)} className="mt-2 w-full rounded-lg border border-color_3 px-3 py-3 outline-none"/></label></div><div className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">Demo checkout only. No payment is collected. Your order is saved to this browser.</div><button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-color_6 px-5 py-4 text-sm font-semibold text-white disabled:opacity-50">{busy && <LoaderCircle className="animate-spin" size={16}/>}Place demo order · {money(subtotal + shipping)}</button></form><aside className="h-fit rounded-2xl bg-color_2 p-6"><h2 className="font-semibold">Your order</h2>{cartDetails.map(line => <div key={line.product.id} className="flex justify-between gap-3 border-b border-color_3 py-4 text-sm"><span>{line.product.name} × {line.quantity}</span><b>{money(salePrice(line.product) * line.quantity)}</b></div>)}<div className="mt-4 flex justify-between text-sm"><span>Shipping</span><span>{shipping ? money(shipping) : 'Free'}</span></div><div className="mt-4 flex justify-between border-t border-color_3 pt-4 font-semibold"><span>Total</span><span>{money(subtotal + shipping)}</span></div></aside></div>}</section>}

        {page === 'thank-you' && (() => {
          const confirmedOrder = orders.find(order => order.id === productSlug && order.user_id === user?.id);
          return <section className="mx-auto max-w-3xl py-12 sm:py-20">
            <div className="rounded-3xl border border-color_3 bg-color_2 px-6 py-10 text-center shadow-sm sm:px-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"><Check size={30}/></div>
              <p className="mt-6 text-xs font-bold uppercase tracking-[0.25em] text-color_5">Order received</p>
              <h1 className="mt-3 font-serif text-4xl sm:text-5xl">Thank you for your order.</h1>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-color_5">{confirmedOrder ? 'Your order is saved. You can check its status and details any time from your order history.' : 'Your order has been placed. You can view its details in your order history.'}</p>
              {confirmedOrder && <div className="mx-auto mt-7 max-w-md rounded-2xl border border-color_3 bg-color_1 p-5 text-left">
                <div className="flex items-center justify-between gap-3"><span className="text-xs text-color_5">Order number</span><b className="font-mono text-sm">#{confirmedOrder.id.slice(0,8)}</b></div>
                <div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-color_5">Items</span><b className="text-sm">{confirmedOrder.items.reduce((sum,item) => sum + item.quantity,0)}</b></div>
                <div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-color_5">Order total</span><b className="text-lg">{money(confirmedOrder.total)}</b></div>
                <div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-color_5">Status</span><StatusPill status={confirmedOrder.status}/></div>
              </div>}
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/ecommerce" className="inline-flex items-center justify-center gap-2 rounded-full bg-color_6 px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:opacity-90"><ShoppingBag size={16}/> Continue shopping</Link>
                <Link href="/ecommerce/orders" className="inline-flex items-center justify-center gap-2 rounded-full border border-color_3 px-6 py-3.5 text-sm font-semibold transition hover:bg-color_3"><Package size={16}/> View my orders</Link>
              </div>
            </div>
          </section>;
        })()}
        {(page === 'dashboard' || page === 'orders') && <section className="py-8"><p className="text-xs font-bold uppercase tracking-[0.25em] text-color_5">Your space</p><h1 className="mt-2 font-serif text-5xl">Hello, {user?.name.split(' ')[0]}.</h1><p className="mt-3 text-color_5">Your orders, your details, all in one place.</p><div className="mt-10 grid gap-6 lg:grid-cols-[260px_1fr]"><aside className="h-fit rounded-2xl bg-color_2 p-5"><div className="flex items-center gap-3 border-b border-color_3 pb-5"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-color_3"><UserRound/></div><div><p className="font-medium">{user?.name}</p><p className="text-xs text-color_5">{user?.email}</p></div></div><nav className="mt-4 space-y-1 text-sm"><button type="button" onClick={() => { setAccountTab('overview'); if (page !== 'dashboard') window.history.replaceState(null, '', '/ecommerce/dashboard'); }} className={'block w-full rounded-lg px-3 py-2.5 text-left ' + (accountTab === 'overview' ? 'bg-color_3 font-medium' : 'hover:bg-color_3')}>Overview</button><button type="button" onClick={() => { setAccountTab('orders'); if (page !== 'orders') window.history.replaceState(null, '', '/ecommerce/orders'); }} className={'block w-full rounded-lg px-3 py-2.5 text-left ' + (accountTab === 'orders' ? 'bg-color_3 font-medium' : 'hover:bg-color_3')}>My orders</button>{isAdmin && <Link href="/ecommerce/admin" className="block rounded-lg px-3 py-2.5 hover:bg-color_3">Admin panel</Link>}<button onClick={() => void signOut()} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-red-600 hover:bg-red-50"><LogOut size={15}/> Sign out</button></nav></aside><div className="min-w-0">{accountTab === 'overview' ? <><div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-color_2 p-5"><Package className="text-color_5"/><p className="mt-4 text-3xl font-semibold">{orders.filter(o => o.user_id === user?.id).length}</p><p className="text-xs text-color_5">Total orders</p></div><div className="rounded-2xl bg-color_2 p-5"><Truck className="text-color_5"/><p className="mt-4 text-3xl font-semibold">{orders.filter(o => o.user_id === user?.id && ['placed','processing','shipped'].includes(o.status)).length}</p><p className="text-xs text-color_5">On the way</p></div><div className="rounded-2xl bg-color_2 p-5"><Check className="text-color_5"/><p className="mt-4 text-3xl font-semibold">{orders.filter(o => o.user_id === user?.id && o.status === 'delivered').length}</p><p className="text-xs text-color_5">Delivered</p></div></div><section className="mt-6 rounded-2xl bg-color_2 p-6"><div><h2 className="text-lg font-semibold">Account security</h2><p className="mt-1 text-sm text-color_5">Change the password you use to sign in.</p></div><form onSubmit={changeAccountPassword} className="mt-5 grid gap-3 sm:grid-cols-2"><label className="block text-xs font-medium text-color_5 sm:col-span-2">Current password<input required type="password" autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} className="mt-1.5 w-full rounded-lg border border-color_3 bg-color_1 px-3 py-2.5 text-sm text-color_4 outline-none focus:border-color_6"/></label><label className="block text-xs font-medium text-color_5">New password<input required type="password" minLength={8} maxLength={128} autoComplete="new-password" value={newPassword} onChange={event => setNewPassword(event.target.value)} className="mt-1.5 w-full rounded-lg border border-color_3 bg-color_1 px-3 py-2.5 text-sm text-color_4 outline-none focus:border-color_6"/></label><label className="block text-xs font-medium text-color_5">Confirm new password<input required type="password" minLength={8} maxLength={128} autoComplete="new-password" value={confirmNewPassword} onChange={event => setConfirmNewPassword(event.target.value)} className="mt-1.5 w-full rounded-lg border border-color_3 bg-color_1 px-3 py-2.5 text-sm text-color_4 outline-none focus:border-color_6"/></label>{passwordError && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500 sm:col-span-2">{passwordError}</p>}<div className="sm:col-span-2"><button type="submit" disabled={passwordBusy || !currentPassword || !newPassword || !confirmNewPassword} className="rounded-full bg-color_6 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{passwordBusy ? 'Updating…' : 'Change password'}</button></div></form></section><div className="mt-8 rounded-2xl bg-color_2 p-6"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Recent orders</h2><button type="button" onClick={() => { setAccountTab('orders'); if (page !== 'orders') window.history.replaceState(null, '', '/ecommerce/orders'); }} className="text-sm underline">View all</button></div>{orders.filter(o => o.user_id === user?.id).length === 0 ? <p className="py-12 text-center text-sm text-color_5">Your first order will show up here.</p> : orders.filter(o => o.user_id === user?.id).slice().sort((a,b) => (b.created_at || '').localeCompare(a.created_at || '')).slice(0,5).map(order => <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-color_3 py-4 text-sm"><div><p className="font-medium">Order #{order.id.slice(0,8)}</p><p className="mt-1 text-xs text-color_5">{new Date(order.created_at || Date.now()).toLocaleDateString()} · {order.items.length} items</p></div><div className="flex items-center gap-4"><StatusPill status={order.status}/><b>{money(order.total)}</b></div></div>)}</div></> : <div className="rounded-2xl bg-color_2 p-6"><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.25em] text-color_5">Order history</p><h2 className="mt-2 font-serif text-3xl">Your orders</h2></div>{orders.filter(o => o.user_id === user?.id).length === 0 ? <p className="py-12 text-center text-sm text-color_5">No orders yet. Your next favourite is waiting.</p> : orders.filter(o => o.user_id === user?.id).slice().sort((a,b) => (b.created_at || '').localeCompare(a.created_at || '')).map(order => <article key={order.id} className="border-b border-color_3 py-5 last:border-0"><button type="button" onClick={() => setExpandedOrderId(current => current === order.id ? null : order.id)} aria-expanded={expandedOrderId === order.id} className="flex w-full flex-wrap items-center justify-between gap-3 text-left"><div className="min-w-0 flex-1"><p className="font-semibold">Order #{order.id.slice(0,8)}</p><p className="mt-1 text-xs text-color_5">{new Date(order.created_at || Date.now()).toLocaleString()} · {order.items.reduce((sum,item) => sum + item.quantity,0)} items</p><div className="mt-3 flex items-center gap-2">{order.items.slice(0,4).map(item => <div key={item.product_id} className="h-12 w-12 overflow-hidden rounded-lg border border-color_3 bg-color_3" title={item.name}><ProductArt product={products.find(product => product.id === item.product_id) || {id:item.product_id,name:item.name,description:'',category:item.category || '',price:item.price,stock:0,active:true,image:item.image} as Product} square/></div>)}{order.items.length > 4 && <span className="flex h-12 min-w-12 items-center justify-center rounded-lg bg-color_3 px-2 text-xs font-semibold text-color_5">+{order.items.length - 4} more</span>}</div></div><div className="flex shrink-0 items-center gap-3"><StatusPill status={order.status}/><b>{money(order.total)}</b><ChevronDown size={17} className={'transition-transform ' + (expandedOrderId === order.id ? 'rotate-180' : '')}/></div></button>{expandedOrderId === order.id && <div className="mt-5 rounded-xl bg-color_3 p-4"><h3 className="text-sm font-semibold">Order details</h3><div className="mt-3 space-y-3">{order.items.map(item => <><div key={item.product_id} className="flex items-center gap-3"><div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-color_2"><ProductArt product={products.find(product => product.id === item.product_id) || {id:item.product_id,name:item.name,description:'',category:item.category || '',price:item.price,stock:0,active:true,image:item.image} as Product} square/></div><div className="min-w-0 flex-1"><p className="text-sm font-medium">{item.name}</p><p className="mt-1 text-xs text-color_5">Qty {item.quantity} · {money(item.price)} each</p></div><b className="text-sm">{money(item.price * item.quantity)}</b></div>{order.status === 'delivered' && <div className="ml-[68px] mt-2"><button type="button" onClick={() => { const product = products.find(p => p.id === item.product_id); if (!product) return notify.error('This product is no longer in the catalog.'); const own = reviews.find(r => r.product_id === item.product_id && r.user_id === user?.id); setOrderReviewProductId(current => current === item.product_id ? null : item.product_id); setReviewRating(own?.rating ?? 5); setReviewBody(own?.body ?? ''); }} className="text-xs font-semibold text-color_6 underline">{reviews.some(r => r.product_id === item.product_id && r.user_id === user?.id) ? 'Edit review' : 'Write a review'}</button>{orderReviewProductId === item.product_id && <div className="mt-3 rounded-xl border border-color_3 bg-color_1 p-4"><p className="text-sm font-semibold">Review {item.name}</p><div className="mt-3 flex gap-1" role="group" aria-label="Choose rating">{[1,2,3,4,5].map(n => <button key={n} type="button" onClick={() => setReviewRating(n)} aria-label={n + ' stars'}><Star size={21} className={n <= reviewRating ? 'fill-amber-400 text-amber-500' : 'text-color_5'}/></button>)}</div><textarea value={reviewBody} onChange={e => setReviewBody(e.target.value)} maxLength={1000} rows={3} placeholder="Share your experience..." className="mt-3 w-full rounded-lg border border-color_3 bg-color_2 p-3 text-sm"/><div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => setOrderReviewProductId(null)} className="rounded-full border border-color_3 px-4 py-2 text-xs">Cancel</button><button type="button" disabled={busy} onClick={() => { const product = products.find(p => p.id === item.product_id); if (product) void submitProductReview(product).then(() => setOrderReviewProductId(null)); }} className="rounded-full bg-color_6 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{reviews.some(r => r.product_id === item.product_id && r.user_id === user?.id) ? 'Update review' : 'Submit review'}</button></div></div>}</div>}</>)} </div><div className="mt-4 border-t border-color_3 pt-3 text-sm"><div className="flex justify-between"><span className="text-color_5">Subtotal</span><span>{money(order.subtotal)}</span></div><div className="mt-2 flex justify-between"><span className="text-color_5">Shipping</span><span>{order.shipping ? money(order.shipping) : 'Free'}</span></div><div className="mt-2 flex justify-between font-semibold"><span>Total</span><span>{money(order.total)}</span></div></div><p className="mt-4 text-xs leading-5 text-color_5">Deliver to: {order.address}</p></div>}</article>)}</div>}</div></div></section>}
        {page === 'admin' && <section className="py-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.25em] text-color_5">Store management</p><h1 className="mt-2 font-serif text-5xl">Admin dashboard</h1><p className="mt-2 text-sm text-color_5">Manage the catalog and local demo orders.</p></div><span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800">Local demo admin</span></div><div className="mt-8 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-color_2 p-5"><Package className="text-color_5"/><p className="mt-4 text-3xl font-semibold">{products.length}</p><p className="text-xs text-color_5">Products</p></div><div className="rounded-2xl bg-color_2 p-5"><ShoppingBag className="text-color_5"/><p className="mt-4 text-3xl font-semibold">{orders.length}</p><p className="text-xs text-color_5">Orders</p></div><div className="rounded-2xl bg-color_2 p-5"><span className="text-xl font-semibold">₹</span><p className="mt-4 text-3xl font-semibold">{money(orders.filter(o => o.status === 'delivered').reduce((sum,o) => sum + o.total,0))}</p><p className="text-xs text-color_5">Total sales · delivered</p></div></div><div className="mt-8 flex gap-2"><button onClick={() => setAdminTab('products')} className={'rounded-full px-5 py-2.5 text-sm ' + (adminTab === 'products' ? 'bg-color_6 text-white' : 'bg-color_2')}>Products</button><button onClick={() => setAdminTab('orders')} className={'rounded-full px-5 py-2.5 text-sm ' + (adminTab === 'orders' ? 'bg-color_6 text-white' : 'bg-color_2')}>Orders</button><button onClick={() => setAdminTab('reviews')} className={'rounded-full px-5 py-2.5 text-sm ' + (adminTab === 'reviews' ? 'bg-color_6 text-white' : 'bg-color_2')}>Reviews</button><button onClick={() => setAdminTab('analytics')} className={'rounded-full px-5 py-2.5 text-sm ' + (adminTab === 'analytics' ? 'bg-color_6 text-white' : 'bg-color_2')}>Analytics</button></div>{adminTab === 'analytics' && <div className="mt-6 space-y-6"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><div className="rounded-2xl bg-color_2 p-5"><p className="text-xs text-color_5">Delivered revenue</p><p className="mt-3 text-3xl font-semibold">{money(deliveredRevenue)}</p></div><div className="rounded-2xl bg-color_2 p-5"><p className="text-xs text-color_5">Delivered orders</p><p className="mt-3 text-3xl font-semibold">{deliveredOrders.length}</p></div><div className="rounded-2xl bg-color_2 p-5"><p className="text-xs text-color_5">Units sold</p><p className="mt-3 text-3xl font-semibold">{deliveredUnits}</p></div><div className="rounded-2xl bg-color_2 p-5"><p className="text-xs text-color_5">Average order value</p><p className="mt-3 text-3xl font-semibold">{money(averageOrderValue)}</p></div></div><div className="grid gap-5 lg:grid-cols-2"><section className="rounded-2xl bg-color_2 p-5"><h2 className="font-semibold">Best-selling products</h2><p className="mt-1 text-xs text-color_5">Ranked by units in delivered orders</p>{bestSellers.length ? <div className="mt-5 space-y-4">{bestSellers.map(({product,units}) => <div key={product.id} className="flex items-center gap-3"><div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-color_3"><ProductArt product={product} square/></div><div className="min-w-0 flex-1"><div className="flex justify-between gap-3 text-sm"><span className="truncate font-medium">{product.name}</span><b>{units}</b></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-color_3"><div className="h-full rounded-full bg-emerald-600" style={{width:(units/Math.max(...bestSellers.map(item=>item.units))*100)+'%'}}/></div></div></div>)}</div> : <p className="py-10 text-center text-sm text-color_5">Best sellers appear after orders are delivered.</p>}</section><section className="rounded-2xl bg-color_2 p-5"><h2 className="font-semibold">Top categories</h2><p className="mt-1 text-xs text-color_5">Based on delivered product revenue</p>{categorySales.length ? <div className="mt-5 space-y-4">{categorySales.map((entry,index) => <div key={entry.name}><div className="flex justify-between gap-3 text-sm"><span>{entry.name}{index===0?' · Top category':''}</span><b>{money(entry.revenue)}</b></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-color_3"><div className="h-full rounded-full bg-color_6" style={{width:(entry.revenue/Math.max(...categorySales.map(item=>item.revenue))*100)+'%'}}/></div></div>)}</div> : <p className="py-10 text-center text-sm text-color_5">Category insights appear after deliveries.</p>}</section></div><section className="rounded-2xl bg-color_2 p-5"><h2 className="font-semibold">Order status</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{(['placed','processing','shipped','delivered','cancelled'] as const).map(status => <div key={status} className="rounded-xl bg-color_3 p-4"><p className="text-xs capitalize text-color_5">{status}</p><p className="mt-2 text-2xl font-semibold">{orders.filter(order=>order.status===status).length}</p></div>)}</div></section></div>}{adminTab === 'products' && <div className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-color_5">Product catalog</p><h2 className="mt-1 font-serif text-3xl">{editing ? 'Edit product' : 'Add new product'}</h2><p className="mt-1 text-sm text-color_5">Add the details, set your price, and show customers what you sell.</p></div>
            <button type="button" onClick={() => {setProductEntryMode(productEntryMode === 'json' ? 'manual' : 'json');setJsonError('')}} className={'rounded-full border px-4 py-2.5 text-sm font-semibold transition ' + (productEntryMode === 'json' ? 'border-color_6 bg-color_3 text-color_4' : 'border-color_3 bg-color_2 hover:border-color_6')}>{productEntryMode === 'json' ? 'Close JSON import' : 'Import with JSON'}</button>
          </div>
          {productEntryMode === 'json' && <div className="rounded-2xl border border-color_3 bg-color_2 p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">Bulk product import</h3><p className="mt-1 max-w-2xl text-xs leading-5 text-color_5">Paste a JSON array or an object with a products array. We validate every product before saving anything.</p></div><button type="button" onClick={() => setProductJson(JSON.stringify({products:[{name:'Everyday Runner',description:'Light cushioned shoes for daily use.',category:'Footwear',price:3499,discount_percent:20,stock:18,image:'https://example.com/runner.jpg',active:true,featured:true},{name:'Canvas Weekender',description:'A roomy canvas bag for short trips.',category:'Bags',price:2199,discount_percent:0,stock:12,active:true,featured:false}]},null,2))} className="rounded-full border border-color_3 px-3 py-2 text-xs font-semibold transition hover:bg-color_3">Load sample JSON</button></div>
            <textarea value={productJson} onChange={e => {setProductJson(e.target.value);setJsonError('')}} rows={8} spellCheck={false} placeholder={'[\n  { "name": "Everyday Runner", ... }\n]'} className="mt-4 w-full rounded-xl border border-color_3 bg-color_1 px-4 py-3 font-mono text-xs leading-5 outline-none transition focus:border-color_6"/>
            {jsonError && <p role="alert" className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-700">{jsonError}</p>}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-[11px] leading-5 text-color_5">Required: name, description, category, price, stock. Optional: discount_percent, image, active, featured.</p><button type="button" onClick={() => void importProductsFromJson()} disabled={busy || !productJson.trim()} className="rounded-full bg-color_6 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">{busy ? 'Importing…' : 'Import all products'}</button></div>
          </div>}
          <form id="product-create-form" onSubmit={saveProduct} className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]">
            <div className="space-y-5">
              <section className="rounded-2xl border border-color_3 bg-color_2 p-5 shadow-sm sm:p-6">
                <div className="mb-5"><h3 className="text-base font-semibold">General information</h3><p className="mt-1 text-xs text-color_5">Give this product a clear name and useful details.</p></div>
                <div className="space-y-4">
                  <div><label className="mb-1.5 block text-xs font-medium text-color_5">Product name</label><input required value={productForm.name} onChange={e => setProductForm({...productForm,name:e.target.value})} placeholder="e.g. Puffer jacket with pocket detail" className="w-full rounded-xl border border-color_3 bg-color_1 px-4 py-3 text-sm outline-none transition focus:border-color_6"/></div>
                  <div><label className="mb-1.5 block text-xs font-medium text-color_5">Product description</label><textarea required value={productForm.description} onChange={e => setProductForm({...productForm,description:e.target.value})} placeholder="Describe the material, fit, features, and what makes it useful..." rows={5} className="w-full resize-y rounded-xl border border-color_3 bg-color_1 px-4 py-3 text-sm leading-6 outline-none transition focus:border-color_6"/></div>
                </div>
              </section>
              <section className="rounded-2xl border border-color_3 bg-color_2 p-5 shadow-sm sm:p-6">
                <div className="mb-5"><h3 className="text-base font-semibold">Pricing and stock</h3><p className="mt-1 text-xs text-color_5">Set the base price, discount, and available quantity.</p></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className="mb-1.5 block text-xs font-medium text-color_5">Base price (₹)</label><input required type="number" min="1" value={productForm.price} onChange={e => setProductForm({...productForm,price:e.target.value})} placeholder="1999" className="w-full rounded-xl border border-color_3 bg-color_1 px-4 py-3 text-sm outline-none focus:border-color_6"/></div>
                  <div><label className="mb-1.5 block text-xs font-medium text-color_5">Stock quantity</label><input required type="number" min="0" value={productForm.stock} onChange={e => setProductForm({...productForm,stock:e.target.value})} placeholder="10" className="w-full rounded-xl border border-color_3 bg-color_1 px-4 py-3 text-sm outline-none focus:border-color_6"/></div>
                  <div><label className="mb-1.5 block text-xs font-medium text-color_5">Discount (%)</label><input type="number" min="0" max="95" step="1" value={productForm.discount} onChange={e => setProductForm({...productForm,discount:e.target.value})} placeholder="0" className="w-full rounded-xl border border-color_3 bg-color_1 px-4 py-3 text-sm outline-none focus:border-color_6"/><p className="mt-1.5 text-[11px] text-color_5">Enter 0–95. Sale price: <b className="text-color_4">{money(Math.round((Number(productForm.price) || 0) * (1 - (Math.min(95, Math.max(0, Number(productForm.discount) || 0)) / 100))))}</b></p></div>
                  <div className="flex items-end"><div className="w-full rounded-xl bg-color_3 px-4 py-3"><p className="text-[11px] text-color_5">Customer price</p><p className="mt-1 text-lg font-semibold">{money(Math.round((Number(productForm.price) || 0) * (1 - (Math.min(95, Math.max(0, Number(productForm.discount) || 0)) / 100))))}</p></div></div>
                </div>
              </section>
            </div>
            <div className="space-y-5">
              <section className="rounded-2xl border border-color_3 bg-color_2 p-5 shadow-sm">
                <h3 className="text-base font-semibold">Product images</h3><p className="mt-1 text-xs text-color_5">Add several image URLs to show different angles and details.</p>
                <div className="mt-4 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-color_3 bg-color_1">
                  {productForm.images.some(url => url.trim()) ? <img src={productForm.images[selectedProductImage] || productForm.images.find(url => url.trim()) || ''} alt="Product preview" className="h-full w-full object-contain"/> : <div className="px-6 text-center text-color_5"><Package size={32} className="mx-auto opacity-50"/><p className="mt-3 text-sm font-medium">Image preview</p><p className="mt-1 text-xs">Add your first image below</p></div>}
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {productForm.images.map((url,index) => <div key={index} className="relative aspect-square">
                    <button type="button" onClick={() => setSelectedProductImage(index)} className={'flex h-full w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition ' + (selectedProductImage === index ? 'border-color_6 bg-color_3' : 'border-color_3 bg-color_1 hover:border-color_5')}>
                      {url.trim() ? <img src={url} alt={'Product image ' + (index+1)} className="h-full w-full object-cover"/> : <Plus size={20} className="text-color_5"/>}
                    </button>
                    {url.trim() && <button type="button" onClick={() => {setProductForm(current => ({...current,images:current.images.filter((_,i)=>i!==index)}));setSelectedProductImage(0);}} className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white shadow" aria-label={'Remove image ' + (index+1)}>×</button>}
                  </div>)}
                  {productForm.images.length < 8 && <button type="button" onClick={() => {setProductForm(current => ({...current,images:[...current.images,'']}));setSelectedProductImage(productForm.images.length);}} className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-color_3 bg-color_1 text-color_5 transition hover:border-color_6 hover:bg-color_3" aria-label="Add another product image"><Plus size={22}/></button>}
                </div>
                {productForm.images.map((url,index) => <div key={'url-'+index} className="mt-3">
                  <label className="mb-1 block text-xs font-medium text-color_5">Image {index+1} URL</label>
                  <div className="flex gap-2"><input value={url} onFocus={() => setSelectedProductImage(index)} onChange={event => setProductForm(current => ({...current,images:current.images.map((item,i)=>i===index?event.target.value:item),image:index===0?event.target.value:current.image}))} placeholder="https://example.com/product-image.jpg" className="min-w-0 flex-1 rounded-xl border border-color_3 bg-color_1 px-3 py-2.5 text-xs outline-none transition focus:border-color_6"/>{productForm.images.length>1 && <button type="button" onClick={() => setProductForm(current => ({...current,images:current.images.filter((_,i)=>i!==index)}))} className="rounded-lg border border-color_3 px-3 text-xs text-red-600" aria-label={'Remove image URL ' + (index+1)}>Remove</button>}</div>
                </div>)}
                <p className="mt-3 text-[11px] text-color_5">The first image is used as the main product photo. Add up to 8 images.</p>
              </section>
              <section className="rounded-2xl border border-color_3 bg-color_2 p-5 shadow-sm">
                <h3 className="text-base font-semibold">Category</h3><p className="mt-1 text-xs text-color_5">Choose where customers find this item.</p>
                <label className="mt-4 block text-xs font-medium text-color_5">Product category</label><select value={productForm.category} onChange={e => setProductForm({...productForm,category:e.target.value})} className="mt-1.5 w-full rounded-xl border border-color_3 bg-color_1 px-4 py-3 text-sm outline-none focus:border-color_6">{['Footwear','Bags','Tech','Accessories','Clothing','Home'].map(c => <option key={c}>{c}</option>)}</select>
              </section>
              <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
                <button disabled={busy} form="product-create-form" className="flex flex-1 items-center justify-center gap-2 rounded-full bg-color_6 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:translate-y-0 disabled:opacity-50"><Check size={17}/>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add product'}</button>
                {editing && <button type="button" onClick={() => {setEditing(null);setProductForm({name:'',description:'',category:'Footwear',price:'1999',discount:'0',stock:'10',image:''})}} className="rounded-full border border-color_3 px-5 py-3.5 text-sm font-semibold transition hover:bg-color_3">Cancel edit</button>}
              </div>
            </div>
          </form>
          <div className="overflow-hidden rounded-2xl border border-color_3 bg-color_2 shadow-sm"><div className="border-b border-color_3 p-5 font-semibold">Catalog · {products.length}</div>{products.map(product => <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-color_3 p-4 last:border-0"><div className="flex min-w-0 items-center gap-3"><div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-color_3"><ProductArt product={product} square/></div><div className="min-w-0"><p className="font-medium">{product.name} {!product.active && <span className="ml-2 text-xs text-color_5">Hidden</span>}</p><p className="mt-1 text-xs text-color_5">{product.category} · {money(salePrice(product))} {discountPercent(product) > 0 && <><del className="ml-1">{money(product.price)}</del><span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-900">{discountPercent(product)}% OFF</span></>} · {product.stock} in stock</p></div></div><div className="flex items-center gap-2"><button onClick={() => startEdit(product)} className="rounded-full border border-color_3 p-2" aria-label="Edit product"><Pencil size={15}/></button><button onClick={() => void toggleProduct(product)} className="rounded-full border border-color_3 px-3 py-2 text-xs">{product.active ? 'Hide' : 'Publish'}</button><button onClick={() => void deleteProduct(product)} className="rounded-full border border-red-200 p-2 text-red-600 hover:bg-red-50" aria-label="Delete product"><Trash2 size={15}/></button></div></div>)}</div>
        </div>}{adminTab === 'orders' && <div className="mt-5 overflow-hidden rounded-2xl bg-color_2">{orders.length === 0 ? <p className="p-10 text-center text-sm text-color_5">Orders will appear here after checkout.</p> : orders.slice().sort((a,b) => (b.created_at || '').localeCompare(a.created_at || '')).map(order => <div key={order.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-color_3 p-5"><div><p className="font-semibold">#{order.id.slice(0,8)} · {order.customer_name}</p><p className="mt-1 text-xs text-color_5">{order.customer_email} · {money(order.total)}</p></div><div className="flex items-center gap-2"><StatusPill status={order.status}/><select value={order.status} onChange={e => void changeOrderStatus(order,e.target.value as Order['status'])} className={'rounded-lg border px-3 py-2 text-sm font-medium capitalize ' + ({placed:'border-blue-200 bg-blue-50 text-blue-700',processing:'border-amber-200 bg-amber-50 text-amber-700',shipped:'border-violet-200 bg-violet-50 text-violet-700',delivered:'border-emerald-200 bg-emerald-50 text-emerald-700',cancelled:'border-red-200 bg-red-50 text-red-700'}[order.status])}>{['placed','processing','shipped','delivered','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}</select></div><button type="button" onClick={() => void removeOrderRecord(order)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50">Delete</button></div>)}</div>}{adminTab === 'reviews' && <div className="mt-5 overflow-hidden rounded-2xl bg-color_2">{reviews.length === 0 ? <p className="p-10 text-center text-sm text-color_5">Customer reviews will appear here.</p> : reviews.slice().sort((a,b) => (b.created_at || '').localeCompare(a.created_at || '')).map(review => <article key={review.id} className="flex flex-wrap items-start justify-between gap-4 border-b border-color_3 p-5"><div className="flex min-w-0 flex-1 items-start gap-4"><div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-color_3"><ProductArt product={products.find(product => product.id === review.product_id) || {id:review.product_id,name:'Deleted product',description:'',category:'',price:0,stock:0,active:false} as Product} square/></div><div className="min-w-0 flex-1"><p className="font-semibold">{products.find(product => product.id === review.product_id)?.name || 'Deleted product'}</p><p className="mt-1 text-xs text-color_5">{review.customer_name} · {formatReviewDate(review.created_at)} · Order #{review.order_id.slice(0,8)} <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"><Check size={12}/> Verified purchase</span></p><div className="mt-2 flex items-center gap-1">{[1,2,3,4,5].map(n => <Star key={n} size={13} className={n <= review.rating ? 'fill-amber-400 text-amber-500' : 'text-color_5'}/>)}</div>{review.body && <p className="mt-2 whitespace-pre-wrap text-sm text-color_5">{review.body}</p>}</div></div><button type="button" onClick={() => void toggleReviewVisibility(review)} className="rounded-full border border-color_3 px-3 py-2 text-xs font-semibold">{review.visible === false ? 'Show review' : 'Hide review'}</button></article>)}</div>}</section>}
      </main>
      <section className="mt-12 border-t-2 border-color_3 bg-color_2 text-color_4"><div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 sm:grid-cols-3"><div><p className="font-serif text-2xl">SHOPCRAFT</p><p className="mt-3 max-w-xs text-sm leading-6 text-color_5">Thoughtful things for everyday living. Built for the demo, ready to grow.</p></div><div><p className="text-xs font-bold uppercase tracking-widest">Explore</p><div className="mt-4 space-y-2 text-sm text-color_5"><Link className="block" href="/ecommerce">Shop all</Link><Link className="block" href="/ecommerce/orders">Order history</Link><Link className="block" href="/ecommerce/dashboard">My account</Link></div></div><div><p className="text-xs font-bold uppercase tracking-widest">Local demo</p><p className="mt-4 text-sm leading-6 text-color_5">Orders and catalog data stay in this browser. Checkout does not collect payment or create a real shipment.</p></div></div></section>
      <Footer appName="ShopCraft" />
    </div>
  );
}


export default function EcommerceClient({ slug = [] }: { slug?: string[] }) {
  return <EcommerceContent slug={slug} />;
}
