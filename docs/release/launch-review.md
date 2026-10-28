# Launch review (2026-10-28)

What a pre-launch pass over vomatt-web and its Sanity content found, what was fixed, and what still needs someone to act. Companion to [release-checklist.md](release-checklist.md).

## Needs you before launch

### Legal pages: fill the placeholders

The Terms, Privacy and Cookies pages are published in Sanity but still show bracketed placeholders. Only you (or a lawyer) can fill these:

| Placeholder | Pages | Notes |
|---|---|---|
| `[DATE]` | all three | "Last updated" date |
| `[COMPANY NAME]`, `[ADDRESS]` | Terms, Privacy | Operating entity; Privacy names it the data controller |
| `[CONTACT EMAIL]` | Terms, Cookies | A role address (e.g. support@), not a person's |
| `[PRIVACY EMAIL]` | Privacy | Can be the same as the contact email |
| `[16]` | Terms §2, Privacy §8 | Minimum age. Taiwan PDPA and GDPR differ; confirm |
| `[JURISDICTION]`, `[VENUE]` | Terms §10 | Governing law and courts |
| `[API / DATABASE HOST]` | Privacy §4 | Where vomatt-api and its database run |
| Email provider `[NAME]` | Privacy §4 | Who sends the sign-in codes |
| `[30]` days | Privacy §5 | Server log retention; confirm with the API host |

Have a lawyer review all three before or soon after launch, especially jurisdiction, age and GDPR/PDPA wording. The pages are English only; zh visitors see English legal text.

### Sanity content

- **About page** (`/about`) is published with only an "About" heading. A draft with real copy is waiting in Studio. Review and publish it.
- **Resources page** (`/resources`) is an empty page from 2023. It is public and in the sitemap. Unpublish or delete it in Studio.
- **Homepage** has an unpublished draft (`drafts.pHome`, edited 2026-10-14). Publish or discard it so it doesn't surprise anyone later.
- **Meta descriptions.** The homepage, About and sign-up pages have no "SEO + sharing → description". Search results and link previews show no summary for them. Add one to the Homepage at least.
- **Coming soon is already off** in Settings → General. If production is deployed, the site is already public.

### Decisions only you can make

- **Brand casing.** Copy uses both "Vomatt" (site title, login heading, tab titles) and "vomatt" (body copy, legal pages, the logo). Pick one. Changing the login heading also needs `src/__tests__` updates.
- **"Open" vs "Active"** for a running poll: Explore and profile filters say "Open", other places say "Active".
- **British spellings** (neighbourhood, armour, cancelled, licence). Fine if intended.

## Fixed in this pass

### Sanity (published)

- Cookies Policy: the access token lasts 15 minutes, not 1 hour. Added the cookies the app sets but the page omitted: `sidebar_state`, `session-unconfirmed`, `auth-key-mismatch`.
- Privacy Policy: added passkeys (public key, name, created and last-used dates), blocked members, and that the IP address is used to limit sign-in attempts.
- Terms, Privacy, Cookies: added meta descriptions.

### Code

- `robots.txt` and `sitemap.xml` now exist (`src/app/robots.ts`, `src/app/sitemap.ts`). Before, both 404'd. The sitemap lists `/`, `/explore` and the Sanity pages.
- Terms, Privacy and Cookies are linked from the sidebar footer for every visitor. Before, signed-out desktop visitors could reach them only through the sign-up text. Settings also links Cookies now.
- Shared links no longer all point at the homepage. The root layout set `og:url` to the site URL, which pages without their own Open Graph (profiles, Explore) inherited.
- A missing poll is `noindex`.
- iOS universal links no longer open `/following` and `/settings` in the app as profiles.
- Login and Notifications tab titles are localized. The login tab read "Login Vomatt".
- Copy:
  - zh: verification screen word order, "email" label, resend wording, 封存 (archived) → 密封 (sealed) for sealed ballots, "opened"/"opens" were both 開始, 用戶 → 使用者/人 (Taiwan usage), "picks that won" was translated as a rate.
  - en: "Press Return" → "Press Enter" (the code checks Enter), "sign in again" → "log in again", "home" → "Home", "{count} voted in" → "{count} polls voted in".
  - Home empty state: "Start the poll, lead the crowd." contradicted the no-herd-voting message. Now "No polls yet. Start the first one."

Checks: lint clean (0 errors), 1065 tests pass, `next build` succeeds. `next build` can fail locally on stale types in `.next/dev` from deleted routes; delete `.next/dev` if you see that. Vercel builds from scratch and isn't affected.

## Not fixed, should follow soon

Ranked by how much a visitor would notice.

1. **Mobile has no legal links** for signed-out visitors. The TabBar has no footer. They see the links only on the sign-up step. Add a legal row to the mobile menu or home rail.
2. **Root crash page** (`src/app/global-error.tsx`) is unstyled, English only, and doesn't log the error. It shows when the root layout throws, e.g. if `SITE_URL` is unset.
3. **No site-wide meta description.** The root layout doesn't set one, and `siteSharingQuery` doesn't fetch any. Pages without their own (Explore, profiles, Following) ship none.
4. **Profile links unfurl as the site.** Profiles set no Open Graph title or image.
5. **Missing poll returns 200**, not 404 (it is noindex now). A deleted poll shows "Vomatt" as its tab title.
6. **Account deletion has no confirmation.** `deleteAccount` redirects to `/?account_deleted=1`, which nothing reads.
7. **`/following` loses the redirect.** Signed-out visitors go to `/login` without `?redirect=`, so they land on `/` after signing in.
8. **Remaining hardcoded English:** `[slug]/not-found.tsx` title, `defineMetadata` "Page not found" fallback, screen-reader text in `ui/Sheet.tsx` ("Close") and `ui/Sidebar.tsx` ("Toggle Sidebar"), the "Coming soon" fallback heading.
9. **Remaining zh copy:** English API error messages left in `zh.json` (`apiError.*`: invalid token, expired session, sort on ended polls, pagination, client ID mismatch), 發佈 vs 發布, 重試 vs 再試一次, three names for the profile page, 預覽 for "Review", 「白無常，走得高」.
10. **Remaining en copy:** API errors call a poll a "Vote" and capitalize model names ("Vote not found", "Invite List"); Title Case outliers ("End Poll", "Invite Lists"); straight apostrophe in `passkey.addFailed`.
11. **No Content-Security-Policy** header. Other security headers are set.
12. **No `loading.tsx`** for `/explore` and `/settings`, which wait on all their data before first paint.
13. **Dead code:** `components/Newsletter.tsx` (posts to a missing Klaviyo route), `components/layout/Footer`, `app/api/user/language/route.ts` (unauthenticated stub), `hooks/useUserLanguage.ts`, `absoluteUrl` in `lib/utils.ts`, `lib/session.ts`, `app/client-utils.ts`. Unused locale keys: `profile.joinedAt`, `profile.totalVotes`, `account.turnout_one`, zh `verificationCode.invalidVerificationCode`.

## Checked and fine

- Open redirects: `getSafeRedirectPath` rejects cross-origin targets.
- `/api/revalidate` checks its secret in constant time and rejects calls when it is unset.
- No secrets in `NEXT_PUBLIC_*` variables.
- Feeds and notifications degrade gracefully when the API fails.
- Every internal link resolves to a real route.
- No TODO or FIXME left in `src`.
- No Simplified Chinese characters in `zh.json`.
