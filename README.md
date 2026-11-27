# Universal Starter App (Next.js Modular Engine)

A production-ready, plug-and-play Next.js (App Router + TypeScript + Tailwind CSS) starter template. 

Clone this repository to build and deploy ANY application—E-Commerce, SaaS, Blog, or Hybrid—without re-configuring databases, authentication, or core infrastructure.

---

## 1. Core Architectural Rules (Read First)

1. **Zero Cross-App Imports:** Mini-apps inside `src/web_apps/` are completely independent. Deleting any folder inside `src/web_apps/` (and turning it `false` in `web_app_switches.ts`) must never break the rest of the build.

2. **One-Way Dependency Flow:**
   - `src/web_apps/*` can import from `src/DB/`, `src/AUTH/`, and `src/shared/`.
   - `src/web_apps/*` can **NEVER** import from another `src/web_apps/*` folder.
   - `src/shared/` can **NEVER** import from `src/web_apps/`.

3. **Adapter-Only Infrastructure:** Business logic never calls Supabase, MongoDB, Firebase, or NextAuth directly. Always import `db` from `@/DB/db/db_switch` and `auth` from `@/AUTH/auth/auth_switch`.

4. **Shared Database Table Prefixing:** Multiple deployed apps can share a single database instance. Prefix all tables/collections with the mini-app's name (e.g., `ecom_products`, `blog_posts`, `saas_workspaces`). Only the `users` table is shared.

5. **App-Controlled Chrome:** `src/app/layout.tsx` provides only the bare HTML shell and global plugins. Each `web_app` renders its own custom-styled Header and Footer (or imports the default ones from `src/shared/layout/`).

---

## 2. Folder & File Structure

```bash
   tree src -L 4 -I "node_modules|dist|build"
```

```python
universal-starter-app/
├── .env.example                 # Env template (committed)
├── .env.local                   # Real secrets (git-ignored)
├── .gitignore
├── package.json
└── README.md
│
└── src/
    ├── app/                     # 1. NEXT.JS ROUTING (Traffic cop)
    │   ├── layout.tsx           # Bare HTML shell + global plugins
    │   ├── page.tsx             # Home page (lists active web_apps)
    │   ├── not-found.tsx        # Global 404 page
    │   ├── [web_app]/
    │   │   └── [[...slug]]/
    │   │       └── page.tsx     # Catch-all router for mini-apps
    │   └── api/
    │       ├── auth/
    │       │   └── [...nextauth]/
    │       │       └── route.ts # NextAuth / OAuth API route
    │       └── health/
    │           └── route.ts     # 200 OK health check endpoint
    │
    ├── web_apps/                # 2. MINI-APPS (Delete-safe)
    │   ├── web_app_switches.ts  # ON/OFF switches for mini-apps
    │   ├── ecommerce/           # Store app (tables: ecom_*)
    │   ├── blog/                # Blog app (tables: blog_*)
    │   └── saas/                # SaaS app (tables: saas_*)
    │
    ├── DB/                      # 3. DATABASE SWITCHBOARD
    │   ├── config/
    │   │   ├── db_switches.ts   # ON/OFF: local, supabase, firebase, mongo
    │   │   └── db_env.ts        # Checks keys ONLY for ON databases
    │   └── db/
    │       ├── db_contract.ts   # Shared CRUD rules
    │       ├── db_switch.ts     # Exports active `db` adapter
    │       └── db_services/     # Database implementations
    │           ├── db_localstorage.ts
    │           ├── db_supabase.ts
    │           ├── db_firebase.ts
    │           └── db_mongodb.ts
    │
    ├── AUTH/                    # 4. AUTH SWITCHBOARD
    │   ├── config/
    │   │   ├── auth_switches.ts # ON/OFF: demo, local_session, oauth
    │   │   └── auth_env.ts      # Checks keys ONLY for ON auth
    │   └── auth/
    │       ├── auth_contract.ts # Shared login/user rules
    │       ├── auth_switch.ts   # Exports active `auth` adapter
    │       └── auth_services/   # Auth implementations
    │           ├── auth_demo.ts
    │           ├── auth_local_session.ts
    │           └── auth_oauth.ts
    │
    └── shared/                  # 5. SHARED UI & PLUGINS
        ├── ui/                  # Basic UI (Button, Input, Modal)
        ├── layout/              # Default Header.tsx & Footer.tsx
        ├── plugins/             # Global add-ons (toast, dark mode)
        │   ├── plugin_switches.ts
        │   └── toast/
        └── utils/               # Helper functions (date, price, cn)

```

