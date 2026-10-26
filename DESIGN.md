# Design

How the vomatt UI is built. `PRODUCT.md` says why (users, brand, principles, accessibility); this file says how. The code is the source of truth for values: tokens live in `src/styles/global.css`, primitives in `src/components/ui/`. When this file and the code disagree, fix one of them.

## Color

Cool canvas, navy ink actions, two signals: Volt (`highlight`) marks what is yours, Tide marks what vomatt promises. The navy ink gives the lime a complementary hue, so the pairing reads as deliberate rather than loud; full-size ink-on-Volt appears once per screen, on the create action. Use the semantic tokens as Tailwind classes, never raw `oklch()`/hex values. Every token has a dark value in `.dark`, and the theme defaults to light. Night keeps Daylight's cool neutral (surfaces at chroma 0.012, never a navy canvas): cards lift by surface, lines stay one step quieter than in light, text is off-white, and Volt and Tide lose a little lightness so they sit in the picture instead of on it. The theme defaults to light: the root layout mounts `ThemeProvider` (next-themes, `defaultTheme="light"`), which puts `.dark` on `<html>`. People switch Light, Dark or Auto (follows `prefers-color-scheme`) from the sidebar's More menu.

| Role | Token | Use for |
|---|---|---|
| Canvas | `background` | Page background |
| Surface | `card` | Cards, ballot rows, outline buttons, a focused field |
| Soft surface | `surface-soft` | Folded settings, empty states |
| Field | `field` | Fill of text fields at rest; it is what marks them as fields |
| Ink | `foreground`, `primary` | Text and the primary action (same ink) |
| Quiet text | `muted-foreground` | Meta, hints, secondary copy |
| Lines | `border`, `border-strong` | `border` for cards, rows and dividers; `border-strong` for outline buttons and pills at rest (hover fills them, the line stays) |
| Controls | `input` | Text field borders, checkbox marks and switch tracks: the 3:1 boundary a control needs at rest |
| Highlight (Volt) | `highlight`, `highlight-foreground`, `highlight-tint` | The create action (`Button variant="create"`: a Volt icon on ink in light, a Volt button in dark), the viewer's cast vote (`highlight-tint` behind its row, a Volt `BallotMark`, `YourVotePill`), the Seal's check, the You chip. Text on it is always `highlight-foreground` ink. Never decoration, never a notification |
| Alert | `alert`, `alert-foreground` | The unread count and `UnreadDot`: something asking to be looked at. White on red, so it reads as a notification. Never a button, a status or an error |
| Tide | `tide`, `tide-tint`, `tide-line`, `tide-foreground` | The promise: the Seal after voting (`tide-tint` surface, `tide` ring, a Volt check), the rules ("How vomatt counts" in the sidebar, the poll page's About rules, the creator's rules summary), the voting-window bar (`Progress variant="tide"`). Never links, buttons, headers or hovers |
| Poll status | `status-scheduled/open/closing/ended` | Status chip tints, always with a text label. Closing is peach, the `avatar-peach` hue |
| Error | `destructive` | Validation and destructive actions |

`sidebar` is one step deeper than the canvas, divided by a 1px `sidebar-border`; the other `sidebar-*` tokens alias the base tokens, so change the base, not the alias.

## Type

- **Geist** (`font-sans`) for everything, with PingFang TC / Microsoft JhengHei / Noto Sans TC fallbacks for Traditional Chinese. **Geist Mono** (`font-mono`, `tabular-nums`) for counts, times and handles.
- Every title is weight 500: confident, not shouting.
- **Display**: the `display-heading` utility sets weight 500, leading 1.25 and -0.03em tracking; the size goes beside it.
  - Page titles: `display-heading text-[30px] md:text-[40px]`
  - Auth titles: `display-heading text-[30px]`
  - Person names: `display-heading text-2xl`
- **Poll title** (card and preview): `text-[22px] font-medium leading-[1.2] tracking-[-0.02em]`; cards add `md:text-[26px]`.
- **Item title** (list rows): the `item-title` utility (16px, weight 500, -0.01em); leading goes beside it. Rail card titles are 15px (`PollSideCard`).
- **Body** `text-[14px]` (card descriptions `text-base`; ballot and result options 15px); **meta** `text-[12px]` in rows, `text-[13px]` on a poll card (author line, footer, the ballot's Tide lines, the results caption) and the rail; **chip** `text-[11px]` uppercase semibold, `.06em` tracking (`chipClassName`).
- **Tab labels** (`TabsList variant="line"`) 15px. **Dialog titles** (`DialogTitle`, `AlertDialogTitle`) 21px, weight 500, -0.02em.
- Inputs are `text-[16px]` on phones so iOS doesn't zoom (`text-base` is 15px).

## Shape and layout

- Borders stay quiet: 1px, `border` by default. Fields are `input` on a `field` fill (the border carries the 3:1 contrast at rest) and turn `card` white on focus. Only the selected ballot row and a winning result get an ink border.
- Radius: `rounded-2xl` (16px) for cards and panels (`PollCard`, side cards, the About panel, settings panels); `rounded-xl` (12px) for ballot rows, list rows, inputs and the Tide surfaces inside a card; `--radius` (10px) for buttons, set once in `Button`; `rounded-full` for chips, pills and avatars.
- Page container: `px-contain mx-auto max-w-2xl py-6` for lists (Explore); `max-w-5xl` for a poll page. Profile and Notifications put a 720 / 680px main column beside a 280px rail from `xl` (`max-w-[1080px]` / `max-w-[1000px]`); Settings is a 680px column with an On this page list from `lg`.
- The home feed column is `max-w-feed` (640px, `--container-feed`), its cards 16px apart (`gap-4`), the page 24px from the top and 64px from the bottom. From `xl` up `HomeRail` (which owns the `<aside>`) sits to its right, flexible from 260 to 320px ("Results are in": Ended polls the viewer voted in, with unread dots; "Closing soon": Open polls ending within a day; the login prompt for guests; "Got a question for everyone?" with Write one for signed-in viewers); below `xl` the rail follows the feed.
- Desktop gets the collapsible `AppSidebar` (248px; nav rows 40px, the current one a `card` with a `border` line); mobile gets the fixed `TabBar` (64px plus the safe-area inset). Phones also get a fixed logo `Header` (56px) that slides up while scrolling down, returns on scroll up and is back on every new page; it eases over 400ms (`ease-header`). Bars that stick under it and slide with it use `sticky follow-header` (Home's topics; a page's own line tabs pass `sticky` to `TabsList`). The TabBar's profile tab shows the signed-in person's avatar. All three hide on `/login`. There is one create action, `Button variant="create"`: the sidebar's button and the TabBar's center square.
- The poll creator is full screen on phones and a 560px dialog from `sm` up.
- Touch targets are at least 44px (`h-11`) on phones. From `md` up `Button` takes its size's height: `default` stays 44, `md` 40 (settings and dialog footers, Show more), `sm` 36 (header actions), `xs` 32 (actions inside a row), `icon-sm` 36, `icon-xs` a 32px circle (a row's •••). Pick the size; never set `h-*`. `Switch` is a 44x26 track whose hit area is 44px tall.
- Every avatar is drawn in the `avatar-frame` utility: a 32px circle (a size goes beside it) with a 1px `border` line, so it sits on any surface. The avatar components carry it; no call site adds or removes the line.

