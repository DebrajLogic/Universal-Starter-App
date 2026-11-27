import { notFound } from 'next/navigation';
import { WEB_APP_SWITCHES } from '@/web_apps/web_app_switches';
import EcommerceApp from '@/web_apps/ecommerce';
import BlogApp from '@/web_apps/blog';
import SaasApp from '@/web_apps/saas';

// =============================================================================
// DYNAMIC MINI-APP REGISTRY (Maps URL slug -> Active Mini-App)
// =============================================================================
const APP_COMPONENTS: Record<string, React.ComponentType<{ slug?: string[] }>> = {
  ecommerce: EcommerceApp,
  blog: BlogApp,
  saas: SaasApp,
};

export default async function WebAppCatchAllPage({
  params,
}: {
  params: Promise<{ web_app: string; slug?: string[] }>;
}) {
  const { web_app, slug } = await params;
  const config = WEB_APP_SWITCHES[web_app];
  const AppComponent = APP_COMPONENTS[web_app];

  if (!config || !config.enabled || !AppComponent) {
    notFound();
  }

  return <AppComponent slug={slug} />;
}
