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
  signUp(name: string, email: string, password: string): Promise<AuthUser>;
  signIn(email: string, password: string): Promise<AuthUser>;
  signOut(): Promise<void>;
}
