// =============================================================================
// UNIVERSAL USER SHAPE & AUTH RULES (Every adapter must follow this)
// =============================================================================
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface AuthContract {
  getCurrentUser(): Promise<AuthUser | null>;
  signIn(email?: string): Promise<AuthUser>;
  signOut(): Promise<void>;
}
