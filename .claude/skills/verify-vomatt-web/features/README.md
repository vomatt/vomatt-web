# vomatt-web verification map

The maintained source for verifying vomatt-web's user-facing behavior. Read this index, then use the matching feature file as the recipe. `vv` below is `.claude/skills/verify-vomatt-web/scripts/vv`; `$W` is `http://localhost:${VERIFY_WEB_PORT:-3102}`; `$E` is `/tmp/vomatt-verify-evidence/$RUN_ID`.

## Baseline preconditions

- `vv up` finished with `vv: ready`, and `vv doctor` prints only `ok` lines.
- The local API database starts empty: no users, no polls. Every recipe creates what it needs through the UI.
- Use a fresh email per run, e.g. `verify-$RUN_ID@example.test`.
- Never drive the developer's `:3002` server or the deployed API.

## Driving conventions

- Drive through `vv b <browse command>`; sign in with `vv login <email>` (real UI flow).
- Prefer `role=<role>[name="<name>"]` selectors and the element ids named in each file; avoid CSS classes and DOM position.
- Use `vv b wait <selector>` rather than sleeps.
- Desktop viewport is the default; the mobile TabBar only renders below the `md` breakpoint (`vv b viewport 390x844`).

## Proof and skip reporting

- Capture the action and the resulting state: `vv b snapshot > $E/<id>-<step>.aria.txt` before and after, plus `vv b screenshot $E/<id>-<step>.png`.
- Mutation proof includes a second read: reload or reopen the page, and query Postgres with `vv sql`.
- Record the feature ID and entry point with every artifact.
- Report an unreachable path with the command tried and the unmet precondition. Never report an entry point as verified through another one.

## Feature entry contract

Each feature file has an H1, a one-paragraph description, then four H2s in order: `Sub-features`, `How to get to it (user POV)`, `Driving it with vv`, `Gotchas`. Keep implementation details out; name user paths, stable handles, required state, commands, and observable proof.

## Features

- [Sign in](./sign-in.md): email OTP sign-in and sign-up, profile step, protected-route redirect, sign out.
- [Create a poll](./create-poll.md): the New poll dialog, review, publish, landing on the poll page.
- [Vote on a poll](./vote.md): cast, update, and withdraw a vote; sealed results.
- [Comments](./comments.md): post, reply, and delete comments on a poll.
- [Explore](./explore.md): browse, search, filter, and sort public polls.
