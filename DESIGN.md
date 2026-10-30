# Design

How the vomatt UI is built. `PRODUCT.md` says why (users, brand, principles, accessibility); this file says how. The code is the source of truth for values: tokens live in `src/styles/global.css`, primitives in `src/components/ui/`. When this file and the code disagree, fix one of them.

## Color

Cool canvas, navy ink actions, two signals: Volt (`highlight`) marks what is yours, Tide marks what vomatt promises. The navy ink gives the lime a complementary hue, so the pairing reads as deliberate rather than loud; full-size ink-on-Volt appears once per screen, on the create action. Use the semantic tokens as Tailwind classes, never raw `oklch()`/hex values. Every token has a dark value in `.dark`, and the theme defaults to light. Night keeps Daylight's cool neutral (surfaces at chroma 0.012, never a navy canvas): cards lift by surface, lines stay one step quieter than in light, text is off-white, and Volt and Tide lose a little lightness so they sit in the picture instead of on it. The theme defaults to light: the root layout mounts `ThemeProvider` (next-themes, `defaultTheme="light"`), which puts `.dark` on `<html>`. People switch Light, Dark or Auto (follows `prefers-color-scheme`) from the sidebar's More menu.

| Role | Token | Use for |
|---|---|---|
| Canvas | `background` | Page background |
| Surface | `card` | Cards, ballot rows, outline buttons, text fields |
| Soft surface | `surface-soft` | Folded settings, empty states, read notification rows |
| Field | `field` | Icon discs, segmented tracks and other recessed fills (text fields are `card`) |
| Ink | `foreground`, `primary` | Text and the primary action (same ink) |
| Quiet text | `muted-foreground` | Meta, hints, secondary copy |
| Lines | `border`, `border-strong` | `border` for cards, rows and dividers; `border-strong` for outline buttons and pills at rest (hover fills them, the line stays) |
| Controls | `input` | Text field borders, checkbox marks and switch tracks: the 3:1 boundary a control needs at rest |
| Highlight (Volt) | `highlight`, `highlight-foreground`, `highlight-tint` | The create action (`Button variant="create"`: a Volt icon on ink in light, a Volt button in dark), the viewer's choice on a ballot (`highlight-tint` behind the chosen row, chosen or cast, and the `BallotMark`'s dot), the poll card's Voted pill, `YourVotePill` on results, the Seal's check, the You chip, selected text (`::selection`). Text on it is always `highlight-foreground` ink. Never decoration, never a notification |
| Alert | `alert`, `alert-foreground` | The unread count and `UnreadDot`: something asking to be looked at. White on red, so it reads as a notification. Never a button, a status or an error |
| Tide | `tide`, `tide-tint`, `tide-line`, `tide-foreground` | The promise: the Seal after voting (`tide-tint` surface, `tide` ring, a Volt check, and Withdraw vote as a Tide-ink ghost button inside it), the ballot's lock line beside Vote, the rules ("How vomatt counts" in the sidebar, the poll page's About rules, the creator's rules summary), the voting-window bar (`Progress variant="tide"`). Never links, headers or hovers |
| Poll status | `status-scheduled/open/closing/ended`, `status-open-ends` | Status chip tints, always with a text label. Closing is peach, the `avatar-peach` hue. On a poll card an Open or closing poll's chip is pink `status-open-ends` with no mark ("Ends Fri 18:00") |
| Elected | `elected` | The red stamp on a winning result (a graphic with an accessible name, never text or a button) |
| Error | `destructive` | Validation and destructive actions |
| Focus | `ring` | Keyboard focus only (`outline-ring`, full strength, never `/50`): a blue no other state uses, so a focused control never reads as chosen (ink line) or yours (Volt). Selection in a picker (the avatar grid) is an ink ring with an ink check badge, not a Volt halo, which is 1.1:1 on white |

`sidebar` is one step deeper than the canvas, divided by a 1px `sidebar-border`; the other `sidebar-*` tokens alias the base tokens, so change the base, not the alias.

## Type

