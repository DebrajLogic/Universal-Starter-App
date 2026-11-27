import { z } from 'zod';
import { AUTH_SWITCHES } from './auth_switches';

// =============================================================================
// SMART AUTH ENV VALIDATOR (Checks keys ONLY if OAuth is turned ON)
// =============================================================================
const authEnvSchema = z.object({
  AUTH_SECRET: AUTH_SWITCHES.oauth
    ? z.string().min(1, 'AUTH_SECRET is required when oauth is ON')
    : z.string().optional(),
  GOOGLE_CLIENT_ID: AUTH_SWITCHES.oauth
    ? z.string().min(1, 'GOOGLE_CLIENT_ID is required when oauth is ON')
    : z.string().optional(),
  GOOGLE_CLIENT_SECRET: AUTH_SWITCHES.oauth
    ? z.string().min(1, 'GOOGLE_CLIENT_SECRET is required when oauth is ON')
    : z.string().optional(),
});

export const authEnv = authEnvSchema.parse({
  AUTH_SECRET: process.env.AUTH_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
});
