import { z } from 'zod';
import { DB_SWITCHES } from './db_switches';

// =============================================================================
// SMART DB ENV VALIDATOR (Checks .env.local keys ONLY for ON databases)
// =============================================================================
const dbEnvSchema = z.object({
  // Supabase keys
  NEXT_PUBLIC_SUPABASE_URL: DB_SWITCHES.supabase
    ? z.string().url('NEXT_PUBLIC_SUPABASE_URL is required when supabase is ON')
    : z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: DB_SWITCHES.supabase
    ? z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required when supabase is ON')
    : z.string().optional(),

  // MongoDB keys
  MONGODB_URI: DB_SWITCHES.mongodb
    ? z.string().min(1, 'MONGODB_URI is required when mongodb is ON')
    : z.string().optional(),
  MONGODB_DB_NAME: DB_SWITCHES.mongodb
    ? z.string().min(1).default('universal_portfolio_db')
    : z.string().optional(),

  // Firebase keys
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: DB_SWITCHES.firebase
    ? z.string().min(1, 'NEXT_PUBLIC_FIREBASE_PROJECT_ID is required when firebase is ON')
    : z.string().optional(),
});

export const dbEnv = dbEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  MONGODB_URI: process.env.MONGODB_URI,
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
