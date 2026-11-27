'use client';

import { Header } from '@/shared/layout/Header';
import { Footer } from '@/shared/layout/Footer';
import { notify } from '@/shared/plugins/toast/ToastPlugin';

// =============================================================================
// SAAS MINI-APP (Uses color_1..8 tokens & isolated saas_* data)
// =============================================================================
export default function SaasApp({ slug }: { slug?: string[] }) {
  return (
    <div className="flex min-h-screen flex-col bg-color_1 text-color_4">
      <Header
        brandName="PulseMetrics SaaS"
        brandHref="/saas"
        navItems={[
          { label: 'All Apps', href: '/' },
          { label: 'Overview', href: '/saas' },
          { label: 'Billing', href: '/saas/billing' },
        ]}
        rightSlot={
          <button
            onClick={() => notify.success('Workspace synced!')}
            className="rounded-md bg-color_6 px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
          >
            Sync Data
          </button>
        }
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-bold text-color_4">SaaS Dashboard Mini-App</h1>
        <p className="mt-2 text-color_5">
          Active sub-route:{' '}
          <code className="rounded border border-color_3 bg-color_2 px-2 py-0.5 text-color_6">
            /{slug?.join('/') || ''}
          </code>
        </p>
      </main>

      <Footer appName="PulseMetrics SaaS" />
    </div>
  );
}
