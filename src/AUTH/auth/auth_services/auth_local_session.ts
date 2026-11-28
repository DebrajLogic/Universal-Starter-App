import type { AuthContract, AuthUser } from '../auth_contract';

// =============================================================================
// LOCAL BROWSER AUTH
// Local-only account store. Passwords are PBKDF2 hashes, never plain text.
// This is a demo adapter, NOT production authentication.
// =============================================================================
const USERS_KEY = 'usa_local_auth_users_v1';
const SESSION_KEY = 'usa_local_auth_session_v1';
const ITERATIONS = 210_000;

interface StoredUser extends AuthUser {
  password_hash: string;
  password_salt: string;
}

interface StoredSession {
  user_id: string;
  created_at: string;
}

function requireBrowser(): Storage {
  if (typeof window === 'undefined') {
    throw new Error('Local authentication is available in the browser only.');
  }
  return window.localStorage;
}

function readUsers(): StoredUser[] {
  const raw = requireBrowser().getItem(USERS_KEY);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Local account data is damaged. Clear the local auth data and try again.');
  return parsed as StoredUser[];
}

function writeUsers(users: StoredUser[]): void {
  requireBrowser().setItem(USERS_KEY, JSON.stringify(users));
}

const LOCAL_ADMIN_EMAILS = (process.env.NEXT_PUBLIC_LOCAL_ADMIN_EMAILS ?? 'admin@local.test')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean);

function roleForEmail(email: string): AuthUser['role'] {
  return LOCAL_ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'user';
}

function publicUser(user: StoredUser): AuthUser {
  return { id: user.id, name: user.name, email: user.email, role: roleForEmail(user.email) };
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function derivePassword(password: string, salt: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Secure password hashing is not available in this browser. Use a modern browser on localhost.');
  }
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: Uint8Array.from(atob(salt), c => c.charCodeAt(0)), iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    256
  );
  return toBase64(new Uint8Array(bits));
}

function createSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return toBase64(bytes);
}

export const authLocalSession: AuthContract = {
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const storage = requireBrowser();
      const raw = storage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as StoredSession;
      if (!session || typeof session.user_id !== 'string') {
        storage.removeItem(SESSION_KEY);
        return null;
      }
      const user = readUsers().find(item => item.id === session.user_id);
      if (!user) {
        storage.removeItem(SESSION_KEY);
        return null;
      }
      return publicUser(user);
    } catch {
      return null;
    }
  },

  async signUp(name: string, email: string, password: string): Promise<AuthUser> {
    requireBrowser();
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (cleanName.length < 2 || cleanName.length > 60) throw new Error('Name must be between 2 and 60 characters.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new Error('Enter a valid email address.');
    if (password.length < 8) throw new Error('Password must be at least 8 characters.');
    if (password.length > 128) throw new Error('Password must be 128 characters or fewer.');

    const users = readUsers();
    if (users.some(user => user.email.toLowerCase() === cleanEmail)) {
      throw new Error('An account with this email already exists. Sign in instead.');
    }

    const salt = createSalt();
    const password_hash = await derivePassword(password, salt);
    const user: StoredUser = {
      id: crypto.randomUUID(),
      name: cleanName,
      email: cleanEmail,
      role: roleForEmail(cleanEmail),
      password_hash,
      password_salt: salt,
    };
    users.push(user);
    writeUsers(users);
    requireBrowser().setItem(SESSION_KEY, JSON.stringify({ user_id: user.id, created_at: new Date().toISOString() }));
    return publicUser(user);
  },

  async signIn(email: string, password: string): Promise<AuthUser> {
    requireBrowser();
    const cleanEmail = email.trim().toLowerCase();
    const user = readUsers().find(item => item.email.toLowerCase() === cleanEmail);
    if (!user) throw new Error('Email or password is incorrect.');
    const attemptedHash = await derivePassword(password, user.password_salt);
    if (attemptedHash !== user.password_hash) throw new Error('Email or password is incorrect.');
    requireBrowser().setItem(SESSION_KEY, JSON.stringify({ user_id: user.id, created_at: new Date().toISOString() }));
    return publicUser(user);
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    requireBrowser();
    if (newPassword.length < 8) throw new Error('Your new password must be at least 8 characters.');
    if (newPassword.length > 128) throw new Error('Your new password must be 128 characters or fewer.');
    if (currentPassword === newPassword) throw new Error('Choose a password you are not already using.');
    const session = JSON.parse(requireBrowser().getItem(SESSION_KEY) || 'null') as StoredSession | null;
    if (!session?.user_id) throw new Error('Sign in again before changing your password.');
    const users = readUsers();
    const index = users.findIndex(item => item.id === session.user_id);
    if (index < 0) throw new Error('Your local account could not be found.');
    const user = users[index];
    const currentHash = await derivePassword(currentPassword, user.password_salt);
    if (currentHash !== user.password_hash) throw new Error('Your current password is incorrect.');
    const salt = createSalt();
    const password_hash = await derivePassword(newPassword, salt);
    users[index] = { ...user, password_hash, password_salt: salt };
    writeUsers(users);
  },

  async signOut(): Promise<void> {
    requireBrowser().removeItem(SESSION_KEY);
  },
};
