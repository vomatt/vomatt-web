# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev           # Start dev server
npm run build         # Production build
npm run lint          # ESLint (next/core-web-vitals + simple-import-sort)
npm run test          # Jest (jsdom)
npm run test:watch    # Jest watch mode
npm run test:coverage # Jest with coverage
npx tsc --noEmit      # Type-check without emitting
npm run generate:types    # Regenerate src/payload-types.ts (requires live DB)
npm run generate:openapi  # Regenerate OpenAPI schema
```

Tests live in `src/__tests__/` and match `**/*.test.{ts,tsx}`. Run a single file:
```bash
npx jest src/__tests__/components/PollCard.test.tsx
```

## Architecture

**vomatt** is a public voting/poll platform built on Next.js 16 App Router + Payload CMS 3.x + PostgreSQL.

### Route Groups

- `src/app/(frontend)/` — customer-facing UI. `layout.tsx` fetches the `SettingsGeneral` Payload global for site-wide metadata and applies language detection from cookies/headers.
- `src/app/(payload)/` — auto-generated Payload CMS admin at `/admin`.
- `src/app/api/` — thin API route handlers (user-related endpoints).

### Payload CMS

Config at `src/payload.config.ts`. All types are auto-generated into `src/payload-types.ts` — re-run `npm run generate:types` after schema changes with a live DB connection.

**Collections:** `Users` (with auth), `Media` (publicly readable uploads), `Pages` (drafts + autosave + ISR revalidation on publish).

**Globals:** `SettingsGeneral`, `Home`, `SignUpPage`, `Contact` — all in `src/globals/`.

Fetch patterns:
```ts
// Global
await payload.findGlobal({ slug: 'settings-general' })

// Collection
await payload.find({ collection: 'pages', where: { slug: { equals: slug } } })

// Rich text rendering (Lexical)
import { RichText } from '@payloadcms/richtext-lexical/react'
```

### API / Data Layer

`src/lib/api/` contains the entire data layer:

- **`auth.ts`** — JWT helpers: `decodeToken`, `getTokens`, `setAuthTokens`, `refreshTokens`, `logout`, `clearAuthTokens`. Tokens are stored in httpOnly cookies (`ACCESS_TOKEN`, `REFRESH_TOKEN`). Access token expires in 15 min, refresh in 7 days.
- **`client.ts`** — `apiClient<T>()` generic fetch wrapper. Automatically refreshes on 401. Handles FormData vs JSON. Throws `AuthError` or `ApiError`.
- **`endpoints/`** — `polls.ts`, `auth.ts`, `users.ts`. All are Server Actions (`'use server'`). They fall back to mock data (`src/lib/api/mock/polls`) if the API is unavailable.

The external API base is `process.env.API_URL` (currently pointing to `https://vomatt.zeabur.app`).

### Internationalization

Locales: `en`, `zh-TW` (default `en`). Config at `src/i18n-config.ts`. Language is detected in `src/proxy.tsx` middleware via `negotiator` + `@formatjs/intl-localematcher` and stored in the `USER_LANG` cookie. In components, use the `useLanguage()` context hook and call `t('key')`.

### State & UI Conventions

- **Server Components** for data fetching; **Client Components** (`'use client'`) for interaction.
- UI primitives are shadcn/ui (new-york style, zinc base) in `src/components/ui/`.
- Layout uses a collapsible sidebar (`SidebarProvider` + `AppSidebar`) visible on all routes except `/login` and `/signup`. Mobile gets a `TabBar` instead.
- Fonts: Geist (sans), Geist Mono, Instrument Serif (display), DM Mono (data/numbers).
- Design tokens in `src/styles/global.css` use OKLCh color space with Tailwind CSS v4.
- Tailwind v4: `revalidatePath(path, 'page')` requires the second arg; use `updateTag(tag)` for single-tag revalidation.

### ISR Revalidation

Pages collection fires `revalidatePath` + `updateTag('pages-sitemap')` via `src/collections/Pages/hooks/revalidatePage.ts` on publish.

## Environment Variables

```
DATABASE_URL     # PostgreSQL connection string
PAYLOAD_SECRET   # Payload CMS secret
SESSION_SECRET   # JWT signing secret (HS512)
SITE_URL         # Frontend URL (e.g. http://localhost:3000)
API_URL          # Backend API (e.g. https://vomatt.zeabur.app)
```

## Key Paths Quick Reference

| What | Where |
|------|-------|
| Global CSS / design tokens | `src/styles/global.css` |
| Payload config | `src/payload.config.ts` |
| Generated Payload types | `src/payload-types.ts` |
| API client + token logic | `src/lib/api/client.ts`, `src/lib/api/auth.ts` |
| Poll endpoints | `src/lib/api/endpoints/polls.ts` |
| Sidebar | `src/components/layout/AppSidebar.tsx` |
| Main layout composition | `src/components/layout/index.tsx` |
| Root frontend layout | `src/app/(frontend)/layout.tsx` |
| i18n middleware | `src/proxy.tsx` |
| Mock poll data | `src/lib/api/mock/polls` |
