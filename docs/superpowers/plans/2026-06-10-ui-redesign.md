# PotPlanner UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the visual design of PotPlanner to a polished, professional Monzo-inspired aesthetic with dark mode, improved typography, elevation system, sidebar redesign, KPI dashboard cards, and Framer Motion page transitions — zero functionality changes.

**Architecture:** All changes are purely visual (CSS, className changes, new presentational components). New dependencies: `next-themes` (theme switching), `framer-motion` (animations). No schema, DAL, server action, or routing changes. The existing component tree and data flow are preserved exactly.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, shadcn/ui, Framer Motion, next-themes, IBM Plex Sans (existing), IBM Plex Mono (existing)

---

## Files Overview

**New files:**
- `src/components/page-transition.tsx` — Framer Motion page wrapper
- `src/components/motion.tsx` — stagger animation variants
- `src/components/ui/theme-toggle.tsx` — 3-state light/system/dark pill
- `src/components/ui/kpi-card.tsx` — dashboard stat card
- `src/components/pots/pot-donut.tsx` — allocation donut chart

**Modified files:**
- `src/app/layout.tsx` — add ThemeProvider
- `src/app/(app)/layout.tsx` — fetch + pass userInitial to Sidebar
- `src/app/globals.css` — semantic tokens, elevation classes, type scale, remove CSS reveal keyframes
- `src/components/sidebar.tsx` — full redesign: gradient header, grouped nav, footer with toggle + avatar
- `src/components/nav-link.tsx` — pill active state
- `src/components/bottom-nav.tsx` — replace hardcoded hex with Tailwind theme classes
- `src/components/pots/pot-list.tsx` — elevation-1, left accent bar, Framer Motion stagger, donut
- `src/components/dashboard/dashboard-view.tsx` — KPI cards, Framer Motion, semantic tokens
- `src/components/finances/finances-view.tsx` — elevation-1 account cards
- `src/components/savings/savings-list.tsx` — upgraded progress bars, success colour
- `src/components/bills/bill-list.tsx` — elevation-1 wrapper, type scale
- `src/components/debts/debt-list.tsx` — elevation-1 wrapper, type scale
- `src/components/forecast/forecast-view.tsx` — semantic colour tokens
- `src/components/history/spending-donut.tsx` — update chart colours to Monzo palette
- `src/app/(app)/page.tsx` and all 9 other page files — wrap in `<PageTransition>`
- `src/app/(auth)/login/page.tsx` + `src/components/login-form.tsx` — replace hardcoded inline styles with CSS variables

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install next-themes and framer-motion**

```bash
npm install next-themes framer-motion
```

Expected output: both packages added to `dependencies` in `package.json`.

- [ ] **Step 2: Verify TypeScript can resolve them**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install next-themes and framer-motion"
```

---

### Task 2: Update globals.css — semantic tokens, elevation, typography scale

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace globals.css with the new version**

The new file adds: semantic colour tokens (`:root` + `.dark`), elevation utility classes, a 6-step typography scale, a `.font-money` utility. It removes the `@keyframes reveal-up` / `reveal-fade` animations and the `.animate-reveal-up` / `.animate-reveal-fade` classes (replaced by Framer Motion in later tasks). The `.animate-progress` keyframe is kept — it's still used on progress bars.

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-ibm-plex), "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) * 0.5);
  --radius-md: calc(var(--radius) * 0.75);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.25);
  --radius-2xl: calc(var(--radius) * 1.5);
  --radius-3xl: calc(var(--radius) * 2);
  --radius-4xl: calc(var(--radius) * 2.5);
}

/* ─── Monzo-inspired light theme ─── */
:root {
  --background: oklch(0.981 0.002 55);
  --foreground: oklch(0.19 0.045 248);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.19 0.045 248);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.19 0.045 248);
  --primary: oklch(0.62 0.235 22);
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.953 0 0);
  --secondary-foreground: oklch(0.19 0.045 248);
  --muted: oklch(0.953 0 0);
  --muted-foreground: oklch(0.59 0 0);
  --accent: oklch(0.971 0.012 22);
  --accent-foreground: oklch(0.19 0.045 248);
  --destructive: oklch(0.565 0.24 17);
  --border: oklch(0.922 0.002 55);
  --input: oklch(0.922 0.002 55);
  --ring: oklch(0.62 0.235 22 / 30%);
  --chart-1: oklch(0.62 0.235 22);
  --chart-2: oklch(0.679 0.108 185);
  --chart-3: oklch(0.19 0.045 248);
  --chart-4: oklch(0.866 0.170 88);
  --chart-5: oklch(0.59 0 0);
  --radius: 0.875rem;
  --sidebar: oklch(1 0 0);
  --sidebar-foreground: oklch(0.19 0.045 248);
  --sidebar-primary: oklch(0.62 0.235 22);
  --sidebar-primary-foreground: oklch(1 0 0);
  --sidebar-accent: oklch(0.62 0.235 22 / 10%);
  --sidebar-accent-foreground: oklch(0.62 0.235 22);
  --sidebar-border: oklch(0.922 0.002 55);
  --sidebar-ring: oklch(0.62 0.235 22);

  /* ── Semantic tokens ── */
  --color-success: oklch(0.679 0.108 185);
  --color-success-bg: oklch(0.96 0.025 185);
  --color-warning: oklch(0.866 0.170 88);
  --color-warning-bg: oklch(0.98 0.040 88);
  --sidebar-header-bg: oklch(0.997 0.004 22);
}

/* ─── Dark mode ─── */
.dark {
  --background: oklch(0.10 0.010 248);
  --foreground: oklch(0.96 0.003 55);
  --card: oklch(0.15 0.013 248);
  --card-foreground: oklch(0.96 0.003 55);
  --popover: oklch(0.15 0.013 248);
  --popover-foreground: oklch(0.96 0.003 55);
  --primary: oklch(0.68 0.22 22);
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.20 0.013 248);
  --secondary-foreground: oklch(0.96 0.003 55);
  --muted: oklch(0.20 0.013 248);
  --muted-foreground: oklch(0.55 0.010 248);
  --accent: oklch(0.62 0.235 22 / 15%);
  --accent-foreground: oklch(0.96 0.003 55);
  --destructive: oklch(0.65 0.22 17);
  --border: oklch(1 0 0 / 8%);
  --input: oklch(1 0 0 / 10%);
  --ring: oklch(0.68 0.22 22 / 40%);
  --chart-1: oklch(0.68 0.22 22);
  --chart-2: oklch(0.72 0.108 185);
  --chart-3: oklch(0.55 0.045 248);
  --chart-4: oklch(0.90 0.170 88);
  --chart-5: oklch(0.65 0 0);
  --sidebar: oklch(0.12 0.012 248);
  --sidebar-foreground: oklch(0.96 0.003 55);
  --sidebar-primary: oklch(0.68 0.22 22);
  --sidebar-primary-foreground: oklch(1 0 0);
  --sidebar-accent: oklch(0.62 0.235 22 / 14%);
  --sidebar-accent-foreground: oklch(0.68 0.22 22);
  --sidebar-border: oklch(1 0 0 / 6%);
  --sidebar-ring: oklch(0.68 0.22 22);

  /* ── Semantic tokens dark ── */
  --color-success: oklch(0.72 0.108 185);
  --color-success-bg: oklch(0.20 0.040 185);
  --color-warning: oklch(0.90 0.170 88);
  --color-warning-bg: oklch(0.20 0.060 88);
  --sidebar-header-bg: oklch(0.13 0.015 248);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  ::selection {
    background: oklch(0.62 0.235 22 / 18%);
    color: oklch(0.19 0.045 248);
  }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: oklch(0.62 0.235 22 / 18%);
    border-radius: 99px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: oklch(0.62 0.235 22 / 35%);
  }
}

/* ─── Elevation tiers ─── */
@layer components {
  .elevation-0 {
    background: var(--background);
  }
  .elevation-1 {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-2xl);
    box-shadow: 0 1px 3px oklch(0.19 0.045 248 / 6%), 0 1px 2px oklch(0.19 0.045 248 / 4%);
    transition: box-shadow 150ms ease-out, transform 150ms ease-out;
  }
  .elevation-1:hover {
    box-shadow: 0 4px 16px oklch(0.19 0.045 248 / 10%), 0 1px 4px oklch(0.19 0.045 248 / 6%);
    transform: translateY(-1px);
  }
  .dark .elevation-1 {
    box-shadow: none;
  }
  .dark .elevation-1:hover {
    box-shadow: 0 4px 16px oklch(0 0 0 / 30%);
  }
  .elevation-2 {
    background: var(--card);
    border-radius: var(--radius-2xl);
    box-shadow: 0 8px 32px oklch(0.19 0.045 248 / 12%), 0 2px 8px oklch(0.19 0.045 248 / 6%);
  }
  .dark .elevation-2 {
    box-shadow: 0 8px 32px oklch(0 0 0 / 40%);
  }

  /* Legacy — kept for any uses not yet migrated */
  .card-elevated {
    background: white;
    border-radius: var(--radius-2xl);
    border: 1px solid oklch(0.922 0.002 55);
    box-shadow:
      0 1px 2px rgba(20, 35, 60, 0.04),
      0 4px 16px rgba(20, 35, 60, 0.07);
  }
}

/* ─── Typography scale ─── */
@layer components {
  .t-display {
    font-size: 2rem;
    line-height: 1.1;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  .t-h1 {
    font-size: 1.375rem;
    line-height: 1.25;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  .t-h2 {
    font-size: 1rem;
    line-height: 1.25;
    font-weight: 600;
  }
  .t-body {
    font-size: 0.875rem;
    line-height: 1.5;
    font-weight: 400;
  }
  .t-label {
    font-size: 0.75rem;
    line-height: 1.4;
    font-weight: 500;
  }
  .t-caption {
    font-size: 0.6875rem;
    line-height: 1.4;
    font-weight: 500;
  }
  .font-money {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
  }
}

/* ─── Animations ─── */
@keyframes progress-grow {
  from { width: 0; }
}

.animate-progress {
  animation: progress-grow 0.85s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: var(--delay, 200ms);
}

.tabular-nums {
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 2: Verify**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "style: add semantic tokens, elevation system, typography scale to globals.css"
```

