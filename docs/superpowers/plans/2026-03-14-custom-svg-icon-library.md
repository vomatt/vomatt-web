# Custom SVG Icon Library Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `lucide-react` and `react-icons` with a single self-managed `src/components/ui/icons.tsx` file containing all 29 icon components.

**Architecture:** One file exports all icons as plain function components sharing a common `IconProps` interface. All 16 consumer files swap their import paths and rename symbols where needed. The two external icon packages are then uninstalled.

**Tech Stack:** Next.js 16, TypeScript, React (automatic JSX runtime)

**Spec:** `docs/superpowers/specs/2026-03-14-custom-svg-icon-library-design.md`

---

## Chunk 1: Create icons.tsx

### Task 1: Create `src/components/ui/icons.tsx`

**Files:**
- Create: `src/components/ui/icons.tsx`

- [ ] **Step 1: Create the file with all 29 icons**

```tsx
/*
 * Social media icons adapted from Font Awesome Free
 * https://fontawesome.com — MIT License
 * Copyright (c) Fonticons, Inc.
 */
import type { SVGProps } from 'react'

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number | string
}

// ─── Stroke icons (lucide-derived, ISC license) ──────────────────────────────

export function ArrowLeft({ size = '1em', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  )
}

export function Bell({ size = '1em', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10.268 21a2 2 0 0 0 3.464 0" />
      <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
    </svg>
  )
}

export function Calendar({ size = '1em', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  )
}

export function Check({ size = '1em', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export function ChevronDown({ size = '1em', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export function ChevronUp({ size = '1em', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m18 15-6-6-6 6" />
    </svg>
  )
}

export function CirclePlus({ size = '1em', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  )
}

export function CircleUser({ size = '1em', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="10" r="3" />
      <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
    </svg>
  )
}

export function Home({ size = '1em', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  )
}

export function Loader2({ size = '1em', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

export function LogOut({ size = '1em', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    </svg>
  )
}

export function MessageSquare({ size = '1em', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />
    </svg>
  )
}

export function PanelLeft({ size = '1em', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
    </svg>
  )
}

export function Plus({ size = '1em', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}

/** Alias for CirclePlus */
export { CirclePlus as PlusCircle }

export function Search({ size = '1em', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m21 21-4.34-4.34" />
      <circle cx="11" cy="11" r="8" />
    </svg>
  )
}

export function Share2({ size = '1em', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
      <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
    </svg>
  )
}

export function Star({ size = '1em', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
    </svg>
  )
}

export function TrendingUp({ size = '1em', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 7h6v6" />
      <path d="m22 7-8.5 8.5-5-5L2 17" />
    </svg>
  )
}

export function User({ size = '1em', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export function Users({ size = '1em', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <path d="M16 3.128a4 4 0 0 1 0 7.744" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <circle cx="9" cy="7" r="4" />
    </svg>
  )
}

export function X({ size = '1em', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

// ─── Brand / filled icons (Font Awesome Free, MIT) ───────────────────────────

export function Facebook({ size = '1em', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 320 512" fill="currentColor" {...props}>
      <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
    </svg>
  )
}

export function Github({ size = '1em', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 496 512" fill="currentColor" {...props}>
      <path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z" />
    </svg>
  )
}

export function Instagram({ size = '1em', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 448 512" fill="currentColor" {...props}>
      <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
    </svg>
  )
}

export function Linkedin({ size = '1em', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 448 512" fill="currentColor" {...props}>
      <path d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z" />
    </svg>
  )
}

export function Spotify({ size = '1em', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 496 512" fill="currentColor" {...props}>
      <path d="M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8zm100.7 364.9c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 26.2 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4zm26.9-65.6c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5zm31-76.2c-5.2 0-8.4-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 205.4 47.8 7.8 4.5 12.9 10.7 12.9 22.6 0 13.6-11 23.3-23.2 23.3z" />
    </svg>
  )
}

export function XTwitter({ size = '1em', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 512 512" fill="currentColor" {...props}>
      <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
    </svg>
  )
}

export function Youtube({ size = '1em', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 576 512" fill="currentColor" {...props}>
      <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" />
    </svg>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors relating to `icons.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/icons.tsx
git commit -m "feat: add custom SVG icon library (icons.tsx)"
```

---

## Chunk 2: Migrate UI components

### Task 2: Update `src/components/ui/Sheet.tsx`

**Files:**
- Modify: `src/components/ui/Sheet.tsx`

- [ ] **Step 1: Replace import**

Find: `import { XIcon } from "lucide-react"` (double quotes — match the file's quote style)
Replace with: `import { X } from '@/components/ui/icons'`

Then rename all JSX usages of `<XIcon` → `<X` and `XIcon` refs → `X`.

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit 2>&1 | grep Sheet
```

