'use client';

import { useEffect, useState } from 'react';
import {
  Settings, X, Database, ShieldCheck, Trash2, LogIn, LogOut, CircleHelp,
} from 'lucide-react';
import type { AuthUser } from '@/AUTH/auth/auth_contract';
import { auth } from '@/AUTH/auth/auth_switch';

type ProviderStatus = 'active' | 'setup' | 'error' | 'inactive';

const statusStyles: Record<ProviderStatus, string> = {
  active: 'bg-emerald-500',
  setup: 'bg-amber-500',
  error: 'bg-red-500',
  inactive: 'bg-zinc-400',
};

function StatusDot({ status }: { status: ProviderStatus }) {
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${statusStyles[status]}`} aria-label={status} />;
}

function ProviderRow({ name, detail, status, label }: {
  name: string;
  detail: string;
  status: ProviderStatus;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-color_5">{detail}</p>
      </div>
      <span className="flex shrink-0 items-center gap-2 text-xs text-color_5">
        <StatusDot status={status} /> {label}
      </span>
    </div>
  );
}

export function ControlCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function refreshStatus() {
    try {
      window.localStorage.setItem('__usa_storage_check__', 'ok');
      window.localStorage.removeItem('__usa_storage_check__');
      setStorageReady(true);
    } catch {
      setStorageReady(false);
    }

    try {
      setUser(await auth.getCurrentUser());
    } catch {
      setUser(null);
    }
  }

  useEffect(() => {
    void refreshStatus();
  }, []);

  async function handleSignIn() {
    setBusy(true);
    setMessage('');
    try {
      setUser(await auth.signIn());
      setMessage('Demo session started on this browser.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    setMessage('');
    try {
      await auth.signOut();
      setUser(null);
      setMessage('You are signed out.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Sign-out failed.');
    } finally {
      setBusy(false);
    }
  }

  function resetDemoDatabase() {
    const confirmed = window.confirm(
      'Delete this app’s LocalStorage database records from this browser? This cannot be undone.'
    );
    if (!confirmed) return;

    let removed = 0;
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith('app_db_')) {
        window.localStorage.removeItem(key);
        removed += 1;
      }
    }
    setMessage(`Reset complete. Removed ${removed} database collection(s). Your theme and demo login were left untouched.`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setIsOpen(true); void refreshStatus(); }}
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-color_3 bg-color_2 text-color_4 shadow-xl transition hover:scale-105 hover:border-color_6"
        aria-label="Open Control Center"
        title="Control Center"
      >
        <Settings size={20} />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-5"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="control-center-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-color_3 bg-color_1 p-5 text-color_4 shadow-2xl sm:rounded-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-color_6">System settings</p>
                <h2 id="control-center-title" className="mt-1 text-2xl font-bold">Control Center</h2>
                <p className="mt-1 text-sm text-color_5">Choose a ready provider and manage your local demo setup.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-color_5 hover:bg-color_2 hover:text-color_4"
                aria-label="Close Control Center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-color_3 bg-color_2 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Database size={18} />
                  <h3 className="font-semibold">Database</h3>
                  <span className="ml-auto text-xs text-color_5">One active provider</span>
                </div>

                <label htmlFor="database-provider" className="mb-2 block text-xs font-medium text-color_5">
                  Active database
                </label>
                <select
                  id="database-provider"
                  value="localstorage"
                  disabled={!storageReady}
                  className="w-full rounded-lg border border-color_3 bg-color_1 px-3 py-2 text-sm text-color_4 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-describedby="database-provider-help"
                >
                  <option value="localstorage">LocalStorage — Active</option>
                  <option value="supabase" disabled>Supabase — Coming in a later step</option>
                  <option value="firebase" disabled>Firebase — Coming in a later step</option>
                  <option value="mongodb" disabled>MongoDB — Coming in a later step</option>
                  <option value="appwrite" disabled>Appwrite — Coming in a later step</option>
                </select>
                <p id="database-provider-help" className="mt-2 text-xs text-color_5">
                  LocalStorage is the only database adapter ready to run right now. Other choices stay locked until their adapters are connected and tested.
                </p>

                <div className="mt-4 space-y-3 border-t border-color_3 pt-4">
                  <ProviderRow name="LocalStorage" detail="Browser-based demo database" status={storageReady ? 'active' : 'error'} label={storageReady ? 'Ready and active' : 'Unavailable'} />
                  <ProviderRow name="Supabase" detail="PostgreSQL cloud database" status="setup" label="Not configured" />
                  <ProviderRow name="Firebase" detail="Cloud Firestore" status="setup" label="Not configured" />
                  <ProviderRow name="MongoDB" detail="MongoDB database" status="setup" label="Not configured" />
                  <ProviderRow name="Appwrite" detail="Appwrite database" status="setup" label="Not configured" />
                </div>

                <button
                  type="button"
                  onClick={resetDemoDatabase}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-500/40 px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-500/10"
                >
                  <Trash2 size={15} /> Reset demo database
                </button>
              </div>

              <div className="rounded-xl border border-color_3 bg-color_2 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <ShieldCheck size={18} />
                  <h3 className="font-semibold">Authentication</h3>
                  <span className="ml-auto text-xs text-color_5">One active provider</span>
                </div>

                <label htmlFor="auth-provider" className="mb-2 block text-xs font-medium text-color_5">
                  Active authentication
                </label>
                <select
                  id="auth-provider"
                  value="demo"
                  className="w-full rounded-lg border border-color_3 bg-color_1 px-3 py-2 text-sm text-color_4"
                  aria-describedby="auth-provider-help"
                >
                  <option value="demo">Demo Auth — Active</option>
                  <option value="local_session" disabled>Local Session — Coming in a later step</option>
                  <option value="oauth" disabled>OAuth — Coming in a later step</option>
                </select>
                <p id="auth-provider-help" className="mt-2 text-xs text-color_5">
                  Demo Auth is the only authentication adapter ready to run right now. The other choices stay locked until their adapters are implemented.
                </p>

                <div className="mt-4 space-y-3 border-t border-color_3 pt-4">
                  <ProviderRow name="Demo Auth" detail="Browser-based test session" status="active" label="Ready and active" />
                  <ProviderRow name="Local Session" detail="Server-managed sessions" status="setup" label="Not configured" />
                  <ProviderRow name="OAuth" detail="Google / GitHub sign-in" status="setup" label="Not configured" />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-color_3 pt-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{user ? user.name : 'No demo user signed in'}</p>
                    <p className="text-xs text-color_5">{user ? user.email : 'Sign in to test a local session'}</p>
                  </div>
                  {user ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleSignOut()}
                      className="inline-flex items-center gap-2 rounded-lg border border-color_3 px-3 py-2 text-sm font-medium hover:bg-color_1 disabled:opacity-50"
                    >
                      <LogOut size={15} /> Sign out
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleSignIn()}
                      className="inline-flex items-center gap-2 rounded-lg bg-color_6 px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                    >
                      <LogIn size={15} /> Sign in as demo user
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-color_2 p-3 text-xs text-color_5">
              <CircleHelp size={16} className="mt-0.5 shrink-0" />
              <p>Only ready providers can be selected. LocalStorage and Demo Auth are for local testing only. Other providers remain visible but disabled until they are fully wired and tested.</p>
            </div>
            {message && <p role="status" className="mt-3 rounded-lg border border-color_3 p-3 text-sm text-color_5">{message}</p>}
          </section>
        </div>
      )}
    </>
  );
}
