'use client';

import { Header } from '@/shared/layout/Header';
import { Footer } from '@/shared/layout/Footer';
import { notify } from '@/shared/plugins/toast/ToastPlugin';

// =============================================================================
// BLOG MINI-APP (Uses color_1..8 tokens & isolated blog_* data)
// =============================================================================
export default function BlogApp({ slug }: { slug?: string[] }) {
  return (
    <div className="flex min-h-screen flex-col bg-color_1 text-color_4">
      <Header
        brandName="The Dev Dispatch"
        brandHref="/blog"
        navItems={[
          { label: 'All Apps', href: '/' },
          { label: 'Articles', href: '/blog' },
          { label: 'Drafts', href: '/blog/drafts' },
        ]}
        rightSlot={
          <button
            onClick={() => notify.info('Subscribed to newsletter!')}
            className="rounded-md bg-color_7 px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
          >
            Subscribe
          </button>
        }
      />

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-bold text-color_4">Editorial Blog Mini-App</h1>
        <p className="mt-2 text-color_5">
          Active sub-route:{' '}
          <code className="rounded border border-color_3 bg-color_2 px-2 py-0.5 text-color_7">
            /{slug?.join('/') || ''}
          </code>
        </p>
      </main>

      <Footer appName="The Dev Dispatch" />
    </div>
  );
}
