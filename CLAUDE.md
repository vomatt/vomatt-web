# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev           # Start dev server (Turbopack, port 3002)
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

**vomatt** is a public voting/poll platform built on Next.js 16 App Router + Sanity (CMS content) + vomatt-api (app data). The Sanity Studio and its schemas live in `vomatt-admin` (sibling repo); this app only reads published content.

### Route Groups

- `src/app/(frontend)/` — customer-facing UI. `layout.tsx` fetches the `settingsGeneral` Sanity singleton for site-wide metadata and applies language detection from cookies/headers.
- `/sanity` redirects to vomatt-admin's Studio when `NEXT_PUBLIC_SANITY_STUDIO_URL` is set (`next.config.ts`).
- `src/app/api/` — thin API route handlers (user-related endpoints).

### Sanity CMS

Schemas live in vomatt-admin `src/sanity/schemaTypes/` (singletons like `settingsGeneral`, `pSignUp`, `pHome`; documents like `pGeneral`); GROQ queries here depend on them, so check both when a schema changes. Read side here: `src/sanity/{env.ts,lib/client.ts,lib/live.ts,lib/image.ts,lib/queries.ts}` on `@sanity/client` + `groq` (not `next-sanity`, which pulls in the Studio). Content is not localized.

Fetch pattern (published content, cached per Sanity sync tag, expired on publish — no read token):
```ts
import { sanityFetch } from '@/sanity/lib/live'
import { pageGeneralQuery } from '@/sanity/lib/queries'

const { data } = await sanityFetch({ query: pageGeneralQuery, params: { slug } })
```
Render Portable Text with `@/components/CustomPortableText`; build image URLs with `@/sanity/lib/image`.

### API / Data Layer

`src/lib/api/` contains the entire data layer:

- **`tokens.ts`** — shared by the proxy and server code: `verifyAccessToken` (HS256/384/512), `requestTokenRefresh` (deduped; returns `ok | rejected | unavailable`), `buildAuthCookies`. Tokens live in httpOnly cookies (`accessToken`, `refreshToken`); lifetimes follow the backend (access 15m, refresh 30d, rotated on every refresh).
- **`auth.ts`** — `server-only` cookie helpers (`getTokens`, `setAuthTokens`, `clearAuthTokens`). Never make it `'use server'`: every export would become a callable Server Action.
- **Refresh happens only in `src/proxy.tsx`**, which writes rotated cookies to both the request and the response. The backend ends the session when a used refresh token comes back after its grace window, so nothing else may refresh.
- **`client.ts`** — `apiClient<T>()` (authenticated; throws `AuthError` on 401, `ApiError` with `data.errorCode` otherwise; `auth: 'optional'` falls back to `publicFetch`) and `publicFetch<T>()`. Both unwrap the `ApiResponse` envelope.
- **`services/`** — `auth.ts` (`requestOtp`, `verifyOtp`, `signout`) and `users.ts` are Server Actions (`'use server'`). Domain actions live in `src/features/<domain>/service.ts` (polls — incl. ballots, comments, invitees — groups, avatars, notifications) and return `ActionResult` (via `attempt()` in `lib/api/action.ts`) instead of throwing.

The backend is `vomatt-api` (sibling repo): prefix `/api`; the contract is `api-docs.json` at the repo root (what the deployed API at `API_URL` serves from `/v3/api-docs`; flow docs in `vomatt-api/docs/frontend/`). When checking or diffing `api-docs.json`, skip the admin endpoints (`/api/admin/**`, tags `Admin - Lookup` and `Admin Tag`): this app doesn't call them. Lists are cursor-paged: `{ items, nextCursor }` with `limit`/`cursor` params (`lib/api/cursor.ts`). Open questions from the integration are in `docs/release/api-integration-notes.md`; older backend gaps in `docs/release/backend-requests.md`.

### Internationalization

