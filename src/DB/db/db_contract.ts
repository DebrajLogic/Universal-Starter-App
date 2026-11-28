// =============================================================================
// UNIVERSAL RECORD SHAPE & CRUD RULES (Every DB adapter must follow this)
// =============================================================================
export interface BaseRecord {
  id: string;
  created_at?: string;
}

export interface DbContract {
  getAll<T extends BaseRecord>(collection: string): Promise<T[]>;
  getById<T extends BaseRecord>(collection: string, id: string): Promise<T | null>;
  insert<T extends Partial<BaseRecord>>(collection: string, data: T): Promise<T & BaseRecord>;
  update<T extends object>(collection: string, id: string, data: T): Promise<T & BaseRecord>;
  remove(collection: string, id: string): Promise<void>;
}