---

## 3. Master Environment Template (`.env.example`)

Copy `.env.example` to `.env.local`. **You only need to fill in variables for switches set to `true` (`ON`).**

```python
# ==============================================================================
# UNIVERSAL STARTER APP - MASTER ENVIRONMENT VARIABLES
# ==============================================================================
# NOTE: You DO NOT need to fill in every key below!
# Only fill in the sections that are turned ON (true) in:
# -> src/DB/config/db_switches.ts
# -> src/AUTH/config/auth_switches.ts
# ==============================================================================


# ------------------------------------------------------------------------------
# 1. APP & CORE SETTINGS (Always Recommended)
# ------------------------------------------------------------------------------
NEXT_PUBLIC_APP_NAME="UniversalStarterApp"
NEXT_PUBLIC_APP_URL="http://localhost:3000"


# ------------------------------------------------------------------------------
# 2. DATABASE: SUPABASE (PostgreSQL)
# Required ONLY when DB_SWITCHES.supabase = true
# ------------------------------------------------------------------------------
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""


# ------------------------------------------------------------------------------
# 3. DATABASE: MONGODB ATLAS
# Required ONLY when DB_SWITCHES.mongodb = true
# ------------------------------------------------------------------------------
MONGODB_URI=""
MONGODB_DB_NAME="universal_portfolio_db"


# ------------------------------------------------------------------------------
# 4. DATABASE: FIREBASE (Firestore)
# Required ONLY when DB_SWITCHES.firebase = true
# ------------------------------------------------------------------------------
NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
FIREBASE_CLIENT_EMAIL=""
FIREBASE_PRIVATE_KEY=""


# ------------------------------------------------------------------------------
# 5. AUTHENTICATION (Auth.js / OAuth)
# Required ONLY when AUTH_SWITCHES.oauth = true
# ------------------------------------------------------------------------------
AUTH_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""


# ------------------------------------------------------------------------------
# 6. PAYMENTS (Razorpay / Stripe)
# Required ONLY when using payment plugins/features
# ------------------------------------------------------------------------------
# Razorpay (India / Global)
NEXT_PUBLIC_RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""
RAZORPAY_WEBHOOK_SECRET=""

# Stripe (Optional alternative)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""


# ------------------------------------------------------------------------------
# 7. EMAIL NOTIFICATIONS (Resend / SMTP)
# Required ONLY when using email notifications
# ------------------------------------------------------------------------------
RESEND_API_KEY=""
EMAIL_FROM="onboarding@yourdomain.com"


# ------------------------------------------------------------------------------
# 8. AI & EXTERNAL APIs (Optional Plugins)
# ------------------------------------------------------------------------------
GEMINI_API_KEY=""
OPENAI_API_KEY=""
```

---

## 4. Developer & AI Workflows

### How to Add a New Mini-App
1. Create a new folder: `src/web_apps/<app_name>/` with an `index.tsx` entry component.
2. Prefix all database collections/tables inside that app with `<app_name>_`.
3. Register `<app_name>` in `src/web_apps/web_app_switches.ts` and set `enabled: true`.
4. Access it immediately at `/<app_name>`.

### How to Remove a Mini-App
1. Delete `src/web_apps/<app_name>/`.
2. Remove `<app_name>` from `src/web_apps/web_app_switches.ts`.
3. Run `npm run build` (no route files or shared layouts need editing).