Locales: `en`, `zh` (Traditional Chinese; default `en`), strings in `src/locales/{en,zh}.json`. Config at `src/i18n-config.ts`. Language is detected in `src/proxy.tsx` middleware via `negotiator` + `@formatjs/intl-localematcher` and stored in the `USER_LANG` cookie. In components, use the `useLanguage()` context hook and call `t('key')`.

### State & UI Conventions

- **Before any UI work, read `DESIGN.md`** (tokens, type, building blocks, don'ts) and `PRODUCT.md` (users, brand, principles).
- **Server Components** for data fetching; **Client Components** (`'use client'`) for interaction.
- UI primitives are shadcn/ui (new-york style, zinc base) in `src/components/ui/`.
- Layout uses a collapsible sidebar (`SidebarProvider` + `AppSidebar`) visible on all routes except `/login`. Mobile gets a `TabBar` instead.
- Fonts: Geist for everything (counts and times use `tabular-nums`), loaded with `next/font` in the root layout. Sizes come only from the type scale in `global.css` (`text-display-*`, `text-title-*`, `text-body-*`, `text-caption-*`; see `DESIGN.md`); ESLint rejects arbitrary and default Tailwind sizes.
- Design tokens in `src/styles/global.css` use OKLCh color space with Tailwind CSS v4.
- Next.js cache: `revalidatePath(path, 'page')` requires the second arg; use `updateTag(tag)` for single-tag revalidation.

### ISR Revalidation

`sanityFetch` (`src/sanity/lib/live.ts`) fetches each query twice: a lookup (tag `sanity:sync-tags`) that returns the query's Sanity sync tags, then the content tagged `sanity:<syncTag>`. On publish, vomatt-admin's Sanity Function (`functions/invalidate-tags`, a Sync Tag Invalidate function) POSTs `{ syncTags }` to `/api/revalidate` with `Bearer SANITY_REVALIDATE_SECRET`, which expires the lookups and only those sync tags with `{ expire: 0 }` (Route Handlers can't use `updateTag`; `'max'` would serve one stale render). So only queries whose content changed refetch. In production with the secret set, the Sanity CDN is skipped and the cache also refreshes hourly (a fetch in flight during a publish can re-cache old content); elsewhere (local dev, Previews: the function only calls production) queries use the CDN and refresh every 60s.

## Environment Variables

```
NEXT_PUBLIC_SANITY_PROJECT_ID  # Sanity project
NEXT_PUBLIC_SANITY_DATASET     # Sanity dataset
NEXT_PUBLIC_SANITY_STUDIO_URL  # Optional: vomatt-admin Studio URL; /sanity redirects there
SESSION_SECRET   # Must equal the API's JWT_SECRET (HMAC-SHA)
SITE_URL         # Frontend URL, no trailing slash; required (metadataBase)
API_URL          # vomatt-api origin, no path (e.g. http://localhost:8080)
SANITY_REVALIDATE_SECRET  # Production only; same value as the invalidate-tags function's. Set in production: publish expires the cache, hourly fallback. Unset or not production: 60s refresh; unset also makes /api/revalidate reject all calls
API_LOG          # Optional API request/response log: 0 silences it in dev, 1 enables it in a deployment
CLIENT_IP_SECRET # Same value as the API's; sent with each user's IP (lib/api/client-ip.ts) so its rate limits and OTP lockouts are per user, not per server
```

Template and Vercel setup: `.env.example`, `README.md`. The production site shows only the coming-soon page until Sanity's Settings → General → Coming soon is turned off (`src/lib/comingSoon.ts`).

## Key Paths Quick Reference

| What | Where |
|------|-------|
| Global CSS / design tokens | `src/styles/global.css` |
| Sanity queries (schemas in vomatt-admin) | `src/sanity/lib/queries.ts` |
| API client + token logic | `src/lib/api/client.ts`, `src/lib/api/auth.ts` |
| Poll domain (schema, status, service) | `src/features/polls/` |
| Sidebar | `src/components/layout/AppSidebar.tsx` |
| Main layout composition | `src/components/layout/index.tsx` |
| Root frontend layout | `src/app/(frontend)/layout.tsx` |
| i18n middleware | `src/proxy.tsx` |

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
