// src/DB/db/db_services/db_firebase.ts
import { BaseRecord, DbContract } from '../db_contract';

// =============================================================================
// FIREBASE ADAPTER (Stub — install `firebase` and wire Firestore here)
// =============================================================================
export const dbFirebase: DbContract = {
  async getAll<T extends BaseRecord>(_collection: string): Promise<T[]> {
    throw new Error('Firebase selected: install `firebase` and wire Firestore.');
  },
  async getById<T extends BaseRecord>(_collection: string, _id: string): Promise<T | null> {
    throw new Error('Firebase adapter not yet wired.');
  },
  async insert<T extends Partial<BaseRecord>>(_collection: string, _data: T): Promise<T & BaseRecord> {
    throw new Error('Firebase adapter not yet wired.');
  },
  async update<T extends Partial<BaseRecord>>(_collection: string, _id: string, _data: T): Promise<T & BaseRecord> {
    throw new Error('Firebase adapter not yet wired.');
  },
  async remove(_collection: string, _id: string): Promise<void> {
    throw new Error('Firebase adapter not yet wired.');
  },
};