- **Geist** (`font-sans`) for everything, with PingFang TC / Microsoft JhengHei / Noto Sans TC fallbacks for Traditional Chinese. **Geist Mono** (`font-mono`, `tabular-nums`) for counts, times and handles.
- Every title is weight 500: confident, not shouting.
- Wrapping is set once in `global.css`: `h1`–`h4` balance their lines and `p`, `li`, `dd`, `blockquote` keep a lone word off the last line (`text-wrap-style`, so `truncate` and `whitespace-nowrap` still win). A title that isn't a heading element takes `text-balance`.
- **Display**: the `display-heading` utility sets weight 500, leading 1.25 and -0.03em tracking; the size goes beside it.
  - Page titles (Explore, Notifications, Settings): the `page-title` utility, 28px at every width with leading 1.3
  - CMS page titles: `display-heading text-[30px] md:text-[40px]`
  - Auth titles: 30px, leading 1.2, -0.02em (every auth step; in the auth dialog the step's title is the dialog's own 21px title)
  - Person names: `display-heading text-[26px] md:text-[30px]` on a profile; `text-2xl` elsewhere
  - CMS body 17px, leading 1.6, section headings 24px; coming soon headline 48px, leading 1.1
- **Poll title** (card and preview): the `poll-title` utility (22px, weight 500, leading 1.2, -0.02em, balanced lines); cards add `md:text-[25px]`.
- **Item title** (list rows): the `item-title` utility (16px, weight 500, -0.01em); leading goes beside it. Rail card titles are 15px (`PollSideCard`).
- **Body** `text-[14px]` (card descriptions `text-base`; ballot and result options 16px, weight 500); **meta** `text-[12px]` in rows, `text-[14px]` on a poll card (author line, footer, the ballot's Tide lines, the results caption), `text-[13px]` in the rail; **chip** `text-[11px]` uppercase semibold, `.06em` tracking (`chipClassName`), 10px on a poll card.
- Sidebar and More rows 14px, their group labels and segments 12px. The policy line under log in is 12px (`text-xs` is 11px here).
- **Tab labels** (`TabsList variant="line"`) 15px. **Dialog titles** (`DialogTitle`, `AlertDialogTitle`) 21px, weight 500, -0.02em.
- Inputs are `text-[16px]` on phones so iOS doesn't zoom (`text-base` is 15px).

## Shape and layout

- Borders stay quiet: 1px, `border` by default. Fields are white `card` with an `input` border (the border carries the 3:1 contrast at rest), 10px radius, 15px text from `md`; the six code slots are 48x56 from `md`, mono 22px, and a wrong code stays in them. Only the chosen ballot row and the viewer's own result row get an ink border.
- Radius: `rounded-2xl` (16px) for cards and panels (`PollCard`, side cards, the About panel, settings panels); `rounded-xl` (12px) for ballot rows, list rows and the Tide surfaces inside a card; `--radius` (10px) for buttons, set once in `Button`, and for text fields; `rounded-full` for chips, pills and avatars.
- Every page sits in `PageShell` (`components/layout/PageShell`), 32px from the top and 64px from the bottom: a main column up to 680px (`max-w-main`) and, from `xl`, a 300px rail (`w-rail`) 40px to its right, in a 1020px frame (`max-w-page`) centered in the content area. The rail column is kept when a page has no rail or it is still loading, so the main column starts at the same x on every page and in every skeleton; a page's skeleton renders inside the same `PageShell`. Below `xl` the rail follows the main column. Rails: Home and Following `HomeRail` ("Results are in", "Closing soon", "Got a question for everyone?" with Write one for signed-in viewers; "How vomatt counts" for guests); a poll's About this poll and More from @author; Profile's notes (and the owner's public preview); Notifications' aside (none when empty); Settings' sticky On this page list (from `xl` only, since the rail column starts there). Explore, Language preferences, CMS pages and not-found pages have none. Explore is `PageShell wide`: no rail column, so from `xl` its main column takes the whole 1020px frame and still starts at the same x.
- The home feed column is `max-w-feed` (640px, `--container-feed`) inside the main column, its cards 16px apart (`gap-4`), 16px from the top. Explore lists its results as `PollTile`s in a `PollTileGrid` instead. Below `xl` the owner's profile flips between You and Everyone with a `SegmentedControl`. Guests get `LoginPrompt` at the top of the feed, at every width.
- Desktop gets the collapsible `AppSidebar` (248px; nav rows 40px, the current one a `card` with a `border` line); mobile gets the fixed `TabBar` (64px plus the safe-area inset). Phones also get a fixed logo `Header` (56px) that slides up while scrolling down, returns on scroll up and is back on every new page; it eases over 400ms (`ease-header`). Bars that stick under it and slide with it are a `StickyBar` (Explore's search and filters, Home's topics, `BackLink`, Language preferences' title row; a page's own line tabs pass `sticky` to `TabsList`): a solid `background` that runs 20px past the bar's sides and fades into what scrolls under it once stuck. No translucent or blurred bars. The TabBar's profile tab shows the signed-in person's avatar. All three hide on `/login`. There is one create action, `Button variant="create"`: the sidebar's button and the TabBar's center square.
- The poll creator is full screen on phones and from `sm` up a 640px dialog, `rounded-[20px]` on the canvas color, with a visible subtitle, a 44px close button and two white `rounded-2xl` sections (Timing & privacy always open). Each choice in it is a fieldset of toggle pills with the chosen option's meaning on a line under them.
- The auth dialog is 420px, padding 28, 120px from the top from `md`, and carries the policy line.
- Touch targets are at least 44px (`h-11`) on phones. From `md` up `Button` takes its size's height: `default` stays 44 (15px label), `md` 40 (14px; settings and dialog footers, Show more), `sm` 36 (14px; header actions), `xs` 32 (13px; actions inside a row), `icon-sm` 36, `icon-xs` a 32px circle (a row's •••). Pick the size; never set `h-*`. `Switch` is a 44x26 track whose hit area is 44px tall.
- Every avatar is drawn in the `avatar-frame` utility: a 32px circle (a size goes beside it) with a 1px `border` line, so it sits on any surface. The avatar components carry it; no call site adds or removes the line.