### How to Switch Database or Auth Providers
1. Open `src/DB/config/db_switches.ts` (or `src/AUTH/config/auth_switches.ts`).
2. Set the desired provider to `true` and others to `false`.
3. Add the matching keys in `.env.local` (if using `localstorage` + `demo`, zero `.env` keys are required).


---

# Step-by-Step Build Guide
We'll build in 6 Phases:
* Next.js App Router + TypeScript + Tailwind v4 `(Phase 1–2)`
* Database & Auth circuit breakers `(Phase 3–4)`
* Shared layout, helpers & toast plugin `(Phase 5)`
* Dynamic mini-app catch-all routing + health endpoint `(Phase 6)`

### Phase 1: Spin Up the Blank Next.js Stage
1. Create the project (`universal-starter-app`):
   ```bash
   npx create-next-app@latest universal-starter-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
   ```
2. Enter the project folder:
   ```bash
   cd universal-starter-app
   ```
3. Install core dependencies (`zod` + `lucide-react`):
   ```bash
   npm install zod lucide-react
   ```
___

### Phase 2: Create Environment Files & Folder Skeleton

1. Create `.env.example` at the project root using Section 3 above.

2. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

3. Create the full `src/` directory skeleton:

```bash
mkdir -p "src/app/[web_app]/[[...slug]]" "src/app/api/auth/[...nextauth]" "src/app/api/health" "src/web_apps/ecommerce" "src/web_apps/blog" "src/web_apps/saas" "src/DB/config" "src/DB/db/db_services" "src/AUTH/config" "src/AUTH/auth/auth_services" "src/shared/ui" "src/shared/layout" "src/shared/plugins/toast" "src/shared/utils"
```
___
### Phase 3: Wire Up the `src/DB/` Circuit Breaker

1. Create `src/DB/config/db_switches.ts` with `localstorage: true` and cloud databases set to `false`.

2. Create `src/DB/config/db_env.ts` to validate `.env.local` keys only for active databases.

3. Create `src/DB/db/db_contract.ts` defining the shared CRUD rules (`getAll`, `getById`, `insert`, `update`, `remove`).

4. Create `src/DB/db/db_services/db_localstorage.ts` and the three cloud stubs (`db_supabase.ts`, `db_mongodb.ts`, `db_firebase.ts`).

5. Create `src/DB/db/db_switch.ts` to export the active `db` adapter based on `DB_SWITCHES`.

___
### Phase 4: Wire Up the `src/AUTH/` Circuit Breaker

1. Create `src/AUTH/config/auth_switches.ts` with `demo: true` and `local_session` / `oauth` set to `false`.

2. Create `src/AUTH/config/auth_env.ts` to validate `.env.local` keys only when `oauth` is ON.

3. Create `src/AUTH/auth/auth_contract.ts` defining the `AuthUser` shape and login/logout rules.

4. Create `src/AUTH/auth/auth_services/auth_demo.ts` and the two stubs (`auth_local_session.ts`, `auth_oauth.ts`).

5. Create `src/AUTH/auth/auth_switch.ts` to export the active `auth` adapter based on `AUTH_SWITCHES`.

___
### Phase 5: Build the `src/shared/` Toolbox

1. Create `src/shared/utils/helpers.ts` with pure formatting helpers (`cn`, `formatCurrency`, `formatDate`).

2. Create `src/shared/plugins/plugin_switches.ts` with `toast: true` to toggle global plugins.

3. Create `src/shared/plugins/toast/ToastPlugin.tsx` exporting `ToastProvider` and `notify` (`success`, `error`, `info`).

4. Create `src/shared/layout/Header.tsx` and `src/shared/layout/Footer.tsx` as configurable default shells that any mini-app can style or replace.

___
### Phase 6: Wire Up `src/web_apps/` & `src/app/` Routing

1. Create `src/web_apps/web_app_switches.ts` to register and toggle mini-apps (`ecommerce`, `blog`, `saas`).

2. Create `index.tsx` inside `src/web_apps/ecommerce/`, `src/web_apps/blog/`, and `src/web_apps/saas/`, each with its own custom-styled `Header` and `Footer`.

