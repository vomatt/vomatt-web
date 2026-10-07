# Backend requests for public release

Found while moving vomatt-web onto the live `vomatt-api` contract and testing it end to end
against a local build of the API (Postgres + Redis in Docker). Ordered by priority.
The web app already works around everything marked *workaround*; nothing here needs a web change
to ship, except where noted.

## P0 — block release

### 1. Creating a comment returns 500
`POST /api/votes/{id}/comments` throws
`NullPointerException: VoteComment.getCreatedAt() is null` at
`comments/CommentMapper.java:19` (`!comment.getCreatedAt().equals(comment.getUpdatedAt())`).
`created_at` is filled by the database default, so it is still null on the entity returned by
`save()`. Use `Objects.equals(...)`, or `saveAndFlush` + `refresh`, before mapping.
Listing, liking and deleting comments work.

### 2. Guests can't open a shared poll
`SecurityEndpoints.PUBLIC_GET` contains `/api/votes` but not `/api/votes/*`, so
`GET /api/votes/{id}`, `/api/votes/{id}/results` and `/api/votes/{id}/comments` require a token.
Every shared link shows a sign-in wall, link previews have no title, and search engines see nothing.
Add `/api/votes/*`, `/api/votes/*/results` and `/api/votes/*/comments` (GET only).
*Workaround:* the page shows a sign-in prompt that returns to the poll.

### 3. Sealed results are not sealed in the API
The product promise is "results are sealed until the poll ends". The web UI never shows counts
while a poll is open, but `VoteResponse.options[].votes`, `totalVotes` and `/results` return live
counts to anyone. Withhold per-option counts (and `/results`, 403) until `endTime`; keep a
participant count.

### 4. Editing a scheduled poll has no endpoint
The owner's **Edit** button on a scheduled poll calls `PUT /api/votes/{id}`, which doesn't exist.
Either add it (owner only, scheduled polls only) or tell us to hide the button.

### 5. Production email
Sign-in is email-OTP only. `EMAIL_ENABLED=true` and the SMTP settings must be set in production,
or nobody can sign in. (Locally `EmailServiceNoOp` drops the code silently.)

## P1 — needed for the features to be complete

| # | Request | Why | Web today |
|---|---------|-----|-----------|
| 6 | `GET /api/votes/participated` (polls I voted in, with my option) | Account "Your votes" and badges | Scans the 50 newest polls |
| 7 | `myOptionId` on `VoteResponse` for the signed-in viewer | Removes one `my-vote-status` call per card | Parallel lookups on the server |
| 8 | `GET /api/votes` filters: `creatorUsername`, `status`, `sort` (newest, popular, ending), `q` | Profile polls, Explore search and sort | Filters the newest 50 client-side |
| 9 | `commentCount` and `participantCount` on `VoteResponse` | Feed shows "12 comments", turnout = people not ballots | Count appears after opening the thread |
| 10 | Distinct `vote.ended` error code | Today closed polls return the generic `vote.not_allowed` | Both treated as "ended" |
| 11 | `voterVisibility` (`nobody` / `owner` / `signed-in`) stored and returned | The creator already asks for it | Sent, ignored by the API |
| 12 | Display name and bio public by default | They default to hidden, so new users look anonymous | Account → Settings has the toggles |
| 13 | Notify voters when results are revealed | The sealed notice says "We'll notify you" | `/notifications` is a placeholder |
| 14 | Avatars (`avatarUrl` on profiles, upload endpoint) and follows | UI exists behind dev-only mock routes | Hidden until the profile sends the fields |
| 15 | Change username | Usernames are generated (`newbie_4264`) and can't be changed | — |

## Notes

- `POST /api/auth/check-email` lets anyone test whether an email is registered. The web uses it
  only to word the sign-in screen; it can be dropped if enumeration matters more than the copy.
- Refresh-token rotation with reuse detection works as designed: the web now rotates only in the
  proxy and forwards new cookies to the same request, so one navigation causes one rotation and no
  reuse alarms (verified with a 120s access token).
