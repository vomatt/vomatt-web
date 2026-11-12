# Vomatt — web

Public voting platform. This repo is the Next.js 16 front end. App data (polls, ballots, comments,
accounts) comes from [vomatt-api](../vomatt-api); site content (settings, the sign-up
terms) comes from Sanity. Editors use the Sanity Studio in [vomatt-admin](../vomatt-admin).

```
Browser ──► vomatt-web (Vercel) ──► vomatt-api   (server-side only, Bearer token from httpOnly cookies)
                     │
                     └────────────► Sanity       (published content, expired per change on publish)
```

## Requirements

- Node.js 22 or 24 (Next.js 16 needs 20.9+, but Node 20 is end-of-life; Vercel's default is 24)
- pnpm 10 (the lockfile is `pnpm-lock.yaml`; `corepack enable` picks the version pinned in `package.json`)
- A running vomatt-api (local Docker or deployed) and a Sanity project

## Local setup

```bash
pnpm install
cp .env.example .env.local   # then fill in the values, see below
pnpm dev
```

- Site: http://localhost:3002 (the dev server uses Turbopack on port 3002)
- Studio: run [vomatt-admin](../vomatt-admin) (http://localhost:3003/sanity)

### Sanity

1. Use the existing project, or create one at [sanity.io/manage](https://www.sanity.io/manage).
2. Put its project ID and dataset in `NEXT_PUBLIC_SANITY_PROJECT_ID` / `NEXT_PUBLIC_SANITY_DATASET`.
3. **Dataset visibility must be Public** (manage → Datasets). The site reads published content
   without a token.
4. In the vomatt-admin Studio, publish **Settings → General** (site title, share image, favicon). Studio CORS origins are set up in vomatt-admin.

### vomatt-api

Run it locally (see its README; Postgres + Redis via `docker compose up -d`), then set
`API_URL=http://localhost:8080` and `SESSION_SECRET` to the API's `JWT_SECRET`.
Sign-in codes are emailed. With email disabled locally the code can't be read from Redis: the API
stores only an HMAC of it (under `otp:email:<sha256 of the address>`), never the code.
`.claude/skills/verify-vomatt-web/scripts/vv otp <address>` recovers the code from that hash for the
stack it runs (`vv up`; see that skill's `SKILL.md`).

## Environment variables

| Variable | Required | Example | What it's for |
|----------|----------|---------|---------------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes | `abc123de` | Sanity project. |
| `NEXT_PUBLIC_SANITY_DATASET` | Yes | `production` | Sanity dataset. |
| `API_URL` | Yes | `https://api.vomatt.com` | vomatt-api **origin only** — no path, **no trailing slash**. Called from the server only. |
| `SESSION_SECRET` | Yes | 64 random chars | **Must equal the API's `JWT_SECRET`.** Used to verify access tokens. A mismatch signs everyone out on every request. Server-only; never prefix with `NEXT_PUBLIC_`. |
| `CLIENT_IP_SECRET` | Production | 48 random chars | **Same value as the API's `CLIENT_IP_SECRET`.** Sent with each user's IP so the API's rate limits and OTP lockouts apply per user. Unset: the API sees every user as this server's IP, so one abuser can rate-limit or lock out everyone. Server-only; mark **Sensitive**. |
| `SITE_URL` | Yes | `https://vomatt.com` | Public origin, no trailing slash. Used for metadata, Open Graph and canonical URLs; the site errors if it is missing. |
| `API_LOG` | No | `1` | Logs each API request/response from the server. On by default in `pnpm dev` (`0` silences it); off in deployments unless `1` (e.g. a Preview scoped to the `dev` branch, read in Vercel Runtime Logs). |
| `IOS_APP_IDS` | No | `ABCDE12345.com.vomatt.app` | iOS universal links: comma-separated `<TeamID>.<bundle ID>` values served in `/.well-known/apple-app-site-association`, so `/poll/<id>` and `/<username>` links open the app. Unset: that file 404s and links stay on the web. Set it in Production (the domain in the app's `applinks:` entitlement). |
| `SANITY_REVALIDATE_SECRET` | No | 48 random chars | **Production only.** Lets vomatt-admin's Sanity Function expire just the changed Sanity content on publish (`POST /api/revalidate`); while set, Sanity content refreshes only hourly as a fallback. Same value as the function's `SANITY_REVALIDATE_SECRET` (`npx sanity functions env add invalidate-tags SANITY_REVALIDATE_SECRET <value>` in vomatt-admin). Outside Production (local dev, Previews, which the function never calls) edits show up within about a minute, set or not. |
| `NEXT_PUBLIC_SANITY_API_VERSION` | No | `2025-08-08` | Sanity API version; defaults to `2025-08-08`. |
| `NEXT_PUBLIC_ABOUT_URL` | No | `https://about.vomatt.com` | The about site's origin, no trailing slash. `/about` and the legal pages redirect there, and the app's legal links point there. Defaults to `https://about.vomatt.com`. |

Not needed (leave unset): `DATABASE_URL`, `PAYLOAD_SECRET` (Payload was removed);
`SANITY_API_READ_TOKEN` (the site reads only published content, without a token); `SANITY_STUDIO_PREVIEW_ORIGIN` (the Presentation
tool was removed);
`NEXT_PUBLIC_API_URL` (nothing reads it; the browser never calls the API, and the followers/following
lists use Server Actions).

On **vomatt-api**, set at least `JWT_SECRET` (same value as `SESSION_SECRET`), `CLIENT_IP_SECRET` (same value as here), the database and
Redis settings, and email (`EMAIL_ENABLED=true` + SMTP) — sign-in is email-code only.
The browser never calls the API directly, so its `CORS_ALLOWED_ORIGINS` doesn't need this site.

## Deploy to Vercel

1. **Import** the repo in Vercel. Framework preset: Next.js. Leave the build command
   (`next build`), output directory and install command at their defaults.
2. **Package manager:** Vercel installs with pnpm because `pnpm-lock.yaml` is in the repo. Don't commit a
   `package-lock.json` alongside it. Add `ENABLE_EXPERIMENTAL_COREPACK=1` (all environments) so Vercel uses
   the pnpm version pinned in `package.json` instead of picking one from the lockfile.
3. **Environment variables** (Project → Settings → Environment Variables): add every *Required*
   variable above.
   - Production: `SITE_URL` = your production domain, `API_URL` = production API.
   - Preview: same keys; `SITE_URL` can be the preview's domain, `API_URL` a staging API.
   - Mark `SESSION_SECRET` and `CLIENT_IP_SECRET` as **Sensitive**.
   - Variables are read at build time too, so **redeploy** after changing them.
4. **Domain:** add it under Project → Domains.
5. **Deploy.** The production site is public as soon as it deploys.

### Going live

Before the first production deploy, run through [docs/release/release-checklist.md](docs/release/release-checklist.md).

## Scripts

```bash
pnpm dev                  # dev server (Turbopack, port 3002)
pnpm build                # production build
pnpm start                # serve the production build locally
pnpm start:vercel         # run through `vercel dev` (needs the Vercel CLI and a linked project)
pnpm lint                 # ESLint
pnpm test                 # Jest (tests in src/__tests__/)
pnpm test:watch           # Jest in watch mode
pnpm test:coverage        # Jest with coverage
pnpm exec jest <path>     # one test file
pnpm exec tsc --noEmit    # type-check
pnpm generate:icons       # regenerate the favicon and app icons from src/lib/brand/mark.ts
```

## Project docs

| File | What's in it |
|------|--------------|
| [DESIGN.md](DESIGN.md) | Design tokens, type, UI building blocks, don'ts — read before UI work |
| [PRODUCT.md](PRODUCT.md) | Users, brand, product principles |
| [CLAUDE.md](CLAUDE.md) | Architecture notes: route groups, data layer, auth/token refresh, i18n |
| [api-docs.json](api-docs.json) | vomatt-api contract (what the API serves at `/v3/api-docs`) |
| [docs/release/](docs/release) | Release checklist, API integration notes, launch review |

## Troubleshooting

- **Everyone gets signed out / sign-in loops** — `SESSION_SECRET` doesn't match the API's
  `JWT_SECRET`.
- **Feed is empty, requests go to `//api/...`** — `API_URL` has a trailing slash or a path.
- **Site errors on every page with "Invalid URL"** — `SITE_URL` is missing.
- **Sanity content doesn't appear** — the dataset is private, or the project ID/dataset are wrong.
- **Can't sign in on production** — the API's email isn't configured, so codes are never sent.
