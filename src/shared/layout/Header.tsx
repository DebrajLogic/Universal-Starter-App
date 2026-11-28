'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Check, Trash2 } from 'lucide-react';
import { cn } from '@/shared/utils/helpers';
import { ThemeToggleButton } from '@/shared/ui/ThemeToggleButton';
import { auth } from '@/AUTH/auth/auth_switch';
import {
  deleteNotification,
  getNotifications,
  markNotificationRead,
  type AppNotification,
} from '@/shared/notifications/notifications';

export interface NavItem {
  label: string;
  href: string;
}

interface HeaderProps {
  brandName?: string;
  brandHref?: string;
  navItems?: NavItem[];
  className?: string;
  rightSlot?: React.ReactNode;
}

export function Header({
  brandName = 'UniversalStarterApp',
  brandHref = '/',
  navItems = [],
  className,
  rightSlot,
}: HeaderProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const unreadCount = notifications.filter(item => !item.read_at).length;

  const refreshNotifications = useCallback(async (id: string) => {
    try { setNotifications(await getNotifications(id)); }
    catch { setNotifications([]); }
  }, []);

  useEffect(() => {
    let active = true;
    auth.getCurrentUser().then(user => {
      if (!active) return;
      setUserId(user?.id ?? null);
      if (user) void refreshNotifications(user.id);
    }).catch(() => { if (active) setUserId(null); });
    const refresh = () => { if (userId) void refreshNotifications(userId); };
    window.addEventListener('usa-notifications-change', refresh);
    window.addEventListener('usa-auth-change', refresh);
    const onStorage = () => { if (userId) void refreshNotifications(userId); };
    window.addEventListener('storage', onStorage);
    return () => {
      active = false;
      window.removeEventListener('usa-notifications-change', refresh);
      window.removeEventListener('usa-auth-change', refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, [refreshNotifications, userId]);

  async function markRead(item: AppNotification) {
    if (item.read_at) return;
    await markNotificationRead(item.id);
    if (userId) await refreshNotifications(userId);
  }

  async function remove(item: AppNotification) {
    await deleteNotification(item.id);
    if (userId) await refreshNotifications(userId);
  }

  return (
    <header className={cn('w-full border-b border-color_3 bg-color_2 px-6 py-4', className)}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link href={brandHref} className="text-lg font-bold tracking-tight text-color_4">
          {brandName}
        </Link>
        <nav className="flex items-center gap-3 sm:gap-4">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-color_5 transition hover:text-color_4">
              {item.label}
            </Link>
          ))}
          {userId && (
            <div className="relative">
              <button type="button" onClick={() => setNotificationsOpen(open => !open)} aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'} aria-expanded={notificationsOpen} className="relative rounded-full border border-color_3 p-2.5 text-color_4 transition hover:bg-color_3">
                <Bell size={18}/>
                {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-color_6 px-1 text-[10px] font-bold text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
              </button>
              {notificationsOpen && <div className="absolute right-0 top-12 z-[70] w-[min(90vw,360px)] overflow-hidden rounded-2xl border border-color_3 bg-color_2 shadow-2xl">
                <div className="flex items-center justify-between border-b border-color_3 px-4 py-3"><div><p className="text-sm font-semibold text-color_4">Notifications</p><p className="text-xs text-color_5">{unreadCount ? `${unreadCount} unread` : 'All caught up'}</p></div><Link href="/ecommerce/dashboard/notifications" onClick={() => setNotificationsOpen(false)} className="text-xs font-semibold text-color_6 hover:underline">View all</Link></div>
                <div className="max-h-[min(65vh,420px)] overflow-y-auto">
                  {notifications.length === 0 ? <p className="px-4 py-10 text-center text-sm text-color_5">No notifications yet.</p> : notifications.slice(0, 8).map(item => <article key={item.id} className={`border-b border-color_3 px-4 py-3 last:border-0 ${item.read_at ? 'opacity-55' : ''}`}>
                    <div className="flex items-start gap-3"><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-color_4">{item.title}</p><p className="mt-1 text-xs leading-5 text-color_5">{item.message}</p><p className="mt-1 text-[10px] text-color_5">{item.created_at ? new Date(item.created_at).toLocaleString() : 'Just now'}</p></div><div className="flex shrink-0 items-center gap-1">
                      {!item.read_at && <button type="button" onClick={() => void markRead(item)} aria-label="Mark notification as read" title="Mark as read" className="rounded-lg p-2 text-color_5 hover:bg-color_3 hover:text-color_4"><Check size={14}/></button>}
                      <button type="button" onClick={() => void remove(item)} aria-label="Delete notification" title="Delete notification" className="rounded-lg p-2 text-color_5 hover:bg-red-500/10 hover:text-red-500"><Trash2 size={14}/></button>
                    </div></div>
                    {item.href && <Link href={item.href} onClick={() => { setNotificationsOpen(false); if (!item.read_at) void markRead(item); }} className="mt-2 inline-block text-xs font-semibold text-color_6 hover:underline">Open</Link>}
                  </article>)}
                </div>
              </div>}
            </div>
          )}
          <ThemeToggleButton />
          {rightSlot}
        </nav>
      </div>
    </header>
  );
}
