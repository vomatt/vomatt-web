# Launch review (2026-11-04)

A second pre-launch pass over vomatt-web and vomatt-about: flows and logic, risk and legal, and a phone walk-through of both sites in a real browser. It follows [launch-review.md](launch-review.md) (2026-10-28), whose placeholder table is now out of date: the published legal pages have no bracketed placeholders left.

## Fixed in this pass

### vomatt-web (branch `claude/vomatt-web-review-launch-5c4044`)

- **An API hiccup no longer crashes every page.** A 5xx, 429 or network failure on `/users/me` threw from the root layout, so signed-in users got the unstyled crash page. The layout now shows the existing SessionRetry screen. "Try again" on the error pages calls `retry` (refetches) instead of `reset` (re-renders the same failure). The root crash page is styled, shows English and Chinese, and logs the error.
- **Comments survive a dropped request.** Every comment call goes through `settle()`. A failed post keeps the typed text and re-enables Post; a failed first load shows retry instead of a skeleton forever. Failures show the API's own message ("the comment you replied to was deleted", rate limits). Deleting an already-deleted comment just removes it.
- **Missing polls.** A guest opening a deleted or mistyped link saw "Log in to open this poll", then "Poll not found" after logging in. Now they see "Poll not found" (tab title "Not found"). Invite-only polls still show the invitation. The status is still 200 because the root layout streams before the page renders.
- **Blocks on profile poll lists.** The list didn't send the viewer's token, so a blocked viewer saw the owner's polls and got a 404 opening them.
- **Unlisted and invite-only polls are `noindex`.**
- **Phones:**
  - Vote and Update vote stay on screen above the TabBar once an option is picked. Before, the button could be 600px below the fold on a long poll.
  - Result labels no longer split mid-word.
  - Explore's sticky filter bar went from 224px to 120px tall.
  - Notification rows went from 329px to about 148px tall, and handles no longer break.
  - Follower and following counts, and the toast close button, have 44px targets.
  - Guests now find Terms, Privacy and Cookies under the home login prompt. The sidebar is unchanged, since that removal (0382fc2) looked deliberate.
- **Accessibility.** Policy links were announced as "Go to https://about.vomatt.com/…" instead of their text (WCAG 2.5.3).
- **Docs.** [docs/legal/launch-pages-draft.md](../legal/launch-pages-draft.md) drafts the missing pages (Community Guidelines, Reporting and appeals, Your data) and exact edits to Privacy, Cookies and the sign-up message, in English and 繁體中文.

Checks: 1325 tests pass, lint has 0 errors, `next build` succeeds, and `tsc` shows only the existing `PublicKeyCredentialJSON` errors. The phone fixes were measured in the running app before and after.

### vomatt-about (branch `claude/vomatt-web-review-launch-fd4967`)

- **A real homepage at `/`** replaces the redirect to `/about`. It tells one poll's story in three scroll-driven steps (ask, vote sealed, result), then why sealed matters, features, use cases, a privacy promise and a closing call to action.
  - It uses CSS and `react-intersection-observer` only, with no new dependencies: 3.9KB of gzipped JS.
  - With reduced motion or JS turned off, it shows each step's final state.
  - Nothing scrolls sideways at 320 to 1440.
- **CMS links** are named by their visible text.
- **Footer links** have 44px targets.
- **`robots.txt` and `sitemap.xml`** now exist.

## Needs you

### Decisions

1. **Download your data.** The published Privacy Policy (§6) and Terms (§9) say people can download their data in Account settings. The API serves it (`GET /api/users/me/export`, once a day), but f6a913f removed the button. It is rebuilt and tested on branch `claude/restore-data-export` (12c9075). Either merge it, or change the policy text as in `launch-pages-draft.md` §4.1 and §4.6. PDPA and GDPR give people a right to a copy either way; email works if the button stays out.
2. **Legal pages.** Review the drafts with a lawyer, fill the `[OWNER]` slots and publish them in Studio:
   - Community Guidelines, Reporting and appeals, Your data.
   - Privacy and Cookies edits: name the email provider, Redis host and regions; add the `theme` storage key; correct the anonymous-ballot timing (a daily job, not instant).
   - The sign-up "13 or older" line.
   - Decide whether the Chinese versions get their own pages.

   Then add the new pages to the about site's footer (`SiteChrome.tsx`).
3. **Homepage copy.** Check the claims against the product before launch, for example "everyone who voted gets a notification". The page is code, not Sanity, so editors can't change it in Studio.
4. **Resources page.** The empty 2023 `resources` page will appear in the about site's new sitemap if it is still published. Unpublish it.

### Production settings (from the API code; production env not visible)

- **`OTP_TEST_CODE`** must be unset in production. If set, anyone can sign up unlimited `@vomatt.test` accounts with the known code, which breaks one person, one vote.
- **`CLIENT_IP_SECRET`** must match on web and API. Without it every user shares the server's IP, so the sign-in rate limit is site-wide and three wrong codes can lock someone's email for everyone.
- **`PROFILES_ACTIVE=prod`** on the API. It defaults to `dev`, which with mail off writes sign-in codes to the logs instead of sending them.
- **Mail.** It defaults to `smtp.gmail.com`, whose daily cap would stop sign-in codes at launch volume. Use a transactional provider (Resend is supported via `EMAIL_PROVIDER`).
- **`SITE_URL`** unset makes every page 500 on both sites.
- **Next security upgrade.** `next dev` printed an advisory suggesting `next upgrade --agent=security`. Not run; check it before launch.

## Not fixed, should follow soon

Web, ranked:

1. Actions that call `revalidateTag(tag, { expire: 0 })` re-render the current route despite comments saying they don't. Saving a new username can flash "This profile doesn't exist", Follow throws away loaded pages, and deleting a poll flashes not-found. This needs a decision per action (redirect inside the action, or `'max'`).
2. A notification for a comment outside the newest 20 opens the poll but doesn't scroll to or highlight it (`CommentThread.tsx` never loads more).
3. The unread badge doesn't come back after signing out and in again in the same tab.
4. Poll drafts live in localStorage under one key, invitee emails included, and survive sign-out and account deletion. On a shared computer the next person sees them.
5. No error monitoring (Sentry or `instrumentation.ts`) and no Content-Security-Policy on either site.
6. No site-wide meta description; profiles have no Open Graph; no `loading.tsx` for Explore and Settings.
7. At 768px (iPad portrait) controls drop to desktop sizes below 44px. Consider `pointer: coarse` sizing.
8. The "Replying to @x" pill is 22px tall; a bigger hit area needs a layout change.
9. Remaining copy and dead code from the 2026-10-28 list.

About site:

- No dark mode wiring.
- The Privacy page is 8000px tall on a phone, with no table of contents.

## Checked and fine

- Auth cookies are httpOnly, Secure in production, SameSite=Lax.
- Server Actions keep Next's Origin check.
- Open redirects are blocked.
- Comments and mentions render as text.
- No image SSRF.
- Sign-in doesn't reveal whether an email has an account.
- OTP attempts are limited.
- Sealed counts don't leak before close.
- No analytics runs before consent; the consent cookie is shared across both domains.
- A first visit from a zh-TW browser renders in Chinese, checked locally and on production. An audit claim that it didn't was tested and is wrong.
- Neither site scrolls sideways at 320 or 375 on any page checked.
