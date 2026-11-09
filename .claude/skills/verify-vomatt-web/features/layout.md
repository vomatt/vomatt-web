# Layout

Sideways pill rows and long option text, checked by measuring the page in a real browser; jsdom can't lay out, so the Jest tests only check the classes. Run these whenever `bleed-x`, `bleed-r`, `PageShell`, a sticky bar or an option row changes.

## Sub-features

- **Edge-to-edge rows** (L1): on phones (below 768px) the Home topic pills, Explore's filter and topic rows, and the Notifications category pills scroll out to the screen's edges; scrolled to either end, the first and last pill line up with the column.
- **Wrapping pills from md** (L2): from 768px the Notifications category pills wrap instead of scrolling.
- **Sticky pill bars** (L3): the Home topics and Notifications category bars stick under the phone Header and slide with it.
- **Long options** (L4): an option with no spaces wraps in the results and never runs under its count.

## How to get to it (user POV)

- L1, L3: `/` (topics), `/explore`, `/notifications` (signed in) at `vv b viewport 375x812` and `740x900`.
- L2: `/notifications` at `1024x800` with the sidebar open.
- L4: create a poll with an option such as `Supercalifragilisticexpialidocious_NoSpaceVeryLongOptionStringToTestWrap` (100 characters at most), end it with `End now`, open its page.

## Driving it with vv

Each check returns JSON; every value named `ok…` must be `true`. A fresh account has no topics or notifications, so L1 needs enough pills to overflow at 375px (Notifications always has six).

```bash
# L1: the scroller reaches both screen edges and its pills keep the column's edges
vv b js '(()=>{const g=document.querySelector("[role=group][aria-label=Category]")??document.querySelector("nav[aria-label=Topics] ul");const p=g.parentElement.getBoundingClientRect(),r=g.getBoundingClientRect(),b=[...g.children];g.scrollLeft=0;const first=b[0].getBoundingClientRect().left;g.scrollLeft=1e5;const last=b.at(-1).getBoundingClientRect().right;g.scrollLeft=0;return JSON.stringify({okLeftEdge:r.left<=0,okRightEdge:r.right>=innerWidth,okFirst:Math.abs(first-p.left)<1.5,okLast:g.scrollWidth<=g.clientWidth||Math.abs(last-p.right)<1.5,okNoPageScroll:document.documentElement.scrollWidth<=document.documentElement.clientWidth})})()'

# L2: at 1024px the Notifications pills wrap rather than scroll
vv b js '(()=>{const g=document.querySelector("[role=group][aria-label=Category]");return JSON.stringify({okWraps:getComputedStyle(g).flexWrap==="wrap",okNoClip:g.scrollWidth<=g.clientWidth})})()'

# L3: scroll down then up a little; the bar sits flush under the Header
vv b js 'window.scrollTo(0,900)'; vv b js 'window.scrollBy(0,-150)'
vv b js '(()=>{const bar=document.querySelector("[data-sticky-bar],[class*=follow-header]");const h=[...document.querySelectorAll("header")].find(e=>e.offsetHeight);return JSON.stringify({okStuck:Math.round(bar.getBoundingClientRect().top)===Math.round(h.getBoundingClientRect().bottom)})})()'

# L4: no option's text runs past the left edge of its count
vv b js 'JSON.stringify({okNoOverlap:[...document.querySelectorAll("li")].filter(li=>li.querySelector(".tabular-nums")).every(li=>{const t=li.querySelector(".wrap-anywhere");return !t||t.getBoundingClientRect().right<=li.querySelector(".tabular-nums").getBoundingClientRect().left+0.5})})'
```

Capture `vv b screenshot --viewport $E/layout-<id>-<width>.png` for each check.

## Gotchas

- L3 needs a page taller than the screen; with an empty list, append a spacer first: `vv b js 'document.querySelector("[data-sticky-bar],[class*=follow-header]").parentElement.append(Object.assign(document.createElement("div"),{style:"height:3000px"}))'`.
- Scrolling down hides the phone Header and the bar with it (both sit at the top, 0); only scrolling back up shows the bar flush under it.
- The checks select by role and aria-label (`Category`, `Topics`), which come from the English locale.