3. Create `src/app/[web_app]/[[...slug]]/page.tsx` to route URLs dynamically to active mini-apps.

4. Update `src/app/layout.tsx` (mounting `ToastProvider`) and `src/app/page.tsx` (displaying active mini-apps and circuit-breaker status).

5. Create `src/app/api/health/route.ts` for deployment health checks.

6. Run `npm run build && npm run dev` to verify zero TypeScript or build errors.

___
___

# Database

This starter kit uses a **Switch + Adapter** pattern (`src/DB/db/db_switch.ts`). The app code only ever calls `db.getAll()`, `db.getById()`, `db.insert()`, `db.update()`, and `db.remove()`—allowing you to swap databases in one place (`src/DB/db/db_<database>.ts`) without rewriting your features.

### Universal AI Adapter Generator Prompt

Copy the prompt below, fill in `Database: { ... }` on the first line (e.g., `MongoDB`, `Supabase`, `Firebase`, `PostgreSQL`), and paste it into any AI to generate a zero-edit adapter file:

```markdown
Database: { MongoDB }

Write a complete, production-ready TypeScript database adapter file (`src/DB/db_services/db_<database_lowercase>.ts`) for a Next.js App Router project using the official Node/TypeScript SDK for the Database specified above.

Do NOT ask about my rest-of-app folder structure. Follow EVERY rule below strictly so the output compiles with zero edits:

1. Import the contract directly using: `import type { BaseRecord, DbContract } from "../db_contract";` (do NOT re-declare `BaseRecord` or `DbContract` in this file).

2. Implement ONLY these exact 5 method names, generic constraints, and return types from `DbContract`:

export interface BaseRecord {
  id: string;
  created_at?: string;
}

export interface DbContract {
  getAll<T extends BaseRecord>(collection: string): Promise<T[]>;
  getById<T extends BaseRecord>(collection: string, id: string): Promise<T | null>;
  insert<T extends Partial<BaseRecord>>(collection: string, data: T): Promise<T & BaseRecord>;
  update<T extends Partial<BaseRecord>>(collection: string, id: string, data: T): Promise<T & BaseRecord>;
  remove(collection: string, id: string): Promise<void>;
}

(Do NOT rename them to `findAll`, `findById`, or `delete`. `insert` and `update` MUST accept `data: T` where `T extends Partial<BaseRecord>` and return `Promise<T & BaseRecord>`. `remove` MUST return `Promise<void>`.)

3. Export the adapter strictly as: `export const db_<database_lowercase>: DbContract = { ... };` (plus `export default db_<database_lowercase>;`).

4. Lazy-load all required `process.env.*` credentials INSIDE a connection/client helper function—NEVER throw missing env errors at the top level of the file, because this file is imported even when this database switch is turned OFF.

5. Cache the database client/connection pool on `global` (resetting the cache on connection failure) so Next.js hot-reloading does not exhaust connections.

6. Map each `collection` string to the corresponding table, collection, or document path in the target database, validating `collection` names to block injection or invalid path characters.

7. Normalize IDs automatically: always return a plain string `id` property on every record (converting native IDs such as MongoDB `_id` / `ObjectId`, Firestore doc IDs, or Appwrite `$id` into `id`), and properly parse/validate incoming string `id` arguments for `getById`, `update`, and `remove`.

8. On `insert`, ignore any `id`, `_id`, `$id`, or `created_at` passed in `data`, generate a fresh native/UUID `id`, attach `created_at: new Date().toISOString()` as an ISO string (snake_case `created_at`, NOT `createdAt`), and throw an error if the inserted record cannot be retrieved so `insert` never returns `null`.

9. On `update`, strip `id`, `_id`, `$id`, and `created_at` from the incoming payload, sanitize keys to prevent query/operator injection, and throw an error if no record matches `id` so `update` never returns `null`.

10. Output ONLY:
    - The exact `npm install <package>` command
    - The required `.env.local` variable names
    - The complete, copy-pasteable TypeScript code for `src/DB/db_services/db_<database_lowercase>.ts` (no extra explanations or placeholders).

11. write comments like eg. 
// --------------------------------------------------
// CONNECTION HELPER
// Credentials are loaded lazily.
// --------------------------------------------------

```

