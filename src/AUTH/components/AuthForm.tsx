'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { auth } from '@/AUTH/auth/auth_switch';
import { Header } from '@/shared/layout/Header';
import { Footer } from '@/shared/layout/Footer';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isRegister = mode === 'register';

  function clearError() {
    if (error) setError('');
  }

  function safeDestination(): string {
    const next = searchParams.get('next');
    return next && next.startsWith('/') && !next.startsWith('//') ? next : '/ecommerce';
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setError('');
    setBusy(true);

    try {
      if (isRegister) await auth.signUp(name, email, password);
      else await auth.signIn(email, password);

      setName('');
      setEmail('');
      setPassword('');
      window.dispatchEvent(new Event('usa-auth-change'));
      router.replace(safeDestination());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
      // Keep the email so the user does not need to type it again.
      // Clear the password so an incorrect password is never left in the form.
      setPassword('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-color_1 text-color_4">
      <Header brandName="Universal Starter App" />
      <main className="mx-auto flex w-full max-w-md flex-1 items-center px-5 py-12">
        <section className="w-full rounded-2xl border border-color_3 bg-color_2 p-6 shadow-xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-color_6">Local account</p>
          <h1 className="mt-2 text-2xl font-bold">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
          <p className="mt-2 text-sm text-color_5">{isRegister ? 'Create an account to enter the mini-app.' : 'Sign in to continue to your mini-app.'}</p>

          <form onSubmit={handleSubmit} aria-busy={busy} className="mt-6 space-y-4">
            {isRegister && (
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Name</span>
                <input
                  required minLength={2} maxLength={60} autoComplete="name"
                  disabled={busy} value={name}
                  onChange={e => { setName(e.target.value); clearError(); }}
                  className="w-full rounded-lg border border-color_3 bg-color_1 px-3 py-2.5 text-sm outline-none focus:border-color_6 disabled:opacity-60"
                  placeholder="Your name"
                />
              </label>
            )}

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Email</span>
              <input
                required type="email" autoComplete="email" disabled={busy}
                value={email}
                onChange={e => { setEmail(e.target.value); clearError(); }}
                className="w-full rounded-lg border border-color_3 bg-color_1 px-3 py-2.5 text-sm outline-none focus:border-color_6 disabled:opacity-60"
                placeholder="you@example.com"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Password</span>
              <input
                required type="password" minLength={isRegister ? 8 : undefined}
                maxLength={128} autoComplete={isRegister ? 'new-password' : 'current-password'}
                disabled={busy} value={password}
                onChange={e => { setPassword(e.target.value); clearError(); }}
                className="w-full rounded-lg border border-color_3 bg-color_1 px-3 py-2.5 text-sm outline-none focus:border-color_6 disabled:opacity-60"
                placeholder={isRegister ? 'At least 8 characters' : 'Your password'}
              />
            </label>

            {error && (
              <p role="alert" aria-live="assertive" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit" disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-color_6 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy && <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />}
              <span>{busy ? (isRegister ? 'Creating account...' : 'Signing in...') : isRegister ? 'Create account' : 'Sign in'}</span>
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-color_5">
            {isRegister ? 'Already have an account?' : 'New here?'}{' '}
            <Link
              href={(isRegister ? '/login' : '/register') + (searchParams.get('next') ? '?next=' + encodeURIComponent(searchParams.get('next') as string) : '')}
              className="font-semibold text-color_6 hover:underline"
            >
              {isRegister ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
          <p className="mt-6 rounded-lg bg-color_1 p-3 text-xs leading-5 text-color_5">
            Local testing only. Accounts and sessions stay in this browser. This is not secure authentication for a public website.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