---

### Task 3: Add ThemeProvider to root layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update root layout**

```tsx
import type { Metadata } from "next"
import { IBM_Plex_Sans } from "next/font/google"
import { ThemeProvider } from "next-themes"
import "./globals.css"

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "PotPlanner",
  description: "Household budgeting app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ibmPlexSans.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

Note: `suppressHydrationWarning` on `<html>` is required by next-themes to avoid hydration mismatch on the `class` attribute. `disableTransitionOnChange` prevents colour-scheme flash during theme switch.

- [ ] **Step 2: Verify**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: add next-themes ThemeProvider to root layout"
```

---

### Task 4: Create ThemeToggle component

**Files:**
- Create: `src/components/ui/theme-toggle.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client'

import { useTheme } from 'next-themes'
import { Sun, Monitor, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

const OPTIONS = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'system', icon: Monitor, label: 'System' },
  { value: 'dark', icon: Moon, label: 'Dark' },
] as const

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <div className="h-8 w-[120px] rounded-lg bg-muted animate-pulse" />

  return (
    <div className="flex items-center rounded-lg bg-muted p-0.5 gap-0.5">
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={label}
          className={`flex items-center justify-center h-7 w-9 rounded-md transition-all duration-150 ${
            theme === value
              ? 'bg-card text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verify**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/theme-toggle.tsx
git commit -m "feat: add ThemeToggle component (light/system/dark pill)"
```

---

### Task 5: Redesign Sidebar

**Files:**
- Modify: `src/components/sidebar.tsx`

The sidebar gets: a coral-gradient branded header, two nav groups (OVERVIEW / PLANNING + SETTINGS), and a footer row with the ThemeToggle and a user avatar (letter derived from email). A `userInitial` prop is added — wired up in Task 6.

- [ ] **Step 1: Replace sidebar.tsx**

```tsx
'use client'

import Link from 'next/link'
import { NavLink } from '@/components/nav-link'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useMember } from '@/lib/context/member-context'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  LayoutDashboard,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Target,
  Banknote,
  Users,
  LogOut,
} from 'lucide-react'
import { logoutAction } from '@/app/actions/auth'

const OVERVIEW_ITEMS = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/accounts', icon: CreditCard, label: 'Accounts' },
  { href: '/pay', icon: Banknote, label: 'Income' },
  { href: '/forecast', icon: TrendingUp, label: 'Forecast' },
]

const PLANNING_ITEMS = [
  { href: '/debts', icon: TrendingDown, label: 'Debts' },
  { href: '/savings', icon: Target, label: 'Savings' },
]

const SETTINGS_ITEMS = [
  { href: '/household', icon: Users, label: 'Household' },
]

interface Member {
  id: number
  name: string
}

interface SidebarProps {
  members: Member[]
  userInitial: string
}

function NavGroup({ label, items }: { label: string; items: typeof OVERVIEW_ITEMS }) {
  return (
    <div className="mb-3">
      <p className="t-caption uppercase tracking-widest text-muted-foreground/50 px-3 mb-1.5">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map(({ href, icon, label: itemLabel }) => (
          <NavLink key={href} href={href} icon={icon}>
            {itemLabel}
          </NavLink>
        ))}
      </div>
    </div>
  )
}

