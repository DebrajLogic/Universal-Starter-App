// src/AUTH/auth/auth_services/auth_oauth.ts
import { AuthContract, AuthUser } from '../auth_contract';

// =============================================================================
// OAUTH ADAPTER (Stub — install `next-auth` and wire Google/GitHub here)
// =============================================================================
export const authOAuth: AuthContract = {
  async getCurrentUser(): Promise<AuthUser | null> {
    throw new Error('OAuth selected: install `next-auth` and wire session here.');
  },
  async signIn(): Promise<AuthUser> {
    throw new Error('OAuth adapter not yet wired.');
  },
  async signOut(): Promise<void> {
    throw new Error('OAuth adapter not yet wired.');
  },
};
