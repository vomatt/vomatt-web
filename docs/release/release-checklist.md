# Release checklist (web)

## Environment

Full list and Vercel steps: [README → Environment variables](../../README.md#environment-variables).

| Variable | Production value | Note |
|----------|------------------|------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project ID | Dataset must be **public** |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` | |
| `API_URL` | Deployed vomatt-api origin | No path, **no trailing slash** (see api-integration-notes E2) |
| `SESSION_SECRET` | **Same value as the API's `JWT_SECRET`** | A mismatch signs everyone out; mark Sensitive on Vercel |
| `SITE_URL` | `https://<production domain>` | Required; pages error without it |

Remove from Vercel if present: `DATABASE_URL`, `PAYLOAD_SECRET` (Payload is gone),
`NEXT_PUBLIC_API_URL`.

On the API: `JWT_SECRET`, database, Redis, and email (`EMAIL_ENABLED=true` + SMTP). The browser
never calls the API directly, so its CORS list doesn't need the web origin.

## Deployment blockers

- [x] **Delete `pnpm-lock.yaml` and `pnpm-workspace.yaml`** (or regenerate them). The pnpm lockfile
      still lists Payload and has no Sanity packages; Vercel prefers it over `package-lock.json`, so
      the install fails or installs the wrong dependencies.
- [ ] The deployed API must run current vomatt-api `main` (api-integration-notes E1).
- [ ] Sanity → API → CORS origins: add the production domain (with credentials) so `/sanity` works.

## Before launch

- [ ] Deploy vomatt-api `release-readiness` (backend P0 1–4) and configure email (P0 5)
- [ ] Seed topics (tags) so the feed has tabs and Explore has a directory
- [ ] Sanity: publish Settings → General (site title, share image, favicon) and the Log-in
      page policy text (terms + privacy links); the login page shows it under the form
- [ ] Terms of service and privacy policy pages (Sanity pages), linked from login and footer
- [ ] Last step: Settings → General → Coming soon → off → Publish (live within ~1 minute)
- [ ] Smoke test on the deployed pair: sign up, sign out, sign in, vote, change vote, withdraw,
      comment, like, edit profile, toggle visibility, delete a throwaway account
- [ ] Error monitoring (e.g. Sentry) and uptime check on the API's `/actuator/health`
      (it reports DOWN while mail isn't configured)

## Known and accepted

- `npm run lint` reports 12 errors from the React Compiler rules in files this release didn't
  touch (LanguageContext, DraftList, PollCreator, hooks/*). They predate the release work.
- `src/lib/session.ts` is unused.
- Follow, followers and avatar upload are hidden until the API supports them; their dev-only mock
  routes under `/api/v1/users/*` answer 404 in production.

## Verified locally (vomatt-api in Docker, access token TTL 120s)

- New email → code → display name → signed in; wrong code shows the mapped error; resend countdown
- Existing email → code → back to the page that asked for sign-in (`?redirect=`)
- Access token expiry → the proxy rotates once per navigation, no reuse alarm, user stays signed in
- Logout revokes the refresh token; protected pages then redirect to login
- Create poll → lands on the poll; vote, stamp, sealed notice; feed turnout updates
- Comments list, like (persists), own-comment controls; posting works with the updated API
- Updated API: guest reads, sealed counts and 403 results while open, `myOptionId`,
  `/participated`, `?creatorUsername=`, public display name
- Topic tabs, Explore filters, account stats/badges/activity, visibility toggle persists
- `next build` succeeds
