# API integration notes (round 1)

Integration of vomatt-web with the vomatt-api contract dated 2026-10-09
(`vomatt-api/docs/frontend/openapi.json` and the flow docs next to it).
This lists what is unclear, missing or not ready, so we can come back to it after this round.

Status: **B** = blocks or breaks something now · **Q** = question / decision needed · **N** = next round (web work).

## Environment and verification

| # | Item | Status |
|---|------|--------|
| E1 | The deployed API at `API_URL=https://vomatt-api.vercel.app/` still runs the **old** contract: `GET /api/votes` returns `{ content, total, page, limit }`, and 401s have an empty body. The web now only reads `{ items, nextCursor }`, so lists stay empty or fail until that deployment runs current vomatt-api `main`. | **B** |
| E2 | `API_URL` in `.env` ends with `/`, so requests go to `https://…app//api/...`. Remove the trailing slash (CLAUDE.md says "origin, no path"). | **B** |
| E3 | `next build` compiles, then fails while collecting page data: Payload can't reach its Postgres (`tenant/user postgres.bbgszmcihpyhptivpdmm not found`). This is a Supabase/`DATABASE_URL` problem, not related to the API work, but it also blocks `next dev`. | **B** |
| E4 | No end-to-end run against a live API this round: the deployed API is outdated (E1), and this machine has no Java runtime to run vomatt-api locally. Coverage is unit and component tests (344 passing). First check once E1–E3 are fixed: sign in, vote, retract, comment and reply, end a poll, see the badge, open the notification. | **N** |
| E5 | The `api-docs.json` attached to the request (in `~/.Trash`) couldn't be read: macOS blocks access to the Trash. The work follows `docs/frontend/openapi.json` in vomatt-api, which the docs call the single source of truth. If the attached file is newer, it should replace that snapshot. | **Q** |

## Contract gaps and questions for the backend

| # | Item | What the web does now | Status |
|---|------|-----------------------|--------|
| A1 | `GET /api/votes` has no "all statuses" option and no "most votes" sort. | Explore lost its **All** filter and **Most votes** sort. It offers Open (Newest / Ending soon) and Ended. | **Q** |
| A2 | Search (`q`) matches titles and descriptions, not option text. | Placeholder now reads "Search poll titles and descriptions…". | **Q** — should options be searched? |
| A3 | `/votes/my` mixes polls the user **created** with polls they **voted in**, and has no filter for either. | My Polls shows both, as the docs describe. The account page finds "created" by `creatorId === me` itself. | **Q** — add `?role=created\|participated`? |
| A4 | There's no aggregate stats endpoint. | Account insights (people reached, majority rate, badges) are computed from the first 50 open plus 50 ended polls in `/votes/my`, so heavy users see partial numbers. `totalVotes` and `totalPolls` come from `/users/me` and are exact. | **Q** |
| A5 | Notifications have no push and no list endpoint of their own. | The web polls `unread-count` every 60s while the tab is visible, and again when the user comes back to it. The list is `/votes/my?status=ended`. Opening a poll from the list or its page calls `POST /notifications/{id}/read`. | OK; add push (SSE) later? |
| A6 | `commentCount` counts Comments **and** Replies that aren't deleted (`VoteCommentRepository.countVisibleByVoteIds`). | The footer shows it as "N comments", replies included. | **Q** — is that the wording we want? |
| A7 | A Reply to a Reply is moved under the top-level Comment, and nobody is notified. | The reply box starts with `@author `. Mentions aren't linked and don't notify anyone. | **Q** |
| A8 | Avatar endpoints (`PATCH/DELETE /users/me/avatar`) and follow endpoints (`/users/{u}/follow`, `/followers`, `/following`) aren't in the contract. | The UI stays hidden as before. The code is still there: `lib/api/avatar-upload.ts`, `lib/api/users-public.ts`, and `followUser`/`unfollowUser`/`removeAvatar` in `services/users.ts`. | **Q** — build them, or remove the dead code? |
| A9 | `GET /users/search` returns `UserDto` without applying visibility settings (email, phone, active, lastLoginAt). | `searchUsers` moved to cursor paging. No UI uses it yet. | **Q** — privacy: should the API send only public fields? |
| A10 | `POST /auth/check-email` lets anyone test whether an email is registered. | The web still uses it only to choose between "sign in" and "sign up" wording. | **Q** (carried over from backend-requests.md) |
| A11 | 400 validation errors report only the first failing field. | PollCreator shows the API `message`, which is now localized through `Accept-Language`, as a form-level error. | Known limitation |
| A12 | `/api/lookups/*` isn't used by the web. | — | **Q** — what is it for on the frontend? |
| A13 | Editing a Scheduled poll (`PUT /votes/{id}`) rebuilds its options, so option IDs change. | This is harmless: nobody can vote before the poll opens. | OK |

## Not done this round (web)

| # | Item | Status |
|---|------|--------|
| W1 | Phone OTP and Google / LINE / Apple sign-in exist in the API. The web still offers email OTP only. | **N** |
| W2 | The PollCreator can't attach tags (`tagIds`; tags come from `GET /api/tags`). | **N** |
| W3 | 429 responses: `ApiError.retryAfter` now carries the `Retry-After` header, but the auth UI still shows a generic "Too many requests" message with no countdown. The OTP resend cooldown already counts down 180s. | **N** |
| W4 | `auth.suspicious_login`: on a protected page the user lands on `/login?session_expired=security` and sees "signed out on all devices". On a public page the cookies are cleared without any message. | **N** — add a toast? |
| W5 | Tokens are refreshed ahead of expiry, only in `proxy.tsx`. A 401 during a Server Action always becomes `AuthError` (sign in again), even with `auth.token.expired`. It's rare because the proxy refreshes early, but it isn't retried. | OK for now |
| W6 | Mobile has no notifications entry. The My Polls tab shows a dot when anything is unread, and its Ended tab marks unread polls. `/notifications` is linked from the desktop sidebar only. | **Q** (UX) |
| W7 | Leftover dead schemas from the old contract in `features/polls/schema.ts`: `PollPageSchema`, `PageableSchema`, `SortSchema`, `CreatePollRequestSchema`. Left alone because nothing uses them. | Cleanup |
| W8 | Changing username isn't possible (no endpoint). | **Q** (carried over) |

## What changed in the web (for review)

- Paging: every list uses `limit` + `cursor` and reads `{ items, nextCursor }`. The parser no longer accepts the old offset shapes.
- `voterVisibility`: the web keeps `nobody | owner | signed-in` and converts to `NOBODY | OWNER | SIGNED_IN` when talking to the API.
- Sealed counts arrive as `null` and are read as "unknown". The old schema rejected `null`, so every open poll would have failed to parse.
- Endpoints that were removed and their replacements: `/votes/participated` → `/votes/my` (open and ended); `?creatorUsername=` → `/users/{username}/votes`; `DELETE /vote/{optionId}` → `DELETE /vote`.
- New: Explore searches, filters and sorts on the server. Comments have one level of Replies and deleted placeholders. Ended polls show "See who voted" when Voter Visibility allows it. Notifications have a badge, a page and mark-as-read.
- `vote.not_allowed` now means "not open yet" and no longer counts as "ended". Only `vote.ended` does.
- `apiClient` sends `Accept-Language` (`zh-TW` or `en`) and reads `Retry-After`.
