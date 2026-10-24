# Design

How the vomatt UI is built. `PRODUCT.md` says why (users, brand, principles, accessibility); this file says how. The code is the source of truth for values: tokens live in `src/styles/global.css`, primitives in `src/components/ui/`. When this file and the code disagree, fix one of them.

## Color

Cool canvas, navy ink actions, two signals: Volt (`highlight`) marks what is yours, Tide marks what vomatt promises. The navy ink gives the lime a complementary hue, so the pairing reads as deliberate rather than loud; full-size ink-on-Volt appears once per screen, on the create action. Use the semantic tokens as Tailwind classes, never raw `oklch()`/hex values. Every token has a dark value in `.dark`, and the theme defaults to light: the root layout mounts `ThemeProvider` (next-themes, `defaultTheme="light"`), which puts `.dark` on `<html>`. People switch Light, Dark or Auto (follows `prefers-color-scheme`) from the sidebar's More menu.

| Role | Token | Use for |
|---|---|---|
| Canvas | `background` | Page background |
| Surface | `card` | Cards, ballot rows, outline buttons, a focused field |
| Soft surface | `surface-soft` | Folded settings, empty states |
| Field | `field` | Fill of text fields at rest; it is what marks them as fields |
| Ink | `foreground`, `primary` | Text and the primary action (same ink) |
| Quiet text | `muted-foreground` | Meta, hints, secondary copy |
| Lines | `border`, `border-strong` | `border` for cards, rows, dividers and outline buttons; `border-strong` for hover |
| Controls | `input` | Text field borders, checkbox marks and switch tracks: the 3:1 boundary a control needs at rest |
| Highlight (Volt) | `highlight`, `highlight-foreground`, `highlight-tint` | The create action (`Button variant="create"`: a Volt icon on ink in light, a Volt button in dark), the unread count and unread markers, the viewer's own choice (`highlight-tint` behind the selected row). Text on it is always `highlight-foreground` ink. Never decoration |
| Tide | `tide`, `tide-tint`, `tide-line`, `tide-foreground` | The promise: the Seal after voting (`tide-tint` surface, `tide` ring, a Volt check), the rules ("How vomatt counts" in the sidebar, the poll page's About rules, the creator's rules summary), the voting-window bar (`Progress variant="tide"`). Never links, buttons, headers or hovers |
| Poll status | `status-scheduled/open/closing/ended` | Status chip tints, always with a text label |
| Error | `destructive` | Validation and destructive actions |

`sidebar` is one step deeper than the canvas, divided by a 1px `sidebar-border`; the other `sidebar-*` tokens alias the base tokens, so change the base, not the alias.

## Type

- **Geist** (`font-sans`) for everything, with PingFang TC / Microsoft JhengHei / Noto Sans TC fallbacks for Traditional Chinese. **Geist Mono** (`font-mono`, `tabular-nums`) for counts, times and handles.
- Every title is weight 500: confident, not shouting.
- **Display**: the `display-heading` utility sets weight 500, leading 1.25 and -0.03em tracking; the size goes beside it.
  - Page titles: `display-heading text-[30px] md:text-[40px]`
  - Auth titles: `display-heading text-[30px]`
  - Person names: `display-heading text-2xl`
- **Poll title** (card and preview): `text-[21px] font-medium leading-tight tracking-[-0.02em]`; cards add `md:text-[25px]`.
- **Item title** (list rows, side cards): the `item-title` utility (16px, weight 500, -0.01em); leading goes beside it.
- **Body** `text-[14px]` (card descriptions `text-base`); **meta** `text-[12px]`; **chip** `text-[10px]` uppercase semibold.
- Inputs are `text-[16px]` on phones so iOS doesn't zoom (`text-base` is 15px).

## Shape and layout

- Borders stay quiet: 1px, `border` by default. Fields are `input` on a `field` fill (the border carries the 3:1 contrast at rest) and turn `card` white on focus. Only the selected ballot row and a winning result get an ink border.
- Radius: `rounded-2xl` (16px) for cards and panels (`PollCard`, side cards, the About panel, settings panels); `rounded-xl` (12px) for ballot rows, list rows, inputs and the Tide surfaces inside a card; `--radius` (10px) for buttons, set once in `Button`; `rounded-full` for chips, pills and avatars.
- Page container: `px-contain mx-auto max-w-2xl py-6` for lists (Explore, My polls, Notifications, Profile); `max-w-5xl` for a poll page; `max-w-3xl` for Account.
- The home feed column is `max-w-feed` (640px, `--container-feed`). From `xl` up a 280px rail sits to its right ("Results are in": Ended polls the viewer voted in, with unread dots; "Closing soon": Open polls ending within a day; the login prompt for guests); below `xl` the rail follows the feed.
- Desktop gets the collapsible `AppSidebar`; mobile gets the fixed `TabBar` (64px plus the safe-area inset). Phones also get a fixed logo `Header` (56px) that slides up while scrolling down, returns on scroll up and is back on every new page; it eases over 400ms (`ease-header`). Bars that stick under it and slide with it use `sticky follow-header` (Home's topics; a page's own line tabs pass `sticky` to `TabsList`). The TabBar's profile tab shows the signed-in person's avatar. All three hide on `/login`. There is one create action, `Button variant="create"`: the sidebar's button and the TabBar's center square.
- The poll creator is full screen on phones and a 560px dialog from `sm` up.
- Touch targets are at least 44px (`h-11`); the `sm` sizes shrink to 36px from `md` up only.

## Building blocks

Use these. Don't copy their classes into a new element.

| Need | Use |
|---|---|
| Any button or link styled as one | `Button`, or `buttonVariants()` on a `Link` |
| Toggle pill or preset | `<Button size="sm" variant={active ? 'default' : 'outline'} aria-pressed={active}>`, add `rounded-full` for pills |
| Text field | `Input`, `Textarea` (these already carry the focus outline) |
| Underlined tabs | `<TabsList variant="line">` + `TabsTrigger`, no className overrides |
| Status of a poll | `StatusChip` with `derivePollStatus(poll)` |
| Other small pill (e.g. ballot outcome) | `chipClassName` from `features/polls/chip.ts` + a `bg-*` tint |
| Empty list | the `empty-state` utility (dashed `surface-soft` box) |
| Unread marker | `UnreadDot` with an `aria-label` |
| A rule or promise (Tide) | `TidePanel` for a surface, `TideRules` + `TideRule icon={…}` for a list of rules |
| The cast Ballot | `Seal` (in full once per cast, then a row) with `SealMark` |
| Side card of polls (home rail) | `PollSideCard` with a heading key |
| Progress (voting window) | `Progress variant="tide"` |
| List row for a poll | `PollListItem` with `meta` and `aside` |
| A person's counts | the profile's stats card: `rounded-2xl` `card` cells, a `font-mono` number over a 12px label |
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
