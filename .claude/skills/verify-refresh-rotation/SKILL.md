---
name: verify-refresh-rotation
description: Bounded model check of vomatt-web's refresh-token rotation (src/proxy.tsx + src/lib/api/tokens.ts) against vomatt-api's rotate/grace/reuse rules. Use whenever a change touches the proxy's session handling, requestTokenRefresh, auth cookie writing, or the backend's refresh semantics, to prove concurrent page loads can't sign a user out.
---

# Verify refresh-token rotation

## What is verified

**Property.** However a browser's concurrent page loads interleave across server instances, the proxy's refreshes never make vomatt-api see a spent refresh token after its grace window, and the browser always ends up holding the session's live refresh token.

**Harm if broken.** vomatt-api treats a spent refresh token that comes back after its 60 s grace window as theft and signs that session out (`auth.suspicious_login`). A user would be logged out at random, just for opening a couple of tabs or pages at once, and would see "For your security, you were signed out on this device".

Three checks, each stated in the code's words:

- **P1 single flight.** Within one server instance, while a refresh of token `R` is in flight, no other request sends `R` to `/auth/refresh` (`requestTokenRefresh` dedups by token).
- **P2 no self-inflicted revocation.** The backend never answers `auth.suspicious_login`.
- **P3 browser converges.** When every response has reached the browser, its `refreshToken` cookie is the backend's live token. A spent or deleted token there means the next refresh, more than 60 s later, gets the session revoked, or the user is simply signed out.

## How it works

`src/__tests__/verification/refresh-rotation.test.ts` runs the **real** `proxy()` from `src/proxy.tsx`, together with the real `requestTokenRefresh` / `fetchRefreshedTokens` / `buildAuthCookies` from `src/lib/api/tokens.ts`. There are two copies, one per server instance, loaded with `jest.isolateModules`, so each has its own `inFlightRefreshes` map. Only two things are replaced, and both are await points the scheduler controls:

- `backendFetch` (`src/lib/api/backend-fetch.ts`) is a model of vomatt-api's `RefreshTokenService.rotate`, in two steps other requests can run between, as the user lookup separates them for real:
  - `read` (`World.backendRead`): a spent token within its grace window returns the same pair; after the window it revokes the session; a missing token is a plain 401. A live token goes on to `commit`.
  - `commit` (`World.backendCommit`): the atomic consume. The first caller rotates; a caller that lost the race gets the pair the winner wrote to grace in the same step.
  - The backend may also refuse once with 429 before doing anything.
- `setTimeout` inside a proxy run: the retry delay in `requestTokenRefresh` after a plain refusal is a step the scheduler fires, not a real 1 s wait.
- `verifyAccessToken` is the await before the session decision. The access token's age is modeled per epoch: fresh, then expiring (within `ACCESS_TOKEN_REFRESH_LEEWAY`), then expired. The second `verifyAccessToken` call, the one after a refresh, resolves immediately. Between that call and the response, the request touches no shared state.

The scheduler explores every order of these events, with states deduplicated:

- the browser sending the next request (capturing its current cookie jar) to either instance;
- each pending verify resolving;
- each pending refresh step (`read`, `commit`, or a `429` instead of `read`);
- each pending retry delay ending;
- each finished response reaching the browser (applying its Set-Cookie), in any order;
- the clock jumping (`age`).

## Bounds and assumptions

