// src/DB/db/db_services/db_mongodb.ts
import { BaseRecord, DbContract } from '../db_contract';

// =============================================================================
// MONGODB ADAPTER (Stub — install `mongodb` and wire Atlas client here)
// =============================================================================
export const dbMongo: DbContract = {
  async getAll<T extends BaseRecord>(_collection: string): Promise<T[]> {
    throw new Error('MongoDB selected: install `mongodb` and wire client.');
  },
  async getById<T extends BaseRecord>(_collection: string, _id: string): Promise<T | null> {
    throw new Error('MongoDB adapter not yet wired.');
  },
  async insert<T extends Partial<BaseRecord>>(_collection: string, _data: T): Promise<T & BaseRecord> {
    throw new Error('MongoDB adapter not yet wired.');
  },
  async update<T extends Partial<BaseRecord>>(_collection: string, _id: string, _data: T): Promise<T & BaseRecord> {
    throw new Error('MongoDB adapter not yet wired.');
  },
  async remove(_collection: string, _id: string): Promise<void> {
    throw new Error('MongoDB adapter not yet wired.');
  },
};
