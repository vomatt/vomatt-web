# Backend requests for public release

Found while moving vomatt-web onto the live `vomatt-api` contract and testing both end to end
(API in Docker with Postgres + Redis). Items marked **Done** are implemented on the
`release-readiness` branch of vomatt-api and used by the web app on its branch of the same name.

## P0 — block release

| # | Request | Status |
|---|---------|--------|
| 1 | `POST /api/votes/{id}/comments` returned 500 (`createdAt` read before flush in `CommentMapper`) | **Done**: `saveAndFlush`, null-safe mapper; a new comment is no longer flagged `edited` |
| 2 | Guests couldn't read a poll, its results or its comments | **Done**: `GET /api/votes/*`, `/results`, `/comments` are public; `/my`, `/participated`, `/my-vote-status` stay authenticated |
| 3 | Option counts were public while a poll was open | **Done**: `options[].votes` is left out until the poll ends (or is cancelled); `/results` answers 403 `vote.results.sealed` before then |
| 4 | No endpoint for editing a scheduled poll | **Done**: `PUT /api/votes/{id}`, creator only, before it opens (`vote.not_editable` after); options are replaced, tags kept |
| 5 | Production email | **Ops**: set `EMAIL_ENABLED=true` and SMTP; locally `EmailServiceNoOp` drops the code |

## P1

| # | Request | Status |
|---|---------|--------|
| 6 | Polls I voted in | **Done**: `GET /api/votes/participated` (paged, newest first, each with `myOptionId`); the account page uses it |
| 7 | `myOptionId` on polls | **Done**: on every poll response; left out for guests, `null` when the viewer hasn't voted. The web no longer looks ballots up one by one |
| 8 | List filters | **Partly**: `?creatorUsername=` (all the user's polls, ended ones included) is done and used by profiles. `status`, `sort` and `q` are not; Explore still filters the newest 50 |
| 9 | `commentCount`, `participantCount` | **Done**: both on every poll response, counted once per page |
| 10 | Distinct `vote.ended` | **Done**: ballots on an ended or cancelled poll get `vote.ended` (400); `vote.not_allowed` now means "not open yet" |
| 11 | Store `voterVisibility` (`nobody` / `owner` / `signed-in`) | Open: needs a DB column. Meanwhile results list voters only to the poll's creator (never for anonymous polls), so "Anyone signed in" behaves like "Only me" |
| 12 | Display name and bio public by default | **Done** |
| 13 | Notify voters when results are revealed | Open (needs a notifications table and a job) |
| 14 | Avatars and follows | Avatars: see 16. Follows: open (schema); UI stays hidden until profiles send the fields |
| 15 | Change username | Done: `PATCH /api/users/me` `{ username }` (`editProfile` in `lib/api/services/users.ts`). Still open: Profiles live at `/{username}`, so usernames must not match app routes (`explore`, `login`, `account`, …) or Sanity page slugs |
| 16 | Choose an avatar from the cast | Open. Details below |

## 16. Avatars: the cast

The web gives everyone one of 48 drawn characters (`src/features/avatars/catalog.ts`). A choice is
stored as `bot:<kind>` (e.g. `bot:boba`) in the existing `users.avatar_url` column; no migration.

1. `PATCH /api/users/me` accepts `avatarUrl`. Reject anything that isn't `bot:` plus one of the
   kinds in `BOT_KINDS` (400, field error), so no one can point everyone at an image URL.
2. `GET /api/users/me` and `GET /api/users/{username}` return `avatarUrl` (null when unset). Avatars
   are always public, so no visibility setting applies.
3. A new user gets a random `bot:<kind>` when the account is created (`AuthService`, both
   `User.builder()` sites). Stop copying Google / Apple / LINE pictures into `avatar_url`; existing
   picture URLs stay until the user picks a bot.
4. Return `avatarUrl` for poll creators, voters and comment authors (and the web passes it to
   `UserAvatar` there). Ship this with 2: the picker turns on as soon as profiles return
   `avatarUrl`, and without 4 a chosen bot would show on the profile but not beside comments.

Until then the web draws the bot picked from the username (`defaultBotFor`), so it changes if the
username changes, and the picker in Settings stays hidden because `avatarUrl` isn't in the profile.
Provider photo URLs (`https://…`) are ignored: everyone is drawn as a bot.

## Notes

- `POST /api/auth/check-email` lets anyone test whether an email is registered. The web uses it
  only to word the sign-in screen; it can be dropped if enumeration matters more than the copy.
- Refresh-token rotation with reuse detection works as designed: the web rotates only in the
  proxy and forwards new cookies to the same request (verified with a 120s access token).
- `GET /api/votes` still returns only polls that are open right now, so ended polls (and their
  results) appear in the feed only through profiles, the account page and direct links.
