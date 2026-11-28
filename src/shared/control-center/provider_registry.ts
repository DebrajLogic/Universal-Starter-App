// Central provider registry. Add entries when adapter implementations are ready.
export type ProviderDefinition = {
  id: string; name: string; detail: string;
  readiness: 'ready' | 'available' | 'setup';
  active: boolean;
  statusLabel: string;
};

export const DATABASE_PROVIDERS: ProviderDefinition[] = [
  { id: 'localstorage', name: 'LocalStorage', detail: 'Browser-based demo database', readiness: 'ready', active: true, statusLabel: 'Browser storage' },
  { id: 'supabase', name: 'Supabase', detail: 'PostgreSQL cloud database', readiness: 'available', active: false, statusLabel: 'Adapter boilerplate available · credentials required' },
  { id: 'firebase', name: 'Firebase', detail: 'Cloud Firestore', readiness: 'available', active: false, statusLabel: 'Adapter available · credentials required' },
  { id: 'mongodb', name: 'MongoDB', detail: 'MongoDB database', readiness: 'available', active: false, statusLabel: 'Adapter available · credentials required' },
  { id: 'appwrite', name: 'Appwrite', detail: 'Appwrite database', readiness: 'available', active: false, statusLabel: 'Adapter available · credentials required' },
];

export const AUTH_PROVIDERS: ProviderDefinition[] = [
  { id: 'local_session', name: 'Local Auth', detail: 'Browser-based accounts for local testing', readiness: 'ready', active: true, statusLabel: 'Local session adapter' },
  { id: 'oauth', name: 'OAuth', detail: 'Google / GitHub sign-in', readiness: 'setup', active: false, statusLabel: 'OAuth adapter not configured' },
];
