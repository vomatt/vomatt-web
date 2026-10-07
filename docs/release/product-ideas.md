# Product ideas: making Vomatt a place people come back to

Vomatt's distinctive promise is the **sealed ballot**: nobody sees the count until the poll ends,
so people vote what they think, not what's winning. The ideas below lean into that, grouped by
what they do for the platform. Effort: S (days), M (1–2 weeks), L (more).

## 1. Make the reveal an event

- **Reveal moment** (M) — when a poll ends, voters get a notification and open a short animated
  reveal: options shuffle, bars race, the winner lands. Shareable as an image card.
- **Predict the winner** (S) — after voting, optionally guess which option will win. At reveal,
  show "You predicted it" and track a prediction score. Separates *what I want* from *what I
  think the crowd wants*; very sticky.
- **Countdown on the feed** (S) — polls ending in the next hour float up with a live countdown.
- **"Results in" inbox** (S) — the account's "Your votes" tab gets a badge when anything you voted
  on is decided (the data is already there).

## 2. Trust in the result

- **Verified humans only** (M) — optional phone/OAuth verification for a poll; show a
  "verified voters" mark. The API already supports phone OTP, Google, LINE and Apple sign-in.
- **Ballot receipt** (M) — after voting, show a receipt hash; after the reveal, voters can check
  their ballot was counted as cast without exposing who voted what.
- **Bot and brigading signals** (M) — owner sees turnout over time and an "unusual spike" flag;
  the API's rate limiter and audit log already record what's needed.
- **Report and moderation queue** (M) — report poll/comment, moderator role (exists in the API),
  auto-hide after N reports.

## 3. Better questions

- **Poll types** (L) — ranked choice, approve-many, 1–5 scale, "this or that" image polls.
  Ranked choice pairs especially well with sealed results.
- **Templates** (S) — "Where should we eat?", "Pick a date", "Rate the talk" — prefilled creator.
- **Option suggestions** (M) — voters propose an option before the poll opens; owner accepts.
- **AI assist in the creator** (M) — flag leading or loaded wording, suggest missing options,
  translate the poll between English and Traditional Chinese.

## 4. Groups and private polls

- **Link-only and invite-only polls** (M) — share to a group chat; only people with the link vote.
  Most real-world voting (teams, clubs, families) is here, not on a public feed.
- **Spaces** (L) — a club, class or company with members, its own feed and its own moderators.
- **LINE / Slack / Discord sharing cards** (S) — rich previews with "Vote now" (needs backend #2).
  In Taiwan, LINE is the channel that matters most.

## 5. Reasons, not just numbers

- **Reason with your vote** (S) — one optional line when voting, shown grouped by option after the
  reveal ("Why people chose Saturday"). Comments already exist; this structures them.
- **Change-of-mind stat** (S) — after the reveal, show how many voters changed their ballot before
  close; it's a fun signal the discussion mattered.
- **Best argument** (S) — most-liked comment per option is pinned at the reveal.

## 6. Identity and habit

- **Badges and streaks** (S, started) — the account page now awards seven badges; add weekly
  streaks and a "civic pillar" profile flair.
- **Follow topics and people** (M) — topics feed into a personal "For you" tab.
- **Weekly digest email** (S) — "3 results are in, 2 polls you follow end tomorrow".

## 7. Growth and SEO

- **Public, indexable poll pages** with Open Graph images rendered from the poll (M; needs backend #2).
- **Embeds** (M) — `<iframe>` widget for blogs and news sites; votes count toward the same poll.
- **Trending page** (S) — most-voted in the last 24 hours, per topic.

## Suggested next three

1. Backend P0s, then **reveal notifications + reveal moment** — it completes the sealed-ballot loop
   the product already promises.
2. **Link-only polls with LINE sharing cards** — the fastest path to real usage.
3. **Predict the winner** — small to build, makes every reveal personal.
