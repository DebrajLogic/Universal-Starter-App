import { db } from '@/DB/db/db_switch';
import type { BaseRecord } from '@/DB/db/db_contract';

export type AppNotification = BaseRecord & {
  user_id: string;
  title: string;
  message: string;
  href?: string;
  read_at?: string;
};

const COLLECTION = 'usa_notifications';

function notifyChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('usa-notifications-change'));
}

export async function getNotifications(userId: string): Promise<AppNotification[]> {
  const rows = await db.getAll<AppNotification>(COLLECTION);
  return rows.filter(row => row.user_id === userId)
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
}

export async function createNotification(data: Omit<Partial<AppNotification>, 'id'> & Pick<AppNotification, 'user_id' | 'title' | 'message'>): Promise<AppNotification> {
  const saved = await db.insert<AppNotification>(COLLECTION, {
    ...data,
    created_at: new Date().toISOString(),
  });
  notifyChanged();
  return saved;
}

export async function markNotificationRead(id: string): Promise<void> {
  await db.update<AppNotification>(COLLECTION, id, { read_at: new Date().toISOString() });
  notifyChanged();
}

export async function deleteNotification(id: string): Promise<void> {
  await db.remove(COLLECTION, id);
  notifyChanged();
}

export async function deleteUserNotifications(userId: string): Promise<void> {
  const rows = await db.getAll<AppNotification>(COLLECTION);
  for (const row of rows.filter(item => item.user_id === userId)) await db.remove(COLLECTION, row.id);
  notifyChanged();
}