## Building blocks

Use these. Don't copy their classes into a new element.

| Need | Use |
|---|---|
| Any button or link styled as one | `Button`, or `buttonVariants()` on a `Link` |
| Toggle pill or preset | `<Button size="sm" variant={active ? 'default' : 'outline'} aria-pressed={active}>`, add `rounded-full` for pills. Home's topics are the same pill on a `Link` (`buttonVariants`, `aria-current`) |
| Text field | `Input`, `Textarea` (these already carry the focus outline); fixed text inside the field before the value ("vomatt.com/") is `Input leading` |
| Underlined tabs | `<TabsList variant="line">` + `TabsTrigger`, no className overrides; `fit` sizes them to their labels so a row can hold filters beside them (the row draws the line) |
| Filter pills over one list | `FilterPills` |
| Follow a person | `FollowButton` (ink Follow; outline Following that offers Unfollow on hover): `size="sm"` (36px) in a profile header, `xs` (32px) on the hover card and in rows; `BlockedBadge` once blocked |
| A row's ••• menu | Base UI `Menu` with `Button variant="ghost" size="icon-xs"` as the trigger and `menuPopupClassName` / `menuItemClassName` from `components/ui/menu.ts` (ink 16px icons; a destructive item adds `text-destructive`) |
| Back to the parent page | `BackLink` ("‹ Home": a quiet 14px link with a 44px hit area that takes no extra space) |
| A detail only the owner sees | `OnlyYouMarker` (the lock) beside it |
| Rows on a profile | `AskedRow`, `VotedRow` and `ProfileSection` from `features/profiles/ProfileRows` |
| Status of a poll | `StatusChip` with `derivePollStatus(poll)` (tint, an ink dot or a clock while closing, words). Pick `time`: `inline` where the chip stands alone, on cards, the creator's review and Explore ("Open · ends Fri"); `elsewhere` in a row, which puts `pollTiming(…).when` in its meta ("1,284 voted · ends Fri 20:00" beside "Open") |
| Any date a poll surface shows | `useViewerClock()` (null until hydrated) + `pollTiming()` from `features/polls/timing`, or `formatPollDay` / `formatPollMoment` / `formatDuration` / `formatAge` from `features/polls/format`. Not `Date.now()` or `new Date()` in a component |
| Other small pill (e.g. ballot outcome) | `chipClassName` from `features/polls/chip.ts` + a `bg-*` tint |
| Empty list | the `empty-state` utility (dashed `surface-soft` box) |
| Unread marker | `UnreadDot` with an `aria-label`, right after the name of what is unread: a tab's label, a list row's title (which goes `font-semibold`, with `NewMark` in its meta), a notification's first line (the row is already a card, so no bold title and no "new"), the top-trailing corner of an icon. Never a leading gutter and never the row's far edge: titles keep one left edge and chips one column whether a row is read or not |
| A rule or promise (Tide) | `TidePanel` for a surface, `TideRules` + `TideRule icon={…}` for a list of rules |
| A ballot option's mark | `BallotMark state`: `rest` (a ring; `quiet` once another option is cast), `selected` (a 6px ink ring), `cast` (Volt fill, ink line and check). `SelectionHighlight cast` adds the Volt tint to the cast row only |
| The viewer's cast option | `YourVotePill` ("your vote", lower-case, Volt with an ink line), on ballot and result rows |
| The cast Ballot | `Seal` (in full once per cast, then a row) with `SealMark`: `sm` 32px on rows (the Seal row, profile rows, notifications), `lg` 72px with the dashed ring in the full Seal. Pass facts (`endTime`, `visibility`); the Seal writes its own lines |
| A poll card's footer | `PollFooter` with `audience`: the turnout in ink mono, then a non-Public audience ("18 voted · invite only") |
| Side card of polls (home rail) | `PollSideCard` with a `kind`: `resultsIn` (unread titles 600, read 400, "N voted · new") or `closingSoon` ("ends in 2h · 96 voted") |
| Progress (voting window) | `Progress variant="tide"` |
| List row for a poll | `PollListItem` with `meta` and `aside` |
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
