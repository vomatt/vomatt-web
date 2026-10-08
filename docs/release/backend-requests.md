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
| 14 | Avatars and follows | Open (schema); UI stays hidden until profiles send the fields |
| 15 | Change username | Open |

## Notes

- `POST /api/auth/check-email` lets anyone test whether an email is registered. The web uses it
  only to word the sign-in screen; it can be dropped if enumeration matters more than the copy.
- Refresh-token rotation with reuse detection works as designed: the web rotates only in the
  proxy and forwards new cookies to the same request (verified with a 120s access token).
- `GET /api/votes` still returns only polls that are open right now, so ended polls (and their
  results) appear in the feed only through profiles, the account page and direct links.
