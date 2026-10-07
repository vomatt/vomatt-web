# Release checklist (web)

## Environment

| Variable | Value | Note |
|----------|-------|------|
| `API_URL` | Deployed vomatt-api origin, no path | `https://vomatt.zeabur.app` is gone (404 on every path) |
| `SESSION_SECRET` | **Same value as the API's `JWT_SECRET`** | The proxy verifies access tokens with it; a mismatch signs everyone out |
| `DATABASE_URL` | Payload CMS Postgres | The configured Supabase tenant no longer exists; the layout can't load site settings |
| `PAYLOAD_SECRET` | Random, ≥32 chars | |
| `SITE_URL` | Public web origin | |
| `NEXT_PUBLIC_API_URL` | Leave unset in production | Only used by the dev-only follow/avatar mocks |

On the API: `CORS_ALLOWED_ORIGINS` must include the web origin, and email must be enabled
(see backend-requests.md #5).

## Before launch

- [ ] Backend P0 items 1–5 in `backend-requests.md`
- [ ] Seed topics (tags) so the feed has tabs and Explore has a directory
- [ ] Payload: publish Settings General (site title, description, share image) and the Sign-up
      page policy text (terms + privacy links); the signup page shows it under the form
- [ ] Terms of service and privacy policy pages (Payload `Pages`), linked from signup and footer
- [ ] Smoke test on the deployed pair: sign up, sign out, sign in, vote, change vote, withdraw,
      comment, like, edit profile, toggle visibility, delete a throwaway account
- [ ] Error monitoring (e.g. Sentry) and uptime check on the API's `/actuator/health`
      (it reports DOWN while mail isn't configured)

## Known and accepted

- `npm run lint` reports 12 errors from the React Compiler rules in files this release didn't
  touch (LanguageContext, DraftList, PollCreator, hooks/*). They predate the release work.
- `src/app/my-route/route.ts` is the Payload template's example route; harmless, safe to delete.
- `src/lib/session.ts` is unused.
- Follow, followers and avatar upload are hidden until the API supports them; their dev-only mock
  routes under `/api/v1/users/*` answer 404 in production.

## Verified locally (vomatt-api in Docker, access token TTL 120s)

- New email → code → display name → signed in; wrong code shows the mapped error; resend countdown
- Existing email → code → back to the page that asked for sign-in (`?redirect=`)
- Access token expiry → the proxy rotates once per navigation, no reuse alarm, user stays signed in
- Logout revokes the refresh token; protected pages then redirect to login
- Create poll → lands on the poll; vote, stamp, sealed notice; feed turnout updates
- Comments list, like (persists), own-comment controls; posting blocked by backend #1
- Topic tabs, Explore filters, account stats/badges/activity, visibility toggle persists
- `next build` succeeds