Expected: no output

---

### Task 3: Update `src/components/ui/Dialog.tsx`

**Files:**
- Modify: `src/components/ui/Dialog.tsx`

- [ ] **Step 1: Replace import**

Find: `import { XIcon } from 'lucide-react'`
Replace with: `import { X } from '@/components/ui/icons'`

Rename `<XIcon` → `<X` and `XIcon` refs → `X` throughout.

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit 2>&1 | grep Dialog
```

Expected: no output

---

### Task 4: Update `src/components/ui/Sidebar.tsx`

**Files:**
- Modify: `src/components/ui/Sidebar.tsx`

- [ ] **Step 1: Replace import**

Find: `import { PanelLeftIcon } from 'lucide-react'`
Replace with: `import { PanelLeft } from '@/components/ui/icons'`

Rename `PanelLeftIcon` → `PanelLeft` throughout.

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit 2>&1 | grep Sidebar
```

Expected: no output

---

### Task 5: Update `src/components/ui/Spinner.tsx`

**Files:**
- Modify: `src/components/ui/Spinner.tsx`

- [ ] **Step 1: Replace import**

Find: `import { Loader2Icon } from 'lucide-react'`
Replace with: `import { Loader2 } from '@/components/ui/icons'`

Rename `Loader2Icon` → `Loader2` throughout.

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit 2>&1 | grep Spinner
```

Expected: no output

---

### Task 6: Update `src/components/ui/Select.tsx`

**Files:**
- Modify: `src/components/ui/Select.tsx`

- [ ] **Step 1: Replace import**

Find: `import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'`
Replace with: `import { Check, ChevronDown, ChevronUp } from '@/components/ui/icons'`

Rename throughout: `CheckIcon` → `Check`, `ChevronDownIcon` → `ChevronDown`, `ChevronUpIcon` → `ChevronUp`.

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit 2>&1 | grep Select
```

Expected: no output

---

### Task 7: Update `src/components/ButtonLoading.tsx`

**Files:**
- Modify: `src/components/ButtonLoading.tsx`

- [ ] **Step 1: Replace import**

Find: `import { Loader2Icon } from 'lucide-react'`
Replace with: `import { Loader2 } from '@/components/ui/icons'`

Rename `Loader2Icon` → `Loader2` throughout.

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit 2>&1 | grep ButtonLoading
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Sheet.tsx src/components/ui/Dialog.tsx src/components/ui/Sidebar.tsx src/components/ui/Spinner.tsx src/components/ui/Select.tsx src/components/ButtonLoading.tsx
git commit -m "feat: migrate UI components to custom icon library"
```

---

## Chunk 3: Migrate app components

### Task 8: Update `src/app/(frontend)/_components/PollCard.tsx`

**Files:**
- Modify: `src/app/(frontend)/_components/PollCard.tsx`

- [ ] **Step 1: Replace import**

Find: `import { ... } from 'lucide-react'` (imports `Check`, `MessageSquare`, `Users`)
Replace with: `import { Check, MessageSquare, Users } from '@/components/ui/icons'`

No symbol renames needed.

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit 2>&1 | grep PollCard
```

Expected: no output

---

### Task 9: Update `src/app/(frontend)/explore/page.tsx`

**Files:**
- Modify: `src/app/(frontend)/explore/page.tsx`

- [ ] **Step 1: Replace import**

Find: `import { Search } from 'lucide-react'`
Replace with: `import { Search } from '@/components/ui/icons'`

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "explore/page"
```

Expected: no output

---

### Task 10: Update `src/app/(frontend)/notifications/page.tsx`

**Files:**
- Modify: `src/app/(frontend)/notifications/page.tsx`

- [ ] **Step 1: Replace import**

Find: `import { Bell } from 'lucide-react'`
Replace with: `import { Bell } from '@/components/ui/icons'`

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "notifications/page"
```

Expected: no output

---

### Task 11: Update `src/app/(frontend)/poll/[id]/page.tsx`

**Files:**
- Modify: `src/app/(frontend)/poll/[id]/page.tsx`

- [ ] **Step 1: Replace import**

Find: `import { ArrowLeft, Share2, Users } from 'lucide-react'`
Replace with: `import { ArrowLeft, Share2, Users } from '@/components/ui/icons'`

No symbol renames needed.

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "poll/\[id\]"
```

Expected: no output

---

### Task 12: Update `src/app/(frontend)/profile/[username]/_components/ProfileHeader.tsx`

**Files:**
- Modify: `src/app/(frontend)/profile/[username]/_components/ProfileHeader.tsx`

- [ ] **Step 1: Replace import**

