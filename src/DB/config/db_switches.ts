// =============================================================================
// DATABASE CIRCUIT BREAKER (Keep only ONE set to true)
// =============================================================================
export const DB_SWITCHES = {
  localstorage: true,  // Zero-config browser storage (default for instant demos)
  supabase: false,     // PostgreSQL via Supabase
  firebase: false,     // Cloud Firestore
  mongodb: false,      // MongoDB Atlas
} as const;
