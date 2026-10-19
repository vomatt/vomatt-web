# Vote on a poll

A signed-in user picks one option on an open poll and casts a vote. Results stay sealed until the poll ends; the voter can change or withdraw the vote while it is open.

## Sub-features

- `vote-cast` casts a vote and shows the `Voted` stamp.
- `vote-update` switches to a different option.
- `vote-withdraw` withdraws the vote after a confirm.
- `vote-signed-out` opens the sign-in dialog and casts the vote after sign-in.
- `vote-results` shows results on an ended poll.

## How to get to it (user POV)

- Open `/poll/<id>` (from the home feed, Explore, My Polls, or a shared link).
- Vote from a poll card in the home feed.

## Driving it with vv

Preconditions:

- A published open poll with options `Tabs` and `Spaces` (run [Create a poll](./create-poll.md)); its URL in `$POLL`.
- Signed in. Voting on your own poll is allowed.

- **Pick.** Run `vv b goto $POLL` and `vv b click 'label >> text="Tabs"'`. The `Vote` button becomes enabled (`vv b is enabled 'role=button[name="Vote"]'`).
- **Cast.** Run `vv b click 'role=button[name="Vote"]'` and `vv b wait 'role=button[name="Withdraw vote"]'`. The `Tabs` option shows `Voted`, the footer reads `1 voted`, and the notice `Results are sealed until …` appears. No per-option counts are shown.
- **Persistence.** Run `vv b reload`. `Withdraw vote` and the `Voted` stamp on `Tabs` are still there.
- **Update.** Run `vv b click 'label >> text="Spaces"'` and `vv b click 'role=button[name="Update vote"]'`. The stamp moves to `Spaces`; the footer still reads `1 voted`.
- **Withdraw.** Run `vv b click 'role=button[name="Withdraw vote"]'`, then `vv b click 'role=group[name="Withdraw vote"] >> role=button[name="Withdraw"]'`. The `Vote` button returns and the footer reads `0 voted`.
- **Proof.** Snapshot after each step (`vv b snapshot > $E/vote-<step>.aria.txt`) and check the row: `vv sql "select o.text from vomatt.user_votes uv join vomatt.vote_options o on o.id = uv.option_id"` returns the current choice (no row after withdraw).

## Gotchas

- Radios are visually hidden (`sr-only`), so clicking `role=radio` times out. Click the label (`label >> text="<option>"`) and assert with `vv b is checked 'role=radio[name="<option>"]'`.
- Open polls never show counts; asserting a percentage on an open poll is a wrong expectation, not a bug.
- `vote-results` needs an ended poll: as its creator, use `End now` on the poll page (confirm dialog), then reload.
- The `Hide my name from voter lists` switch is hidden when the poll's voter visibility is `Nobody`.
