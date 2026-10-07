# Release Readiness Plan

Context: the web app still targets the retired `/api/v1` backend (zeabur, now 404).
The live contract is `vomatt-api` (`/api` prefix, unified email OTP, refresh-token
rotation with reuse detection, `PageResponse { content, total, page, limit }`, 1-based pages).
The web adapts to that contract; backend gaps are listed in `docs/release/backend-requests.md`.

## Stage 1: Auth hardening + new auth contract
**Goal**: Sign-up/log-in/refresh/logout work against `/api/auth/*` and sessions survive token expiry.
**Success Criteria**:
- Email → OTP → signed in (new emails create an account; first-time users can set a display name).
- Proxy refresh forwards rotated cookies to the same request, clears dead sessions, never double-rotates.
- Token helpers are `server-only` (not exposed as Server Actions); logout revokes the refresh token.
- JWT verified with HS256/384/512; cookie lifetimes follow the backend (refresh 30d).
**Tests**: tokens, proxy, auth service, useAuthFlow, client refresh path.
**Status**: Complete

## Stage 2: API contract alignment + correctness
**Goal**: Feed, poll detail, ballots, comments and profiles call the real endpoints.
**Success Criteria**: `/api` prefix; PageResponse parsed; retract uses option id; owner check by user id;
"ended" error code recognised; poll detail readable when signed in and degrades when the API refuses guests.
**Tests**: cursor, service, status/errors, PollCard owner actions.
**Status**: Not Started

## Stage 3: Voting UX (motion)
**Goal**: Voting feels like dropping a ballot in a box: select → cast → sealed confirmation; results animate in.
**Success Criteria**: animated selection, cast "stamp" + sealed state, animated result bars, reduced-motion respected.
**Tests**: Ballot/Results render + interaction tests still pass; reduced-motion path.
**Status**: Not Started

## Stage 4: Poll detail + comments
**Goal**: Detail page that invites participation: context, timeline, turnout, share, threaded comments (post/edit/delete/like).
**Tests**: comments component tests (post, optimistic like, delete own).
**Status**: Not Started

## Stage 5: Account page
**Goal**: Profile summary, stats, my polls by status, voting activity, settings (display name/bio/visibility), logout.
**Tests**: account component tests.
**Status**: Not Started

## Stage 6: Release docs
**Goal**: `docs/release/` — backend requests, release checklist, product brainstorm.
**Status**: Not Started
