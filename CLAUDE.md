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
npm run generate:openapi  # Regenerate OpenAPI schema
```

Tests live in `src/__tests__/` and match `**/*.test.{ts,tsx}`. Run a single file:
```bash
npx jest src/__tests__/components/PollCard.test.tsx
```

## Architecture

**vomatt** is a public voting/poll platform built on Next.js 16 App Router + Sanity (CMS content) + vomatt-api (app data).

### Route Groups

- `src/app/(frontend)/` — customer-facing UI. `layout.tsx` fetches the `settingsGeneral` Sanity singleton for site-wide metadata and applies language detection from cookies/headers.
- `src/app/(sanity)/` — embedded Sanity Studio at `/sanity` (`sanity.config.ts`).
- `src/app/api/` — thin API route handlers (user-related endpoints).

### Sanity CMS

Studio config in `sanity.config.ts`; schemas in `src/sanity/schemaTypes/` (singletons like `settingsGeneral`, `pSignUp`, `pHome`; documents like `pGeneral`). Content is not localized.

Fetch pattern (published content, revalidated every 60s — no read token or webhook):
```ts
import { sanityFetch } from '@/sanity/lib/live'
import { pageGeneralQuery } from '@/sanity/lib/queries'

const { data } = await sanityFetch({ query: pageGeneralQuery, params: { slug } })
```
Render Portable Text with `@/components/CustomPortableText`; build image URLs with `@/sanity/lib/image`.

### API / Data Layer

`src/lib/api/` contains the entire data layer:

- **`tokens.ts`** — shared by the proxy and server code: `verifyAccessToken` (HS256/384/512), `requestTokenRefresh` (deduped; returns `ok | rejected | unavailable`), `buildAuthCookies`. Tokens live in httpOnly cookies (`accessToken`, `refreshToken`); lifetimes follow the backend (access 1h, refresh 30d, rotated on every refresh).
- **`auth.ts`** — `server-only` cookie helpers (`getTokens`, `setAuthTokens`, `clearAuthTokens`). Never make it `'use server'`: every export would become a callable Server Action.
- **Refresh happens only in `src/proxy.tsx`**, which writes rotated cookies to both the request and the response. The backend revokes every session when a used refresh token comes back, so nothing else may refresh.
- **`client.ts`** — `apiClient<T>()` (authenticated; throws `AuthError` on 401, `ApiError` with `data.errorCode` otherwise; `auth: 'optional'` falls back to `publicFetch`) and `publicFetch<T>()`. Both unwrap the `ApiResponse` envelope.
- **`services/`** — `auth.ts` (`requestOtp`, `verifyOtp`, `signout`) and `users.ts` are Server Actions (`'use server'`). Poll, ballot and comment actions live in `src/features/polls/service.ts` and return `ActionResult` instead of throwing.

The backend is `vomatt-api` (sibling repo): prefix `/api`; the contract is `api-docs.json` at the repo root (what the deployed API at `API_URL` serves from `/v3/api-docs`; flow docs in `vomatt-api/docs/frontend/` describe a newer backend). Lists are page-based: `{ content, total, page, limit }` with 1-based `page`/`size` params; `lib/api/cursor.ts` maps them onto `{ items, nextCursor }`, with the next page number as the cursor. Open questions from the integration are in `docs/release/api-integration-notes.md`; older backend gaps in `docs/release/backend-requests.md`.

### Internationalization

Locales: `en`, `zh-TW` (default `en`). Config at `src/i18n-config.ts`. Language is detected in `src/proxy.tsx` middleware via `negotiator` + `@formatjs/intl-localematcher` and stored in the `USER_LANG` cookie. In components, use the `useLanguage()` context hook and call `t('key')`.

### State & UI Conventions

- **Server Components** for data fetching; **Client Components** (`'use client'`) for interaction.
- UI primitives are shadcn/ui (new-york style, zinc base) in `src/components/ui/`.
- Layout uses a collapsible sidebar (`SidebarProvider` + `AppSidebar`) visible on all routes except `/login`. Mobile gets a `TabBar` instead.
- Fonts: Geist (sans), Geist Mono, Instrument Serif (display), DM Mono (data/numbers).
- Design tokens in `src/styles/global.css` use OKLCh color space with Tailwind CSS v4.
- Tailwind v4: `revalidatePath(path, 'page')` requires the second arg; use `updateTag(tag)` for single-tag revalidation.

### ISR Revalidation

Sanity fetches revalidate every 60s (`src/sanity/lib/live.ts`); there is no publish webhook yet.

## Environment Variables

```
NEXT_PUBLIC_SANITY_PROJECT_ID  # Sanity project
NEXT_PUBLIC_SANITY_DATASET     # Sanity dataset
SESSION_SECRET   # Must equal the API's JWT_SECRET (HMAC-SHA)
SITE_URL         # Frontend URL, no trailing slash; required (metadataBase)
API_URL          # vomatt-api origin, no path (e.g. http://localhost:8080)
```

Template and Vercel setup: `.env.example`, `README.md`. The production site shows only the coming-soon page until Sanity's Settings → General → Coming soon is turned off (`src/lib/comingSoon.ts`).

## Key Paths Quick Reference

| What | Where |
|------|-------|
| Global CSS / design tokens | `src/styles/global.css` |
| Sanity Studio config | `sanity.config.ts` |
| Sanity schemas / queries | `src/sanity/schemaTypes/`, `src/sanity/lib/queries.js` |
| API client + token logic | `src/lib/api/client.ts`, `src/lib/api/auth.ts` |
| Poll domain (schema, status, service) | `src/features/polls/` |
| Sidebar | `src/components/layout/AppSidebar.tsx` |
| Main layout composition | `src/components/layout/index.tsx` |
| Root frontend layout | `src/app/(frontend)/layout.tsx` |
| i18n middleware | `src/proxy.tsx` |
| Mock poll data | `src/lib/api/mock/polls` |

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