Find: `import { User } from 'lucide-react'`
Replace with: `import { User } from '@/components/ui/icons'`

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "ProfileHeader"
```

Expected: no output

---

### Task 13: Update `src/components/PollCreator.tsx`

**Files:**
- Modify: `src/components/PollCreator.tsx`

- [ ] **Step 1: Replace import**

Find: `import { Calendar, Plus, X } from 'lucide-react'`
Replace with: `import { Calendar, Plus, X } from '@/components/ui/icons'`

No symbol renames needed.

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "PollCreator"
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/_components/PollCard.tsx src/app/\(frontend\)/explore/page.tsx src/app/\(frontend\)/notifications/page.tsx "src/app/(frontend)/poll/[id]/page.tsx" "src/app/(frontend)/profile/[username]/_components/ProfileHeader.tsx" src/components/PollCreator.tsx
git commit -m "feat: migrate app components to custom icon library"
```

---

## Chunk 4: Migrate layout and utils, delete dead code, uninstall packages

### Task 14: Update `src/components/layout/AppSidebar.tsx`

**Files:**
- Modify: `src/components/layout/AppSidebar.tsx`

- [ ] **Step 1: Replace import**

Find: `import { Home, LogOut, PlusCircle, Search, TrendingUp, User } from 'lucide-react'`
Replace with: `import { Home, LogOut, PlusCircle, Search, TrendingUp, User } from '@/components/ui/icons'`

No symbol renames needed.

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "AppSidebar"
```

Expected: no output

---

### Task 15: Update `src/components/layout/TabBar.tsx`

**Files:**
- Modify: `src/components/layout/TabBar.tsx`

- [ ] **Step 1: Replace import**

Find the lucide-react import (imports `CirclePlus`, `CircleUserIcon`, `HomeIcon`, `Search`, `Star`).
Replace with: `import { CirclePlus, CircleUser, Home, Search, Star } from '@/components/ui/icons'`

Rename in JSX/usage: `CircleUserIcon` → `CircleUser`, `HomeIcon` → `Home`. (`CirclePlus`, `Search`, `Star` need no rename.)

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "TabBar"
```

Expected: no output

---

### Task 16: Update `src/components/layout/index.tsx`

**Files:**
- Modify: `src/components/layout/index.tsx`

- [ ] **Step 1: Replace import**

Find: `import { Plus } from 'lucide-react'`
Replace with: `import { Plus } from '@/components/ui/icons'`

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "layout/index"
```

Expected: no output

---

### Task 17: Update `src/lib/utils.ts`

**Files:**
- Modify: `src/lib/utils.ts`

- [ ] **Step 1: Replace import**

Find: `import { FaFacebookF, FaGithub, FaInstagram, FaLinkedin, FaSpotify, FaXTwitter, FaYoutube } from 'react-icons/fa6'`
Replace with: `import { Facebook, Github, Instagram, Linkedin, Spotify, XTwitter, Youtube } from '@/components/ui/icons'`

Then rename each symbol in the `getIcon()` switch body:
- `FaFacebookF` → `Facebook`
- `FaGithub` → `Github`
- `FaInstagram` → `Instagram`
- `FaLinkedin` → `Linkedin`
- `FaSpotify` → `Spotify`
- `FaXTwitter` → `XTwitter`
- `FaYoutube` → `Youtube`

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "utils"
```

Expected: no output

---

### Task 18: Delete `src/components/SvgIcons.tsx`

**Files:**
- Delete: `src/components/SvgIcons.tsx`

- [ ] **Step 1: Delete the file**

```bash
git rm src/components/SvgIcons.tsx
```

- [ ] **Step 2: Confirm no imports remain**

```bash
grep -r "SvgIcons" src/
```

Expected: no output

- [ ] **Step 3: Commit deletion**

```bash
git commit -m "chore: delete dead SvgIcons.tsx (no active consumers)"
```

---

### Task 19: Uninstall external icon packages

- [ ] **Step 1: Remove packages**

```bash
npm uninstall lucide-react react-icons
```

- [ ] **Step 2: Confirm removed from package.json**

```bash
grep -E 'lucide-react|react-icons' package.json
```

Expected: no output

---

### Task 20: Final verification

- [ ] **Step 1: Full TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Expected: no errors

- [ ] **Step 3: Tests**

```bash
npm run test
```

Expected: all tests pass

- [ ] **Step 4: Final commit**

```bash
git add src/components/layout/AppSidebar.tsx src/components/layout/TabBar.tsx src/components/layout/index.tsx src/lib/utils.ts package.json package-lock.json
git commit -m "feat: complete migration to custom icon library, remove lucide-react and react-icons"
```
