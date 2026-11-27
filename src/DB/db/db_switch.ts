import { DB_SWITCHES } from '@/DB/config/db_switches';
import { DbContract } from './db_contract';
import { dbLocalStorage } from './db_services/db_localstorage';
import { dbSupabase } from './db_services/db_supabase';
import { dbFirebase } from './db_services/db_firebase';
import { dbMongo } from './db_services/db_mongodb';

// =============================================================================
// DATABASE SWITCHBOARD (Mini-apps import `db` from here — never the adapters)
// =============================================================================
function getActiveDb(): DbContract {
  if (DB_SWITCHES.supabase) return dbSupabase;
  if (DB_SWITCHES.mongodb) return dbMongo;
  if (DB_SWITCHES.firebase) return dbFirebase;
  if (DB_SWITCHES.localstorage) return dbLocalStorage;

  throw new Error('No database is turned ON in src/DB/config/db_switches.ts');
}

export const db = getActiveDb();