export function Sidebar({ members, userInitial }: SidebarProps) {
  const { activeMemberId, setActiveMemberId } = useMember()

  return (
    <aside className="hidden md:flex w-[220px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Branded header */}
      <div
        className="flex h-16 items-center gap-2.5 px-5 border-b border-sidebar-border"
        style={{ background: 'var(--sidebar-header-bg)' }}
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
          style={{
            background: 'linear-gradient(135deg, #FF3B30 0%, #E0321F 100%)',
            boxShadow: '0 2px 8px rgba(255,59,48,0.35)',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
            <path d="M3 11V6a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="7.5" cy="6" r="1.75" stroke="white" strokeWidth="1.5"/>
            <path d="M5.5 9.5h4M5.5 11.5h2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </div>
        <Link href="/" className="text-[17px] font-bold tracking-tight text-foreground select-none">
          PotPlanner
        </Link>
      </div>

      {/* Member selector */}
      {members.length > 0 && (
        <div className="px-3 pt-3 pb-1">
          <p className="t-caption px-1 mb-1.5 uppercase tracking-widest text-muted-foreground/50">
            Viewing
          </p>
          <Select
            value={activeMemberId?.toString() ?? 'all'}
            onValueChange={(v) => setActiveMemberId(v === 'all' ? null : Number(v))}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All members</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id.toString()}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        <NavGroup label="Overview" items={OVERVIEW_ITEMS} />
        <NavGroup label="Planning" items={PLANNING_ITEMS} />
        <NavGroup label="Settings" items={SETTINGS_ITEMS} />
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-3 py-3 space-y-2">
        <ThemeToggle />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-white text-[11px] font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, #FF3B30 0%, #E0321F 100%)' }}
            >
              {userInitial}
            </div>
            <span className="t-label text-muted-foreground truncate max-w-[100px]">Account</span>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              title="Sign out"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
```

Note: The logout uses `logoutAction` — verify this action exists in `src/app/actions/auth.ts`. If the app currently uses a different logout mechanism, keep the existing pattern and only change the visual shell.

- [ ] **Step 2: Check logout action exists**

```bash
grep -rn "logoutAction\|logout" /home/peter/Documents/Git/PotPlanner/src/app/actions/ | head -10
```

If `logoutAction` doesn't exist, keep the existing logout link/button from the current sidebar footer (or omit the logout button entirely — it's a visual-only task).

- [ ] **Step 3: Verify**

```bash
npm run type-check
```

- [ ] **Step 4: Commit**

```bash
git add src/components/sidebar.tsx
git commit -m "style: redesign sidebar with gradient header, nav groups, theme toggle footer"
```

---

### Task 6: Wire userInitial into app layout

**Files:**
- Modify: `src/app/(app)/layout.tsx`

The session only has `userId`. We need to look up the user's email to extract the initial letter. Add a new DAL function for this.

- [ ] **Step 1: Add getUserById to auth DAL**

Add to `src/lib/dal/auth.ts` (append after the existing function):

```typescript
export async function getUserById(id: number): Promise<typeof users.$inferSelect | undefined> {
  const rows = await db.select().from(users).where(eq(users.id, id))
  return rows[0]
}
```

Make sure `eq` is imported — it should already be if `getUserByEmail` uses it. If not, add `import { eq } from 'drizzle-orm'` at the top.

- [ ] **Step 2: Update app layout**

```tsx
import { verifySession } from '@/lib/auth/session'
import { getUserById } from '@/lib/dal/auth'
import { getHouseholdMembers } from '@/lib/dal/household-members'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { BottomNav } from '@/components/bottom-nav'
import { MemberProvider } from '@/lib/context/member-context'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let userId: number
  try {
    const session = await verifySession()
    userId = session.userId
  } catch {
    redirect('/login')
  }

  const [members, user] = await Promise.all([
    getHouseholdMembers(),
    getUserById(userId!),
  ])

  const userInitial = user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <MemberProvider>
      <div className="flex h-[100dvh] overflow-hidden">
        <Sidebar members={members} userInitial={userInitial} />
        <main className="flex-1 overflow-y-auto bg-background pb-16 md:pb-0">
          {children}
        </main>
      </div>
      <BottomNav />
    </MemberProvider>
  )
}
```

- [ ] **Step 3: Verify**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/dal/auth.ts src/app/\(app\)/layout.tsx
git commit -m "style: pass userInitial from session to Sidebar"
```

---

### Task 7: Update NavLink pill active state

**Files:**
- Modify: `src/components/nav-link.tsx`

- [ ] **Step 1: Replace nav-link.tsx**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'

interface NavLinkProps {
  href: string
  icon: LucideIcon
  children: React.ReactNode
}

export function NavLink({ href, icon: Icon, children }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-xl px-3 py-2 t-label transition-all duration-100 border-l-2 ${
        isActive
          ? 'bg-primary/8 text-primary font-semibold border-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 border-transparent'
      }`}
    >
      <Icon className="h-[15px] w-[15px] shrink-0" />
      {children}
    </Link>
  )
}
```

- [ ] **Step 2: Verify**

```bash
npm run type-check
```

- [ ] **Step 3: Commit**

```bash
git add src/components/nav-link.tsx
git commit -m "style: update NavLink with pill active state and border-l accent"
```

---

### Task 8: Fix BottomNav hardcoded colours

**Files:**
- Modify: `src/components/bottom-nav.tsx`

Replace all hardcoded `#FF3B30` and `#14233C` hex values with Tailwind theme-aware classes.

- [ ] **Step 1: Replace bottom-nav.tsx**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  CreditCard,
  Banknote,
  TrendingUp,
  MoreHorizontal,
  TrendingDown,
  Target,
  Users,
} from 'lucide-react'

const PRIMARY_ITEMS = [
  { href: '/', icon: LayoutDashboard, label: 'Home' },
  { href: '/accounts', icon: CreditCard, label: 'Accounts' },
  { href: '/pay', icon: Banknote, label: 'Pay' },
  { href: '/forecast', icon: TrendingUp, label: 'Forecast' },
]

const MORE_ITEMS = [
  { href: '/debts', icon: TrendingDown, label: 'Debts' },
  { href: '/savings', icon: Target, label: 'Savings' },
  { href: '/household', icon: Users, label: 'Household' },
]

export function BottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  useEffect(() => { setMoreOpen(false) }, [pathname])

  const isMoreActive = MORE_ITEMS.some((item) => pathname.startsWith(item.href))

  return (
    <>
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More drawer */}
      <div
        className="fixed inset-x-0 z-40 md:hidden transition-transform duration-200 ease-out bg-card border-t border-border/70"
        style={{
          bottom: 'calc(4rem + env(safe-area-inset-bottom))',
          transform: moreOpen ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        <div className="flex flex-col py-2">
          {MORE_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-5 py-3.5 transition-opacity duration-150 ${
                  isActive ? 'opacity-100' : 'opacity-60'
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-primary' : 'text-foreground'}`} />
                <span className={`text-sm font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Bottom nav bar */}
      <nav
        className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-card border-t border-border/70"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch h-16">
          {PRIMARY_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center flex-1 gap-0.5 px-1 transition-opacity duration-150 ${
                  isActive ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <Icon className={`h-[22px] w-[22px] ${isActive ? 'text-primary' : 'text-foreground'}`} />
                <span className={`text-[10.5px] font-semibold tracking-wide ${isActive ? 'text-primary' : 'text-foreground'}`}>
                  {label}
                </span>
              </Link>
            )
          })}

          <button
            onClick={() => setMoreOpen((o) => !o)}
            className={`flex flex-col items-center justify-center flex-1 gap-0.5 px-1 transition-opacity duration-150 ${
              moreOpen || isMoreActive ? 'opacity-100' : 'opacity-40'
            }`}
          >
            <MoreHorizontal className={`h-[22px] w-[22px] ${moreOpen || isMoreActive ? 'text-primary' : 'text-foreground'}`} />
            <span className={`text-[10.5px] font-semibold tracking-wide ${moreOpen || isMoreActive ? 'text-primary' : 'text-foreground'}`}>
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}
```

- [ ] **Step 2: Verify**

```bash
npm run type-check
```

- [ ] **Step 3: Commit**

```bash
git add src/components/bottom-nav.tsx
git commit -m "style: replace hardcoded hex colours in BottomNav with Tailwind theme classes"
```

---

### Task 9: Create PageTransition and stagger motion utilities

**Files:**
- Create: `src/components/page-transition.tsx`
- Create: `src/components/motion.tsx`

- [ ] **Step 1: Create page-transition.tsx**

```tsx
'use client'

import { motion } from 'framer-motion'

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 2: Create motion.tsx**

```tsx
export const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
}

export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
}
```

- [ ] **Step 3: Verify**

```bash
npm run type-check
```

- [ ] **Step 4: Commit**

```bash
git add src/components/page-transition.tsx src/components/motion.tsx
git commit -m "feat: add PageTransition and stagger motion utilities"
```

---

### Task 10: Wrap all pages in PageTransition

**Files:**
- Modify: `src/app/(app)/page.tsx`
- Modify: `src/app/(app)/accounts/page.tsx`
- Modify: `src/app/(app)/bills/page.tsx`
- Modify: `src/app/(app)/debts/page.tsx`
- Modify: `src/app/(app)/forecast/page.tsx`
- Modify: `src/app/(app)/history/page.tsx`
- Modify: `src/app/(app)/household/page.tsx`
- Modify: `src/app/(app)/pots/page.tsx`
- Modify: `src/app/(app)/savings/page.tsx`
- Modify: `src/app/(app)/pay/page.tsx`

The pattern for every page is the same: import `PageTransition` and wrap the outermost returned element.

- [ ] **Step 1: Update pots/page.tsx**

```tsx
import { getPots } from '@/lib/dal/pots'
import { getAccountsWithShares } from '@/lib/dal/accounts'
import { PotList } from '@/components/pots/pot-list'
import { PageTransition } from '@/components/page-transition'

export default async function PotsPage() {
  const [pots, accounts] = await Promise.all([getPots(), getAccountsWithShares()])
  return (
    <PageTransition>
      <div className="px-6 md:px-8 py-8">
        <PotList pots={pots} accounts={accounts} />
      </div>
    </PageTransition>
  )
}
```

- [ ] **Step 2: Update accounts/page.tsx**

```tsx
import { getAccountsWithShares } from '@/lib/dal/accounts'
import { getPots } from '@/lib/dal/pots'
import { getBillsWithSplits } from '@/lib/dal/bills'
import { getDebts } from '@/lib/dal/debts'
import { getHouseholdMembers } from '@/lib/dal/household-members'
import { FinancesView } from '@/components/finances/finances-view'
import { PageTransition } from '@/components/page-transition'

export default async function AccountsPage() {
  const [accounts, pots, bills, debts, members] = await Promise.all([
    getAccountsWithShares(),
    getPots(),
    getBillsWithSplits(),
    getDebts(),
    getHouseholdMembers(),
  ])
  return (
    <PageTransition>
      <FinancesView accounts={accounts} pots={pots} bills={bills} debts={debts} members={members} />
    </PageTransition>
  )
}
```

- [ ] **Step 3: Update bills/page.tsx**

```tsx
import { getBillsWithSplits } from '@/lib/dal/bills'
import { getPots } from '@/lib/dal/pots'
import { getAccountsWithShares } from '@/lib/dal/accounts'
import { getHouseholdMembers } from '@/lib/dal/household-members'
import { BillList } from '@/components/bills/bill-list'
import { PageTransition } from '@/components/page-transition'

export default async function BillsPage() {
  const [bills, pots, accounts, members] = await Promise.all([
    getBillsWithSplits(),
    getPots(),
    getAccountsWithShares(),
    getHouseholdMembers(),
  ])
  return (
    <PageTransition>
      <div className="px-6 md:px-8 py-8">
        <BillList bills={bills} pots={pots} accounts={accounts} members={members} />
      </div>
    </PageTransition>
  )
}
```

- [ ] **Step 4: Update debts/page.tsx**

```tsx
import { getDebts } from '@/lib/dal/debts'
import { getAccounts } from '@/lib/dal/accounts'
import { getPots } from '@/lib/dal/pots'
import { getHouseholdMembers } from '@/lib/dal/household-members'
import { DebtList } from '@/components/debts/debt-list'
import { PageTransition } from '@/components/page-transition'

export default async function DebtsPage() {
  const [debts, accounts, pots, members] = await Promise.all([
    getDebts(),
    getAccounts(),
    getPots(),
    getHouseholdMembers(),
  ])
  return (
    <PageTransition>
      <div className="px-6 md:px-8 py-8">
        <DebtList debts={debts} accounts={accounts} pots={pots} members={members} />
      </div>
    </PageTransition>
  )
}
```

- [ ] **Step 5: Update savings/page.tsx**

```tsx
import { getSavingsGoals, getSavingsGoalProgress } from '@/lib/dal/savings-goals'
import { getPots } from '@/lib/dal/pots'
import { getHouseholdMembers } from '@/lib/dal/household-members'
import { getIncomes } from '@/lib/dal/incomes'
import { SavingsList } from '@/components/savings/savings-list'
import { PageTransition } from '@/components/page-transition'

export default async function SavingsPage() {
  const [goals, pots, members, incomes] = await Promise.all([
    getSavingsGoals(),
    getPots(),
    getHouseholdMembers(),
    getIncomes(),
  ])

  const goalsWithProgress = await Promise.all(
    goals.map(async (goal) => ({
      ...goal,
      savedPence: await getSavingsGoalProgress(goal.id, goal.potId),
    }))
  )

  return (
    <PageTransition>
      <div className="px-6 md:px-8 py-8">
        <SavingsList
          goals={goalsWithProgress}
          pots={pots}
          members={members}
          incomes={incomes.map((i) => ({ memberId: i.memberId ?? null, frequency: i.frequency }))}
        />
      </div>
    </PageTransition>
  )
}
```

- [ ] **Step 6: Update forecast/page.tsx**

```tsx
import { getIncomes } from '@/lib/dal/incomes'
import { getBillsWithSplits } from '@/lib/dal/bills'
import { getPots } from '@/lib/dal/pots'
import { getAccountsWithShares } from '@/lib/dal/accounts'
import { ForecastView } from '@/components/forecast/forecast-view'
import { PageTransition } from '@/components/page-transition'

export default async function ForecastPage() {
  const [incomes, billsWithSplits, pots, accounts] = await Promise.all([
    getIncomes(),
    getBillsWithSplits(),
    getPots(),
    getAccountsWithShares(),
  ])

  return (
    <PageTransition>
      <div className="px-6 md:px-8 py-8">
        <ForecastView
          incomes={incomes.map((i) => ({
            id: i.id,
            name: i.name,
            amountPence: i.amountPence,
            frequency: i.frequency,
            nextPayDate: new Date(i.nextPayDate).toISOString(),
            memberId: i.memberId ?? null,
          }))}
          billsWithSplits={billsWithSplits.map((b) => ({
            id: b.id,
            name: b.name,
            amountPence: b.amountPence,
            frequency: b.frequency,
            potId: b.potId,
            accountId: b.accountId,
            nextDueDate: new Date(b.nextDueDate).toISOString(),
            splits: b.splits.map((s) => ({ memberId: s.memberId, percentage: s.percentage })),
          }))}
          pots={pots.map((p) => ({
            id: p.id,
            name: p.name,
            allocatedPence: p.allocatedPence,
            rollover: p.rollover,
            accountId: p.accountId ?? null,
          }))}
          accounts={accounts.map((a) => ({
            id: a.id,
            ownerId: a.ownerId ?? null,
            shares: a.shares.flatMap((s) =>
              s.memberId !== null ? [{ memberId: s.memberId }] : [],
            ),
          }))}
        />
      </div>
    </PageTransition>
  )
}
```

- [ ] **Step 7: Update history/page.tsx**

```tsx
import { getTransferHistoryWithNames, getMonthlySpendingByPot } from '@/lib/dal/transfer-history'
import { getPots } from '@/lib/dal/pots'
import { TransferHistoryList } from '@/components/history/transfer-history-list'
import { PageTransition } from '@/components/page-transition'
import { format } from 'date-fns'

const CHART_COLORS = [
  '#FF3B30',
  '#00B9A9',
  '#FFC800',
  '#14233C',
  '#E8634A',
  '#3EC9BA',
]

export default async function HistoryPage() {
  const now = new Date()
  const [entries, spendingByPot, allPots] = await Promise.all([
    getTransferHistoryWithNames(),
    getMonthlySpendingByPot(now.getFullYear(), now.getMonth() + 1),
    getPots(),
  ])

  const donutSlices = allPots
    .filter((p) => (spendingByPot[p.id] ?? 0) > 0)
    .map((p, i) => ({
      potName: p.name,
      amountPence: spendingByPot[p.id] ?? 0,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }))

  const month = format(now, 'MMMM yyyy')

  return (
    <PageTransition>
      <div className="px-6 md:px-8 py-8">
        <TransferHistoryList entries={entries} donutSlices={donutSlices} month={month} />
      </div>
    </PageTransition>
  )
}
```

- [ ] **Step 8: Update household/page.tsx**

```tsx
import { getHouseholdMembers } from '@/lib/dal/household-members'
import { MemberList } from '@/components/household/member-list'
import { PageTransition } from '@/components/page-transition'

export default async function HouseholdPage() {
  const members = await getHouseholdMembers()
  return (
    <PageTransition>
      <div className="px-6 md:px-8 py-8 max-w-2xl">
        <MemberList members={members} />
      </div>
    </PageTransition>
  )
}
```

- [ ] **Step 9: Update pay/page.tsx**

```tsx
import { getIncomes } from '@/lib/dal/incomes'
import { getHouseholdMembers } from '@/lib/dal/household-members'
import { IncomeList } from '@/components/pay/income-list'
import { PageTransition } from '@/components/page-transition'

export default async function PayPage() {
  const [incomes, members] = await Promise.all([getIncomes(), getHouseholdMembers()])
  return (
    <PageTransition>
      <IncomeList incomes={incomes} members={members} />
    </PageTransition>
  )
}
```

- [ ] **Step 10: Update dashboard page.tsx**

The `DashboardView` and the early-return "set up your income" block both need wrapping. Replace the entire `src/app/(app)/page.tsx`:

```tsx
import { getPots } from '@/lib/dal/pots'
import { getBillsWithSplits } from '@/lib/dal/bills'
import { getDebts } from '@/lib/dal/debts'
import { getAccountsWithShares } from '@/lib/dal/accounts'
import { getIncomes } from '@/lib/dal/incomes'
import { getSavingsGoals, getSavingsGoalProgress } from '@/lib/dal/savings-goals'
import { DashboardView } from '@/components/dashboard/dashboard-view'
import { PageTransition } from '@/components/page-transition'
import { Banknote, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const [accounts, pots, billsWithSplits, debts, incomes, goals] = await Promise.all([
    getAccountsWithShares(),
    getPots(),
    getBillsWithSplits(),
    getDebts(),
    getIncomes(),
    getSavingsGoals(),
  ])

  const savingsGoals = await Promise.all(
    goals.map(async (g) => ({
      ...g,
      savedPence: await getSavingsGoalProgress(g.id, g.potId),
    }))
  )

  if (incomes.length === 0) {
    return (
      <PageTransition>
        <div className="px-8 py-8 max-w-2xl">
          <h1 className="t-h1 mb-6">Dashboard</h1>
          <div className="elevation-1 p-8 text-center">
            <Banknote size={36} className="mx-auto mb-4 text-muted-foreground/40" />
            <p className="t-h2 mb-1">Set up your income</p>
            <p className="t-body text-muted-foreground mb-5">
              Add an income source so the dashboard can show exactly what to transfer into each pot
              each pay cycle.
            </p>
            <Link
              href="/pay"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Add income <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <DashboardView
        billsWithSplits={billsWithSplits.map((b) => ({
          ...b,
          nextDueDate: new Date(b.nextDueDate).toISOString(),
        }))}
        pots={pots.map((p) => ({ id: p.id, name: p.name, accountId: p.accountId ?? null }))}
        accounts={accounts.map((a) => ({
          id: a.id,
          name: a.name,
          ownerId: a.ownerId,
          shares: a.shares.map((s) => ({ memberId: s.memberId })),
        }))}
        debts={debts.map((d) => ({
          ...d,
          paymentDueDate: d.paymentDueDate ? new Date(d.paymentDueDate).toISOString() : null,
        }))}
        incomes={incomes.map((i) => ({
          id: i.id,
          name: i.name,
          amountPence: i.amountPence,
          frequency: i.frequency,
          nextPayDate: new Date(i.nextPayDate).toISOString(),
          memberId: i.memberId ?? null,
        }))}
        savingsGoals={savingsGoals.map((g) => ({
          id: g.id,
          name: g.name,
          targetPence: g.targetPence,
          savedPence: g.savedPence,
          goalDate: g.goalDate ? new Date(g.goalDate).toISOString() : null,
          members: g.members,
        }))}
      />
    </PageTransition>
  )
}
```

- [ ] **Step 11: Verify**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 12: Commit**

```bash
git add src/app/\(app\)/page.tsx src/app/\(app\)/accounts/page.tsx src/app/\(app\)/bills/page.tsx src/app/\(app\)/debts/page.tsx src/app/\(app\)/forecast/page.tsx src/app/\(app\)/history/page.tsx src/app/\(app\)/household/page.tsx src/app/\(app\)/pots/page.tsx src/app/\(app\)/savings/page.tsx src/app/\(app\)/pay/page.tsx
git commit -m "style: wrap all app pages in PageTransition for smooth route animations"
```

---

### Task 11: Redesign Pot cards

**Files:**
- Modify: `src/components/pots/pot-list.tsx`

Changes: remove `backgroundColor: accent.bg` from card backgrounds → use `elevation-1`; add `border-l-4` left accent bar; use `.t-display font-money` for amounts; remove `animate-reveal-up` CSS; add Framer Motion stagger on the grid.

- [ ] **Step 1: Replace pot-list.tsx**

```tsx
'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog } from '@/components/ui/dialog'
import { useMember } from '@/lib/context/member-context'
import { deletePotAction, resetPotAllocationsAction } from '@/app/actions/pots'
import { PotForm } from '@/components/pots/pot-form'
import { PotDonut } from '@/components/pots/pot-donut'
import { sumPotAllocations, validatePotAllocations, getPotBalance } from '@/lib/engine/pots'
import { staggerContainer, staggerItem } from '@/components/motion'
import type { Pot as EnginePot } from '@/lib/engine/types'

interface Pot {
  id: number
  name: string
  allocatedPence: number
  rollover: boolean
  accountId: number | null
  createdAt: Date
}

interface Account {
  id: number
  name: string
  ownerId: number | null
  shares: Array<{ memberId: number }>
}

const POT_ACCENTS: Array<{ bar: string; text: string }> = [
  { bar: '#FF3B30', text: '#B80A00' },
  { bar: '#00B9A9', text: '#007870' },
  { bar: '#FFC800', text: '#8A6B00' },
  { bar: '#14233C', text: '#14233C' },
  { bar: '#E8634A', text: '#B84225' },
  { bar: '#3EC9BA', text: '#1A8075' },
  { bar: '#FFD340', text: '#8A7000' },
  { bar: '#5B8AC5', text: '#2D5F94' },
]

interface PotListProps {
  pots: Pot[]
  accounts: Account[]
}

export function PotList({ pots, accounts }: PotListProps) {
  const [incomePence, setIncomePence] = useState<number>(0)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingPot, setEditingPot] = useState<{
    id: number; name: string; allocatedPence: number; rollover: boolean; accountId: number | null
  } | null>(null)
  const [resetPending, setResetPending] = useState(false)

  const { activeMemberId } = useMember()

  const memberAccountIds = useMemo(() => {
    if (!activeMemberId) return null
    return new Set(
      accounts
        .filter((a) => a.ownerId === activeMemberId || a.shares.some((s) => s.memberId === activeMemberId))
        .map((a) => a.id)
    )
  }, [accounts, activeMemberId])

  const visiblePots = useMemo(() => {
    if (!memberAccountIds) return pots
    return pots.filter((p) => p.accountId === null || memberAccountIds.has(p.accountId))
  }, [pots, memberAccountIds])

  const enginePots: EnginePot[] = visiblePots.map((p) => ({
    id: p.id, name: p.name, allocatedPence: p.allocatedPence, rollover: p.rollover,
  }))
  const totalAllocatedPence = sumPotAllocations(enginePots)
  const validation = validatePotAllocations(incomePence, enginePots)

  async function handleReset() {
    setResetPending(true)
    await resetPotAllocationsAction()
    setResetPending(false)
  }

  const dialogs = (
    <>
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <PotForm accounts={accounts} onClose={() => setCreateDialogOpen(false)} />
      </Dialog>
      <Dialog open={editingPot !== null} onOpenChange={(open) => !open && setEditingPot(null)}>
        <PotForm key={editingPot?.id ?? 'new'} pot={editingPot} accounts={accounts} onClose={() => setEditingPot(null)} />
      </Dialog>
    </>
  )

  const header = (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="t-h1">Pots</h1>
        <p className="t-body text-muted-foreground mt-1">
          Allocated:{' '}
          <span className={`font-bold font-money ${!validation.valid && incomePence > 0 ? 'text-amber-600' : 'text-foreground'}`}>
            £{(totalAllocatedPence / 100).toFixed(2)}
          </span>
          {incomePence > 0 && (
            <span className="text-muted-foreground"> of £{(incomePence / 100).toFixed(2)}</span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset month
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset all pot allocations?</AlertDialogTitle>
              <AlertDialogDescription>
                This will set all pot allocations to £0.00. Your pot names and settings will be kept.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep allocations</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={handleReset} disabled={resetPending}>
                {resetPending ? 'Resetting…' : 'Reset allocations'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add pot
        </Button>
      </div>
    </div>
  )

  const incomeRow = (
    <div className="mb-6 flex items-center gap-3">
      <label htmlFor="income-input" className="t-label text-muted-foreground whitespace-nowrap">
        Monthly income
      </label>
      <div className="relative flex items-center">
        <span className="absolute left-3 t-body text-muted-foreground font-medium">£</span>
        <input
          id="income-input"
          type="number"
          step="0.01"
          min="0"
          defaultValue="0.00"
          className="h-9 w-36 rounded-xl border border-border bg-background pl-7 pr-3 text-sm font-money text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          onChange={(e) => setIncomePence(Math.round(parseFloat(e.target.value || '0') * 100))}
        />
      </div>
      {incomePence > 0 && visiblePots.length > 0 && (
        <div className="ml-auto hidden sm:block">
          <PotDonut
            pots={visiblePots.map((p, i) => ({
              name: p.name,
              allocatedPence: p.allocatedPence,
              color: POT_ACCENTS[i % POT_ACCENTS.length].bar,
            }))}
            totalPence={incomePence}
          />
        </div>
      )}
    </div>
  )

  const overWarning = !validation.valid && incomePence > 0 && (
    <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
      <Alert className="border-0 bg-transparent p-0">
        <AlertTitle className="text-[13px] font-semibold text-amber-700">Over-allocated</AlertTitle>
        <AlertDescription className="text-[12px] text-amber-600/80 mt-0.5">
          Total allocation (£{(totalAllocatedPence / 100).toFixed(2)}) exceeds monthly income (£{(incomePence / 100).toFixed(2)}).
        </AlertDescription>
      </Alert>
    </div>
  )

  if (visiblePots.length === 0) {
    return (
      <div>
        {header}
        {incomeRow}
        {overWarning}
        <div className="elevation-1 flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <p className="t-h2 mb-1">No pots yet</p>
          <p className="t-label text-muted-foreground mb-5 max-w-xs">
            Create your first budget pot to start allocating your income.
          </p>
          <Button variant="outline" size="sm" onClick={() => setCreateDialogOpen(true)}>
            Add pot
          </Button>
        </div>
        {dialogs}
      </div>
    )
  }

  return (
    <div>
      {header}
      {incomeRow}
      {overWarning}
      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {visiblePots.map((pot, i) => (
          <motion.div key={pot.id} variants={staggerItem}>
            <PotCard
              pot={pot}
              incomePence={incomePence}
              accent={POT_ACCENTS[i % POT_ACCENTS.length]}
              onEdit={() => setEditingPot({ id: pot.id, name: pot.name, allocatedPence: pot.allocatedPence, rollover: pot.rollover, accountId: pot.accountId })}
            />
          </motion.div>
        ))}
        <motion.div variants={staggerItem}>
          <button
            onClick={() => setCreateDialogOpen(true)}
            className="flex flex-col items-center justify-center w-full h-full min-h-[140px] rounded-3xl border-2 border-dashed border-primary/20 text-muted-foreground transition-all hover:border-primary/45 hover:text-primary hover:bg-accent"
          >
            <Plus className="h-5 w-5 mb-1.5" />
            <span className="t-label font-semibold">Add pot</span>
          </button>
        </motion.div>
      </motion.div>
      {dialogs}
    </div>
  )
}

interface PotCardProps {
  pot: Pot
  incomePence: number
  accent: { bar: string; text: string }
  onEdit: () => void
}

function PotCard({ pot, incomePence, accent, onEdit }: PotCardProps) {
  const [deletePending, setDeletePending] = useState(false)

  async function handleDelete() {
    setDeletePending(true)
    await deletePotAction(pot.id)
    setDeletePending(false)
  }

  const balance = getPotBalance(pot.allocatedPence, 0)
  const fillPct = incomePence > 0 ? Math.min(100, (pot.allocatedPence / incomePence) * 100) : 0
  const isOver = balance < 0

  return (
    <div className="elevation-1 group relative overflow-hidden border-l-4 px-5 py-5"
      style={{ borderLeftColor: accent.bar }}
    >
      {/* Actions */}
      <div className="absolute right-4 top-4 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          aria-label={`Edit ${pot.name}`}
          className="flex h-7 w-7 items-center justify-center rounded-xl bg-background/80 text-foreground/60 hover:text-foreground hover:bg-background transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              aria-label={`Delete ${pot.name}`}
              className="flex h-7 w-7 items-center justify-center rounded-xl bg-background/80 text-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete pot?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &ldquo;{pot.name}&rdquo;. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep pot</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={deletePending}>
                {deletePending ? 'Deleting…' : 'Delete pot'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Pot name + rollover */}
      <div className="flex items-center gap-2 mb-3 pr-14">
        <p className="t-h2" style={{ color: accent.text }}>
          {pot.name}
        </p>
        {pot.rollover && (
          <span
            className="t-caption font-bold rounded-full px-2 py-0.5"
            style={{ backgroundColor: `${accent.bar}22`, color: accent.text }}
          >
            Rollover
          </span>
        )}
      </div>

      <p className={`t-display font-money leading-none mb-0.5 ${isOver ? 'text-destructive' : 'text-foreground'}`}>
        £{(pot.allocatedPence / 100).toFixed(2)}
      </p>
      <p className="t-caption text-muted-foreground mb-4">allocated this month</p>

      <div
        className="h-2.5 rounded-full overflow-hidden"
        style={{ backgroundColor: `${accent.bar}28` }}
      >
        <div
          className="h-full rounded-full animate-progress"
          style={{ width: `${fillPct}%`, backgroundColor: isOver ? '#EF4444' : accent.bar }}
        />
      </div>
      {incomePence > 0 && (
        <p className="t-caption text-muted-foreground/60 mt-1.5 font-money">
          {fillPct.toFixed(0)}% of income
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify**

```bash
npm run type-check
```

- [ ] **Step 3: Commit**

```bash
git add src/components/pots/pot-list.tsx
git commit -m "style: redesign pot cards with elevation-1, left accent bar, Framer Motion stagger"
```

---

### Task 12: Create PotDonut component

**Files:**
- Create: `src/components/pots/pot-donut.tsx`

A compact donut showing pot allocation proportions, reusing the same SVG approach as `spending-donut.tsx`.

- [ ] **Step 1: Create pot-donut.tsx**

```tsx
'use client'

interface PotSlice {
  name: string
  allocatedPence: number
  color: string
}

interface PotDonutProps {
  pots: PotSlice[]
  totalPence: number
}

export function PotDonut({ pots, totalPence }: PotDonutProps) {
  const allocated = pots.reduce((s, p) => s + p.allocatedPence, 0)
  const unallocated = Math.max(0, totalPence - allocated)

  const allSlices = [
    ...pots.filter((p) => p.allocatedPence > 0),
    ...(unallocated > 0 ? [{ name: 'Unallocated', allocatedPence: unallocated, color: 'var(--muted)' }] : []),
  ]

  if (allSlices.length === 0) return null

  const cx = 40
  const cy = 40
  const r = 28
  const circumference = 2 * Math.PI * r
  let offset = 0

  const paths = allSlices.map((slice) => {
    const fraction = slice.allocatedPence / totalPence
    const dashArray = `${fraction * circumference} ${circumference}`
    const rotation = (offset / totalPence) * 360 - 90
    offset += slice.allocatedPence
    return { dashArray, rotation, color: slice.color, name: slice.name }
  })

  const pct = totalPence > 0 ? Math.round((allocated / totalPence) * 100) : 0

  return (
    <div className="relative w-[80px] h-[80px] shrink-0">
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
        {paths.map((p, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={p.color}
            strokeWidth="12"
            strokeDasharray={p.dashArray}
            strokeDashoffset={0}
            style={{ transform: `rotate(${p.rotation}deg)`, transformOrigin: `${cx}px ${cy}px` }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="t-caption font-money font-bold text-foreground">{pct}%</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

```bash
npm run type-check
```

- [ ] **Step 3: Commit**

```bash
git add src/components/pots/pot-donut.tsx
git commit -m "feat: add PotDonut allocation chart component"
```

---

### Task 13: Create KpiCard component

**Files:**
- Create: `src/components/ui/kpi-card.tsx`

- [ ] **Step 1: Create kpi-card.tsx**

```tsx
import type { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  label: string
  value: string
  sub: string
  intent: 'default' | 'success' | 'warning' | 'danger'
  icon: LucideIcon
}

const intentStyles: Record<KpiCardProps['intent'], { sub: string; iconBg: string; icon: string }> = {
  default:  { sub: 'text-muted-foreground',       iconBg: 'bg-muted',           icon: 'text-muted-foreground' },
  success:  { sub: 'text-[var(--color-success)]',  iconBg: 'bg-[var(--color-success-bg)]', icon: 'text-[var(--color-success)]' },
  warning:  { sub: 'text-[var(--color-warning)]',  iconBg: 'bg-[var(--color-warning-bg)]', icon: 'text-[var(--color-warning)]' },
  danger:   { sub: 'text-destructive',             iconBg: 'bg-destructive/10',  icon: 'text-destructive' },
}

export function KpiCard({ label, value, sub, intent, icon: Icon }: KpiCardProps) {
  const styles = intentStyles[intent]

  return (
    <div className="elevation-1 px-5 py-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="t-label text-muted-foreground">{label}</span>
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${styles.iconBg}`}>
          <Icon className={`h-3.5 w-3.5 ${styles.icon}`} />
        </div>
      </div>
      <p className="t-display font-money leading-none">{value}</p>
      <p className={`t-caption ${styles.sub}`}>{sub}</p>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

```bash
npm run type-check
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/kpi-card.tsx
git commit -m "feat: add KpiCard component for dashboard stat tiles"
```

---

### Task 14: Update DashboardView — KPI cards and style upgrades

**Files:**
- Modify: `src/components/dashboard/dashboard-view.tsx`

Changes: add 4 KPI cards above the hero card; replace all `animate-reveal-up` / `card-elevated` patterns with `elevation-1` and Framer Motion; replace hardcoded `#00B9A9` with `var(--color-success)`; replace `style={{ background: '#14233C' }}` hero card with a CSS-variable-safe version.

- [ ] **Step 1: Update the imports section (lines 1–11)**

Replace the existing imports with:

```tsx
'use client'

import { useMember } from '@/lib/context/member-context'
import { calculatePayWindowAllocations, getCurrentPayWindow, getWindowEnd, type PayFrequency, type Account, type Pot } from '@/lib/engine/paycheck'
import type { Bill as EngineBill, BillFrequency } from '@/lib/engine/types'
import { getPeriodsUntilDate, getSavingsContributionPerPeriod } from '@/lib/engine/savings'
import { motion } from 'framer-motion'
import { format, endOfMonth } from 'date-fns'
import { CreditCard, PiggyBank, Receipt, Target, Banknote, TrendingDown, Calendar } from 'lucide-react'
import { KpiCard } from '@/components/ui/kpi-card'
import { staggerContainer, staggerItem } from '@/components/motion'
```

- [ ] **Step 2: Remove the `POT_ACCENTS` `bg` field from the constant**

Change the `POT_ACCENTS` constant from:
```tsx
const POT_ACCENTS = [
  { bar: '#FF3B30', bg: '#FFF0EE', text: '#B80A00' },
  ...
```
to:
```tsx
const POT_ACCENTS = [
  { bar: '#FF3B30', text: '#B80A00' },
  { bar: '#00B9A9', text: '#007870' },
  { bar: '#FFC800', text: '#8A6B00' },
  { bar: '#14233C', text: '#14233C' },
  { bar: '#E8634A', text: '#B84225' },
  { bar: '#3EC9BA', text: '#1A8075' },
  { bar: '#FFD340', text: '#8A7000' },
  { bar: '#5B8AC5', text: '#2D5F94' },
]
```

- [ ] **Step 3: Add KPI data derivation after `commitPct` (after line ~227)**

After the line `const commitPct = payPence > 0 ? Math.min(100, ...` add:

```tsx
  const totalDebtPence = visibleDebts.reduce((s, d) => s + d.balancePence, 0)
  const totalSavedPence = savingsGoals.reduce((s, g) => s + g.savedPence, 0)
  const totalTargetPence = savingsGoals.reduce((s, g) => s + g.targetPence, 0)
  const savingsPct = totalTargetPence > 0 ? Math.round((totalSavedPence / totalTargetPence) * 100) : 0
  const billsDueCount = memberBillRecords.length
```

Note: `totalDebtPence` is already computed later in the file — remove the duplicate declaration when you see it.

- [ ] **Step 4: Add KPI row to the main return (before the hero card)**

In the `return (...)` block, replace:

```tsx
return (
  <div className="px-8 py-8 max-w-2xl">

    {/* Pay period header */}
    <div
      className="animate-reveal-up relative overflow-hidden rounded-3xl px-6 py-6 text-white mb-5"
```

with:

```tsx
return (
  <div className="px-8 py-8 max-w-2xl">

    {/* KPI cards */}
    <motion.div
      className="grid grid-cols-2 gap-3 mb-5"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <motion.div variants={staggerItem}>
        <KpiCard
          label="Income"
          value={fmt(payPence)}
          sub="this period"
          intent="default"
          icon={Banknote}
        />
      </motion.div>
      <motion.div variants={staggerItem}>
        <KpiCard
          label="Committed"
          value={`${commitPct.toFixed(0)}%`}
          sub={isShort ? 'over budget' : 'of income'}
          intent={isShort ? 'danger' : commitPct > 95 ? 'warning' : 'success'}
          icon={Receipt}
        />
      </motion.div>
      <motion.div variants={staggerItem}>
        <KpiCard
          label="Total Debt"
          value={fmt(totalDebtPence)}
          sub={totalDebtPence > 0 ? `${visibleDebts.length} active` : 'debt free'}
          intent={totalDebtPence > 0 ? 'warning' : 'success'}
          icon={TrendingDown}
        />
      </motion.div>
      <motion.div variants={staggerItem}>
        <KpiCard
          label="Savings"
          value={`${savingsPct}%`}
          sub={totalTargetPence > 0 ? 'of goals saved' : 'no goals set'}
          intent={savingsPct >= 80 ? 'success' : savingsPct > 0 ? 'warning' : 'default'}
          icon={Target}
        />
      </motion.div>
    </motion.div>

    {/* Pay period header */}
    <div
      className="relative overflow-hidden rounded-3xl px-6 py-6 text-white mb-5"
```

- [ ] **Step 5: Replace all remaining `animate-reveal-up card-elevated` and `card-elevated` occurrences**

Find and replace in the file:
- `className="animate-reveal-up card-elevated` → `className="elevation-1`
- `className="animate-reveal-up card-elevated` (with style delay props) → `className="elevation-1`
- `style={{ '--delay': '...ms' } as CSSProperties}` — remove these props from elements that no longer use CSS animations
- `style={{ color: '#00B9A9' }}` → `style={{ color: 'var(--color-success)' }}`
- `style={{ color: '#FF6B5E' }}` → `className="text-destructive"`
- Background on pot rows: `style={{ backgroundColor: accent.bg }}` — remove (no `bg` field anymore)

For pot rows, the `style={{ backgroundColor: accent.bg }}` lines need to be removed. Replace with plain `<div>`:
```tsx
<div key={pot.potId}>
```

- [ ] **Step 6: Remove the duplicate `totalDebtPence` declaration**

The original file already has `const totalDebtPence = visibleDebts.reduce(...)` — if you added it in Step 3, remove the second occurrence.

- [ ] **Step 7: Remove unused `CSSProperties` import**

Remove `import type { CSSProperties } from 'react'` if it's still in the imports.

- [ ] **Step 8: Verify**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add src/components/dashboard/dashboard-view.tsx
git commit -m "style: add KPI cards to dashboard, replace card-elevated with elevation-1, Framer Motion"
```

---

### Task 15: Update Savings list — upgraded progress bars

**Files:**
- Modify: `src/components/savings/savings-list.tsx`

- [ ] **Step 1: Find and update all progress bar instances**

In `savings-list.tsx`, find all uses of the `<Progress>` shadcn component or any `h-2.5` progress bar implementations.

Replace each progress bar section. The pattern to find:
```tsx
<Progress value={...} className="h-2.5 ..." />
```
Or custom progress bar div patterns. Replace with:
```tsx
<div className="relative h-3 rounded-full overflow-hidden bg-muted">
  <div
    className="h-full rounded-full animate-progress"
    style={{ width: `${Math.min(100, pct)}%`, backgroundColor: 'var(--color-success)' }}
  />
</div>
<div className="flex justify-between items-center mt-1">
  <span className="t-caption text-muted-foreground/60">{pct.toFixed(0)}% saved</span>
  <span className="t-caption font-money text-muted-foreground">
    £{(savedPence / 100).toFixed(2)} / £{(targetPence / 100).toFixed(2)}
  </span>
</div>
```

Where `pct = targetPence > 0 ? (savedPence / targetPence) * 100 : 0`.

- [ ] **Step 2: Replace page header with type scale**

Find `<h1 className="text-2xl font-bold` (or similar) and replace with `<h1 className="t-h1`.

- [ ] **Step 3: Update any `animate-reveal-up` classes**

Remove `animate-reveal-up` className and `style={{ '--delay': '...' }}` props (Framer Motion handles this at the page level now).

- [ ] **Step 4: Verify**

```bash
npm run type-check
```

- [ ] **Step 5: Commit**

```bash
git add src/components/savings/savings-list.tsx
git commit -m "style: upgrade savings progress bars to taller design with success colour"
```

---

### Task 16: Update BillList and DebtList — elevation wrapper and type scale

**Files:**
- Modify: `src/components/bills/bill-list.tsx`
- Modify: `src/components/debts/debt-list.tsx`

- [ ] **Step 1: Update bills/bill-list.tsx page header and card wrapper**

Find the outermost wrapping div of the bill list content and add `elevation-1` to the container. Replace the heading:
- `<h1 className="text-2xl font-bold tracking-tight` → `<h1 className="t-h1`
- `<p className="text-sm text-muted-foreground` → `<p className="t-body text-muted-foreground`
- Remove `animate-reveal-up` class and `--delay` style props.

- [ ] **Step 2: Update debts/debt-list.tsx page header and card wrapper**

Same pattern as bills:
- `<h1 className="text-2xl font-bold tracking-tight` → `<h1 className="t-h1`
- Remove `animate-reveal-up` class and `--delay` style props.
- Debt balance values: add `font-money` class to monetary spans.

- [ ] **Step 3: Verify**

```bash
npm run type-check
```

- [ ] **Step 4: Commit**

```bash
git add src/components/bills/bill-list.tsx src/components/debts/debt-list.tsx
git commit -m "style: update bills and debts lists with type scale and remove CSS animation classes"
```

---

### Task 17: Update ForecastView — semantic colour tokens and dark mode

**Files:**
- Modify: `src/components/forecast/forecast-view.tsx`

- [ ] **Step 1: Replace hardcoded colour values**

In `forecast-view.tsx`, find all hardcoded hex values and inline colour styles. Apply replacements:
- Any `text-[13px]`, `text-[12px]` etc. → nearest type scale class (`.t-body`, `.t-label`, `.t-caption`)
- `<Card>` components: add `elevation-1` className and remove any conflicting shadow classes
- Page heading: `<h1 className="text-2xl font-bold` → `<h1 className="t-h1`
- Remove `animate-reveal-up` classes and `--delay` style props
- Monetary values: add `font-money` to currency spans

- [ ] **Step 2: Verify**

```bash
npm run type-check
```

- [ ] **Step 3: Commit**

```bash
git add src/components/forecast/forecast-view.tsx
git commit -m "style: update forecast view with type scale, elevation-1 cards, semantic tokens"
```

---

### Task 18: Update FinancesView — elevation-1 account cards

**Files:**
- Modify: `src/components/finances/finances-view.tsx`

- [ ] **Step 1: Wrap account sections in elevation-1**

In `finances-view.tsx`, find the per-account rendering block. Each account's card wrapper should use `elevation-1`. The current pattern likely has an outer div per account — add `elevation-1 mb-4` to that div.

- [ ] **Step 2: Update page heading and monetary displays**

- Any `<h1 className="text-2xl font-bold` → `<h1 className="t-h1`
- Account total amounts: add `t-display font-money` classes
- Remove `animate-reveal-up` classes and `--delay` style props
- Replace `style={{ color: ACCOUNT_COLORS[i] }}` on colour dots with `style={{ background: ACCOUNT_COLORS[i] }}` on an `8px` dot span

- [ ] **Step 3: Verify**

```bash
npm run type-check
```

- [ ] **Step 4: Commit**

```bash
git add src/components/finances/finances-view.tsx
git commit -m "style: update finances view with elevation-1 account cards and type scale"
```

---

### Task 19: Update login page — replace hardcoded inline styles

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/components/login-form.tsx`

- [ ] **Step 1: Update login/page.tsx**

Replace inline background colour with Tailwind class and update heading typography:

```tsx
import { LoginForm } from '@/components/login-form'

export default function LoginPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 bg-accent">
      {/* Decorative radial glows */}
      <div
        className="pointer-events-none fixed -top-32 -right-32 h-[400px] w-[400px] rounded-full opacity-25"
        style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -bottom-24 -left-24 h-[320px] w-[320px] rounded-full opacity-[0.18]"
        style={{ background: 'radial-gradient(circle, var(--color-success) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div
            className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, #FF3B30 0%, #E0321F 100%)',
              boxShadow: '0 4px 16px rgba(255,59,48,0.30)',
            }}
          >
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
              <path d="M6.5 24V11.5A2.5 2.5 0 0 1 9 9h12a2.5 2.5 0 0 1 2.5 2.5V24" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
              <circle cx="15" cy="11.5" r="3.75" stroke="white" strokeWidth="2.2"/>
              <path d="M10.5 17.5h9M10.5 21.5h5.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="text-center">
            <h1 className="t-display">PotPlanner</h1>
            <p className="t-body text-muted-foreground mt-0.5">Your money, organised.</p>
          </div>
        </div>

        {/* Card */}
        <div className="elevation-2 px-7 py-8">
          <p className="t-caption uppercase tracking-[0.16em] text-muted-foreground mb-6">
            Sign in to your account
          </p>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update login-form.tsx — replace onFocus/onBlur imperative style mutations with CSS classes**

The current form uses `onFocus`/`onBlur` to imperatively mutate `e.target.style`. Replace with Tailwind focus classes:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        router.push('/')
        router.refresh()
      } else if (res.status === 401) {
        setError('Invalid email or password.')
      } else if (res.status === 429) {
        setError('Too many attempts. Please try again later.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'h-11 w-full rounded-xl border border-border bg-muted px-4 text-sm text-foreground transition-all focus:outline-none focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="t-label font-semibold text-foreground">
          Email address
        </label>
        <input
          id="email"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="t-label font-semibold text-foreground">
          Password
        </label>
        <input
          id="password"
          type="password"
          name="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-primary/25 bg-accent px-4 py-2.5 t-label text-destructive"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-1 flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-primary-foreground bg-primary transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" />
              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Signing in
          </span>
        ) : 'Sign in'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Verify**

```bash
npm run type-check
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(auth\)/login/page.tsx src/components/login-form.tsx
git commit -m "style: replace hardcoded hex styles on login page with CSS variables and Tailwind classes"
```

---

### Task 20: Final type-check and build verification

**Files:** None (verification only)

- [ ] **Step 1: Full type-check**

```bash
npm run type-check
```

Expected: 0 errors.

- [ ] **Step 2: Production build**

```bash
npm run build
```

Expected: build completes without errors. Note: the build requires the database and Redis to be running for the type-check step only — if the build fails on DB connection, that is expected in CI without the service; check that no TypeScript errors are reported.

- [ ] **Step 3: Run the dev server and visually verify**

```bash
npm run dev
```

Check each page:
1. Login page — gradient logo, clean form, `bg-accent` background
2. Dashboard — KPI cards row, hero card, account allocation cards with `elevation-1`
3. Pots — left accent bar cards, stagger animation, donut chart visible when income > 0
4. Accounts — account cards with `elevation-1`
5. Bills / Debts — type scale headings
6. Savings — taller progress bars in teal
7. Forecast — updated card styles
8. Sidebar — gradient header, grouped nav, theme toggle footer
9. Dark mode — toggle works, all surfaces adapt

- [ ] **Step 4: Commit any remaining fixes**

```bash
git add -p
git commit -m "style: final visual polish fixes"
```

---

## Self-Review Against Spec

| Spec section | Covered by |
|---|---|
| Semantic colour tokens | Task 2 |
| Elevation system | Task 2 |
| Typography scale | Task 2 |
| Sidebar redesign (header, groups, footer) | Tasks 5, 6, 7 |
| NavLink pill active state | Task 7 |
| BottomNav dark mode | Task 8 |
| ThemeProvider + dark mode toggle | Tasks 3, 4 |
| PageTransition Framer Motion | Tasks 9, 10 |
| Stagger animations on card grids | Tasks 11, 14 |
| Pot cards — elevation-1, left bar | Task 11 |
| Pot allocation donut chart | Task 12 |
| KpiCard component | Task 13 |
| Dashboard KPI row | Task 14 |
| Savings progress bars upgrade | Task 15 |
| Bills / Debts type scale | Task 16 |
| Forecast semantic tokens | Task 17 |
| Finances view elevation-1 | Task 18 |
| Login page semantic tokens | Task 19 |
| History chart Monzo colours | Task 10 (history/page.tsx chart colours updated) |
