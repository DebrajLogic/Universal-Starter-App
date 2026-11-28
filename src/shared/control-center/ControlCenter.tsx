'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Settings, X, Database, ShieldCheck, Trash2, LogIn, LogOut, CircleHelp,
  CheckCircle2, LoaderCircle, Palette, WifiOff, AlertCircle,
} from 'lucide-react';
import type { AuthUser } from '@/AUTH/auth/auth_contract';
import { auth } from '@/AUTH/auth/auth_switch';
import { useThemeMode } from '@/shared/themes/ThemeProvider';
import { AUTH_PROVIDERS, DATABASE_PROVIDERS, type ProviderDefinition } from './provider_registry';

type Status = 'connected' | 'connecting' | 'available' | 'offline' | 'error';
type StatusEntry = { state: Status; detail: string };

function StatusBadge({ status, detail }: StatusEntry) {
  const styles: Record<Status, string> = {
    connected: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
    connecting: 'border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-300',
    available: 'border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-300',
    offline: 'border-zinc-500/40 bg-zinc-500/10 text-zinc-500',
    error: 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-300',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium ${styles[status]}`}>
      {status === 'connecting' ? <LoaderCircle size={12} className="animate-spin" /> :
       status === 'connected' || status === 'available' ? <CheckCircle2 size={12} /> :
       status === 'offline' ? <WifiOff size={12} /> : <AlertCircle size={12} />}
      {status === 'connecting' ? 'Connecting…' : status === 'connected' ? 'Connected' : status === 'available' ? 'Available' : status === 'offline' ? 'Offline' : 'Error'}
      <span className="opacity-80">· {detail}</span>
    </span>
  );
}