## Building blocks

Use these. Don't copy their classes into a new element.

| Need | Use |
|---|---|
| Any button or link styled as one | `Button`, or `buttonVariants()` on a `Link` |
| Toggle pill or preset | `<Button size="sm" variant={active ? 'default' : 'outline'} aria-pressed={active}>`, add `rounded-full` for pills. Home's topics are the same pill on a `Link` (`buttonVariants`, `aria-current`) |
| Text field | `Input`, `Textarea` (these already carry the focus outline); fixed text inside the field before the value (the username's "@") is `Input leading` |
| Underlined tabs | `<TabsList variant="line">` + `TabsTrigger`, no className overrides; `fit` sizes them to their labels so a row can hold filters beside them (the row draws the line) |
| Filter pills over one list | `FilterPills` |
| One choice of a few in a settings row (Settings' Theme) | `SegmentedControl`: a radiogroup in a pill track, the checked segment a `card` with a small shadow; `value` stays undefined until it is known, so nothing is checked. MoreMenu keeps its own Volt menu segments |
| Follow a person | `FollowButton follow={useFollow(…)}`: one derived state, follow (ink, plus), followBack (ink, no icon), following (outline, Unfollow on hover), blocked, or none on your own entry. `size="sm"` (36px) in a profile header, `xs` (32px) on the hover card, in follower rows (meta "@jtan · follows you") and notification rows |
| A person's follow counts | "128 followers · 42 following", mono numbers, shown to everyone and buttons that open the list when signed in |
| People the viewer follows who follow this person | `MutualFollowersLine` ("Followed by @a and 2 others you follow", 12px with two stacked 16px avatars) under a visitor profile's details and on the hover card, opening the mutuals list; `MutualFollowersCard` ("Followers you know") in the visitor profile's rail |
| A row's ••• menu | Base UI `Menu` with `Button variant="ghost" size="icon-xs"` as the trigger and `menuPopupClassName` / `menuItemClassName` from `components/ui/menu.ts` (ink 16px icons; a destructive item adds `text-destructive`) |
| Back to the parent page | `BackLink` ("‹ Back": a quiet 14px link with a 44px hit area that takes no extra space, sticking under the phone Header as the page scrolls). Visitor profiles and Settings have none |
| People a user blocked (Settings) | `UserRelationPanel`, a row inside a settings card: the title with a mono count, then soft tiles of a 28px avatar, the @handle and an `xs` action. Who you follow lives on your profile (the following count opens the list, each row with its `FollowButton`), not in Settings |
| A detail only the owner sees | `OnlyYouMarker` (the lock) beside it |
| Rows on a profile | `AskedRow`, `VotedRow` and `ProfileSection` from `features/profiles/ProfileRows` |
| Status of a poll | `StatusChip` with `derivePollStatus(poll)` (tint, an ink dot or a clock while closing, words). Pick `time`: `inline` where the chip stands alone, on cards and the creator's review ("Ends Fri 20:00"); `elsewhere` in a row, which puts `pollTiming(…).when` in its meta ("1,284 voted · ends Fri 20:00" beside "Open") |
| Any date a poll surface shows | `useViewerClock()` (null until hydrated) + `pollTiming()` from `features/polls/timing`, or `formatPollDay` / `formatPollMoment` / `formatDuration` / `formatAge` from `features/polls/format`. Not `Date.now()` or `new Date()` in a component |
| Other small pill (e.g. ballot outcome) | `chipClassName` from `features/polls/chip.ts` + a `bg-*` tint |
| Empty or missing page (no polls, not found, 404, error) | `EmptyCard`: a centered card with a 56px icon disc on `field` (circle-minus unless given another), a 21px title, one 15px line, an optional action; `headingLevel={1}` on a page with no other title |
| Empty list inside a panel or dialog | the `empty-state` utility (dashed `surface-soft` box) |
| Unread marker | `UnreadDot` with an `aria-label`, right after the name of what is unread: a tab's label, a list row's title (which goes `font-semibold`, with `NewMark` in its meta), a notification's first line (the row is already a card, so no bold title and no "new"), the top-trailing corner of an icon. Never a leading gutter and never the row's far edge: titles keep one left edge and chips one column whether a row is read or not |
| A rule or promise (Tide) | `TidePanel` for a surface, `TideRules` + `TideRule icon={…}` for a list of rules |
| A ballot option's mark | `BallotMark state`: `rest` (a 2px `input` ring) or `selected` (ink fill with an 8px Volt dot), 22px. The chosen row, cast or not, takes the Volt tint and an ink line |
| The viewer has voted (card header) | `VotedPill` (Volt, check) beside the status chip |
| The viewer's option on results | `YourVotePill` ("your vote", lower-case, Volt with an ink line) |
| The cast Ballot | `Seal` (in full once per cast, then a row) with `SealMark`: `sm` 32px on profile rows and notifications, `md` 40px dashed in the Seal row, `lg` 72px with a 58px dashed ring in the full Seal. "Sealed. Thank you.", when results open, and Withdraw vote / Update vote inside it. Updating and the withdraw confirm are modes of the Ballot (`SealedMode`), not extra flags |
| A poll card's footer | `PollFooter` with `audience` and `isPage`: the turnout in muted mono, then a non-Public audience ("18 voted · invite only"); Comments leads to `#discussion` |
| A poll's discussion | `CommentThread` in its own `rounded-2xl` card (`PollDiscussion` on the poll page); composers show the viewer's avatar, a reply composer sits under the reply it answers |
| Side card of polls (home rail) | `PollSideCard` with a `kind`: `resultsIn` (unread titles 600, read 400, "**Yes** won · N voted · new" in sans) or `closingSoon` ("ends in 2h · 96 voted", mono) |
| Filter pills | `FilterPills`: 30px from `md`, 13px |
| A notification | one row component per `kind` (`features/notifications/NotificationRows`); consecutive follows group into one row with See followers |
| Progress (voting window) | `Progress variant="tide"` |
| List row for a poll | `PollListItem` with `meta` and `aside` |
| Polls to scan in a grid (Explore) | `PollTileGrid` of `PollTile`s: 1, 2 or 3 columns by the grid's own width (container queries); each tile links to the poll page and holds no ballot, so no counts while open |
| A person's counts | `ProfileRecord`: `rounded-2xl` `card` cells, a 26px `font-mono` number over a 12px label; `Count` for a count inside a phrase |
| Active nav link | `isActivePath(pathname, href)` from `lib/routes.ts` |

If a building block doesn't fit, change its variant or add one. Don't override it at the call site.

## Motion

Motion is feedback, not decoration: ballot selection (`BallotMotion`), results counting up, the auth error sliding in, skeleton shimmer. `MotionProvider` sets `reducedMotion="user"`; CSS animations need their own `prefers-reduced-motion` fallback. No pulsing, no confetti, no backdrop blur over scrolling content (a modal's scrim, which stops the page, may blur it).

## Don'ts

- No `!` overrides on shared components.
- No raw color values or new one-off tokens; add a semantic token in `global.css` if a role is missing.
- No status shown by color alone.
- No live vote counts while a poll is open (sealed ballots).
- No gradients, glows or glass (see Anti-references in `PRODUCT.md`).
