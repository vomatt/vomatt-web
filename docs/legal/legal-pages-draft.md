# vomatt legal pages — draft

> Draft for the three Sanity `otherPages` documents. Replace every `[PLACEHOLDER]` and have a lawyer review before publishing (especially jurisdiction, age limit and GDPR/Taiwan PDPA wording).
> Facts below come from the codebase: email + one-time-code sign-in, profile (username, display name, bio, avatar), polls/ballots/comments, follows, notifications, per-poll voter visibility, sealed results while open, cookies `accessToken`/`refreshToken`/`preferred-language`, optional Google Analytics / Tag Manager (set in Sanity), hosting on Vercel, content in Sanity.

---

# Terms of Service

_Last updated: [DATE]_

These Terms govern your use of vomatt (the "Service"), operated by [COMPANY NAME] ("we", "us"). By using vomatt you agree to them. If you don't agree, please don't use the Service.

## 1. What vomatt is
vomatt is a public voting platform. Anyone can read public polls; signed-in members can create polls, vote, comment and follow other members.

## 2. Your account
- You sign in with your email address and a one-time code we send you. Keep access to that email secure: anyone who can read it can sign in as you.
- You must be at least [16] years old to create an account.
- Your username and profile are public. Choose a username that doesn't impersonate anyone or mislead others.
- You are responsible for activity on your account. Tell us at [CONTACT EMAIL] if you think someone else has access.

## 3. Voting
- One member, one vote per poll. Don't create extra accounts, use automation, or coordinate fake votes to change a result.
- While a poll is open, results are sealed: people see turnout but not the counts. Results are shown when the poll closes.
- Each poll's creator chooses who can see who voted. That setting is shown on the poll before you vote. Your choice of option is never shown to others unless the poll says so.

## 4. Your content
- You keep ownership of the polls, comments and profile content you post ("Your Content").
- You give us a worldwide, non-exclusive, royalty-free licence to host, display, and distribute Your Content to operate and promote the Service. This licence ends when you delete the content or your account, except where others have already interacted with it (for example, votes already cast on your poll) or we must keep it by law.
- You confirm you have the right to post Your Content.

## 5. Rules
Don't post or do anything that:
- is illegal, harassing, hateful, threatening, or sexually explicit;
- shares other people's personal information without permission;
- is spam, advertising, or misleading;
- infringes someone else's intellectual property;
- tries to break, overload, scrape, or get around the security of the Service.

We may remove content or suspend accounts that break these rules, with or without notice.

## 6. Results are not official
Polls on vomatt reflect the people who chose to take part. They are not scientific surveys, official elections, or binding decisions, and we don't guarantee their accuracy.

## 7. Ending your account
You can delete your account at any time in Account settings. We may suspend or end access if you break these Terms or if we stop the Service.

## 8. Disclaimers and liability
The Service is provided "as is". To the extent the law allows, we aren't liable for indirect or consequential losses, or for content posted by members. Nothing in these Terms limits rights you have under consumer law that can't be excluded.

## 9. Changes
We may update these Terms. If a change is significant, we'll tell you on the site or by email before it takes effect. Continuing to use vomatt means you accept the new Terms.

## 10. Law
These Terms are governed by the laws of [JURISDICTION]. Disputes go to the courts of [VENUE], unless your local law says otherwise.

## 11. Contact
[COMPANY NAME], [ADDRESS] — [CONTACT EMAIL]

---

# Privacy Policy

_Last updated: [DATE]_

This policy explains what personal data vomatt collects, why, and the choices you have. [COMPANY NAME] is the data controller.

## 1. What we collect
**You give us**
- **Email address** — to sign you in with a one-time code and to contact you about your account.
- **Profile** — username, display name, bio and optional avatar. These are public.
- **Activity** — polls you create, votes you cast, comments you write, and members you follow.

**Collected automatically**
- **Sign-in cookies** that keep you signed in (see the Cookies Policy).
- **Language preference**, detected from your browser and stored in a cookie.
- **Technical data** such as IP address, browser type and request logs, kept by our hosting provider for security and troubleshooting.
- **Usage analytics**, if enabled: pages visited and general device information, through Google Analytics.

## 2. How we use it
- Run your account and the Service (sign-in, polls, votes, comments, notifications).
- Keep the platform fair and safe: one vote per member, preventing abuse and fake accounts.
- Understand how vomatt is used and improve it.
- Meet legal obligations.

Legal bases (where GDPR applies): performing our contract with you; our legitimate interests in security and improving the Service; your consent for analytics; and legal obligations.

## 3. What others can see
- Your username, display name, bio, avatar, public polls and comments.
- **Votes:** the poll creator chooses whether voters are visible to everyone, to limited people, or to nobody. You see this before voting. Counts are hidden until the poll closes.
- People you follow and who follow you, as shown on profiles.

## 4. Who we share it with
We don't sell your personal data. We share it only with providers who help run vomatt, under contract:
- **Vercel** — website hosting.
- **[API / DATABASE HOST]** — application data storage.
- **Email delivery provider [NAME]** — sending sign-in codes.
- **Sanity** — site content (no member data).
- **Google** — analytics, if enabled.

We may also disclose data if the law requires it or to protect people's safety.

Some providers process data outside your country (for example in the United States). Where required, we use safeguards such as Standard Contractual Clauses.

## 5. How long we keep it
- Account and profile data: until you delete your account.
- Votes and comments: until you delete them or your account. Vote totals on closed polls stay, without your identity.
- Sign-in sessions: up to 30 days of inactivity.
- Server logs: [30] days.

## 6. Your rights
Depending on where you live (including under GDPR and Taiwan's Personal Data Protection Act), you can ask to access, correct, delete, or export your data, object to or restrict processing, and withdraw consent at any time. You can edit your profile and delete your account in Account settings, or email [PRIVACY EMAIL]. You can also complain to your local data protection authority.

## 7. Security
Sign-in tokens are stored in secure, httpOnly cookies and sent only over HTTPS. No system is perfectly secure, so please keep your email account safe.

## 8. Children
vomatt is not for children under [16]. If we learn a child has an account, we will delete it.

## 9. Changes
We'll post updates here and tell you about significant changes.

## 10. Contact
[COMPANY NAME], [ADDRESS] — [PRIVACY EMAIL]

---

# Cookies Policy

_Last updated: [DATE]_

Cookies are small text files a website stores in your browser. vomatt uses as few as possible.

## Strictly necessary
These make the Service work and can't be switched off.

| Cookie | Purpose | Duration |
|---|---|---|
| `accessToken` | Keeps you signed in | 1 hour |
| `refreshToken` | Renews your sign-in securely | 30 days |
| `preferred-language` | Remembers English or 繁體中文 | 1 year |

Both sign-in cookies are httpOnly (unreadable by page scripts) and are removed when you sign out.

## Analytics (only if enabled)
If we turn on Google Analytics, it sets cookies such as `_ga` and `_ga_*` (up to 2 years) to count visits and see which pages are used. This data is aggregated and not used to identify you. [Where required, we ask for your consent first.]

## Managing cookies
You can block or delete cookies in your browser settings. If you block the necessary cookies you won't be able to sign in. To opt out of Google Analytics everywhere, use Google's browser add-on: https://tools.google.com/dlpage/gaoptout

## Contact
Questions: [CONTACT EMAIL]
