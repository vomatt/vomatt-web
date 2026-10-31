# Vomatt — web

Public voting platform. This repo is the Next.js 16 front end. App data (polls, ballots, comments,
accounts) comes from [vomatt-api](../vomatt-api); site content (settings, pages, the coming-soon
switch) comes from Sanity. Editors use the Sanity Studio in [vomatt-admin](../vomatt-admin).

```
Browser ──► vomatt-web (Vercel) ──► vomatt-api   (server-side only, Bearer token from httpOnly cookies)
                     │
                     └────────────► Sanity       (published content, expired per change on publish)
```

## Requirements

- Node.js 22 or 24 (Next.js 16 needs 20.9+, but Node 20 is end-of-life; Vercel's default is 24)
- npm (the lockfile is `package-lock.json`)
- A running vomatt-api (local Docker or deployed) and a Sanity project

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill in the values, see below
npm run dev
```

- Site: http://localhost:3002 (the dev server uses Turbopack on port 3002)
- Studio: run [vomatt-admin](../vomatt-admin) (http://localhost:3003/sanity)

Local development always shows the full site; the coming-soon page only applies in production.

### Sanity

1. Use the existing project, or create one at [sanity.io/manage](https://www.sanity.io/manage).
2. Put its project ID and dataset in `NEXT_PUBLIC_SANITY_PROJECT_ID` / `NEXT_PUBLIC_SANITY_DATASET`.
3. **Dataset visibility must be Public** (manage → Datasets). The site reads published content
   without a token.
4. In the vomatt-admin Studio, publish **Settings → General** (site title, share image, favicon,
   coming soon). Studio CORS origins are set up in vomatt-admin.

### vomatt-api

Run it locally (see its README; Postgres + Redis via `docker compose up -d`), then set
`API_URL=http://localhost:8080` and `SESSION_SECRET` to the API's `JWT_SECRET`.
Sign-in codes are emailed; with email disabled locally, read the code from Redis
(`otp:email:<address>`).

## Environment variables

| Variable | Required | Example | What it's for |
|----------|----------|---------|---------------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes | `abc123de` | Sanity project. Also used to allow Sanity CDN images. |
| `NEXT_PUBLIC_SANITY_DATASET` | Yes | `production` | Sanity dataset. |
| `API_URL` | Yes | `https://api.vomatt.com` | vomatt-api **origin only** — no path, **no trailing slash**. Called from the server only. |
| `SESSION_SECRET` | Yes | 64 random chars | **Must equal the API's `JWT_SECRET`.** Used to verify access tokens. A mismatch signs everyone out on every request. Server-only; never prefix with `NEXT_PUBLIC_`. |
| `CLIENT_IP_SECRET` | Production | 48 random chars | **Same value as the API's `CLIENT_IP_SECRET`.** Sent with each user's IP so the API's rate limits and OTP lockouts apply per user. Unset: the API sees every user as this server's IP, so one abuser can rate-limit or lock out everyone. Server-only; mark **Sensitive**. |
| `SITE_URL` | Yes | `https://vomatt.com` | Public origin, no trailing slash. Used for metadata, Open Graph and canonical URLs; the site errors if it is missing. |
| `API_LOG` | No | `1` | Logs each API request/response from the server. On by default in `npm run dev` (`0` silences it); off in deployments unless `1` (e.g. a Preview scoped to the `dev` branch, read in Vercel Runtime Logs). |
| `IOS_APP_IDS` | No | `ABCDE12345.com.vomatt.app` | iOS universal links: comma-separated `<TeamID>.<bundle ID>` values served in `/.well-known/apple-app-site-association`, so `/poll/<id>` and `/<username>` links open the app. Unset: that file 404s and links stay on the web. Set it in Production (the domain in the app's `applinks:` entitlement). |
| `SANITY_REVALIDATE_SECRET` | No | 48 random chars | **Production only.** Lets vomatt-admin's Sanity Function expire just the changed Sanity content on publish (`POST /api/revalidate`); while set, Sanity content refreshes only hourly as a fallback. Same value as the function's `SANITY_REVALIDATE_SECRET` (`npx sanity functions env add invalidate-tags SANITY_REVALIDATE_SECRET <value>` in vomatt-admin). Outside Production (local dev, Previews, which the function never calls) edits show up within about a minute, set or not. |
| `NEXT_PUBLIC_SANITY_API_VERSION` | No | `2025-08-08` | Sanity API version; defaults to `2025-08-08`. |
| `NEXT_PUBLIC_ABOUT_URL` | No | `https://about.vomatt.com` | The about site's origin, no trailing slash. `/about` and the legal pages redirect there, and the app's legal links point there. Defaults to `https://about.vomatt.com`. |
| `NEXT_PUBLIC_SANITY_STUDIO_URL` | No | `https://admin.vomatt.com/sanity` | vomatt-admin's Studio URL, including its `/sanity` base path (not just the origin). When set, `/sanity` redirects there. |

Not needed (leave unset): `DATABASE_URL`, `PAYLOAD_SECRET` (Payload was removed);
`SANITY_API_READ_TOKEN`
(read in code but nothing depends on it yet); `SANITY_STUDIO_PREVIEW_ORIGIN` (the Presentation
tool was removed);
`NEXT_PUBLIC_API_URL` (the followers/following sheet calls this site's own `/api` routes when it is
unset).

On **vomatt-api**, set at least `JWT_SECRET` (same value as `SESSION_SECRET`), `CLIENT_IP_SECRET` (same value as here), the database and
Redis settings, and email (`EMAIL_ENABLED=true` + SMTP) — sign-in is email-code only.
The browser never calls the API directly, so its `CORS_ALLOWED_ORIGINS` doesn't need this site.

## Deploy to Vercel

1. **Import** the repo in Vercel. Framework preset: Next.js. Leave the build command
   (`next build`), output directory and install command at their defaults.
2. **Package manager:** keep only `package-lock.json` in the repo. If `pnpm-lock.yaml` exists,
   Vercel installs with pnpm from that file instead (see the release checklist).
3. **Environment variables** (Project → Settings → Environment Variables): add every *Required*
   variable above.
   - Production: `SITE_URL` = your production domain, `API_URL` = production API.
   - Preview: same keys; `SITE_URL` can be the preview's domain, `API_URL` a staging API.
   - Mark `SESSION_SECRET` and `CLIENT_IP_SECRET` as **Sensitive**.
   - Variables are read at build time too, so **redeploy** after changing them.
4. **Domain:** add it under Project → Domains.
5. **Deploy**, then in the vomatt-admin Studio check that
   **Settings → General → Coming soon** is set the way you want (it is on until you turn it off).

### Going live

The production site shows only the coming-soon page until it is turned off in Sanity:
**Settings → General → Coming soon → Show coming soon page** → off → **Publish**.
Changes appear right after publishing (within a minute if `SANITY_REVALIDATE_SECRET` is unset). Turn it back on the same
way. If Sanity can't be reached, the coming-soon page stays up. While it is on, search engines are
told not to index the site.

Before switching it off, run through [docs/release/release-checklist.md](docs/release/release-checklist.md).

## Scripts

```bash
npm run dev               # dev server (Turbopack, port 3002)
npm run build             # production build
npm run start:web         # serve the production build locally
npm start                 # run through `vercel dev` (needs the Vercel CLI and a linked project)
npm run lint              # ESLint
npm test                  # Jest (tests in src/__tests__/)
npm run test:watch        # Jest in watch mode
npm run test:coverage     # Jest with coverage
npx jest <path>           # one test file
npx tsc --noEmit          # type-check
npm run generate:openapi  # regenerate openapi.json from the Zod schemas
```

## Project docs

| File | What's in it |
|------|--------------|
| [DESIGN.md](DESIGN.md) | Design tokens, type, UI building blocks, don'ts — read before UI work |
| [PRODUCT.md](PRODUCT.md) | Users, brand, product principles |
| [CLAUDE.md](CLAUDE.md) | Architecture notes: route groups, data layer, auth/token refresh, i18n |
| [api-docs.json](api-docs.json) | vomatt-api contract (what the API serves at `/v3/api-docs`) |
| [docs/release/](docs/release) | Release checklist, API integration notes, open backend requests |

## Troubleshooting

- **Everyone gets signed out / sign-in loops** — `SESSION_SECRET` doesn't match the API's
  `JWT_SECRET`.
- **Feed is empty, requests go to `//api/...`** — `API_URL` has a trailing slash or a path.
- **Site errors on every page with "Invalid URL"** — `SITE_URL` is missing.
- **Sanity content doesn't appear** — the dataset is private, or the project ID/dataset are wrong.
- **Can't sign in on production** — the API's email isn't configured, so codes are never sent.
