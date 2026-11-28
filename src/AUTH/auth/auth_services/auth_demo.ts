import type { AuthContract, AuthUser } from '../auth_contract';

// =============================================================================
// LEGACY DEMO AUTH ADAPTER
// Kept only for compatibility. The active local provider is authLocalSession.
// =============================================================================
const SESSION_KEY = 'usa_demo_auth_session_v1';

const DEMO_USER: AuthUser = {
  id: 'demo_user_001',
  name: 'Demo User',
  email: 'demo@universalapp.dev',
  role: 'user',
};

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export const authDemo: AuthContract = {
  async getCurrentUser(): Promise<AuthUser | null> {
    if (!isBrowser()) return null;
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session: unknown = JSON.parse(raw);
      if (
        typeof session !== 'object' ||
        session === null ||
        (session as Record<string, unknown>).id !== DEMO_USER.id
      ) {
        window.localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return DEMO_USER;
    } catch {
      return null;
    }
  },

  async signUp(): Promise<AuthUser> {
    throw new Error('Sign-up is not available in the legacy demo provider.');
  },

  async signIn(): Promise<AuthUser> {
    if (!isBrowser()) throw new Error('Demo sign-in is available in the browser only.');
    window.localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ id: DEMO_USER.id, signed_in_at: new Date().toISOString() })
    );
    return DEMO_USER;
  },

  async changePassword(): Promise<void> {
    throw new Error('Password changes are not available in the legacy demo provider.');
  },

  async deleteAccount(): Promise<void> {
    throw new Error('Account deletion is not available in the legacy demo provider.');
  },

  async signOut(): Promise<void> {
    if (isBrowser()) window.localStorage.removeItem(SESSION_KEY);
  },
};