- Requests `/`, `/my-polls` (protected, so it redirects), and `/login` (an auth page, so it redirects signed-in users) in that order. With `REFRESH_CHECK_DEEP=1` a fourth request, `/`, is added. Two instances, at most one clock jump, and at most one 429.
- **Assumption:** the clock only jumps when nothing is in flight. Every request and response completes within the 60 s grace window, and access tokens last far longer (15 min) than the grace window, so a token issued in one epoch is never already expiring in that same epoch.
- **Assumption:** every response reaches the browser, and a 429 or 5xx means the backend did not consume the token.
- **Not covered:**
  - A response lost after the backend rotated, such as an aborted navigation, a timeout, or a 5xx after the commit. The browser then keeps a spent token, and the next refresh after 60 s revokes the session. No frontend change can fix that.
  - The `misconfigured` / `auth-key-mismatch` path (`SESSION_SECRET` ≠ `JWT_SECRET`).
  - Server Actions and route handlers, which must never refresh (by convention, not checked here).
  - JWT cryptography.
  - The real Redis behavior of `RefreshTokenService` (its atomic consume is a Lua script; vomatt-api's `RedisServiceImplTest` checks it against Redis 7), and Redis errors, which the backend answers with 503.
  - More than one browser, or sessions on several devices.

## Run it

```bash
npx jest src/__tests__/verification/refresh-rotation.test.ts                        # default bound, ~10 s
REFRESH_CHECK_DEEP=1 npx jest src/__tests__/verification/refresh-rotation.test.ts   # 4 requests, ~3 min
```

It also runs in `npm test`. A pass prints `refresh-rotation: ok: <N> states, <M> end states`. At the default bound that is 2,851 states and 70 end states with the two-step backend; it was 1,959 when the backend was one step and states that differed only in an undelivered response's cookies were wrongly merged. A sharp drop in the count means the model stopped exploring something. Treat it as a modeling error, not a pass.

## Reading a failure

A violation prints the property and a numbered counterexample in this repo's terms, such as `browser sends request 2 (/my-polls, instance 1) with A0/R0` or `backend refreshes R0 for request 3 … → auth.suspicious_login`. To decide what failed:

- **`P1` / `P2` / `P3: …` is a real finding** about the code as written. Replay the steps against `resolveSession`, `applyAuthCookies` and `requestTokenRefresh` to confirm it. Report it with that story. Do not weaken the property, the bounds or the backend model to make it pass, and do not change product code unless the user asks.
- **`model error: …`** means the harness no longer matches the code. One case is `… is stuck on an await the model does not control`: the proxy gained an await that the scheduler doesn't control (a new `fetch`, `cookies()`, or timer). Another is `mocked call outside a proxy run`. Fix the model so the new await is one of its steps, then rerun.
- **A thrown TypeError or import error** usually means a renamed export (`proxy`, `verifyAccessToken`, `backendFetch`) or a changed response shape (`readAuthTokens`). Update the mocks to match.

## Known finding (at the sync commit)

The comment on `inFlightRefreshes` in `tokens.ts` says "never send the same token twice", but the dedup only covers refreshes that are still in flight. Take a request that carries `R0` and finishes `verifyAccessToken` after another request's refresh of `R0` has resolved. The map entry is gone by then, so it sends `R0` again, even on the same instance. Steps: request 1 and request 3 both send with `R0` → request 1's refresh completes (`R0 → R1`) → request 3 finishes verifying → request 3 refreshes `R0` again. Today this is harmless only because the backend's grace window returns the same pair; the default run passes because of that window. If the window is removed, users get signed out. To see it, temporarily change `grace: true` to `grace: false` in `World.backendCommit` and run: P2 fails with that exact story. Revert afterwards.

## When a change is intended

If a change to the covered code is deliberate (for example, new cookie handling or a backend rule change in `RefreshTokenService`):

1. Update the model in the test to match: the backend rules in `World.backendRead` and `World.backendCommit`, the await points in the mocks, and the cookie parsing in `apply('deliver')`.
2. Keep each property's meaning. If a property genuinely no longer applies, say so to the user rather than deleting it quietly.
3. Show the check can still fail. Make a scratch break in the real code, run it, see the violation, and revert with `git checkout -- <file>` (only when the file had no other uncommitted edits). Breaks proven at the sync commit:
   - Delete `if (pending) return pending;` in `requestTokenRefresh` → P1.
   - In `proxy()`, return `NextResponse.redirect(...)` without `applyAuthCookies` → P3: the browser keeps `R0` while `R1` is live.
   - Model the old backend (the production logout bug): in `World.backendRead`, delete a live token at `read` (`this.refresh.delete(token)` before `return undefined`) and let `backendCommit` accept a missing record → P3: a refresh that arrives mid-rotation gets 401 twice, and its response deletes the cookies after the winner's response set `R1`.
4. Move the sync commit below forward only after confirming that the model describes the code at the new commit.

## Coverage record

| Check | Code it describes |
| --- | --- |
| Await points, session decision | `src/proxy.tsx`: `resolveSession`, `proxy` (cookie writes to the request, `applyAuthCookies`, the redirect branches) |
| Dedup, refresh call, result mapping | `src/lib/api/tokens.ts`: `requestTokenRefresh`, `fetchRefreshedTokens`, `readAuthTokens`, `buildAuthCookies`, `isExpiringSoon` |
| Mocked boundary | `src/lib/api/backend-fetch.ts`: `backendFetch` (signature only) |
| Backend model | `../vomatt-api/src/main/java/com/vomatt/common/security/RefreshTokenService.java` (rotate, 60 s grace, reuse detection); `../vomatt-api/docs/frontend/auth-flow.md` §6 |
| Constants | `src/data/constants.ts`: `ACCESS_TOKEN_REFRESH_LEEWAY`, `ACCESS_TOKEN_EXPIRY` |

**Sync commit:** vomatt-web `551afb805b2ed7cf1874adf2d564a04882c7db33` (covered files last changed in `97b170c`); vomatt-api `6526eba`.

To see whether the covered code changed since the sync commit:

```bash
git diff --stat 551afb805b2ed7cf1874adf2d564a04882c7db33 -- src/proxy.tsx src/lib/api/tokens.ts src/lib/api/backend-fetch.ts src/data/constants.ts
git -C ../vomatt-api diff --stat 6526eba -- src/main/java/com/vomatt/common/security/RefreshTokenService.java docs/frontend/auth-flow.md
```

Any output means: re-read those diffs against the model before trusting a pass.
