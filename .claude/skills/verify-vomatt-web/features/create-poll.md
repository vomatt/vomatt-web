# Create a poll

A signed-in user writes a question with at least two options, reviews it, and publishes it. The new poll opens on its own page, ready for votes.

## Sub-features

- `create-open` opens the `New poll` dialog from each entry point.
- `create-validate` blocks review with an empty question or duplicate/empty options.
- `create-review` shows `Review your poll` with a voter preview, and `Edit` returns to the form.
- `create-publish` publishes and lands on `/poll/<id>`.
- `create-draft` keeps an unfinished poll as a local draft.

## How to get to it (user POV)

- Desktop sidebar button `Create a poll`.
- Mobile tab bar icon button `Create a poll` (viewport below `md`).
- Empty home feed button `Create the first poll`.
- Signed out, the sidebar `Create a poll` is a link to `/login`.

## Driving it with vv

Preconditions:

- Signed in (`vv login verify-$RUN_ID@example.test`), on `$W/`.

- **Open dialog.** Run `vv b click 'role=button[name="Create a poll"]'` and `vv b wait 'text=New poll'`. A dialog titled `New poll` shows `Your question` and two option boxes.
- **Validation.** Run `vv b click 'role=button[name="Review"]'` with the form empty. `Ask a question.` and `Fill in every option.` appear; the dialog stays on the form.
- **Fill.** Run `vv b fill '#title' "Verify $RUN_ID: tabs or spaces?"`, `vv b fill 'role=textbox[name="Option 1"]' Tabs`, `vv b fill 'role=textbox[name="Option 2"]' Spaces`. Optional: `vv b click 'role=button[name="Add option"]'` adds `Option 3`.
- **Review.** Run `vv b click 'role=button[name="Review"]'` and `vv b wait 'text=Review your poll'`. The preview shows the question and both options; `Edit` and `Publish poll` are present.
- **Publish.** Run `vv b click 'role=button[name="Publish poll"]'` and `vv b wait 'role=button[name="Vote"]'`. `vv b url` is `$W/poll/<uuid>`; the h1 is the question; the radios are `Tabs` and `Spaces`.
- **Second view.** Run `vv b goto $W/my-polls`. The `Active` tab lists the question.
- **Proof.** `vv b snapshot > $E/create-publish.aria.txt`, `vv b screenshot $E/create-publish.png`, and `vv sql "select v.title, v.audience, o.text from vomatt.votes v join vomatt.vote_options o on o.vote_id = v.id order by o.display_order" > $E/create-publish-db.txt` show the poll, `PUBLIC`, and both options.

## Gotchas

- `Ends and reveals results` defaults to 3 days ahead; leave it unless the journey needs an ended poll.
- `Invite only` requires at least one invitee and an existing user or group to pick.
- Closing a dirty dialog asks `Keep this poll as a draft?`; drafts live in browser storage, not the API, so `vv sql` never shows them.
- The `Poll published` toast disappears quickly; assert the URL and h1, not the toast.
