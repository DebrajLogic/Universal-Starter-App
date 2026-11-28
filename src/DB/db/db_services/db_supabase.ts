import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { BaseRecord, DbContract } from '../db_contract';

let cachedClient: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase configuration missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.');
  if (!cachedClient) cachedClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return cachedClient;
}

function throwIfError(error: { message: string; code?: string } | null, operation: string): void {
  if (error) throw new Error(`Supabase ${operation} failed [${error.code ?? 'UNKNOWN'}]: ${error.message}`);
}

function validateCollection(collection: string): string {
  if (!/^[a-zA-Z][a-zA-Z0-9_]{0,62}$/.test(collection)) throw new Error('Invalid Supabase table name.');
  return collection;
}

export const db_supabase: DbContract = {
  async getAll<T extends BaseRecord>(collection: string): Promise<T[]> {
    const { data, error } = await getClient().from(validateCollection(collection)).select('*');
    throwIfError(error, 'read');
    return (data ?? []) as T[];
  },
  async getById<T extends BaseRecord>(collection: string, id: string): Promise<T | null> {
    const { data, error } = await getClient().from(validateCollection(collection)).select('*').eq('id', id).maybeSingle();
    throwIfError(error, 'read by ID');
    return (data as T | null) ?? null;
  },
  async insert<T extends Partial<BaseRecord>>(collection: string, data: T): Promise<T & BaseRecord> {
    const { data: record, error } = await getClient().from(validateCollection(collection)).insert(data).select('*').single();
    throwIfError(error, 'insert');
    if (!record) throw new Error('Supabase insert returned no record.');
    return record as T & BaseRecord;
  },
  async update<T extends object>(collection: string, id: string, data: T): Promise<T & BaseRecord> {
    const { data: record, error } = await getClient().from(validateCollection(collection)).update(data).eq('id', id).select('*').single();
    throwIfError(error, 'update');
    if (!record) throw new Error(`Supabase update could not find record ${id}.`);
    return record as T & BaseRecord;
  },
  async remove(collection: string, id: string): Promise<void> {
    const { error } = await getClient().from(validateCollection(collection)).delete().eq('id', id);
    throwIfError(error, 'delete');
  },
};

export async function checkSupabaseConnection(): Promise<void> {
  const { error } = await getClient().from('usa_connection_check').select('*').limit(1);
  if (error && error.code !== 'PGRST205' && error.code !== '42P01') throwIfError(error, 'connection check');
}
