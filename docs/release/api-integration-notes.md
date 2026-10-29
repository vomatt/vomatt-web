# API integration notes (round 1)

Integration of vomatt-web with the vomatt-api contract dated 2026-10-09
(`vomatt-api/docs/frontend/openapi.json` and the flow docs next to it).
This lists what is unclear, missing or not ready, so we can come back to it after this round.

Status: **B** = blocks or breaks something now · **Q** = question / decision needed · **N** = next round (web work).

## Environment and verification

| # | Item | Status |
|---|------|--------|
| E1 | ~~The deployed API still ran the old page-based contract.~~ Resolved 2026-10-13: the deployed `api-docs.json` is cursor-paged with status/sort/search on `/votes` and `status` on `/votes/my`; the web's temporary page-based adapter (1f5dad1) is undone. | Done |
| E2 | `API_URL` in `.env` ends with `/`, so requests go to `https://…app//api/...`. Remove the trailing slash (CLAUDE.md says "origin, no path"). | **B** |
| E3 | `next build` compiles, then fails while collecting page data: Payload can't reach its Postgres (`tenant/user postgres.bbgszmcihpyhptivpdmm not found`). This is a Supabase/`DATABASE_URL` problem, not related to the API work, but it also blocks `next dev`. | **B** |
| E4 | No end-to-end run against a live API this round: the deployed API is outdated (E1), and this machine has no Java runtime to run vomatt-api locally. Coverage is unit and component tests (344 passing). First check once E1–E3 are fixed: sign in, vote, retract, comment and reply, end a poll, see the badge, open the notification. | **N** |
| E5 | ~~Which contract snapshot is current?~~ `api-docs.json` at the repo root, refreshed 2026-10-13 from the deployed API. | Done |

## Contract gaps and questions for the backend

| # | Item | What the web does now | Status |
|---|------|-----------------------|--------|
| A1 | `GET /api/votes` has no "all statuses" option. `sort=top` (most Turnout, Open only) arrived 2026-10-14. | Explore offers Open (Newest / Ending soon / Most voted) and Ended. | **Q** (All) |
| A2 | Search (`q`) matches titles and descriptions, not option text. | Placeholder now reads "Search poll titles and descriptions…". | **Q** — should options be searched? |
| A3 | `/votes/my` mixes polls the user **created** with polls they **voted in**, and has no filter for either. | My Polls shows both, as the docs describe. The account page finds "created" by `creatorId === me` itself. | **Q** — add `?role=created\|participated`? |
| A4 | There's no aggregate stats endpoint. | Account insights (people reached, majority rate, badges) are computed from every page of `/votes/my` (open and ended, up to 500 each), one request per page. `totalVotes` and `totalPolls` come from `/users/me` and are exact. | **Q** |
| A5 | Notifications have no push and no list endpoint of their own. | The web polls `unread-count` every 60s while the tab is visible, and again when the user comes back to it. The list is `/votes/my?status=ended`. Opening a poll from the list or its page calls `POST /notifications/{id}/read`. | OK; add push (SSE) later? |
| A6 | `commentCount` counts Comments **and** Replies that aren't deleted (`VoteCommentRepository.countVisibleByVoteIds`). | The footer shows it as "N comments", replies included. | **Q** — is that the wording we want? |
| A7 | A Reply to a Reply is moved under the top-level Comment, and nobody is notified. | The reply box starts with `@author `. Mentions aren't linked and don't notify anyone. | **Q** |
| A8 | ~~Follow endpoints aren't in the contract.~~ Resolved 2026-10-25 (vomatt-api #74, #75, deployed): `POST/DELETE /users/me/follows/{userId}`, `/users/{u}/followers`, `/following`, `/votes/following`, and `isFollowing` / `isBlocked` on profiles. See round 3. Previously: Avatar upload is dropped: everyone gets a drawn bot instead (backend request 16). | Follow ships: `features/follows/` (service, `FollowButton`, `FollowListDialog`); the old mocks and `lib/api/users-public.ts` are gone. Profiles return `avatarUrl` since 2026-10-15 and the picker is on; creators, voters and comment authors still draw from the username (request 16, item 4). | **Q** — build follows, or remove the dead code? |
| A9 | ~~`GET /users/search` returns `UserDto` without applying visibility settings.~~ Resolved 2026-10-14: items carry only `id`, `username`, `displayName`, `avatarUrl`. | The invitee picker searches usernames with it. | Done |
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
| W6 | ~~Mobile has no notifications entry.~~ Resolved in round 3: the TabBar's My Polls tab became Notifications. Previously: The My Polls tab shows a dot when anything is unread, and its Ended tab marks unread polls. `/notifications` is linked from the desktop sidebar only. | **Q** (UX) |
| W7 | Leftover dead schemas from the old contract in `features/polls/schema.ts`: `PollPageSchema`, `PageableSchema`, `SortSchema`, `CreatePollRequestSchema`. Left alone because nothing uses them. | Cleanup |
| W8 | Username changes go through `PATCH /users/me` `{ username }` (3–50 of `[a-z0-9_]`, not `search`; 409 `user.username.taken`). The profile dialog saves username, name and bio in one request. The API doesn't reserve app routes (`explore`, `login`, `account`, …), so such a username would make that profile unreachable at `/{username}`. | **Q** — reserve route names in the API? |

