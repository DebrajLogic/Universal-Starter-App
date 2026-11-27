// =============================================================================
// AUTH CIRCUIT BREAKER (Keep only ONE set to true)
// =============================================================================
export const AUTH_SWITCHES = {
  demo: true,           // 1-click instant Demo User (zero keys or DB required)
  local_session: false, // Email/password stored in your active DB adapter
  oauth: false,         // Google / GitHub login via NextAuth
} as const;
