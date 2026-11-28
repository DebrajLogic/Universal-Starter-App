// Central registry for providers shown in the Control Center.
// When an adapter is implemented, add/update its entry and connection check here.
export type ProviderDefinition = {
  id: string;
  name: string;
  detail: string;
  readiness: 'ready' | 'setup';
  active: boolean;
  statusLabel: string;
};

export const DATABASE_PROVIDERS: ProviderDefinition[] = [
  { id: 'localstorage', name: 'LocalStorage', detail: 'Browser-based demo database', readiness: 'ready', active: true, statusLabel: 'Active · Browser storage' },
  { id: 'supabase', name: 'Supabase', detail: 'PostgreSQL cloud database', readiness: 'setup', active: false, statusLabel: 'Offline · Adapter not configured' },
  { id: 'firebase', name: 'Firebase', detail: 'Cloud Firestore', readiness: 'setup', active: false, statusLabel: 'Offline · Adapter not configured' },
  { id: 'mongodb', name: 'MongoDB', detail: 'MongoDB database', readiness: 'setup', active: false, statusLabel: 'Offline · Server adapter not configured' },
  { id: 'appwrite', name: 'Appwrite', detail: 'Appwrite database', readiness: 'setup', active: false, statusLabel: 'Offline · Adapter not configured' },
];

export const AUTH_PROVIDERS: ProviderDefinition[] = [
  { id: 'local_session', name: 'Local Auth', detail: 'Browser-based accounts for local testing', readiness: 'ready', active: true, statusLabel: 'Active · Local browser session' },
  { id: 'oauth', name: 'OAuth', detail: 'Google / GitHub sign-in', readiness: 'setup', active: false, statusLabel: 'Offline · OAuth adapter not configured' },
];