## What changed in the web (for review)

- Paging: every list uses `limit` + `cursor` and reads `{ items, nextCursor }`. The parser no longer accepts the old offset shapes.
- `voterVisibility`: the web keeps `nobody | owner | signed-in` and converts to `NOBODY | OWNER | SIGNED_IN` when talking to the API.
- Sealed counts arrive as `null` and are read as "unknown". The old schema rejected `null`, so every open poll would have failed to parse.
- Endpoints that were removed and their replacements: `/votes/participated` → `/votes/my` (open and ended); `?creatorUsername=` → `/users/{username}/votes`; `DELETE /vote/{optionId}` → `DELETE /vote`.
- New: Explore searches, filters and sorts on the server. Comments have one level of Replies and deleted placeholders. Ended polls show "See who voted" when Voter Visibility allows it. Notifications have a badge, a page and mark-as-read.
- `vote.not_allowed` now means "not open yet" and no longer counts as "ended". Only `vote.ended` does.
- `apiClient` sends `Accept-Language` (`zh-TW` or `en`) and reads `Retry-After`.

## Round 2: contract of 2026-10-14

Audience (Public / Unlisted / Invite-only), Invitees, Groups, Delete, Deadline, Invitations and `sort=top`.

| # | Item | What the web does now | Status |
|---|------|-----------------------|--------|
| R1 | The invitation email links to `EMAIL_SITE_URL` + `EMAIL_POLL_PATH`, which defaults to `/votes/{voteId}`. The web's poll page is `/poll/{id}`. | Nothing. | **B** — set `EMAIL_POLL_PATH=/poll/{voteId}` on the API, or add a web redirect |
| R2 | A Poll doesn't say whether the viewer is one of its Invitees. | The Notifications page lists Invitations as the Invite-only Polls of someone else in the first page of `/votes/my?status=open` (up to 50). The poll page treats any non-owner viewer of an Invite-only Poll as an Invitee (only they can see it) when marking it read. | **Q** — add a flag, or a notifications list? |
| R3 | `PUT /votes/{id}` replaces the Invitees with `inviteeIds` / `inviteeEmails`. | Editing a Poll that is already Invite-only sends neither list; Invitees are managed in the Invitees dialog on the Poll. Switching a Scheduled Poll to Invite-only sends the people picked in the creator. | OK |
| R4 | `deletable` is computed when the Poll is read; the delete window (default 20 min) can pass while the page is open. | Delete shows while `deletable` is true; a late click shows the API's `vote.delete.window_passed` message. | OK |
| R5 | Invite-only with no Invitees is allowed by the API. | The creator asks for at least one person or Group. The Invitees dialog lets the owner remove everyone who hasn't voted; removing the last one who hasn't voted ends the Poll (the card refetches). | OK |

