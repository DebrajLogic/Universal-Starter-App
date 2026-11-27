// src/web_apps/saas/index.tsx
'use client';

import { Header } from '@/shared/layout/Header';
import { Footer } from '@/shared/layout/Footer';
import { notify } from '@/shared/plugins/toast/ToastPlugin';

// =============================================================================
// SAAS MINI-APP (Indigo workspace header & isolated saas_* data)
// =============================================================================
export default function SaasApp({ slug }: { slug?: string[] }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header
        brandName="PulseMetrics SaaS"
        brandHref="/saas"
        className="border-indigo-200 bg-indigo-50"
        navItems={[
          { label: 'All Apps', href: '/' },
          { label: 'Overview', href: '/saas' },
          { label: 'Billing', href: '/saas/billing' },
        ]}
        rightSlot={
          <button
            onClick={() => notify.success('Workspace synced!')}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            Sync Data
          </button>
        }
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-bold text-slate-900">SaaS Dashboard Mini-App</h1>
        <p className="mt-2 text-slate-600">
          Active sub-route: <code className="rounded bg-slate-100 px-2 py-0.5">/{slug?.join('/') || ''}</code>
        </p>
      </main>

      <Footer appName="PulseMetrics SaaS" className="bg-indigo-50/50" />
    </div>
  );
}
