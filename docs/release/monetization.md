# Monetization: charging for trusted votes

The best way to make money is to charge groups that need a result people will trust: buildings,
clubs, schools, small companies and events. The public app stays free as the way people find
vomatt.

## What we can sell

Sealed ballots are what make vomatt different. People get a result they believe, not a social
poll built for engagement. Public voters won't pay for that, but a group making a real decision
will. Much of what that group would pay for already exists in the API:

| Already built | What a group would pay for |
|---|---|
| Invitees and invite lists (`/invite-lists`, `/votes/{id}/invitees`) | Private polls for members only, bigger invite lists, saved member rosters |
| Phone OTP, LINE, Apple, Google and passkey sign-in | Polls only verified people can vote in, with a "verified voters" mark |
| `/votes/{id}/voters`, `/results`, `/users/me/export`, account insights | A results report: turnout, a PDF or CSV export, an audit trail to show the committee |
| `deactivate`, the moderator role, reports | Admin controls for the people running the vote |

## Ways to charge, ranked

1. **Per-poll pass (start here).** Most groups vote now and then, not every week, so a monthly
   subscription is a poor fit. Charge about NT$150–600 per poll to unlock verified voters, more
   invitees, the group's own logo, a scheduled reveal and an exported report. People can pay on
   the spot when they need it.
2. **"Spaces" plan for organizations** (see `product-ideas.md`). Charge about NT$500–2,000 a
   month for an organization's own feed, members, moderators, history and reports. Building
   committees (管委會), clubs, schools, NGOs and HR teams for internal pulse votes fit this well.
3. **Paid embeds and polls for publishers.** News sites and creators embed a sealed poll and see
   a reader-sentiment dashboard. They pay for the embed or the dashboard, not for ads.
4. **Ballot receipts, ranked choice and approval voting as paid extras.** These are the features
   that make a vote credible. Wait until the first two prove people will pay.

## What not to do

Each of these breaks a promise in `PRODUCT.md`:

- **Ads or paying to boost a poll in the feed.** This breaks "equal weight for everyone" and
  pulls the product toward engagement. Ad revenue in Taiwan is also small at our scale.
- **Selling vote data, even "anonymized" data.** This destroys trust in sealed ballots, and
  Taiwan's personal data law (個資法) makes it a legal risk.
- **Charging voters.** Voting has to stay free and take seconds, or turnout falls and paying
  creators lose what they paid for.

## How to test it cheaply before building payments

1. Pick one group of customers. Building committees and clubs that organize on LINE are the most
   natural fit for a Taiwan-first product.
2. Talk to 10 of them. Find out how they vote now (LINE polls, Google Forms, a show of hands) and
   what goes wrong with it.
3. Sell "Pro" polls by hand: take payment through an ECPay or TapPay link and turn on the
   features with an admin flag. Only build checkout and plan rules into vomatt-api once about 5
   groups have paid.
4. One legal check: votes under Taiwan's apartment-building law (公寓大廈管理條例) follow formal
   rules. Call vomatt "advisory or pre-meeting polling" unless a lawyer confirms it can count as
   the official vote.

## Open decision

Which group of customers to start with. That choice decides which features go into the first
pass and who the 10 interviews are with.
