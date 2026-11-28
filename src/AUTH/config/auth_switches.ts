// =============================================================================
// AUTH CIRCUIT BREAKER (Keep only ONE set to true)
// =============================================================================
export const AUTH_SWITCHES = {
  demo: false,          // Legacy one-click demo login (disabled)
  local_session: true,  // Local browser accounts stored in LocalStorage
  oauth: false,         // Google / GitHub login (not configured)
} as const;
