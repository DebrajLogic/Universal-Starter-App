// src/AUTH/auth/auth_services/auth_local_session.ts
import { AuthContract, AuthUser } from '../auth_contract';

// =============================================================================
// LOCAL SESSION ADAPTER (Stub — wire cookie/DB session when needed)
// =============================================================================
export const authLocalSession: AuthContract = {
  async getCurrentUser(): Promise<AuthUser | null> {
    throw new Error('Local session selected: wire cookie + DB user lookup here.');
  },
  async signIn(): Promise<AuthUser> {
    throw new Error('Local session adapter not yet wired.');
  },
  async signOut(): Promise<void> {
    throw new Error('Local session adapter not yet wired.');
  },
};
