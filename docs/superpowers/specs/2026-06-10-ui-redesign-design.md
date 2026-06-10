# PotPlanner UI Redesign — Design Spec

**Date:** 2026-06-10
**Scope:** Visual/styling only — zero functionality changes
**Approach:** Option C — Full Brand Redesign (Monzo-inspired, polished)

---

## Constraints

- No layout structure changes (sidebar + main stays, bottom nav stays)
- No data flow changes, no new server actions, no schema changes
- No route changes
- Dark mode is additive — all existing light mode behaviour unchanged
- IBM Plex Sans stays as the primary font
- shadcn/ui component structure stays — only visual tokens and classNames change

---

## New Dependencies

| Package | Purpose |
|---|---|
| `next-themes` | Theme provider + `localStorage` persistence for light/system/dark |
| `framer-motion` | Page transitions and stagger animations (replaces CSS `animate-reveal-*`) |
| `recharts` | Pot allocation donut chart (check if already installed via shadcn) |

---

## Section 1 — Colour Token System

### Primitives (unchanged)

| Name | Hex | OKLCH approx |
|---|---|---|
| Hot Coral | `#FF3B30` | `oklch(0.62 0.235 22)` |
| Navy | `#14233C` | `oklch(0.19 0.045 248)` |
| Teal | `#00B9A9` | `oklch(0.679 0.108 185)` |
| Amber | `#FFC800` | `oklch(0.866 0.170 88)` |
| Blush | `#FFF0EE` | `oklch(0.971 0.012 22)` |

### New semantic CSS variables (added to `globals.css`)

```css
:root {
  --color-success:         oklch(0.679 0.108 185);   /* Teal — positive balance, goals on track */
  --color-success-bg:      oklch(0.96 0.025 185);    /* Teal tint — success card backgrounds */
  --color-warning:         oklch(0.866 0.170 88);    /* Amber — over-allocated, due soon */
  --color-warning-bg:      oklch(0.98 0.040 88);     /* Amber tint */
  --color-income:          oklch(0.19 0.045 248);    /* Navy — income amounts */
  --color-surface-1:       oklch(1 0 0);             /* Cards/panels (= --card) */
  --color-surface-2:       oklch(0.981 0.002 55);    /* Page background (= --background) */
  --color-surface-3:       oklch(0.953 0 0);         /* Inset areas, tags (= --muted) */
  --sidebar-header-bg:     oklch(0.997 0.004 22);    /* Coral-tinted sidebar header */
}

.dark {
  --color-success:         oklch(0.72 0.108 185);
  --color-success-bg:      oklch(0.20 0.040 185);
  --color-warning:         oklch(0.90 0.170 88);
  --color-warning-bg:      oklch(0.20 0.060 88);
  --color-income:          oklch(0.96 0.003 55);
  --color-surface-1:       oklch(0.15 0.013 248);
  --color-surface-2:       oklch(0.10 0.010 248);
  --color-surface-3:       oklch(0.20 0.013 248);
  --sidebar-header-bg:     oklch(0.13 0.015 248);
}
```

---

## Section 2 — Surface & Elevation System

Three tiers. Applied via utility classes defined in `globals.css`:

```css
.elevation-0 { /* flat — page bg, no shadow */ }
.elevation-1 { background: var(--color-surface-1); border: 1px solid var(--border); box-shadow: 0 1px 3px oklch(0.19 0.045 248 / 6%); border-radius: var(--radius-2xl); }
.elevation-2 { background: var(--color-surface-1); box-shadow: 0 8px 32px oklch(0.19 0.045 248 / 12%); border-radius: var(--radius-2xl); }
.elevation-3 { /* full-screen dialogs — handled by shadcn DialogOverlay */ }
```

Dark mode adjustments: `elevation-1` drops the shadow (invisible on dark) and uses a brighter border. `elevation-2` uses `0 8px 32px oklch(0 0 0 / 40%)`.

### Card hover behaviour

Tier 1 cards gain hover: `box-shadow` transitions to Tier 2 level + `translateY(-1px)`, `transition: box-shadow 150ms ease-out, transform 150ms ease-out`.

---

## Section 3 — Typography Scale

New utility classes added to `globals.css`. IBM Plex Sans stays. Geist Mono added for monetary values.

