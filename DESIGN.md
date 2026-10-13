# Design

How the vomatt UI is built. `PRODUCT.md` says why (users, brand, principles, accessibility); this file says how. The code is the source of truth for values: tokens live in `src/styles/global.css`, primitives in `src/components/ui/`. When this file and the code disagree, fix one of them.

## Color

Warm canvas, ink actions, one accent. Use the semantic tokens as Tailwind classes, never raw `oklch()`/hex values. Every token has a dark value in `.dark`.

| Role | Token | Use for |
|---|---|---|
| Canvas | `background` | Page background |
| Surface | `card` | Cards, ballot rows, outline buttons, a focused field |
| Soft surface | `surface-soft` | Folded settings, empty states |
| Field | `field` | Fill of text fields at rest; it is what marks them as fields |
| Ink | `foreground`, `primary` | Text and the primary action (same ink) |
| Quiet text | `muted-foreground` | Meta, hints, secondary copy |
| Lines | `border`, `border-strong` | `border` for cards, rows, dividers and outline buttons; `border-strong` for fields and hover |
| Controls | `input` | Checkbox marks and switch tracks: the 3:1 boundary of small controls |
| Your choice | `volt`, `volt-tint` | Only for the viewer's own choice and unread markers. Never decoration |
| Poll status | `status-scheduled/open/closing/ended` | Status chip tints, always with a text label |
| Error | `destructive` | Validation and destructive actions |

The `sidebar-*` tokens alias the base tokens; change the base, not the alias.

## Type

- **Geist** (`font-sans`) for everything, with PingFang TC / Microsoft JhengHei / Noto Sans TC fallbacks for Traditional Chinese. **Geist Mono** (`font-mono`, `tabular-nums`) for counts, times and handles.
- **Display**: the `display-heading` utility sets weight 400, leading 1.25 and -0.03em tracking; the size goes beside it.
  - Page titles: `display-heading text-[32px] md:text-[44px]`
  - Auth titles: `display-heading text-[32px]`
  - Person names: `display-heading text-[28px]`
- **Poll title** (card and preview): `text-[22px] leading-tight tracking-[-0.02em]`, `md:text-2xl` on cards.
- **Body** `text-[15px]`; **meta** `text-[13px]`; **chip** `text-[11px]` uppercase semibold.
- Inputs are `text-base` on phones so iOS doesn't zoom.

## Shape and layout

- Borders stay quiet: 1px, `border` by default. Fields are `border-strong` on a `field` fill and turn `card` white on focus; the strong focus outline carries the 3:1 contrast. Only the selected ballot row and a winning result get an ink border.
- Radius: `rounded-xl` for cards, ballot rows and panels; `rounded-lg` for buttons and inputs; `rounded-full` for chips, pills and avatars.
- Page container: `px-contain mx-auto max-w-2xl py-6` for lists (Explore, My polls, Notifications, Profile); `max-w-5xl` for a poll page; `max-w-3xl` for Account.
- Desktop gets the collapsible `AppSidebar`; mobile gets the fixed `TabBar` (64px plus the safe-area inset). Both hide on `/login`. There is one create action: the sidebar header button and the TabBar's center ink square.
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
| List row for a poll | `PollListItem` with `meta` and `aside` |
| Active nav link | `isActivePath(pathname, href)` from `lib/routes.ts` |

If a building block doesn't fit, change its variant or add one. Don't override it at the call site.

## Motion

Motion is feedback, not decoration: ballot selection (`BallotMotion`), results counting up, the auth error sliding in, skeleton shimmer. `MotionProvider` sets `reducedMotion="user"`; CSS animations need their own `prefers-reduced-motion` fallback. No pulsing, no confetti, no backdrop blur over scrolling content.

## Don'ts

- No `!` overrides on shared components.
- No raw color values or new one-off tokens; add a semantic token in `global.css` if a role is missing.
- No status shown by color alone.
- No live vote counts while a poll is open (sealed ballots).
- No gradients, glows or glass (see Anti-references in `PRODUCT.md`).
