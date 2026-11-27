import Link from 'next/link';
import { WEB_APP_SWITCHES } from '@/web_apps/web_app_switches';
import { DB_SWITCHES } from '@/DB/config/db_switches';
import { AUTH_SWITCHES } from '@/AUTH/config/auth_switches';
import { Header } from '@/shared/layout/Header';
import { Footer } from '@/shared/layout/Footer';

// =============================================================================
// LAUNCHPAD HOME PAGE (Displays active web_apps & switches using color_1..8)
// =============================================================================
export default function HomePage() {
  const activeApps = Object.entries(WEB_APP_SWITCHES).filter(([, cfg]) => cfg.enabled);
  const activeDb = Object.entries(DB_SWITCHES).find(([, isOn]) => isOn)?.at(0) || 'none';
  const activeAuth = Object.entries(AUTH_SWITCHES).find(([, isOn]) => isOn)?.at(0) || 'none';

  return (
    <div className="flex min-h-screen flex-col bg-color_1 text-color_4">
      <Header brandName="Universal Starter App" />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <div className="mb-8 flex flex-wrap items-center gap-3 text-xs font-medium">
          <span className="rounded-full border border-color_3 bg-color_2 px-3 py-1 text-color_7">
            Active DB: {activeDb}
          </span>
          <span className="rounded-full border border-color_3 bg-color_2 px-3 py-1 text-color_6">
            Active Auth: {activeAuth}
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-color_4">Active Web Apps</h1>
        <p className="mt-2 text-color_5">
          Select any enabled mini-app below to launch its isolated routes and custom UI.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {activeApps.map(([key, app]) => (
            <Link
              key={key}
              href={`/${key}`}
              className="group rounded-xl border border-color_3 bg-color_2 p-6 transition hover:border-color_6"
            >
              <h2 className="text-lg font-bold text-color_4">{app.name}</h2>
              <p className="mt-2 text-sm text-color_5">{app.description}</p>
              <span className="mt-4 inline-block text-xs font-semibold text-color_6 group-hover:underline">
                Launch /{key} &rarr;
              </span>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
