'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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

  function safeDestination(): string {
    const next = searchParams.get('next');
    return next && next.startsWith('/') && !next.startsWith('//') ? next : '/ecommerce';
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isRegister) await auth.signUp(name, email, password);
      else await auth.signIn(email, password);
      window.dispatchEvent(new Event('usa-auth-change'));
      router.replace(safeDestination());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
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
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {isRegister && (
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Name</span>
                <input required minLength={2} maxLength={60} autoComplete="name" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg border border-color_3 bg-color_1 px-3 py-2.5 text-sm outline-none focus:border-color_6" placeholder="Your name" />
              </label>
            )}
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Email</span>
              <input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-lg border border-color_3 bg-color_1 px-3 py-2.5 text-sm outline-none focus:border-color_6" placeholder="you@example.com" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Password</span>
              <input required type="password" minLength={8} maxLength={128} autoComplete={isRegister ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-lg border border-color_3 bg-color_1 px-3 py-2.5 text-sm outline-none focus:border-color_6" placeholder="At least 8 characters" />
            </label>
            {error && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={busy} className="w-full rounded-lg bg-color_6 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'}</button>
          </form>
          <p className="mt-5 text-center text-sm text-color_5">{isRegister ? 'Already have an account?' : 'New here?'}{' '}
            <Link href={(isRegister ? '/login' : '/register') + (searchParams.get('next') ? '?next=' + encodeURIComponent(searchParams.get('next') as string) : '')} className="font-semibold text-color_6 hover:underline">{isRegister ? 'Sign in' : 'Create an account'}</Link>
          </p>
          <p className="mt-6 rounded-lg bg-color_1 p-3 text-xs leading-5 text-color_5">Local testing only. Accounts and sessions stay in this browser. This is not secure authentication for a public website.</p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