```css
.t-display { font-size: 2rem;      line-height: 1.1;  font-weight: 700; letter-spacing: -0.02em; }
.t-h1      { font-size: 1.375rem;  line-height: 1.25; font-weight: 700; letter-spacing: -0.01em; }
.t-h2      { font-size: 1rem;      line-height: 1.25; font-weight: 600; }
.t-body    { font-size: 0.875rem;  line-height: 1.5;  font-weight: 400; }
.t-label   { font-size: 0.75rem;   line-height: 1.4;  font-weight: 500; }
.t-caption { font-size: 0.6875rem; line-height: 1.4;  font-weight: 500; }
```

Monetary values: `font-family: var(--font-geist-mono), monospace; font-variant-numeric: tabular-nums;` — applied via `.font-money` utility class.

All `text-[10px]`, `text-[10.5px]`, `text-[12.5px]`, `text-[13px]`, `text-[26px]` instances replaced with scale classes.

---

## Section 4 — Sidebar Redesign

File: `src/components/sidebar.tsx`

### Header

- Background: `var(--sidebar-header-bg)` (coral-tinted in light, dark navy in dark)
- Logo icon: coral-to-crimson gradient square (`from-[#FF3B30] to-[#E0321F]`), `drop-shadow-sm`
- Wordmark: 17px, `font-bold tracking-tight`
- Separator: `1px solid var(--sidebar-border)`

### Member select

Unchanged functionality. Height stays `h-8`.

### Nav groups

Two labelled sections:

```
OVERVIEW        ← .t-caption uppercase tracking-widest text-muted-foreground/50
  Dashboard
  Accounts
  Income

PLANNING
  Forecast
  Debts
  Savings

SETTINGS
  Household
```

### Nav link active state

Active: full-width `rounded-xl` pill, `bg-primary/8` background, icon + label `text-primary`, `border-l-2 border-primary`.
Hover (inactive): `bg-muted/60`, `100ms` transition.

### Footer (new)

```
├─────────────────────────┤
│  [Light][System][Dark]  │  ← 3-state theme toggle pill
│  [P] Peter    [logout]  │  ← avatar initial + name + logout icon
└─────────────────────────┘
```

- Theme toggle: `next-themes` `useTheme()` hook, 3 buttons styled as a pill group
- Avatar: coloured circle, initial from session user name (passed as prop from layout)
- Sign out: icon button, calls existing logout action

Layout prop: `sidebar.tsx` receives `userName: string` from `app/(app)/layout.tsx` (already has `verifySession()` which returns session data).

---

## Section 5 — Card System

### Pot cards (`src/components/pots/pot-list.tsx` — `PotCard`)

- Remove full `backgroundColor: accent.bg` on the card
- Add `elevation-1` class
- Add `border-l-4` with `accent.bar` colour (left accent bar)
- Hover lift: `hover:-translate-y-px hover:shadow-md transition-all duration-150`
- Pot name: `.t-h2`
- Amount: `.t-display .font-money`
- Sub-label: `.t-caption`
- Progress bar: unchanged height, uses `accent.bar`

### Account cards (`src/components/finances/finances-view.tsx`)

- Each account section gets `elevation-1` wrapper
- Account total gets `.t-display .font-money`
- Colour dot (8px circle) instead of coloured text

### Empty states (all pages)

Consistent pattern:
```jsx
<div className="elevation-1 flex flex-col items-center py-20 text-center rounded-3xl">
  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
    <Icon className="h-6 w-6 text-primary" />
  </div>
  <p className="t-h2 mb-1">{title}</p>
  <p className="t-body text-muted-foreground mb-5 max-w-xs">{description}</p>
  <Button size="sm">{cta}</Button>
</div>
```

---

## Section 6 — Dashboard KPI Cards

File: `src/components/dashboard/dashboard-view.tsx`

New `<KpiCard>` component (pure presentational, no data fetching):

```tsx
interface KpiCardProps {
  label: string
  value: string
  sub: string
  intent: 'default' | 'success' | 'warning' | 'danger'
}
```

Four cards rendered in a `grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8`:

