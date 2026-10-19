# Explore

Anyone, signed in or not, can browse public polls, search titles and descriptions, filter by status, and sort.

## Sub-features

- `explore-list` lists public polls with `N voted`.
- `explore-search` finds polls by text (2+ characters).
- `explore-filter` filters by `Open` / `Ended`.
- `explore-sort` sorts by `Newest`, `Ending soon`, `Most voted`.
- `explore-empty` shows `No polls found.`

## How to get to it (user POV)

- Sidebar link `Explore`; mobile tab bar `Explore`; or `/explore`.

## Driving it with vv

Preconditions:

- At least one public poll titled `Verify $RUN_ID: tabs or spaces?` (run [Create a poll](./create-poll.md)). Sign-in is optional.

- **List.** Run `vv b goto $W/explore`. Heading `Explore` and the poll's title are visible.
- **Search hit.** Run `vv b fill 'role=searchbox[name="Search poll titles and descriptions…"]' tabs` (if the role is `textbox`, use that). The poll stays listed.
- **Search miss.** Fill `volcano`. `No polls found.` appears.
- **Short query.** Fill `t`. `Type at least 2 characters to search.` appears.
- **Filter.** Clear the search and choose `Ended`. The open poll disappears; choose `Open` and it returns.
- **Proof.** `vv b snapshot > $E/explore-<step>.aria.txt` after each step.

## Gotchas

- Unlisted and invite-only polls never appear here; that is expected.
- Search is debounced; `vv b wait` for the result or `No polls found.`, not a fixed delay.
- `Browse by topic` needs tags, which only the admin API creates; the local database has none, so topic journeys report a failure with that reason.