function ProviderRow({ provider, status, active, onToggle }: {
  provider: ProviderDefinition;
  status: StatusEntry;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium">{provider.name}</p>
        <p className="text-xs text-color_5">{provider.detail}</p>
        <StatusBadge {...status} />
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        {active && <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-300">Active</span>}
        <button type="button" onClick={onToggle} disabled={status.state === 'connecting'}
          className="rounded-full border border-color_3 px-3 py-1.5 text-xs font-semibold transition hover:border-color_6 disabled:opacity-50">
          {status.state === 'connecting' ? 'Checking…' : 'Test'}
        </button>
      </div>
    </div>
  );
}

export function ControlCenter() {
  const router = useRouter();
  const pathname = usePathname();
  const { mode, toggleMode, theme, setTheme, themes } = useThemeMode();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showAllThemes, setShowAllThemes] = useState(false);
  const [pinnedThemes, setPinnedThemes] = useState<string[]>([theme.name, ...themes.filter(item => item.name !== theme.name).slice(0, 2).map(item => item.name)]);
  const [statuses, setStatuses] = useState<Record<string, StatusEntry>>(() => {
    const initial: Record<string, StatusEntry> = {};
    for (const provider of DATABASE_PROVIDERS) initial[`db:${provider.id}`] = {
      state: provider.readiness === 'ready' ? 'connected' : provider.readiness === 'available' ? 'available' : 'offline',
      detail: provider.statusLabel,
    };
    for (const provider of AUTH_PROVIDERS) initial[`auth:${provider.id}`] = {
      state: provider.readiness === 'ready' ? 'connected' : 'offline',
      detail: provider.statusLabel,
    };
    return initial;
  });

  useEffect(() => { const saved = window.localStorage.getItem('usa_pinned_themes'); if (saved) { try { const parsed = JSON.parse(saved); if (Array.isArray(parsed)) setPinnedThemes(parsed.filter((name): name is string => typeof name === 'string' && themes.some(item => item.name === name)).slice(0, 3)); } catch { /* keep defaults */ } } }, [themes]);

  function togglePinnedTheme(name: string) { setPinnedThemes(current => { const next = current.includes(name) ? current.filter(item => item !== name) : current.length < 3 ? [...current, name] : current; window.localStorage.setItem('usa_pinned_themes', JSON.stringify(next)); return next; }); }

  async function refreshStatus() {
    try {
      const storage = window.localStorage;
      storage.setItem('__usa_storage_check__', 'ok');
      storage.removeItem('__usa_storage_check__');
      setStatuses(previous => ({ ...previous, 'db:localstorage': { state: 'connected', detail: 'Read/write check passed' } }));
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Storage access failed';
      setStatuses(previous => ({ ...previous, 'db:localstorage': { state: 'error', detail } }));
      setErrorMessage(detail);
    }
    try {
      await auth.getCurrentUser();
      setStatuses(previous => ({ ...previous, 'auth:local_session': { state: 'connected', detail: 'Local auth adapter responded' } }));
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Auth check failed';
      setStatuses(previous => ({ ...previous, 'auth:local_session': { state: 'error', detail } }));
      setErrorMessage(detail);
    }
    try { setUser(await auth.getCurrentUser()); } catch { setUser(null); }
  }

  useEffect(() => {
    void refreshStatus();
    const handleAuthChange = () => { void refreshStatus(); };
    window.addEventListener('usa-auth-change', handleAuthChange);
    return () => window.removeEventListener('usa-auth-change', handleAuthChange);
  }, []);

  async function checkProvider(kind: 'db' | 'auth', provider: ProviderDefinition) {
    const key = `${kind}:${provider.id}`;
    setStatuses(previous => ({ ...previous, [key]: { state: 'connecting', detail: 'Running adapter check' } }));
    if (provider.readiness === 'setup') {
      setStatuses(previous => ({ ...previous, [key]: { state: 'offline', detail: 'Adapter is not configured' } }));
      return;
    }
    try {
      if (kind === 'db' && provider.id !== 'localstorage') {
        const response = await fetch('/api/control-center/database-health?provider=' + encodeURIComponent(provider.id), { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.error || 'Connection check failed.');
        setStatuses(previous => ({ ...previous, [key]: { state: 'connected', detail: 'Server connection check passed' } }));
        setErrorMessage('');
        return;
      }
      await refreshStatus();
      const current = statuses[key];
      if (current?.state === 'error') setErrorMessage(current.detail);
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown provider error';
      setStatuses(previous => ({ ...previous, [key]: { state: 'error', detail: 'Connection failed' } }));
      setErrorMessage(detail);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    setMessage('');
    try {
      await auth.signOut();
      setUser(null);
      setMessage('You are signed out.');
      setIsOpen(false);
      router.replace('/login?next=' + encodeURIComponent(pathname || '/'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Sign-out failed.');
    } finally {
      setBusy(false);
    }
  }

  function deleteAllAppData() {
    if (!window.confirm('Delete ALL Universal Starter App data from this browser? This removes app database records, local accounts, sessions, cart and saved preferences. Other websites’ data is not touched. This cannot be undone.')) return;
    const prefixes = ['app_db_', 'usa_', 'ecom_']; const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) { const key = window.localStorage.key(i); if (key && prefixes.some(prefix => key.startsWith(prefix))) keys.push(key); }
    keys.forEach(key => window.localStorage.removeItem(key)); setMessage(`Deleted ${keys.length} app data item(s). Other websites’ data was left untouched.`); setErrorMessage('');
  }

  const renderProviders = (kind: 'db' | 'auth', providers: ProviderDefinition[]) => providers.map(provider => (
    <ProviderRow key={provider.id} provider={provider}
      status={statuses[`${kind}:${provider.id}`] ?? { state: 'offline', detail: 'No status check registered' }}
      active={provider.active}
      onToggle={() => void checkProvider(kind, provider)} />
  ));

  return (
    <>
      <button type="button" onClick={() => { setIsOpen(true); void refreshStatus(); }}
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-500 bg-slate-900 text-white shadow-2xl ring-2 ring-white/80 transition hover:scale-105 hover:bg-slate-800"
        aria-label="Open Control Center" title="Control Center"><Settings size={20} /></button>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-5"
          role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setIsOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="control-center-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-color_3 bg-color_1 p-5 text-color_4 shadow-2xl sm:rounded-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-semibold uppercase tracking-widest text-color_6">System settings</p>
                <h2 id="control-center-title" className="mt-1 text-2xl font-bold">Control Center</h2>
                <p className="mt-1 text-sm text-color_5">Switch themes and inspect provider connections.</p></div>
              <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg p-2 text-color_5 hover:bg-color_2 hover:text-color_4" aria-label="Close Control Center"><X size={20} /></button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-color_3 bg-color_2 p-4">
                <div className="mb-3 flex items-center gap-2"><Palette size={18} /><h3 className="font-semibold">Appearance</h3></div>
                <div className="flex items-center justify-between gap-3 border-b border-color_3 pb-3">
                  <div><p className="text-sm font-medium">Color mode</p><p className="text-xs text-color_5">Switch between light and dark</p></div>
                  <button type="button" onClick={toggleMode} className="rounded-full border border-color_3 px-3 py-1.5 text-xs font-semibold">{mode === 'dark' ? 'Dark mode' : 'Light mode'} · Switch</button>
                </div>
                <p className="mb-2 mt-3 text-xs font-medium text-color_5">Choose a theme</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {(showAllThemes ? [...themes].sort((a,b) => Number(pinnedThemes.includes(b.name))-Number(pinnedThemes.includes(a.name))) : [...themes].filter(item => pinnedThemes.includes(item.name))).map(item => <div key={item.name} className="relative"><button type="button" onClick={() => setTheme(item.name)}
                    aria-pressed={theme.name === item.name}
                    className={`rounded-lg border p-3 text-left transition ${theme.name === item.name ? 'border-color_6 bg-color_6/10 ring-1 ring-color_6' : 'border-color_3 hover:border-color_6'}`}>
                    <span className="block text-sm font-semibold">{item.name}</span>
                    <span className="mt-1 block text-xs text-color_5">{theme.name === item.name ? 'Currently active' : 'Select theme'}</span>
                    <span className="mt-2 flex gap-1">{Object.values(item[mode]).slice(0, 5).map((color, index) => <i key={index} className="h-3 w-5 rounded-full border border-black/10" style={{ backgroundColor: color }} />)}</span>
                  </button><button type="button" onClick={() => togglePinnedTheme(item.name)} className="absolute right-2 top-2 rounded-md border border-color_3 bg-color_1 px-2 py-1 text-[10px] font-semibold">{pinnedThemes.includes(item.name) ? 'Pinned' : 'Pin'}</button></div>)}
                </div>
                <div className="mt-3 flex items-center justify-between gap-3"><p className="text-xs text-color_5">Pin up to 3 favorites · {themes.length} themes available</p><button type="button" onClick={() => setShowAllThemes(value => !value)} className="rounded-full border border-color_3 px-3 py-1.5 text-xs font-semibold">{showAllThemes ? 'Show featured' : 'More themes'}</button></div>
              </div>

              <div className="rounded-xl border border-color_3 bg-color_2 p-4">
                <div className="mb-3 flex items-center gap-2"><Database size={18} /><h3 className="font-semibold">Database</h3><span className="ml-auto text-xs text-color_5">Provider registry</span></div>
                <p className="mb-3 text-xs text-color_5">Only a configured, verified adapter can become active. Offline providers stay unavailable.</p>
                <div className="space-y-4 border-t border-color_3 pt-4">{renderProviders('db', DATABASE_PROVIDERS)}</div>
              </div>

              <div className="rounded-xl border border-color_3 bg-color_2 p-4">
                <div className="mb-3 flex items-center gap-2"><ShieldCheck size={18} /><h3 className="font-semibold">Authentication</h3><span className="ml-auto text-xs text-color_5">Provider registry</span></div>
                <p className="mb-3 text-xs text-color_5">Connection state is checked against the active authentication adapter.</p>
                <div className="space-y-4 border-t border-color_3 pt-4">{renderProviders('auth', AUTH_PROVIDERS)}</div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-color_3 pt-4">
                  <div className="min-w-0"><p className="text-sm font-medium">{user ? user.name : 'No account signed in'}</p><p className="text-xs text-color_5">{user ? user.email : 'Create an account or sign in'}</p></div>
                  {user ? <button type="button" disabled={busy} onClick={() => void handleSignOut()} className="inline-flex items-center gap-2 rounded-lg border border-color_3 px-3 py-2 text-sm font-medium hover:bg-color_1 disabled:opacity-50">{busy ? <LoaderCircle size={15} className="animate-spin" /> : <LogOut size={15} />}{busy ? 'Signing out…' : 'Sign out'}</button> :
                    <Link href="/login" onClick={() => setIsOpen(false)} className="inline-flex items-center gap-2 rounded-lg bg-color_6 px-3 py-2 text-sm font-semibold text-white hover:opacity-90"><LogIn size={15} /> Sign in</Link>}
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-color_2 p-3 text-xs text-color_5"><CircleHelp size={16} className="mt-0.5 shrink-0" /><p>Available means adapter code is present. Connected means its check passed. Offline means it is not configured or reachable. Provider activation remains controlled by the provider switchboard.</p></div>
            {errorMessage && <div role="alert" className="mt-3 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300"><b>Provider error</b><p className="mt-1 break-words">{errorMessage}</p></div>}
            {message && <p role="status" className="mt-3 rounded-lg border border-color_3 p-3 text-sm text-color_5">{message}</p>}
            <div className="mt-5 rounded-xl border-2 border-red-500/60 bg-red-500/5 p-4"><div className="flex items-start gap-3"><Trash2 size={18} className="mt-0.5 shrink-0 text-red-600"/><div className="min-w-0 flex-1"><h3 className="font-semibold text-red-700 dark:text-red-300">Delete all app data</h3><p className="mt-1 text-xs text-color_5">Removes this app’s LocalStorage database, local accounts, sessions, cart and saved preferences. Other websites’ data is not touched.</p><button type="button" onClick={deleteAllAppData} className="mt-3 rounded-lg border border-red-500/60 bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700">Delete all data</button></div></div></div>
          </section>
        </div>
      )}
    </>
  );
}
