# Custom SVG Icon Library — Design Spec

**Date:** 2026-03-14
**Status:** Approved

---

## Goal

Replace `lucide-react` and `react-icons` with a self-managed SVG icon component library. All icons live in a single file, removing external icon dependencies entirely.

---

## Architecture

### Single file: `src/components/ui/icons.tsx`

Every icon is a plain React functional component (`React.FC`). They share one prop interface:

```tsx
import type { SVGProps } from 'react'

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number | string
}

// Reference implementation for every icon:
export function Home({ size = "1em", ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* SVG path(s) */}
    </svg>
  )
}
```

Use `import type { SVGProps } from 'react'` — Next.js 16 uses the automatic JSX runtime so no default `React` import is needed, but the type reference must still be imported explicitly.

Key points:
- `size` maps to both `width` and `height` on `<svg>`, defaulting to `"1em"` — matches lucide-react's behaviour
- Icons are plain `function` declarations (not `React.forwardRef`) so they are compatible with component-as-value patterns (e.g., `const Icon = Facebook; return <Icon />`)
- All other SVG props (`strokeWidth`, `fill`, `className`, `aria-label`, etc.) pass through via spread
- No external dependencies — pure SVG paths

---

## Icon Inventory

### From lucide-react (22 icons)

`SvgIcons.tsx` has no active call sites in the codebase — it is dead code and is simply deleted. Its four icons (`reload`, `user-circle-outline`, `chevrons-right`, `chevrons-left`) are **not** added to `icons.tsx` since nothing uses them.

| Export name | Replaces lucide name(s) |
|---|---|
| `ArrowLeft` | `ArrowLeft` |
| `Bell` | `Bell` |
| `Calendar` | `Calendar` |
| `Check` | `Check`, `CheckIcon` |
| `ChevronDown` | `ChevronDownIcon` |
| `ChevronUp` | `ChevronUpIcon` |
| `CirclePlus` | `CirclePlus` |
| `CircleUser` | `CircleUserIcon` |
| `Home` | `Home`, `HomeIcon` |
| `Loader2` | `Loader2Icon` |
| `LogOut` | `LogOut` |
| `MessageSquare` | `MessageSquare` |
| `PanelLeft` | `PanelLeftIcon` |
| `Plus` | `Plus` |
| `PlusCircle` | `PlusCircle` |
| `Search` | `Search` |
| `Share2` | `Share2` |
| `Star` | `Star` |
| `TrendingUp` | `TrendingUp` |
| `User` | `User` |
| `Users` | `Users` |
| `X` | `X`, `XIcon` |

### From react-icons/fa6 — Font Awesome Free (MIT) (7 icons)

SVG paths are copied verbatim from Font Awesome Free. A block comment at the top of `icons.tsx` must include attribution:

```
/*
 * Social media icons adapted from Font Awesome Free
 * https://fontawesome.com — MIT License
 * Copyright (c) Fonticons, Inc.
 */
```

| Export name | Replaces |
|---|---|
| `Facebook` | `FaFacebookF` |
| `Github` | `FaGithub` |
| `Instagram` | `FaInstagram` |
| `Linkedin` | `FaLinkedin` |
| `Spotify` | `FaSpotify` |
| `XTwitter` | `FaXTwitter` |
| `Youtube` | `FaYoutube` |

---

## Naming Convention

- **PascalCase, no `Icon` suffix** — `Home`, not `HomeIcon`
- Old aliases are **not** re-exported — clean break
- `npx tsc --noEmit` will catch any missed renames at the call site since the old names won't exist in `icons.tsx`

---

## Files Affected

### Updated (import path + symbol renames)

| File | Import change | Symbol renames required |
|---|---|---|
| `src/components/ui/Sheet.tsx` | `lucide-react` → `@/components/ui/icons` | `XIcon` → `X` |
| `src/components/ui/Dialog.tsx` | `lucide-react` → `@/components/ui/icons` | `XIcon` → `X` |
| `src/components/ui/Sidebar.tsx` | `lucide-react` → `@/components/ui/icons` | `PanelLeftIcon` → `PanelLeft` |
| `src/components/ui/Spinner.tsx` | `lucide-react` → `@/components/ui/icons` | `Loader2Icon` → `Loader2` |
| `src/components/ui/Select.tsx` | `lucide-react` → `@/components/ui/icons` | `CheckIcon` → `Check`, `ChevronDownIcon` → `ChevronDown`, `ChevronUpIcon` → `ChevronUp` |
| `src/components/ButtonLoading.tsx` | `lucide-react` → `@/components/ui/icons` | `Loader2Icon` → `Loader2` |
| `src/app/(frontend)/_components/PollCard.tsx` | `lucide-react` → `@/components/ui/icons` | none |
| `src/app/(frontend)/explore/page.tsx` | `lucide-react` → `@/components/ui/icons` | none |
| `src/app/(frontend)/notifications/page.tsx` | `lucide-react` → `@/components/ui/icons` | none |
| `src/app/(frontend)/poll/[id]/page.tsx` | `lucide-react` → `@/components/ui/icons` | none |
| `src/app/(frontend)/profile/[username]/_components/ProfileHeader.tsx` | `lucide-react` → `@/components/ui/icons` | none |
| `src/components/PollCreator.tsx` | `lucide-react` → `@/components/ui/icons` | none |
| `src/components/layout/AppSidebar.tsx` | `lucide-react` → `@/components/ui/icons` | none |
| `src/components/layout/TabBar.tsx` | `lucide-react` → `@/components/ui/icons` | `CircleUserIcon` → `CircleUser`, `HomeIcon` → `Home`; `CirclePlus`, `Search`, `Star` — no rename |
| `src/components/layout/index.tsx` | `lucide-react` → `@/components/ui/icons` | none |
| `src/lib/utils.ts` | `react-icons/fa6` → `@/components/ui/icons` | `FaFacebookF` → `Facebook`, `FaGithub` → `Github`, `FaInstagram` → `Instagram`, `FaLinkedin` → `Linkedin`, `FaSpotify` → `Spotify`, `FaXTwitter` → `XTwitter`, `FaYoutube` → `Youtube`. Note: `getIcon()` returns icon components as values (not JSX) — the new components are plain functions so `const Icon = Facebook; <Icon />` continues to work. The pre-existing `'youTube'` key casing in the switch is out of scope for this migration. |

### Deleted

- `src/components/SvgIcons.tsx` — dead code with no active consumers; simply deleted

### Untouched

- `src/components/ui/animate-icon/MailCheck.tsx` — animated SVG using `motion/react`, stays separate

---

## Migration Steps

1. **Create** `src/components/ui/icons.tsx` with all 29 icon components and the FA attribution comment
2. **Update** all 16 files listed above — swap import paths and apply symbol renames per the table
3. **Delete** `src/components/SvgIcons.tsx`
4. **Uninstall** `lucide-react` and `react-icons` from `package.json`
5. **Verify** — run `npx tsc --noEmit` and `npm run lint`; tsc will surface any missed symbol renames since old names are not re-exported

---

## Out of Scope

- `MailCheck.tsx` — left as-is
- No icons from `SvgIcons.tsx` — they have no consumers and are not added
- No icon registry, lazy loading, or sprite sheets — YAGNI
