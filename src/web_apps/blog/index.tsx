// src/web_apps/blog/index.tsx
'use client';

import { Header } from '@/shared/layout/Header';
import { Footer } from '@/shared/layout/Footer';
import { notify } from '@/shared/plugins/toast/ToastPlugin';

// =============================================================================
// BLOG MINI-APP (Minimalist editorial header & isolated blog_* data)
// =============================================================================
export default function BlogApp({ slug }: { slug?: string[] }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header
        brandName="The Dev Dispatch"
        brandHref="/blog"
        className="border-slate-200 bg-white"
        navItems={[
          { label: 'All Apps', href: '/' },
          { label: 'Articles', href: '/blog' },
          { label: 'Drafts', href: '/blog/drafts' },
        ]}
        rightSlot={
          <button
            onClick={() => notify.info('Subscribed to newsletter!')}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Subscribe
          </button>
        }
      />

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-bold text-slate-900">Editorial Blog Mini-App</h1>
        <p className="mt-2 text-slate-600">
          Active sub-route: <code className="rounded bg-slate-100 px-2 py-0.5">/{slug?.join('/') || ''}</code>
        </p>
      </main>

      <Footer appName="The Dev Dispatch" />
    </div>
  );
}
