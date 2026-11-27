// =============================================================================
// MINI-APPS CIRCUIT BREAKER (Turn mini-apps ON/OFF without touching routes)
// =============================================================================
export interface WebAppConfig {
  enabled: boolean;
  name: string;
  description: string;
  tablePrefix: string;
}

export const WEB_APP_SWITCHES: Record<string, WebAppConfig> = {
  ecommerce: {
    enabled: true,
    name: 'E-Commerce Store',
    description: 'Modular storefront with prefixed ecom_* collections.',
    tablePrefix: 'ecom_',
  },
  blog: {
    enabled: true,
    name: 'Editorial Blog',
    description: 'Clean publishing engine with prefixed blog_* collections.',
    tablePrefix: 'blog_',
  },
  saas: {
    enabled: true,
    name: 'SaaS Workspace',
    description: 'Dashboard starter with prefixed saas_* collections.',
    tablePrefix: 'saas_',
  },
};
