import { DB_SWITCHES } from '@/DB/config/db_switches';
import type { DbContract } from './db_contract';
import { db_localstorage } from './db_services/db_localstorage';

// Uncomment ONLY the server adapter you enable in src/DB/config/db_switches.ts:
// import { db_mongodb } from './db_services/db_mongodb';
// import { db_firebase } from './db_services/db_firebase';
// import { db_supabase } from './db_services/db_supabase';
// import { db_appwrite } from './db_services/db_appwrite';

function getActiveDb(): DbContract {
  if (DB_SWITCHES.localstorage) return db_localstorage;
  // if (DB_SWITCHES.mongodb) return db_mongodb;
  // if (DB_SWITCHES.firebase) return db_firebase;
  // if (DB_SWITCHES.supabase) return db_supabase;
  // if (DB_SWITCHES.appwrite) return db_appwrite;

  throw new Error('No database is turned ON in src/DB/config/db_switches.ts');
}

export const db = getActiveDb();