## Round 3: v2 web design (2026-10-25)

The web side of the "Vomatt v2 Design" canvas: Follow everywhere a person is, the profile's Asked / Voted lists (My Polls folds into Profile › Asked), visibility in Edit profile, the Settings sections, grouped Notifications, and Language in the sidebar's More menu. Checked against the API deployed at `API_URL` on 2026-10-25 (follows live; `api-docs.json` here is refreshed by the sync workflow).

### Built on what the API has

| # | Design piece | What the web does | Status |
|---|---|---|---|
| F1 | One Follow button (Follow / Following → Unfollow on hover / Blocked) on the visitor header and every hover card | Uses `isFollowing` / `isBlocked` from `GET /users/{username}` with the session. That call is no longer cached for signed-in viewers (the relation depends on who asks); signed out it stays cached for 60s. The hover card route answers `private, no-store` when signed in. | OK |
| F2 | Followers / Following lists under the handle | `GET /users/{u}/followers` and `/following` in a dialog, signed in only (the API requires auth), with the counts (B1). | OK |
| F3 | Profile record: polls asked, voted in, people reached, picks that won | Asked and voted in are `totalPolls` / `totalVotes`. People reached and picks that won (owner only) are computed from every page of `/votes/my` (up to 500 open + 500 ended), as A4 already did. | OK, see B5 |
| F4 | Profile › Voted: Sealed then Decided, with the owner's pick and outcome | `/votes/my` filtered to `creatorId != me && myOptionId`. Outcome from the ended options' counts. | OK, see B6 |
| F5 | Profile › Asked with drafts and a ••• menu (Edit, End now, Invitees, Share, Delete) | Drafts stay in local storage. The ••• menu reuses the poll card's owner actions. `/my-polls` redirects to the profile. | OK |
| F6 | Notifications: Today / Yesterday / Earlier | Invitations (Invite-only polls in `/votes/my?status=open`) and results (`/votes/my?status=ended`) merged and grouped on the client. Rows are read when opened or seen; the All / Unread filter and Mark all read were removed 2026-10-29. | OK, see B3 |
| F7 | Visibility per field in Edit profile, "3 of 7 shown" in Settings | `PATCH /users/me/visibility` on Save with only the changed keys. Real name toggles `firstName` and `lastName` together. Birthday always reads "Only you" (never public). | OK |

### Needs the backend (UI hidden until the field or endpoint exists)

| # | Request | Why the design needs it | What the web does now |
|---|---|---|---|
| B5 | Aggregate stats for the owner, e.g. `GET /users/me/stats` → `{ peopleReached, decidedBallots, wonBallots }` | People reached and picks that won are exact only up to 500 + 500 polls, and cost one request per page | Computed on the client |
| B6 | `role=created\|participated` on `/votes/my` (A3), plus `unread` counts per role | The two profile tabs and their unread badges; today both come from one mixed list | Split on the client |

### Open questions

| # | Question |
|---|---|
| Q1 | Should the hover card and profile header also offer Follow to signed-out visitors (leading to log in)? The web shows nothing until signed in, since the followers lists need auth anyway. |
| Q2 | Terms / Privacy / Contact links at the foot of Settings: which pages? `docs/legal/legal-pages-draft.md` has drafts but no routes. Left out. |
| Q3 | The design's collapsed sidebar (icons only, Alert dot, Tide lock) isn't built: the web sidebar doesn't collapse today. Build it? |

B1 (follow counts), B2 (followsYou, isFollowing on list items), B3 (notification feed), B4 (read-all), B7 (mutual followers) and B8 (notification preferences, per kind; no push or email channel exists) are in vomatt-api's feat/design-api branch, 2026-10-26. This app no longer calls B4: Mark all read was removed 2026-10-29.
