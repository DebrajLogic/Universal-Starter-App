// src/DB/db/db_services/db_supabase.ts
import { BaseRecord, DbContract } from '../db_contract';

// =============================================================================
// SUPABASE ADAPTER (Stub — install `@supabase/supabase-js` and wire here)
// =============================================================================
export const db_supabase: DbContract = {
  async getAll<T extends BaseRecord>(_collection: string): Promise<T[]> {
    throw new Error('Supabase selected: install `@supabase/supabase-js` and wire client.');
  },
  async getById<T extends BaseRecord>(_collection: string, _id: string): Promise<T | null> {
    throw new Error('Supabase adapter not yet wired.');
  },
  async insert<T extends Partial<BaseRecord>>(_collection: string, _data: T): Promise<T & BaseRecord> {
    throw new Error('Supabase adapter not yet wired.');
  },
  async update<T extends Partial<BaseRecord>>(_collection: string, _id: string, _data: T): Promise<T & BaseRecord> {
    throw new Error('Supabase adapter not yet wired.');
  },
  async remove(_collection: string, _id: string): Promise<void> {
    throw new Error('Supabase adapter not yet wired.');
  },
};
