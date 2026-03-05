@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run lint         # ESLint
npm run generate:types  # Regenerate payload-types.ts from schema (requires DB connection)
```

No test runner is configured. TypeScript check: `npx tsc --noEmit`.

## Environment Variables

Required in `.env.local`:

- `DATABASE_URL` — PostgreSQL connection string
- `PAYLOAD_SECRET` — Payload CMS secret
- `SESSION_SECRET` — JWT signing key (HS512)
- `SITE_URL` — Full origin URL (e.g. `http://localhost:3000`)
- `API_URL` — External backend API base URL (e.g. `http://localhost:8080`)

## Architecture

### Route Groups

- `src/app/(frontend)/` — Public-facing Next.js pages
- `src/app/(payload)/` — Payload CMS admin UI at `/admin`
- `src/app/api/` — Next.js API routes (auth proxy, polls, etc.)

### Payload CMS (Content)

Config: `src/payload.config.ts`. Collections: `Users`, `Media`, `Pages`. Globals: `SettingsGeneral`, `SignUpPage`, `Home`, `Contact`.

Fetch pattern:

```ts
import { getPayload } from 'payload';
import config from '@payload-config';

const payload = await getPayload({ config });
const data = await payload.findGlobal({ slug: 'settings-general' });
const page = await payload.find({
	collection: 'pages',
	where: { slug: { equals: slug } },
});
```

Rich text: `import { RichText } from '@payloadcms/richtext-lexical/react'`

Media URL: `doc.url` or `${SITE_URL}/api/media/file/${doc.filename}`

After schema changes, run `npm run generate:types` to update `src/payload-types.ts`.

Localization is configured for `en` and `zh-TW` in Payload.

### Authentication (External API)

Auth is handled by an external backend at `API_URL`. The Next.js layer acts as a proxy:

- Login flow: `POST /api/auth/login` → calls `API_URL/api/auth/signin` → stores `accessToken` + `refreshToken` as httpOnly cookies
- Session check: `getUserSession()` in `src/data/auth.tsx` decodes the `accessToken` JWT using `SESSION_SECRET`
- Authenticated requests: use `apiAuthFetch()` from `src/app/api/lib/apiAuthFetch.ts` — handles automatic token refresh on 401
- Middleware (`src/proxy.tsx`): validates tokens, redirects authenticated users away from `/login`/`/register`, detects language

Token constants are in `src/data/constants.ts`: `accessToken` / `refreshToken` cookie names.

### i18n

Supported locales: `en`, `zh` (defined in `src/i18n-config.ts`). Language is stored in a `preferred-language` cookie (set by middleware). Server components read it from cookies or the `x-detected-language` header.

### Production Guard

In `src/app/(frontend)/layout.tsx`, when `NODE_ENV === 'production'`, the entire app renders a "Coming soon" screen. The full app only renders in non-production environments.

### Styling

Tailwind CSS v4 with `@tailwindcss/postcss`. UI components in `src/components/ui/` are Radix UI primitives with `class-variance-authority`. Animations via `motion` (Framer Motion).
