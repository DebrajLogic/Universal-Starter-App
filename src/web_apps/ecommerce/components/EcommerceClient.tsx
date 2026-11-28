'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Search, ShoppingBag, UserRound, LayoutDashboard,
  Package, Plus, Minus, Trash2, Pencil, Check, Truck, ShieldCheck, LogOut, LoaderCircle, ChevronDown,
} from 'lucide-react';
import { getProducts, getOrders, getCart } from '../queries';
import { createProduct, updateProduct, deleteProduct as removeProduct, createOrder, updateOrder as persistOrderUpdate, deleteOrder as removeOrder, saveCart } from '../actions';
import type { Product, Order, OrderItem, CartLine } from '../types';
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
const discountPercent = (product: Product) => Number.isFinite(product.discount_percent) ? Math.min(95, Math.max(0, Number(product.discount_percent))) : product.compare_at_price && product.compare_at_price > product.price ? Math.round((1 - product.price / product.compare_at_price) * 100) : 0;
const salePrice = (product: Product) => product.price;

function ProductArt({ product, large = false, square = false }: { product?: Product | null; large?: boolean; square?: boolean }) {
  const safeProduct = product && typeof product === 'object' ? product : null;
  const productName = typeof safeProduct?.name === 'string' && safeProduct.name.trim() ? safeProduct.name : 'ShopCraft Product';
  const productCategory = typeof safeProduct?.category === 'string' ? safeProduct.category : '';
  const productImage = typeof safeProduct?.image === 'string' ? safeProduct.image : '';
  const palettes: Record<string, string> = {
    Footwear: 'from-orange-100 to-amber-200', Bags: 'from-stone-200 to-orange-100',
    Tech: 'from-slate-200 to-blue-100', Accessories: 'from-amber-100 to-yellow-200',
    Clothing: 'from-rose-100 to-orange-100', Home: 'from-emerald-100 to-teal-100',
  };
  const symbols: Record<string, string> = { Footwear: 'SNEAKERS', Bags: 'WEEKENDER', Tech: 'AUDIO', Accessories: 'TIME', Clothing: 'ESSENTIALS', Home: 'LIGHT' };
  return (
    <div className={'relative flex items-center justify-center overflow-hidden bg-gradient-to-br ' + (palettes[productCategory] || 'from-stone-100 to-stone-200') + (large ? ' aspect-[5/4]' : square ? ' aspect-square' : ' aspect-[4/3]')}>
      {productImage ? <img src={productImage} alt={productName} className="h-full w-full object-cover" /> : (
        <div className="text-center text-stone-700">
          <div className="mb-2 text-[10px] font-bold tracking-[0.35em] opacity-60">{symbols[productCategory] || 'SHOPCRAFT'}</div>
          <div className="font-serif text-4xl italic sm:text-5xl">{productName.split(' ').slice(0, 2).join(' ')}</div>
          <div className="mt-3 text-[9px] tracking-[0.3em] opacity-60">SHOPCRAFT / OBJECTS FOR EVERY DAY</div>
        </div>
      )}
      {safeProduct?.featured && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-stone-800">Featured</span>}
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
  const [productForm, setProductForm] = useState({ name: '', description: '', category: 'Footwear', price: '1999', discount: '0', stock: '10', image: '' });
  const [productEntryMode, setProductEntryMode] = useState<'manual' | 'json'>('manual');
  const [productJson, setProductJson] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [adminTab, setAdminTab] = useState<'products' | 'orders'>('products');
  const [accountTab, setAccountTab] = useState<'overview' | 'orders'>(slug[0] === 'orders' ? 'orders' : 'overview');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const page = slug[0] || 'home';
  const isAdmin = user?.role === 'admin';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [foundProducts, foundOrders] = await Promise.all([
        getProducts(),
        getOrders(),
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
    if (user) {
      setCheckoutName(user.name);
    }
  }, [user]);

  useEffect(() => {
    if (!authChecked) return;
    const protectedPage = ['checkout', 'dashboard', 'orders'].includes(page) || page === 'admin';
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
      window.location.href = '/ecommerce/orders?placed=' + order.id;
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
        stock: Number(productForm.stock), image: productForm.image.trim(),
        active: true,
      };
      if (!payload.name || !payload.description || !Number.isFinite(payload.price) || payload.price <= 0 || !Number.isInteger(payload.stock) || payload.stock < 0 || !Number.isInteger(payload.discount_percent) || payload.discount_percent < 0 || payload.discount_percent > 95) throw new Error('Enter valid product details. Discount must be a whole number from 0 to 95.');
      if (editing) await updateProduct(editing.id, payload);
      else await createProduct(payload);
      setEditing(null);
      setProductForm({ name: '', description: '', category: 'Footwear', price: '1999', discount: '0', stock: '10', image: '' });
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
      stock: number; image?: string; discount_percent: number; active: boolean; featured: boolean;
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

  async function signOut() {
    setBusy(true);
    try { await auth.signOut(); window.location.href = '/login?next=%2Fecommerce'; }
    catch (error) { notify.error(error instanceof Error ? error.message : 'Sign out failed.'); setBusy(false); }
  }

  function startEdit(product: Product) {
    setEditing(product);
    setProductForm({ name: product.name, description: product.description, category: product.category, price: String(product.compare_at_price || product.price), discount: String(discountPercent(product)), stock: String(product.stock), image: product.image || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const categories = ['All', ...Array.from(new Set(products.filter(p => p.active).map(p => p.category)))];

  const nav = (
    <div className="flex items-center gap-2">
      <Link href="/ecommerce/cart" className="relative rounded-full border border-stone-200 p-2.5 text-stone-800 hover:bg-stone-100" aria-label="Shopping bag">
        <ShoppingBag size={18} />
        {cartCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-stone-900 px-1 text-[10px] font-bold text-white">{cartCount}</span>}
      </Link>
      <Link href="/ecommerce/dashboard" className="rounded-full border border-stone-200 p-2.5 text-stone-800 hover:bg-stone-100" aria-label="Your account"><UserRound size={18} /></Link>
      {isAdmin && <Link href="/ecommerce/admin" className="rounded-full border border-stone-200 p-2.5 text-stone-800 hover:bg-stone-100" aria-label="Admin dashboard"><LayoutDashboard size={18} /></Link>}
    </div>
  );

  if (loading || !authChecked) return <div className="flex min-h-screen items-center justify-center gap-3 bg-[#faf9f6] text-sm text-stone-500"><LoaderCircle className="animate-spin" size={20}/> Loading ShopCraft...</div>;

  if (page === 'admin' && !isAdmin) return (
    <div className="min-h-screen bg-[#faf9f6] px-6 py-24 text-center"><ShieldCheck className="mx-auto mb-4" size={36}/><h1 className="text-2xl font-semibold">Admin access required</h1><p className="mt-2 text-stone-500">This local account is not on the admin allowlist.</p><Link className="mt-6 inline-flex rounded-full bg-stone-900 px-5 py-3 text-sm text-white" href="/ecommerce">Back to store</Link></div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f6] text-stone-900">
      <Header brandName="SHOPCRAFT" brandHref="/ecommerce" navItems={[
        { label: 'Shop', href: '/ecommerce' }, { label: 'Orders', href: '/ecommerce/orders' },
        { label: 'My account', href: '/ecommerce/dashboard' },
        ...(isAdmin ? [{ label: 'Admin', href: '/ecommerce/admin' }] : []),
      ]} rightSlot={nav} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8 lg:px-10">
        {page !== 'home' && <div className="mb-6"><Link href={page === 'product' ? '/ecommerce' : page === 'checkout' ? '/ecommerce/cart' : '/ecommerce'} className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"><ArrowLeft size={16}/> {page === 'product' ? 'Back to shop' : page === 'checkout' ? 'Back to cart' : 'Back to shop'}</Link></div>}
        {page === 'home' && <>
          <section className="relative overflow-hidden rounded-[2rem] bg-[#e9e5dc] px-7 py-14 sm:px-14 sm:py-20">
            <div className="relative z-10 max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-stone-500">The everyday edit / 2026</p>
              <h1 className="mt-5 font-serif text-5xl leading-[1.05] tracking-tight sm:text-7xl">Good things.<br/><i>Made to last.</i></h1>
              <p className="mt-5 max-w-md text-sm leading-6 text-stone-600">Thoughtful essentials for the way you live, work, and move. Find your next everyday favourite.</p>
              <a href="#shop" className="mt-8 inline-flex items-center gap-3 rounded-full bg-stone-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-stone-700">Explore the collection <ArrowRight size={16}/></a>
            </div>
            <div className="pointer-events-none absolute -right-8 -top-10 hidden h-[440px] w-[440px] rounded-full border border-white/60 lg:block"/>
            <div className="pointer-events-none absolute right-16 top-12 hidden h-[310px] w-[310px] rounded-full border border-white/60 lg:block"/>
            <div className="pointer-events-none absolute bottom-0 right-20 hidden h-72 w-56 rotate-12 rounded-t-full bg-gradient-to-br from-amber-100 to-stone-300 opacity-70 lg:block"/>
          </section>
          <section id="shop" className="pt-16">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div><p className="text-xs font-bold uppercase tracking-[0.25em] text-stone-400">Curated for you</p><h2 className="mt-2 font-serif text-4xl">The collection</h2></div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2.5"><Search size={16} className="text-stone-400"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products..." className="w-48 bg-transparent text-sm outline-none"/></label>
                <select value={sort} onChange={e => setSort(e.target.value)} className="rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none"><option value="featured">Featured first</option><option value="newest">Newest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select>
              </div>
            </div>
            <div className="mt-7 flex flex-wrap gap-2">{categories.map(c => <button key={c} onClick={() => setCategory(c)} className={'rounded-full px-4 py-2 text-xs font-semibold transition ' + (category === c ? 'bg-stone-900 text-white' : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-500')}>{c}</button>)}</div>
            <div className="mt-7 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {activeProducts.map(product => <article key={product.id} className="group">
                <Link href={'/ecommerce/product/' + product.id} className="block overflow-hidden rounded-2xl"><div className="transition duration-500 group-hover:scale-[1.02]"><ProductArt product={product}/></div></Link>
                <div className="flex items-start justify-between gap-3 pt-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">{product.category}</p><Link href={'/ecommerce/product/' + product.id} className="mt-1 block font-medium hover:underline">{product.name}</Link><p className="mt-1 text-sm text-stone-500">{money(salePrice(product))} {discountPercent(product) > 0 && <><del className="ml-1 text-xs text-stone-400">{money(product.compare_at_price || product.price)}</del><span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">{discountPercent(product)}% OFF</span></>}</p></div><button onClick={() => addToCart(product)} disabled={product.stock < 1} className="rounded-full border border-stone-300 p-3 transition hover:bg-stone-900 hover:text-white disabled:opacity-40" aria-label={'Add ' + product.name + ' to bag'}><Plus size={17}/></button></div>
                <p className="mt-2 text-xs text-stone-400">{product.stock > 0 ? (product.stock < 5 ? 'Only ' + product.stock + ' left' : 'In stock') : 'Sold out'}</p>
              </article>)}
            </div>
            {activeProducts.length === 0 && <div className="py-20 text-center text-sm text-stone-500">No products match that search. Try another term.</div>}
          </section>
        </>}

        {page === 'product' && (() => {
          const product = products.find(p => p.id === slug[1] && p.active);
          if (!product) return <div className="py-24 text-center"><h1 className="font-serif text-3xl">Product not found</h1><Link href="/ecommerce" className="mt-5 inline-block underline">Back to the store</Link></div>;
          return <div className="grid gap-10 py-8 md:grid-cols-2"><div className="overflow-hidden rounded-3xl"><ProductArt product={product} large/></div><div className="flex flex-col justify-center"><p className="text-xs font-bold uppercase tracking-[0.25em] text-stone-400">{product.category}</p><h1 className="mt-3 font-serif text-5xl">{product.name}</h1><p className="mt-5 text-2xl">{money(salePrice(product))} {discountPercent(product) > 0 && <><del className="ml-2 text-base text-stone-400">{money(product.compare_at_price || product.price)}</del><span className="ml-2 rounded-full bg-rose-100 px-2 py-1 align-middle text-xs font-semibold text-rose-700">{discountPercent(product)}% OFF</span></>}</p><p className="mt-6 max-w-lg leading-7 text-stone-600">{product.description}</p><p className="mt-6 text-sm text-stone-500">{product.stock > 0 ? product.stock + ' available' : 'Currently sold out'}</p><button disabled={product.stock < 1} onClick={() => addToCart(product)} className="mt-8 inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-full bg-stone-900 px-6 py-4 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-40"><ShoppingBag size={17}/> Add to bag</button><div className="mt-8 grid max-w-sm grid-cols-2 gap-4 border-t border-stone-200 pt-6 text-xs text-stone-500"><p>Free shipping<br/><b className="mt-1 inline-block text-stone-800">Orders over ₹3,000</b></p><p>Easy support<br/><b className="mt-1 inline-block text-stone-800">We're here to help</b></p></div></div></div>;
        })()}

        {page === 'cart' && <section className="mx-auto max-w-4xl py-8"><p className="text-xs font-bold uppercase tracking-[0.25em] text-stone-400">Your selection</p><h1 className="mt-2 font-serif text-5xl">Shopping bag</h1>{cartDetails.length === 0 ? <div className="py-20 text-center"><ShoppingBag className="mx-auto mb-4 text-stone-300" size={42}/><p className="text-stone-500">Your bag is waiting for something good.</p><Link href="/ecommerce" className="mt-6 inline-flex rounded-full bg-stone-900 px-6 py-3 text-sm text-white">Explore the store</Link></div> : <div className="mt-10 grid gap-10 md:grid-cols-[1fr_300px]"><div className="space-y-5">{cartDetails.map(line => <div key={line.product.id} className="flex gap-4 border-b border-stone-200 pb-5"><div className="w-28 shrink-0 overflow-hidden rounded-xl"><ProductArt product={line.product}/></div><div className="min-w-0 flex-1"><p className="font-medium">{line.product.name}</p><p className="mt-1 text-sm text-stone-500">{money(salePrice(line.product))}</p><div className="mt-4 inline-flex items-center gap-3 rounded-full border border-stone-200 px-3 py-1.5"><button onClick={() => updateQuantity(line.product.id, line.quantity - 1)} aria-label="Decrease quantity"><Minus size={13}/></button><span className="text-sm tabular-nums">{line.quantity}</span><button onClick={() => updateQuantity(line.product.id, line.quantity + 1)} aria-label="Increase quantity"><Plus size={13}/></button></div></div><div className="text-right"><p className="font-medium">{money(salePrice(line.product) * line.quantity)}</p><button onClick={() => updateQuantity(line.product.id, 0)} className="mt-3 text-xs text-stone-400 hover:text-red-600"><Trash2 size={15}/></button></div></div>)}</div><aside className="h-fit rounded-2xl bg-white p-6"><h2 className="font-semibold">Order summary</h2><div className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><span className="text-stone-500">Subtotal</span><span>{money(subtotal)}</span></div><div className="flex justify-between"><span className="text-stone-500">Shipping</span><span>{shipping ? money(shipping) : 'Free'}</span></div><div className="flex justify-between border-t border-stone-200 pt-4 text-base font-semibold"><span>Total</span><span>{money(subtotal + shipping)}</span></div></div><Link href="/ecommerce/checkout" className="mt-6 flex items-center justify-center rounded-full bg-stone-900 px-5 py-3.5 text-sm font-semibold text-white">Continue to checkout <ArrowRight size={15} className="ml-2"/></Link><p className="mt-4 text-center text-[11px] text-stone-400">Shipping is free on orders over ₹3,000.</p></aside></div>}</section>}

        {page === 'checkout' && <section className="mx-auto max-w-5xl py-8"><p className="text-xs font-bold uppercase tracking-[0.25em] text-stone-400">Almost yours</p><h1 className="mt-2 font-serif text-5xl">Checkout</h1>{cartDetails.length === 0 ? <div className="py-16 text-center text-stone-500">Your bag is empty. <Link className="underline" href="/ecommerce">Shop now</Link></div> : <div className="mt-10 grid gap-10 md:grid-cols-[1fr_340px]"><form onSubmit={placeOrder} className="space-y-5 rounded-2xl bg-white p-6 sm:p-8"><h2 className="text-lg font-semibold">Delivery details</h2>{formError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</p>}<label className="block text-sm">Full name<input required value={checkoutName} onChange={e => setCheckoutName(e.target.value)} className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-3 outline-none focus:border-stone-600"/></label><label className="block text-sm">Phone number<input required value={checkoutPhone} onChange={e => setCheckoutPhone(e.target.value)} className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-3 outline-none focus:border-stone-600" placeholder="Your contact number"/></label><label className="block text-sm">Street address<textarea required value={checkoutAddress} onChange={e => setCheckoutAddress(e.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-3 outline-none focus:border-stone-600"/></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm">City<input required value={checkoutCity} onChange={e => setCheckoutCity(e.target.value)} className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-3 outline-none"/></label><label className="block text-sm">PIN code<input required value={checkoutPostal} onChange={e => setCheckoutPostal(e.target.value)} className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-3 outline-none"/></label></div><div className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">Demo checkout only. No payment is collected. Your order is saved to this browser.</div><button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-5 py-4 text-sm font-semibold text-white disabled:opacity-50">{busy && <LoaderCircle className="animate-spin" size={16}/>}Place demo order · {money(subtotal + shipping)}</button></form><aside className="h-fit rounded-2xl bg-white p-6"><h2 className="font-semibold">Your order</h2>{cartDetails.map(line => <div key={line.product.id} className="flex justify-between gap-3 border-b border-stone-100 py-4 text-sm"><span>{line.product.name} × {line.quantity}</span><b>{money(salePrice(line.product) * line.quantity)}</b></div>)}<div className="mt-4 flex justify-between text-sm"><span>Shipping</span><span>{shipping ? money(shipping) : 'Free'}</span></div><div className="mt-4 flex justify-between border-t border-stone-200 pt-4 font-semibold"><span>Total</span><span>{money(subtotal + shipping)}</span></div></aside></div>}</section>}

        {(page === 'dashboard' || page === 'orders') && <section className="py-8"><p className="text-xs font-bold uppercase tracking-[0.25em] text-stone-400">Your space</p><h1 className="mt-2 font-serif text-5xl">Hello, {user?.name.split(' ')[0]}.</h1><p className="mt-3 text-stone-500">Your orders, your details, all in one place.</p><div className="mt-10 grid gap-6 lg:grid-cols-[260px_1fr]"><aside className="h-fit rounded-2xl bg-white p-5"><div className="flex items-center gap-3 border-b border-stone-100 pb-5"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-100"><UserRound/></div><div><p className="font-medium">{user?.name}</p><p className="text-xs text-stone-500">{user?.email}</p></div></div><nav className="mt-4 space-y-1 text-sm"><button type="button" onClick={() => { setAccountTab('overview'); if (page !== 'dashboard') window.history.replaceState(null, '', '/ecommerce/dashboard'); }} className={'block w-full rounded-lg px-3 py-2.5 text-left ' + (accountTab === 'overview' ? 'bg-stone-100 font-medium' : 'hover:bg-stone-50')}>Overview</button><button type="button" onClick={() => { setAccountTab('orders'); if (page !== 'orders') window.history.replaceState(null, '', '/ecommerce/orders'); }} className={'block w-full rounded-lg px-3 py-2.5 text-left ' + (accountTab === 'orders' ? 'bg-stone-100 font-medium' : 'hover:bg-stone-50')}>My orders</button>{isAdmin && <Link href="/ecommerce/admin" className="block rounded-lg px-3 py-2.5 hover:bg-stone-50">Admin panel</Link>}<button onClick={() => void signOut()} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-red-600 hover:bg-red-50"><LogOut size={15}/> Sign out</button></nav></aside><div className="min-w-0">{accountTab === 'overview' ? <><div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-white p-5"><Package className="text-stone-400"/><p className="mt-4 text-3xl font-semibold">{orders.filter(o => o.user_id === user?.id).length}</p><p className="text-xs text-stone-500">Total orders</p></div><div className="rounded-2xl bg-white p-5"><Truck className="text-stone-400"/><p className="mt-4 text-3xl font-semibold">{orders.filter(o => o.user_id === user?.id && ['placed','processing','shipped'].includes(o.status)).length}</p><p className="text-xs text-stone-500">On the way</p></div><div className="rounded-2xl bg-white p-5"><Check className="text-stone-400"/><p className="mt-4 text-3xl font-semibold">{orders.filter(o => o.user_id === user?.id && o.status === 'delivered').length}</p><p className="text-xs text-stone-500">Delivered</p></div></div><div className="mt-8 rounded-2xl bg-white p-6"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Recent orders</h2><button type="button" onClick={() => { setAccountTab('orders'); if (page !== 'orders') window.history.replaceState(null, '', '/ecommerce/orders'); }} className="text-sm underline">View all</button></div>{orders.filter(o => o.user_id === user?.id).length === 0 ? <p className="py-12 text-center text-sm text-stone-500">Your first order will show up here.</p> : orders.filter(o => o.user_id === user?.id).slice().sort((a,b) => (b.created_at || '').localeCompare(a.created_at || '')).slice(0,5).map(order => <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 py-4 text-sm"><div><p className="font-medium">Order #{order.id.slice(0,8)}</p><p className="mt-1 text-xs text-stone-400">{new Date(order.created_at || Date.now()).toLocaleDateString()} · {order.items.length} items</p></div><div className="flex items-center gap-4"><StatusPill status={order.status}/><b>{money(order.total)}</b></div></div>)}</div></> : <div className="rounded-2xl bg-white p-6"><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.25em] text-stone-400">Order history</p><h2 className="mt-2 font-serif text-3xl">Your orders</h2></div>{orders.filter(o => o.user_id === user?.id).length === 0 ? <p className="py-12 text-center text-sm text-stone-500">No orders yet. Your next favourite is waiting.</p> : orders.filter(o => o.user_id === user?.id).slice().sort((a,b) => (b.created_at || '').localeCompare(a.created_at || '')).map(order => <article key={order.id} className="border-b border-stone-100 py-5 last:border-0"><button type="button" onClick={() => setExpandedOrderId(current => current === order.id ? null : order.id)} aria-expanded={expandedOrderId === order.id} className="flex w-full flex-wrap items-center justify-between gap-3 text-left"><div className="min-w-0 flex-1"><p className="font-semibold">Order #{order.id.slice(0,8)}</p><p className="mt-1 text-xs text-stone-400">{new Date(order.created_at || Date.now()).toLocaleString()} · {order.items.reduce((sum,item) => sum + item.quantity,0)} items</p><div className="mt-3 flex items-center gap-2">{order.items.slice(0,4).map(item => <div key={item.product_id} className="h-12 w-12 overflow-hidden rounded-lg border border-stone-100 bg-stone-50" title={item.name}><ProductArt product={{id:item.product_id,name:item.name,description:'',category:item.category || '',price:item.price,stock:0,active:true,image:item.image} as Product} square/></div>)}{order.items.length > 4 && <span className="flex h-12 min-w-12 items-center justify-center rounded-lg bg-stone-100 px-2 text-xs font-semibold text-stone-600">+{order.items.length - 4} more</span>}</div></div><div className="flex shrink-0 items-center gap-3"><StatusPill status={order.status}/><b>{money(order.total)}</b><ChevronDown size={17} className={'transition-transform ' + (expandedOrderId === order.id ? 'rotate-180' : '')}/></div></button>{expandedOrderId === order.id && <div className="mt-5 rounded-xl bg-stone-50 p-4"><h3 className="text-sm font-semibold">Order details</h3><div className="mt-3 space-y-3">{order.items.map(item => <div key={item.product_id} className="flex items-center gap-3"><div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white"><ProductArt product={{id:item.product_id,name:item.name,description:'',category:item.category || '',price:item.price,stock:0,active:true,image:item.image} as Product} square/></div><div className="min-w-0 flex-1"><p className="text-sm font-medium">{item.name}</p><p className="mt-1 text-xs text-stone-500">Qty {item.quantity} · {money(item.price)} each</p></div><b className="text-sm">{money(item.price * item.quantity)}</b></div>)}</div><div className="mt-4 border-t border-stone-200 pt-3 text-sm"><div className="flex justify-between"><span className="text-stone-500">Subtotal</span><span>{money(order.subtotal)}</span></div><div className="mt-2 flex justify-between"><span className="text-stone-500">Shipping</span><span>{order.shipping ? money(order.shipping) : 'Free'}</span></div><div className="mt-2 flex justify-between font-semibold"><span>Total</span><span>{money(order.total)}</span></div></div><p className="mt-4 text-xs leading-5 text-stone-500">Deliver to: {order.address}</p></div>}</article>)}</div>}</div></div></section>}
        {page === 'admin' && <section className="py-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.25em] text-stone-400">Store management</p><h1 className="mt-2 font-serif text-5xl">Admin dashboard</h1><p className="mt-2 text-sm text-stone-500">Manage the catalog and local demo orders.</p></div><span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800">Local demo admin</span></div><div className="mt-8 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-white p-5"><Package className="text-stone-400"/><p className="mt-4 text-3xl font-semibold">{products.length}</p><p className="text-xs text-stone-500">Products</p></div><div className="rounded-2xl bg-white p-5"><ShoppingBag className="text-stone-400"/><p className="mt-4 text-3xl font-semibold">{orders.length}</p><p className="text-xs text-stone-500">Orders</p></div><div className="rounded-2xl bg-white p-5"><span className="text-xl font-semibold">₹</span><p className="mt-4 text-3xl font-semibold">{money(orders.filter(o => o.status !== 'cancelled').reduce((sum,o) => sum + o.total,0))}</p><p className="text-xs text-stone-500">Demo order value</p></div></div><div className="mt-8 flex gap-2"><button onClick={() => setAdminTab('products')} className={'rounded-full px-5 py-2.5 text-sm ' + (adminTab === 'products' ? 'bg-stone-900 text-white' : 'bg-white')}>Products</button><button onClick={() => setAdminTab('orders')} className={'rounded-full px-5 py-2.5 text-sm ' + (adminTab === 'orders' ? 'bg-stone-900 text-white' : 'bg-white')}>Orders</button></div>{adminTab === 'products' && <div className="mt-5 grid gap-6 lg:grid-cols-[340px_1fr]"><div className="h-fit rounded-2xl bg-white p-5"><h2 className="font-semibold">{editing ? 'Edit product' : 'Add products'}</h2>{!editing && <div className="mt-4 grid grid-cols-2 rounded-full bg-stone-100 p-1"><button type="button" onClick={() => {setProductEntryMode('manual');setJsonError('')}} className={'rounded-full px-3 py-2 text-xs font-semibold ' + (productEntryMode === 'manual' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500')}>One at a time</button><button type="button" onClick={() => {setProductEntryMode('json');setJsonError('')}} className={'rounded-full px-3 py-2 text-xs font-semibold ' + (productEntryMode === 'json' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500')}>Bulk JSON</button></div>}{(editing || productEntryMode === 'manual') ? <form onSubmit={saveProduct} className="mt-4 space-y-3"><input required value={productForm.name} onChange={e => setProductForm({...productForm,name:e.target.value})} placeholder="Product name" className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm"/><textarea required value={productForm.description} onChange={e => setProductForm({...productForm,description:e.target.value})} placeholder="Description" rows={3} className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm"/><select value={productForm.category} onChange={e => setProductForm({...productForm,category:e.target.value})} className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm">{['Footwear','Bags','Tech','Accessories','Clothing','Home'].map(c => <option key={c}>{c}</option>)}</select><div className="grid grid-cols-2 gap-3"><div><label className="mb-1 block text-xs text-stone-500">Base price (₹)</label><input required type="number" min="1" value={productForm.price} onChange={e => setProductForm({...productForm,price:e.target.value})} placeholder="Price" className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm"/></div><div><label className="mb-1 block text-xs text-stone-500">Discount (%)</label><input type="number" min="0" max="95" step="1" value={productForm.discount} onChange={e => setProductForm({...productForm,discount:e.target.value})} placeholder="0" className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm"/><p className="mt-1 text-[11px] text-stone-400">Sale price: {money(Math.round((Number(productForm.price) || 0) * (1 - (Math.min(95, Math.max(0, Number(productForm.discount) || 0)) / 100))))}</p></div><div><label className="mb-1 block text-xs text-stone-500">Stock</label><input required type="number" min="0" value={productForm.stock} onChange={e => setProductForm({...productForm,stock:e.target.value})} placeholder="Stock" className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm"/></div></div><input value={productForm.image} onChange={e => setProductForm({...productForm,image:e.target.value})} placeholder="Image URL (optional)" className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm"/><button disabled={busy} className="w-full rounded-full bg-stone-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Saving...' : editing ? 'Save changes' : 'Create product'}</button>{editing && <button type="button" onClick={() => {setEditing(null);setProductForm({name:'',description:'',category:'Footwear',price:'1999',discount:'0',stock:'10',image:''})}} className="w-full rounded-full border border-stone-200 px-4 py-3 text-sm">Cancel edit</button>}</form> : <div className="mt-4 space-y-3"><p className="text-xs leading-5 text-stone-500">Paste a JSON array to add many products at once. All products are checked before anything is saved.</p><textarea value={productJson} onChange={e => {setProductJson(e.target.value);setJsonError('')}} rows={12} spellCheck={false} placeholder={'Paste your products JSON here...'} className="w-full rounded-lg border border-stone-200 px-3 py-3 font-mono text-xs leading-5 outline-none focus:border-stone-500"/>{jsonError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{jsonError}</p>}<button type="button" onClick={() => void importProductsFromJson()} disabled={busy || !productJson.trim()} className="w-full rounded-full bg-stone-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Importing products...' : 'Import all products'}</button><button type="button" onClick={() => setProductJson(JSON.stringify({products:[{name:'Everyday Runner',description:'Light cushioned shoes for daily use.',category:'Footwear',price:3499,discount_percent:20,stock:18,image:'https://example.com/runner.jpg',active:true,featured:true},{name:'Canvas Weekender',description:'A roomy canvas bag for short trips.',category:'Bags',price:2199,discount_percent:0,stock:12,active:true,featured:false}]},null,2))} className="w-full rounded-full border border-stone-200 px-4 py-2.5 text-xs font-semibold">Load sample JSON</button><p className="text-[11px] leading-5 text-stone-400">Required: name, description, category, price, stock. Optional: discount_percent (0–95), image, active, featured. Price is the original price; the app calculates the sale price.</p></div>}</div><div className="overflow-hidden rounded-2xl bg-white"><div className="border-b border-stone-100 p-5 font-semibold">Catalog · {products.length}</div>{products.map(product => <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 p-4 last:border-0"><div className="flex min-w-0 items-center gap-3"><div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-100"><ProductArt product={product} square/></div><div className="min-w-0"><p className="font-medium">{product.name} {!product.active && <span className="ml-2 text-xs text-stone-400">Hidden</span>}</p><p className="mt-1 text-xs text-stone-500">{product.category} · {money(salePrice(product))} {discountPercent(product) > 0 && <><del className="ml-1">{money(product.price)}</del><span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 font-semibold text-rose-700">{discountPercent(product)}% OFF</span></>} · {product.stock} in stock</p></div></div><div className="flex items-center gap-2"><button onClick={() => startEdit(product)} className="rounded-full border border-stone-200 p-2" aria-label="Edit product"><Pencil size={15}/></button><button onClick={() => void toggleProduct(product)} className="rounded-full border border-stone-200 px-3 py-2 text-xs">{product.active ? 'Hide' : 'Publish'}</button><button onClick={() => void deleteProduct(product)} className="rounded-full border border-red-200 p-2 text-red-600 hover:bg-red-50" aria-label="Delete product"><Trash2 size={15}/></button></div></div>)}</div></div>}{adminTab === 'orders' && <div className="mt-5 overflow-hidden rounded-2xl bg-white">{orders.length === 0 ? <p className="p-10 text-center text-sm text-stone-500">Orders will appear here after checkout.</p> : orders.slice().sort((a,b) => (b.created_at || '').localeCompare(a.created_at || '')).map(order => <div key={order.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 p-5"><div><p className="font-semibold">#{order.id.slice(0,8)} · {order.customer_name}</p><p className="mt-1 text-xs text-stone-500">{order.customer_email} · {money(order.total)}</p></div><select value={order.status} onChange={e => void changeOrderStatus(order,e.target.value as Order['status'])} className="rounded-lg border border-stone-200 px-3 py-2 text-sm">{['placed','processing','shipped','delivered','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}</select><button type="button" onClick={() => void removeOrderRecord(order)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50">Delete</button></div>)}</div>}</section>}
      </main>
      <section className="mt-12 border-t border-stone-200 bg-[#f1efe9]"><div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 sm:grid-cols-3"><div><p className="font-serif text-2xl">SHOPCRAFT</p><p className="mt-3 max-w-xs text-sm leading-6 text-stone-500">Thoughtful things for everyday living. Built for the demo, ready to grow.</p></div><div><p className="text-xs font-bold uppercase tracking-widest">Explore</p><div className="mt-4 space-y-2 text-sm text-stone-600"><Link className="block" href="/ecommerce">Shop all</Link><Link className="block" href="/ecommerce/orders">Order history</Link><Link className="block" href="/ecommerce/dashboard">My account</Link></div></div><div><p className="text-xs font-bold uppercase tracking-widest">Local demo</p><p className="mt-4 text-sm leading-6 text-stone-500">Orders and catalog data stay in this browser. Checkout does not collect payment or create a real shipment.</p></div></div></section>
      <Footer appName="ShopCraft" />
    </div>
  );
}


export default function EcommerceClient({ slug = [] }: { slug?: string[] }) {
  return <EcommerceContent slug={slug} />;
}
