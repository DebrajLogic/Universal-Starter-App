// =============================================================================
// DATABASE CIRCUIT BREAKER (Keep only ONE set to true)
// Only LocalStorage is wired for the current local-testing phase.
// The other adapters remain inactive until their credentials and implementations
// have been completed and verified.
// =============================================================================
export const DB_SWITCHES = {
  localstorage: true,
  supabase: false,
  firebase: false,
  mongodb: false,
  appwrite: false,
} as const;
