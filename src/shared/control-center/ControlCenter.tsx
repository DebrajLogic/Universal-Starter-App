'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Settings, X, Database, ShieldCheck, Trash2, LogIn, LogOut, CircleHelp, AlertTriangle, CheckCircle2,
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

function ProviderSwitch({ name, detail, status, label, active, onToggle }: {
  name: string;
  detail: string;
  status: ProviderStatus;
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  const [animating, setAnimating] = useState(false);

  function handleClick() {
    setAnimating(true);
    window.setTimeout(() => setAnimating(false), 220);
    onToggle();
  }

  const knobIsOn = animating ? !active : active;

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-color_5">{detail}</p>
        <span className="mt-1 flex items-center gap-1.5 text-xs text-color_5">
          <StatusDot status={status} /> {label}
        </span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label={active ? `Turn off ${name}` : `Activate ${name}`}
        onClick={handleClick}
        className={'relative h-7 w-12 shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-color_6 focus:ring-offset-2 transition-colors duration-200 ' + (knobIsOn ? 'bg-emerald-600' : 'bg-zinc-400')}
      >
        <span
          className="absolute left-0.5 top-1 h-5 w-5 rounded-full bg-white shadow-md"
          style={{
            transform: 'translateX(' + (knobIsOn ? '20px' : '0px') + ')',
            transition: 'transform 180ms ease-in-out',
          }}
        />
      </button>
    </div>
  );
}

export function ControlCenter() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState<{ type: 'warning' | 'error' | 'success'; message: string } | null>(null);

  function showNotice(message: string, type: 'warning' | 'error' | 'success' = 'warning') {
    setNotice({ type, message });
  }
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

  async function handleSignOut() {
    setBusy(true);
    setMessage('');
    try {
      await auth.signOut();
      setUser(null);
      setMessage('You are signed out.');
      showNotice('You are signed out.', 'success');
      setIsOpen(false);
      router.replace('/login?next=' + encodeURIComponent(pathname || '/ecommerce'));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign-out failed.';
      setMessage(errorMessage);
      showNotice(errorMessage, 'error');
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
    const resetMessage = `Reset complete. Removed ${removed} database collection(s). Your theme and local account were left untouched.`;
    setMessage(resetMessage);
    showNotice(resetMessage, 'success');
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
                <p className="mt-1 text-sm text-color_5">Manage providers and check your local demo setup.</p>
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

            {notice && (
              <div
                role="status"
                aria-live="polite"
                className={'mt-4 flex items-start gap-3 rounded-xl border p-3 text-sm shadow-sm ' + (notice.type === 'warning' ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300' : notice.type === 'error' ? 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300' : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300')}
              >
                {notice.type === 'success' ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <AlertTriangle size={18} className="mt-0.5 shrink-0" />}
                <p className="min-w-0 flex-1">{notice.message}</p>
                <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notification" className="shrink-0 rounded p-0.5 opacity-70 transition hover:opacity-100">
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-color_3 bg-color_2 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Database size={18} />
                  <h3 className="font-semibold">Database</h3>
                  <span className="ml-auto text-xs text-color_5">One active provider</span>
                </div>

                <p className="mb-3 text-xs text-color_5">
                  Turn on one provider. Providers that are not ready show the reason in a notification.
                </p>
                <div className="space-y-4 border-t border-color_3 pt-4">
                  <ProviderSwitch name="LocalStorage" detail="Browser-based demo database" status={storageReady ? 'active' : 'error'} label={storageReady ? 'Ready · Active' : 'Browser storage unavailable'} active={true} onToggle={() => {
                    showNotice('LocalStorage is your only working database. Set up another database before switching it off.');
                  }} />
                  <ProviderSwitch name="Supabase" detail="PostgreSQL cloud database" status="setup" label="Adapter and credentials not configured" active={false} onToggle={() => {
                    showNotice('Supabase is not ready. Add its adapter, URL, and API key before activating it.');
                  }} />
                  <ProviderSwitch name="Firebase" detail="Cloud Firestore" status="setup" label="Adapter and credentials not configured" active={false} onToggle={() => {
                    showNotice('Firebase is not ready. Add its adapter and Firebase configuration before activating it.');
                  }} />
                  <ProviderSwitch name="MongoDB" detail="MongoDB database" status="setup" label="Server adapter not configured" active={false} onToggle={() => {
                    showNotice('MongoDB is not ready. Add and configure its server adapter before activating it.');
                  }} />
                  <ProviderSwitch name="Appwrite" detail="Appwrite database" status="setup" label="Adapter and credentials not configured" active={false} onToggle={() => {
                    showNotice('Appwrite is not ready. Add its adapter and project credentials before activating it.');
                  }} />
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

                <p className="mb-3 text-xs text-color_5">
                  Local Auth stays active for this local test build.
                </p>
                <div className="space-y-4 border-t border-color_3 pt-4">
                  <ProviderSwitch name="Local Auth" detail="Browser-based accounts for local testing" status="active" label="Ready · Active" active={true} onToggle={() => {
                    showNotice('Local Auth is your only working authentication provider. Keep it active while testing this mini-app.');
                  }} />
                  <ProviderSwitch name="OAuth" detail="Google / GitHub sign-in" status="setup" label="OAuth adapter and credentials not configured" active={false} onToggle={() => {
                    showNotice('OAuth is not ready. Implement the OAuth adapter and configure your provider credentials first.');
                  }} />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-color_3 pt-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{user ? user.name : 'No account signed in'}</p>
                    <p className="text-xs text-color_5">{user ? user.email : 'Create an account or sign in'}</p>
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
                    <Link
                      href="/login"
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center gap-2 rounded-lg bg-color_6 px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
                    >
                      <LogIn size={15} /> Sign in
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-color_2 p-3 text-xs text-color_5">
              <CircleHelp size={16} className="mt-0.5 shrink-0" />
              <p>Switches show provider status. An unavailable provider cannot become active; the current working provider stays on until a replacement is configured and passes its checks. LocalStorage and Local Auth are for local testing only.</p>
            </div>
            {message && !notice && <p role="status" className="mt-3 rounded-lg border border-color_3 p-3 text-sm text-color_5">{message}</p>}
          </section>
        </div>
      )}
    </>
  );
}