| Card | Value source | Intent logic |
|---|---|---|
| Net Income | Sum of `incomes` array | `default` |
| Allocated | Sum of pot allocations | `warning` if >95% of income, else `default` |
| Bills Due | Count of bills due this month | `warning` if any due <7 days, `danger` if overdue |
| Savings | % of goals on track | `success` if all on track, `warning` otherwise |

Card body: `.t-label` label, `.t-display .font-money` value, `.t-caption` sub, semantic colour on sub text.

---

## Section 7 — Data Visualisations

### Pot allocation donut chart

File: `src/app/(app)/pots/page.tsx` + `src/components/pots/pot-list.tsx`

- Recharts `PieChart` / `Pie` with `innerRadius` (donut)
- Positioned to the right of the income input row on desktop; hidden on mobile
- Each slice colour = `accent.bar` of the corresponding pot
- Centre label: total allocated / income as percentage
- No tooltips needed — the cards below already show the detail

### Savings goal bars

File: `src/components/savings/savings-list.tsx`

- Upgrade from `h-2.5` to `h-3` bars
- Add percentage label inline at the right end of the bar
- Target marker line at the 100% position (thin `w-0.5 h-5` vertical line)
- Fill colour: `var(--color-success)`

### Forecast chart

File: `src/components/forecast/` — update stroke/fill colours to use CSS variables so dark mode renders correctly.

---

## Section 8 — Framer Motion Page Transitions

### New files

`src/components/page-transition.tsx` — shared wrapper:

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

`src/components/stagger-children.tsx` — for card grids:

```tsx
export const staggerContainer = { animate: { transition: { staggerChildren: 0.04 } } }
export const staggerItem = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }
```

### Migration

- All page components wrap their return in `<PageTransition>`
- All `animate-reveal-up` / `animate-reveal-fade` CSS classes removed
- Card grids wrapped in `<motion.div variants={staggerContainer}>`; each card in `<motion.div variants={staggerItem}>`
- CSS `@keyframes reveal-up` and `@keyframes reveal-fade` removed from `globals.css`
- `--delay` CSS custom property usage removed

---

## Section 9 — Dark Mode

### Setup

1. Install `next-themes`
2. `src/app/layout.tsx`: wrap `<body>` in `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>`
3. `src/components/sidebar.tsx`: add `ThemeToggle` component in footer using `useTheme()`
4. `globals.css`: the `.dark` class block already exists — no changes needed beyond semantic tokens

### ThemeToggle

3-state pill (Light / System / Dark). Each state is a small button. Active state: `bg-primary/10 text-primary`. Inactive: `text-muted-foreground`. The pill container: `bg-muted rounded-lg p-0.5 flex`.

### Bottom nav dark mode

The bottom nav uses hardcoded `#FF3B30` and `#14233C` hex values — replace with `text-primary` and `text-foreground` Tailwind classes so it responds to the theme automatically.

---

## Files to Create/Modify

### New files
- `src/components/page-transition.tsx`
- `src/components/ui/kpi-card.tsx`
- `src/components/ui/theme-toggle.tsx`

### Modified files
- `src/app/layout.tsx` — add ThemeProvider
- `src/app/(app)/layout.tsx` — pass userName to Sidebar
- `src/app/globals.css` — semantic tokens, elevation classes, typography scale, remove reveal keyframes
- `src/components/sidebar.tsx` — full redesign (header, nav groups, footer)
- `src/components/bottom-nav.tsx` — replace hardcoded hex with Tailwind theme classes
- `src/components/nav-link.tsx` — new active/hover pill styles
- `src/components/pots/pot-list.tsx` — card elevation, left accent bar, Framer Motion stagger
- `src/components/finances/finances-view.tsx` — account card elevation, display numbers
- `src/components/dashboard/dashboard-view.tsx` — KPI cards row
- `src/components/savings/savings-list.tsx` — upgraded progress bars
- `src/components/bills/bill-list.tsx` — elevation-1 cards
- `src/components/debts/debt-list.tsx` — elevation-1 cards
- All page components — wrap in `<PageTransition>`

---

## What Does NOT Change

- All server actions, DAL functions, API routes
- All form logic and validation
- All data fetching patterns
- Routing and navigation structure
- shadcn/ui component internals
- Database schema
- Any financial calculation logic
