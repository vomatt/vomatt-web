# Comments

People discuss a poll under it: post a comment, reply to one, like, edit, or delete their own.

## Sub-features

- `comment-post` posts a top-level comment.
- `comment-reply` replies to a comment.
- `comment-delete` deletes your own comment after a confirm.
- `comment-signed-out` opens the sign-in dialog on `Post`.

## How to get to it (user POV)

- The `Discussion` section on `/poll/<id>` (open by default on the poll page).
- The comments toggle (`Discuss` / `N comments`) in a poll card's footer.

## Driving it with vv

Preconditions:

- A published poll at `$POLL`; signed in.

- **Empty state.** Run `vv b goto $POLL`. `No comments yet. Make the case for your choice.` is visible; `Post` is disabled.
- **Post.** Run `vv b fill 'role=textbox[name="Why did you vote the way you did?"]' "Verify $RUN_ID comment"` and `vv b click 'role=button[name="Post"]'`. The comment appears in `Discussion` and the footer toggle reads `1 comment`.
- **Reply.** Run `vv b click 'role=button[name="Reply"]'`, `vv b fill 'role=textbox[name="Write a reply…"]' "Verify reply"`, then click the `Reply` submit button in the reply form. The reply nests under the comment.
- **Delete.** Choose `Delete` on the comment, then `Delete` in the `Delete this comment?` confirm. The comment disappears.
- **Proof.** Reload, snapshot (`vv b snapshot -s '[data-comment-thread]' > $E/comments.aria.txt`), and `vv sql "select content from vomatt.vote_comments"`.

## Gotchas

- After the first comment, two buttons are named `Reply` (the comment action and the reply form's submit); scope with `vv b snapshot -i` and click by `@e` ref.
- Column names in `vomatt.vote_comments` come from vomatt-api's `schema.sql`; check there if the query fails.
