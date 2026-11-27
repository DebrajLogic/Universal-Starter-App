import { AUTH_SWITCHES } from '@/AUTH/config/auth_switches';
import { AuthContract } from './auth_contract';
import { authDemo } from './auth_services/auth_demo';
import { authLocalSession } from './auth_services/auth_local_session';
import { authOAuth } from './auth_services/auth_oauth';

// =============================================================================
// AUTH SWITCHBOARD (Mini-apps import `auth` from here — never the adapters)
// =============================================================================
function getActiveAuth(): AuthContract {
  if (AUTH_SWITCHES.oauth) return authOAuth;
  if (AUTH_SWITCHES.local_session) return authLocalSession;
  if (AUTH_SWITCHES.demo) return authDemo;

  throw new Error('No auth provider is turned ON in src/AUTH/config/auth_switches.ts');
}

export const auth = getActiveAuth();
