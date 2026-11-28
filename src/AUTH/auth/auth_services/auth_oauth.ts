import type { AuthContract, AuthUser } from '../auth_contract';

// OAuth is intentionally unavailable until credentials and a real provider are configured.
export const authOAuth: AuthContract = {
  async getCurrentUser(): Promise<AuthUser | null> { throw new Error('OAuth is not configured yet.'); },
  async signUp(): Promise<AuthUser> { throw new Error('OAuth sign-up is not configured yet.'); },
  async signIn(): Promise<AuthUser> { throw new Error('OAuth sign-in is not configured yet.'); },
  async changePassword(): Promise<void> { throw new Error('Password changes are not configured for OAuth yet.'); },
  async signOut(): Promise<void> { throw new Error('OAuth sign-out is not configured yet.'); },
};
