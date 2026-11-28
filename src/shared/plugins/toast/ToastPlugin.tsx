'use client';

import { useEffect, useState } from 'react';
import { PLUGIN_SWITCHES } from '../plugin_switches';

// =============================================================================
// LIGHTWEIGHT GLOBAL TOAST PLUGIN (Zero external dependencies)
// Any mini-app calls: notify.success("Saved!") or notify.error("Failed!")
// =============================================================================
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastEventDetail {
  message: string;
  type: ToastType;
}

const TOAST_EVENT = 'universal-app-toast';

export const notify = {
  success: (message: string) => dispatchToast(message, 'success'),
  error: (message: string) => dispatchToast(message, 'error'),
  warning: (message: string) => dispatchToast(message, 'warning'),
  info: (message: string) => dispatchToast(message, 'info'),
};

function dispatchToast(message: string, type: ToastType) {
  if (typeof window === 'undefined' || !PLUGIN_SWITCHES.toast) return;
  window.dispatchEvent(
    new CustomEvent<ToastEventDetail>(TOAST_EVENT, { detail: { message, type } })
  );
}

export function ToastProvider() {
  const [toast, setToast] = useState<ToastEventDetail | null>(null);

  useEffect(() => {
    if (!PLUGIN_SWITCHES.toast) return;

    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<ToastEventDetail>;
      setToast(customEvent.detail);
      setTimeout(() => setToast(null), 3000);
    };

    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
  }, []);

  if (!PLUGIN_SWITCHES.toast || !toast) return null;

  const badgeColors: Record<ToastType, string> = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-rose-600 text-white',
    info: 'bg-slate-900 text-white',
    warning: 'bg-amber-500 text-slate-950',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <div className={`rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${badgeColors[toast.type]}`}>
        {toast.message}
      </div>
    </div>
  );
}
