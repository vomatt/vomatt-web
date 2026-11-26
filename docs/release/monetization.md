# Monetization

Updated 2026-11-25. Replaces the earlier note, which only covered charging groups for trusted
votes. Legal text that goes with this plan is in `docs/legal/monetization-pages-draft.md`.

Nothing here is legal advice. A Taiwan lawyer has to check the paid terms and the Insights
product before either goes live.

## Summary

1. **Pro for people who run polls** is the main product. Voters will not pay; the person or group
   that needs a result people trust will.
2. **Do not sell user data, even with names removed.** It is not anonymous in law, it breaks what
   the published Privacy Policy promises, and it can be a crime in Taiwan. Sell **Insights**
   instead: statistics about groups, from members who opted in. Section 3 has the rules.
3. Five smaller revenue lines are in section 4.

## 1. What already exists

| In vomatt-api today | Free | Pro |
|---|---|---|
| Community accounts a person can own | `communityQuota.limit` (1 in the examples) | more |
| Members per community account | 3 | 5 |
| Pro poll: only phone-verified voters, nobody sees who chose what | no | yes (an admin sets it) |
| Result report: age bands, gender, timeline, CSV, small groups merged (`minCellSize`) | no | yes |
| Billing | none: an admin sets the plan | none |

Two gaps: 3 versus 5 members is not a reason to pay, and there is no way to pay.

## 2. The Pro plan

Sell Pro as "run votes people trust", not as status. X sells reach and a badge; both break
"equal weight for everyone" in `PRODUCT.md`.

### What Pro should include

| Group | Feature | State |
|---|---|---|
| Trust | Verified-voter polls with a "verified voters" mark | built, admin-only |
| Trust | Ballot receipt: a voter can check their vote was counted | new |
| Results | Report with age, gender and timeline; CSV | built |
| Results | Report by city or county, PDF and share image, compare two polls | new |
| Results | Turnout alerts: unusual spike, low turnout a day before close | new |
| Polls | Ranked choice, approve-many, 1–5 scale | new |
| Polls | More options per poll, images on options, recurring polls, templates | new |
| Reach | Larger invite lists, more invitation emails a day, saved rosters | limits exist |
| Reach | One reminder to invited people who have not voted | new |
| Reach | QR code and printable poster for meetings and events | new |
| Groups | More community accounts (suggest 1 → 5) | built |
| Groups | More members per community (suggest 3 → 25; 5 is too low to sell) | built, change the config |
| Groups | Community logo on its polls, embed without vomatt branding | new |
| Comfort | Drafts synced across devices (today they stay in one browser) | new |

Ship the built rows first. Pro is worth paying for on day one with: verified polls, the report,
5 communities and 25 members.

### What Pro must never include

- A boost in the feed or search.
- Seeing counts before a poll ends, or seeing who voted for what. This is the sealed ballot.
- Extra votes or weighted votes.
- A badge shown next to the name in feeds and comments. A quiet "Pro" line on the person's own
  profile is fine.
- Editing a poll's audience or visibility after it opens.

### Plans and prices

Prices are first guesses to test, not research.

| Plan | For | Price to test |
|---|---|---|
| Free | Everyone. Voting is always free | NT$0 |
| Pro | One person who runs polls | NT$150 a month or NT$1,500 a year |
| Community | A club, building committee, school, company: more seats, roles, branding | NT$600–1,500 a month |
| Poll pass | One verified poll with a report, no subscription | NT$150–600 per poll |

Keep the poll pass. Most groups vote a few times a year, so a subscription alone loses them.

### Before taking money

- **A legal entity.** The Terms say "the vomatt team". Selling needs a registered company or
  business, business tax and e-invoices (電子發票).
- **A payment provider.** ECPay, TapPay or NewebPay for Taiwan cards and LINE Pay. Check whether
  Stripe accepts a Taiwan business before planning on it.
- **The iOS app.** Apple requires in-app purchase for a subscription sold inside the app and
  takes 15–30%. Either sell on the web only and keep the app silent about price, or add in-app
  purchase and price for the fee.
- **Refund rule.** Taiwan's Consumer Protection Act gives 7 days to cancel a distance sale. An
  online service can be exempt once it has started with the buyer's agreement, but only if the
  checkout says so. Simplest: refund in full on request within 7 days.

## 3. Selling data: what is allowed

### Why "no names" is not enough

