import { BaseRecord, DbContract } from '../db_contract';

// =============================================================================
// BROWSER STORAGE + SERVER FALLBACK HELPERS
// =============================================================================
const memoryFallback = new Map<string, BaseRecord[]>();

function readStore<T extends BaseRecord>(collection: string): T[] {
  if (typeof window === 'undefined') {
    return (memoryFallback.get(collection) as T[]) || [];
  }
  const raw = window.localStorage.getItem(`usa_${collection}`);
  return raw ? JSON.parse(raw) : [];
}

function writeStore<T extends BaseRecord>(collection: string, items: T[]): void {
  if (typeof window === 'undefined') {
    memoryFallback.set(collection, items);
    return;
  }
  window.localStorage.setItem(`usa_${collection}`, JSON.stringify(items));
}

// =============================================================================
// LOCALSTORAGE ADAPTER (Zero-setup sandbox storage for demos & prototyping)
// =============================================================================
export const dbLocalStorage: DbContract = {
  async getAll<T extends BaseRecord>(collection: string): Promise<T[]> {
    return readStore<T>(collection);
  },

  async getById<T extends BaseRecord>(collection: string, id: string): Promise<T | null> {
    const items = readStore<T>(collection);
    return items.find((item) => item.id === id) || null;
  },

  async insert<T extends Partial<BaseRecord>>(collection: string, data: T): Promise<T & BaseRecord> {
    const items = readStore<T & BaseRecord>(collection);
    const newRecord = {
      ...data,
      id: data.id || crypto.randomUUID(),
      created_at: data.created_at || new Date().toISOString(),
    } as T & BaseRecord;

    writeStore(collection, [...items, newRecord]);
    return newRecord;
  },

  async update<T extends Partial<BaseRecord>>(collection: string, id: string, data: T): Promise<T & BaseRecord> {
    const items = readStore<T & BaseRecord>(collection);
    let updatedRecord: (T & BaseRecord) | null = null;

    const nextItems = items.map((item) => {
      if (item.id !== id) return item;
      updatedRecord = { ...item, ...data, id };
      return updatedRecord;
    });

    if (!updatedRecord) throw new Error(`Record ${id} not found in ${collection}`);
    writeStore(collection, nextItems);
    return updatedRecord;
  },

  async remove(collection: string, id: string): Promise<void> {
    const items = readStore<BaseRecord>(collection);
    writeStore(collection, items.filter((item) => item.id !== id));
  },
};
