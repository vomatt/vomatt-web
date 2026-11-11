# Site audit, 2026-11-11

This audit covers layout and logic across vomatt-web. Backend behaviour was read from vomatt-api `origin/main` (45e703b). The local `../vomatt-api` checkout is on the stale branch `feat/self-serve-official`, which has no community endpoints.

## Fixed in this branch

- **Account switcher.** The separate chip above Create a poll is gone. For someone in a community account, the sidebar's Profile row shows the account they act as and opens the menu: View profile, then the accounts, then Create a community account.
- **Check icons in the menu.** The menu had two unexplained checks: a bare check on the selected row, and the community badge (an ink check seal) after each community's name. Every account row now has a radio circle, and the circle is filled on the account in use. The badge is gone from the menu, because the "Community accounts" group label already says what those rows are.
- **Settings "On this page".** The list skipped Community accounts, although that section is on the page.
- **Voter-visibility copy in the poll creator.** "Only me" now says "Only you see who chose each option. Everyone else sees the totals." The note now reads "Voters are shown this before they vote." Nobody now says it includes the owner.
- **"Only me" while acting.** It now reads "Only {community}", and the hint says anyone acting as the community sees who chose each option (High 1 below).
- **Anonymous votes.** The review step now says that if anyone votes anonymously, only who took part is listed (High 2 below).
- **What others see while acting.** The page now shows the same "These settings are your own" notice as Settings, instead of the community's settings, which Editors couldn't save.

## Your question about "Only me"

The setting does not control who sees results. It controls who can see **which option each person chose** after the poll ends.

| Option | API value | Who sees each person's choice |
|---|---|---|
| Only me | `OWNER` | The poll's owner only |
| Everyone signed in (Everyone invited on Invite-only polls) | `SIGNED_IN` | Anyone who can see the poll |
| Nobody | `NOBODY` | Nobody, not even the owner |

Vote **totals** are separate. They stay sealed for everyone, the owner included, while the poll is open. After it ends, totals are public to everyone, signed out included. So a voter on an "Only me" poll still sees the results. "Only me" is the right default, with the two caveats below (High 1 and 2).

## Still open: High

1. **Fixed.** **"Only me" is wrong when you post as a community.** The owner is the community account, so every member who acts as it can see the voter list, and your personal account can't. Suggested fix: while acting, use "Only {community}" and "Members acting as {community} see who chose each option" (also `ruleVisibility.owner`). This is a product call.
2. **Fixed on the review step.** **The visibility labels promise more than the API gives.** If any other voter casts an anonymous ballot, the API hides every voter's choice and lists only who took part. The voter list already handles this, but the creator copy doesn't say so. Suggested fix: add "unless someone votes anonymously".
3. **Community Editors are offered actions the API rejects.** Edit, Delete, End and Invitees show on every community poll, and edit and delete on every community comment. The API answers 403 `community.role_forbidden` when an Editor tries this on another member's item. Hiding these correctly needs a "published by" field on polls and comments, which the API doesn't have yet. This is a backend ask.
4. **Guests can't change language.** More shows only Appearance to guests, and phones have no More menu. The only Language link is in Settings, which needs sign-in.
5. **Switching account on a phone is buried.** On a phone it exists only in Settings → Community accounts. While acting, the profile gear turns into Manage members and Settings shows only a notice, so log out, theme and Report a problem can't be reached. Suggested fix: make the acting banner's button open the same account menu.
6. **Back on a poll always goes Home** (`poll/[id]/page.tsx:85`). Users who came from Explore, a profile or Notifications lose their place.
7. **The create action looks different in five places.** The sidebar and TabBar use the `create` variant. AskCard uses `outline`. The empty feed and empty profile use plain ink. DESIGN.md says there is one create action.

## Still open: Medium

- **Settings subpages while acting.** What others see is fixed. Devices is fine as it is: the client sends session requests as the person, so it shows your own devices. Blocked people isn't restricted for communities, so I left it.
- **Pro polls without a verified phone.** The vote fails with the API's raw message. `apiError.vote.ballot.phone_verification_required` and a few other error keys are missing, and nothing links to phone verification.
- **Follow is hidden while acting, but the API allows it.** Decide whether that is intended.
- **The creator doesn't check time limits.** It allows an end more than 365 days out, and a typed opening time in the past. Both fail only at publish.
- **The Notifications rail uses the lock and Tide panel**, which mean "sealed ballot" elsewhere. Its copy also contradicts itself.
- **Report a problem has no footer primary button.** Send is an outline button, and the textarea has no visible label.
- **In zh, 主題 means both Theme and Topics.**
- **Explore.** The retry link is a small text link. The no-results card has no action. The page has no visible title, although DESIGN.md lists one.
- **Theme order differs.** The More menu shows Light, Dark, Auto. Settings shows Auto, Light, Dark.
- **The community badge site-wide is an ink check in a circle**, which most people read as "verified". This is a judgment call.

## Still open: Low

- "Vomatt" is capitalised in `loginPrompt.title` and in the poll metadata fallback.
- These locale keys are unused: `common.login`, `navigation.logout`, `common.myPolls`, `common.active`, `common.ended`, `profile.joinedAt`, `profile.totalVotes` and `verificationCode.invalidVerificationCode`.
- A scheduled poll viewed while acting says "Community accounts don't vote" instead of its opening time.
- The profile route has no `loading.tsx`, and neither do `settings/language`, `settings/devices` or `settings/blocked`.
- The guest home page shows the legal links above the feed.