- **It is still personal data.** Taiwan's PDPA covers data that identifies someone directly or
  indirectly. A row with birthday, gender, city and a list of votes points to one person even
  without a name. Removing names is pseudonymization, not anonymization. The GDPR treats it the
  same way.
- **It needs consent.** Members gave their data to vote and run polls. Using it for a new purpose
  needs their consent (PDPA Art. 20). Doing it for profit without consent can be a crime, not
  only a fine (PDPA Art. 41).
- **We promised not to.** The published Privacy Policy says "We don't sell your personal data".
  Data collected under that promise cannot be repurposed by editing the page.
- **Votes are sensitive.** Under the GDPR, opinions on politics, religion, health or sexuality
  are special-category data and need explicit consent. Taiwan's list (PDPA Art. 6) is narrower,
  but a leak of who thinks what would still end the product.
- **Trust is the product.** vomatt's one promise is the sealed ballot. "They sell your votes" is
  a headline the product does not survive.

### What can be sold: Insights

Statistics about groups, never about people. For example: "62% of members aged 30–39 in Taipei
chose option A, from 1,840 votes."

The bottom line, replacing "we don't reveal names":

1. **Statistics only.** No rows, no user ids, no hashed ids, no per-person export. Ever.
2. **Opt-in.** A setting, off by default: "Include my age group, gender and city in anonymous
   statistics." Not bundled with sign-up. Can be turned off at any time.
3. **Minimum group size.** No number is shown for a group under 30 people; small groups are
   merged (the report already does this with `minCellSize`). Never slice by more than two traits
   at once.
4. **Coarse traits.** Age band, not birthday. City or county, not free text. Location is free
   text today and would need a list to pick from.
5. **Public polls only.** Never unlisted, invite-only or community polls.
6. **Adults only.** Under-18s are left out.
7. **Anonymous votes stay out** unless the member opted in, and the count is taken before the
   link to the option is deleted.
8. **Buyer contract.** No attempt to identify anyone, no joining with other data, no resale.
9. **Say it in public.** The Privacy Policy explains Insights, and a page lists who buys them.
10. **Taiwan first.** Leave out members in the EU, EEA and UK until a lawyer has cleared the GDPR
    side.

Also ask the lawyer about Taiwan's election law: publishing poll results on an election is banned
from 10 days before voting day (公職人員選舉罷免法 Art. 53). That may touch public polls and any
Insights about candidates.

### Three ways to sell Insights

1. **Commissioned polls.** An organization pays to ask a question. The poll is labelled
   "Commissioned by X", runs like any other poll, and the buyer gets the report. No ranking boost.
   This is the cleanest product: the buyer gets data from a poll made for the purpose.
2. **Topic reports.** A quarterly report on a theme (housing, transport, work) built from public
   polls. Sold or sponsored.
3. **Dashboard subscription.** Later, when there is enough volume: trends by topic and group over
   time.

Honest limit: vomatt voters choose to take part, so results are not a scientific sample. Buyers
of market research will ask. Say so, as the Terms already do, and price accordingly.

## 4. Other ways to earn

| Idea | What it is | Fit |
|---|---|---|
| Event pass | Live vote at an AGM, conference or class: QR code, big-screen reveal, report | Strong. One-off, easy to explain |
| Publisher embeds | News sites embed a sealed poll and get a reader report | Strong, needs embeds built |
| Results API | License already-public results of ended public polls to media and researchers | Low risk: the data is public |
| Annual report sponsor | "What Taiwan voted on in 2027", sponsored | Brand value, small money |
| Supporter tier and grants | Voluntary NT$60 a month; civic-tech grants | Small, but costs nothing in trust |
| White label | A school or company runs vomatt under its own name | Later; high support cost |

Still no: ads, paid boosts, charging voters, paying people to vote.

## 5. Order of work

1. Decide the entity and the payment provider.
2. Sell Pro by hand to 5 groups: payment link, admin sets the plan. Learn what they use.
3. Raise the member limit, then build checkout and the upgrade page.
4. Add the opt-in setting for Insights. It takes months to fill, so start early.
5. Sell one commissioned poll by hand before building anything for Insights.

## Open decisions

- Insights: go ahead on the rules above, or not at all?
- Sell on the web only, or also inside the iOS app?
- Refund rule: 7 days on request (suggested), or no refund once Pro is used?
- Which group to sell to first: building committees, clubs, schools or small companies?
