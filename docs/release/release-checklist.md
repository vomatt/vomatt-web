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
| `CLIENT_IP_SECRET` | **Same value as the API's `CLIENT_IP_SECRET`** | Unset, the API sees every user as this server's IP, so its rate limits and OTP lockouts are site-wide; mark Sensitive on Vercel |

Remove from Vercel if present: `DATABASE_URL`, `PAYLOAD_SECRET` (Payload is gone),
`NEXT_PUBLIC_API_URL`.

On the API: `JWT_SECRET`, database, Redis, and email (`EMAIL_ENABLED=true` + SMTP). The browser
never calls the API directly, so its CORS list doesn't need the web origin.

## Deployment blockers

- [x] **Regenerate `pnpm-lock.yaml`.** The old one still listed Payload and had no Sanity packages; the
      current one comes from the Sanity-era dependencies. Keep it as the only lockfile: Vercel picks the
      package manager from the lockfile, so a `package-lock.json` next to it makes the install ambiguous.
- [ ] Set `ENABLE_EXPERIMENTAL_COREPACK=1` in Vercel (all environments) so builds use the pnpm version
      pinned in `package.json` (`packageManager`), not one Vercel guesses from the lockfile.
- [x] The deployed API must run current vomatt-api `main` (api-integration-notes E1, done 2026-10-13).

## Before launch

- [ ] Deploy current vomatt-api and configure email (`EMAIL_ENABLED=true` + SMTP)
- [ ] Seed topics (tags) so the feed has tabs and Explore has a directory
- [ ] Sanity: publish Settings → General (site title, share image, favicon) and the Log-in
      page policy text (terms + privacy links); the login page shows it under the form
- [ ] Terms of service and privacy policy pages published on the about site (vomatt-about; `next.config.ts`
      redirects `/terms-of-service` and `/privacy-policy` there), linked from login
- [ ] Smoke test on the deployed pair: sign up, sign out, sign in, vote, change vote, withdraw,
      comment, like, edit profile, toggle visibility, delete a throwaway account
- [ ] Error monitoring (e.g. Sentry) and uptime check on the API's `/actuator/health`
      (it reports DOWN while mail isn't configured)

## Known and accepted

- Follow and followers use vomatt-api (#74, #75); the dev-only `/api/v1/users/*` mocks are removed.

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
