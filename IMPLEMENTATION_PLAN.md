# Apply the vomatt redesign

Source of truth: the "vomatt Redesign" canvas (claude.ai/artifact/3VxYgFAenzRkQTcQ18rFHD) and `PRODUCT.md`.
Mobile first: design and verify at 390px, then desktop.

## Stage 1: Foundations
**Goal**: Brand tokens, fonts and radius in `global.css` and the root layout.
**Success Criteria**: Warm canvas `#F5F5F0`, ink `#23221D` primary, Volt and status tokens available as Tailwind colors; Geist / Geist Mono load via `next/font`; existing screens still render.
**Tests**: Existing suite passes; type-check and lint show no new errors.
**Status**: Complete

## Stage 2: Shared primitives
**Goal**: Button, Input, Textarea, Tabs and StatusChip match the design (44px targets, 8px controls, 12px surfaces, ink focus ring, pastel status pills with text).
**Success Criteria**: Primitives look like the "Brand foundations" board; every status still has a text label.
**Tests**: StatusChip tests updated for the new markup; existing component tests pass.
**Status**: Complete

## Stage 3: App shell
**Goal**: AppSidebar and mobile TabBar follow the Home and mobile boards (Ask a question as the primary action, current page marked).
**Success Criteria**: Navigation works at 390px and desktop; `aria-current` on the active item.
**Tests**: Layout tests pass; manual check in the browser at both widths.
**Status**: Complete

## Stage 4: Poll surfaces
**Goal**: PollCard, Ballot, Results, PollAbout and the feed follow the Poll, Results and Home boards.
**Success Criteria**: Sealed-until-close messaging, sending state on vote, results bars without tracks.
**Tests**: Poll component tests pass and cover the sending state.
**Status**: Not Started

## Stage 5: Pages and flows
**Goal**: Login (email code), New poll (write then review), Profile, Explore, My polls, Notifications.
**Success Criteria**: Each page matches its mobile board first, then desktop.
**Tests**: Page and flow tests pass; new tests for the write-then-review creator.
**Status**: Not Started