---
### How to Add the Database
(e.g., MongoDB / Supabase / Firebase)
#### 1. Install Driver & Add Environment Variables

Install the official `<database_lowercase>` package (e.g., `mongodb`):

```bash
npm install <package-name> # e.g., npm install mongodb
```

Add your connection credentials to `.env.local` (e.g., for MongoDB):

```bash
# Example (MongoDB):
MONGODB_URI="mongodb+srv://<username>:<password>@cluster.mongodb.net/"
MONGODB_DB="starter_app"
```

#### 2. Activate `<Database>` in the Switch

1. Save the generated adapter at `src/DB/db/db_<database_name>.ts` (e.g., `src/DB/db/db_mongodb.ts`).
2. Add `<database_name>: true` (and set all other databases to `false`) inside `src/DB/db/db_switches.ts`.
3. Import `db_<database_name>` and wire it into `src/DB/db/db_switch.ts`.
4. Call `db` from **Server Components** or **Server Actions** (`'use server'`), since server-side database drivers (`mongodb`, `pg`, `firebase-admin`) run strictly on the server.

___





___
# Extra Features: 
## THEME:
####  An 8-Color Theme Engine (`src/shared/themes/`)

The starter template includes a plug-and-play theme system with **Dark Mode as default** and a built-in Light/Dark toggle in the default `Header`. All UI elements use 8 numbered color tokens (`color_1`–`color_8`) so swapping themes repaints the entire app automatically:

| Token         | Tailwind Classes             | Visual Role                   |
| :------------ | :--------------------------- | :---------------------------- |
| **`color_1`** | `bg-color_1`                 | Main page background          |
| **`color_2`** | `bg-color_2`                 | Cards, Header, Footer, inputs |
| **`color_3`** | `border-color_3`             | Borders and dividers          |
| **`color_4`** | `text-color_4`               | Primary text and headings     |
| **`color_5`** | `text-color_5`               | Muted / secondary text        |
| **`color_6`** | `bg-color_6`, `text-color_6` | Primary brand accent          |
| **`color_7`** | `bg-color_7`, `text-color_7` | Secondary brand accent        |
| **`color_8`** | `bg-color_8`, `text-color_8` | Danger / error actions        |

* **Switch Active Theme:** Open `src/shared/themes/theme_switch.ts` and change `ACTIVE_THEME` (e.g., from `theme_1` to `theme_2`).
* **Add a New Theme:** Create `src/shared/themes/presets/theme_3.ts` following `theme_contract.ts` (defining both `dark` and `light` palettes) and export it in `theme_switch.ts`.

#### AI Prompt to Generate a New Theme (`theme_<X>.ts`)

Prompt:
```text
Create a new TypeScript theme file (`theme_<x>.ts`) for my Universal Starter App following `src/shared/themes/theme_contract.ts`.

Vibe / Brand Style: [DESCRIBE YOUR VIBE HERE — e.g., "Warm Sunset Amber", "Minimalist Nordic Paper", or "Cyberpunk Neon"]

Requirements:
1. Export `export const theme_3: ThemePreset` with both `dark` and `light` objects.
2. Every mode must define all 8 CSS variables with strong WCAG contrast:
   - `--color_1`: Main page background
   - `--color_2`: Card / Header / Footer background (distinct from `--color_1`)
   - `--color_3`: Borders and dividers
   - `--color_4`: Primary crisp text (high contrast against `--color_1` and `--color_2`)
   - `--color_5`: Muted / secondary text
   - `--color_6`: Primary brand accent (buttons, active links)
   - `--color_7`: Secondary brand accent (badges, highlights)
   - `--color_8`: Danger / error / delete accent
3. Give the `light` mode a subtle brand-tinted background (`--color_1`) and crisp white cards (`--color_2`) so it feels tailored rather than generic plain white.
4. Provide only the complete, copy-pasteable TypeScript code.
```

