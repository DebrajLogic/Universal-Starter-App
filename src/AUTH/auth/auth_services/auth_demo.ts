import { AuthContract, AuthUser } from '../auth_contract';

// =============================================================================
// DEMO AUTH ADAPTER (Zero-setup sandbox login for testing & quick demos)
// =============================================================================
const DEMO_USER: AuthUser = {
  id: 'demo_user_001',
  name: 'Demo Explorer',
  email: 'demo@universalapp.dev',
  role: 'admin',
};

let isDemoLoggedIn = true; // Starts logged in so demos work immediately

export const authDemo: AuthContract = {
  async getCurrentUser(): Promise<AuthUser | null> {
    return isDemoLoggedIn ? DEMO_USER : null;
  },

  async signIn(): Promise<AuthUser> {
    isDemoLoggedIn = true;
    return DEMO_USER;
  },

  async signOut(): Promise<void> {
    isDemoLoggedIn = false;
  },
};
