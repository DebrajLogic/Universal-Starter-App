import EcommerceClient from './components/EcommerceClient';

// Mini-app route entry. Route-specific UI stays inside this mini-app.
export default function EcommercePage({ slug = [] }: { slug?: string[] }) {
  return <EcommerceClient slug={slug} />;
}
