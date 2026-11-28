import { Suspense } from 'react';
import { AuthForm } from '@/AUTH/components/AuthForm';

export default function LoginPage() {
  return <Suspense fallback={<div className="min-h-screen bg-color_1" />}><AuthForm mode="login" /></Suspense>;
}
