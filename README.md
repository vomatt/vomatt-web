# Vomatt — web

Public voting platform. This repo is the Next.js 16 front end with an embedded Sanity Studio at
`/sanity`. App data (polls, ballots, comments, accounts) comes from
[vomatt-api](../vomatt-api); site content (settings, pages, the coming-soon switch) comes from Sanity.

```
Browser ──► vomatt-web (Vercel) ──► vomatt-api   (server-side only, Bearer token from httpOnly cookies)
                     │
                     └────────────► Sanity       (published content, cached 60s)
```

## Requirements

- Node.js 20.9 or later (Vercel's default, 24, is fine)
- npm (the lockfile is `package-lock.json`)
- A running vomatt-api (local Docker or deployed) and a Sanity project

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill in the values, see below
npm run dev
```

- Site: http://localhost:3000
- Studio: http://localhost:3000/sanity (log in with your Sanity account)

Local development always shows the full site; the coming-soon page only applies in production.

### Sanity

1. Use the existing project, or create one at [sanity.io/manage](https://www.sanity.io/manage).
2. Put its project ID and dataset in `NEXT_PUBLIC_SANITY_PROJECT_ID` / `NEXT_PUBLIC_SANITY_DATASET`.
3. **Dataset visibility must be Public** (manage → Datasets). The site reads published content
   without a token.
4. **API → CORS origins**: add every origin the Studio runs on, with *Allow credentials*:
   `http://localhost:3000`, your production domain, and your Vercel preview domain pattern if
   editors use previews.
5. Open `/sanity` and publish **Settings → General** (site title, share image, favicon, coming soon).

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
| `SITE_URL` | Yes | `https://vomatt.com` | Public origin, no trailing slash. Used for metadata, Open Graph and canonical URLs; the site errors if it is missing. |
| `NEXT_PUBLIC_SANITY_API_VERSION` | No | `2025-08-08` | Sanity API version; defaults to `2025-08-08`. |

Not needed (leave unset): `DATABASE_URL`, `PAYLOAD_SECRET` (Payload was removed);
`SANITY_API_READ_TOKEN`, `SANITY_REVALIDATE_SECRET`, `NEXT_PUBLIC_SANITY_STUDIO_URL`,
`SANITY_STUDIO_PREVIEW_ORIGIN` (read in code but nothing depends on them yet);
`NEXT_PUBLIC_API_URL` (only the dev mocks for follows/avatars use it).

On **vomatt-api**, set at least `JWT_SECRET` (same value as `SESSION_SECRET`), the database and
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
   - Mark `SESSION_SECRET` as **Sensitive**.
   - Variables are read at build time too, so **redeploy** after changing them.
4. **Domain:** add it under Project → Domains, then add it to the Sanity CORS origins.
5. **Deploy**, then open `https://<domain>/sanity`, sign in, and check that
   **Settings → General → Coming soon** is set the way you want (it is on until you turn it off).

### Going live

The production site shows only the coming-soon page until it is turned off in Sanity:
**Settings → General → Coming soon → Show coming soon page** → off → **Publish**.
Changes appear within about a minute (Sanity content is cached for 60s). Turn it back on the same
way. If Sanity can't be reached, the coming-soon page stays up. While it is on, search engines are
told not to index the site.

Before switching it off, run through [docs/release/release-checklist.md](docs/release/release-checklist.md).

## Scripts

```bash
npm run dev           # dev server
npm run build         # production build
npm run start:web     # serve the production build locally
npm run lint          # ESLint
npm test              # Jest
npx tsc --noEmit      # type-check
```

## Troubleshooting

- **Everyone gets signed out / sign-in loops** — `SESSION_SECRET` doesn't match the API's
  `JWT_SECRET`.
- **Feed is empty, requests go to `//api/...`** — `API_URL` has a trailing slash or a path.
- **Site errors on every page with "Invalid URL"** — `SITE_URL` is missing.
- **Studio says "CORS origin not allowed"** — add the domain in Sanity manage → API → CORS
  origins, with credentials.
- **Sanity content doesn't appear** — the dataset is private, or the project ID/dataset are wrong.
- **`Failed to communicate with the Sanity API`** in the CLI — run `npx sanity logout` then
  `npx sanity login`.
- **Can't sign in on production** — the API's email isn't configured, so codes are never sent.
