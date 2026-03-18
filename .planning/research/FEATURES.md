# Feature Landscape

**Domain:** Personal finance / pot-based (envelope) budgeting web app
**Researched:** 2026-03-18
**Confidence:** MEDIUM — based on training knowledge (cutoff Aug 2025) covering YNAB, Monzo, Emma, Actual Budget, Copilot Money. No live web verification due to search tool unavailability.

---

## Reference Apps Surveyed

| App | Model | Key Insight |
|-----|-------|-------------|
| YNAB | Envelope budgeting SaaS | Gold standard for zero-based budgeting; "give every dollar a job" |
| Monzo | Bank with pot separation | Real money segregation; visual pot metaphor is mainstream |
| Emma | Aggregator + budgeting | Analytics-heavy; bank sync is the core value prop |
| Actual Budget | Self-hosted envelope budgeting | Privacy-first; closest open-source equivalent to this project |
| Copilot Money | Apple-ecosystem personal finance | Polish and UX-first; monthly review workflow |
| Cleo | AI-driven budgeting assistant | Conversational; gamification layer |

---

## Table Stakes

Features users expect in any budgeting app. Missing = product feels incomplete or users abandon.

| Feature | Why Expected | Complexity | V1 Covered? | Notes |
|---------|--------------|------------|-------------|-------|
| Pot / envelope creation and management | Core metaphor — without named buckets, there's no budgeting | Low | YES | Must support rename, reorder, delete, colour/icon |
| Budget allocation UI | Distributing income across pots is the primary workflow | Medium | YES (engine) | Needs clear "unallocated" residual display |
| Bills CRUD with due dates | Every budgeting app tracks recurring obligations | Low | YES | |
| Mark bill as paid | Closing the loop — users need confirmation of obligation met | Low | YES | Paid/unpaid toggle per cycle |
| Upcoming bills view / calendar | Users need to see what's due in next 7/14/30 days | Medium | Partial | Forecasting exists but a "due soon" view is distinct |
| Disposable income calculation | "What do I actually have left?" is the #1 question | Medium | YES | Must account for pots, bills, debts |
| Spending summary / breakdown | Where did money go? — universal expectation | Medium | YES (donut) | Category breakdown by time period |
| Balance display per pot | Users need to see pot balance at a glance | Low | YES | Implied by pot management |
| Income entry | You have to tell the app how much comes in | Low | YES (engine) | Single household income or multiple sources |
| Transaction / transfer history | Audit trail of what moved where | Medium | YES | |
| Mobile-responsive layout | Most personal finance is checked on phone, even on web apps | Medium | Unclear | Self-hosted web app still needs responsive design |
| Basic search / filter on history | Find a specific payment; essential once history grows | Low | Not mentioned | Low complexity, high value — commonly missed in v1 |

---

## Differentiators

Features that set a product apart. Not universally expected but highly valued by users who encounter them.

| Feature | Value Proposition | Complexity | V1 Covered? | Notes |
|---------|-------------------|------------|-------------|-------|
| Joint bill percentage splits | Household fairness without spreadsheets | Medium | YES | Rare in mainstream apps; genuine differentiator for couples |
| Debt payoff strategies (avalanche / snowball) | Structured path out of debt; users pay off 30-40% faster with a plan | Medium | YES | YNAB has debt tools but simpler; avalanche/snowball is a real edge |
| Savings goals with progress tracking | Motivation through visual progress; converts passive saving to active | Medium | YES | Best if linked to a specific pot (pot IS the savings goal) |
| Clearbit / logo enrichment for payees | Reduces cognitive load — recognisable logos vs plain text | Low | YES | Nice polish differentiator; Monzo does this |
| Bill forecasting with projection horizon | "How much will I have in 3 months?" — rare outside premium apps | High | YES (engine) | Cash-flow projection is a real differentiator |
| Potless bills tracking | Bills that don't fit neatly into a pot — real-world edge case | Low | YES | Most apps force you to categorise everything; flexibility is good |
| "Committed spend" vs "free cash" split | Shows discretionary vs fixed costs clearly — insight users love | Medium | Not explicit | YNAB has this concept; worth exposing in the disposable income calc |
| Rollover pot balances | Underspend carries forward — models real savings behaviour | Low | Not mentioned | Critical in YNAB; pots that don't reset monthly feel more real |
| Monthly budget cycle view | See a whole month's planned vs actual budget | Medium | Not mentioned | Standard in YNAB; gives "the big picture" in one view |
| Bill pay cadence (weekly / monthly / annual) | Annual subscriptions and quarterly bills exist; frequency matters | Low | Partial | v1 likely monthly-only; annual bills often missed |
| Visual allocation bar / progress ring per pot | Instant at-a-glance health of each pot | Low | Partial (donut is global) | Per-pot spend bar is a distinct and valuable addition |
| Overspend detection / alerts | "You've overspent Transport by £23" — prevents surprises | Medium | Not mentioned | YNAB highlights overspent categories in red; table stakes in YNAB, differentiator elsewhere |
| Notes / memo on bills | "This was the annual renewal" — context preserves intent | Low | Not mentioned | Low complexity, often missed, users appreciate it |
| Recurring bill auto-reset each period | Bills automatically re-activate for next cycle without manual re-entry | Medium | Not mentioned | If bills are monthly obligations, they should cycle automatically |

---

## Anti-Features

Features to explicitly NOT build. These bloat budgeting apps without proportional value — especially for a self-hosted personal tool.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Bank sync / open banking | Massive complexity (OAuth per bank, data normalisation, compliance), ongoing maintenance, unreliable APIs. No single bank sync is worth the effort for a self-hosted tool. | Manual entry + import from CSV. Users of self-hosted tools accept manual entry as the privacy trade-off. |
| AI spend categorisation | Requires bank sync to be useful; adds LLM latency and cost to a simple CRUD app; categorisation errors cause more frustration than manual entry | Predefined pot categories chosen by user |
| Push notifications / email alerts | Requires a notification service, email delivery infrastructure. Adds operational complexity disproportionate to personal use. | On-screen "upcoming bills" and overdue flags are sufficient |
| Multi-household / multi-tenant | Complete rearchitecture of data model, auth, isolation. Out of scope by design. | Single household shared session |
| Per-user individual budgets within household | Adds relational complexity (whose pot is it?). Couples either share a budget or they don't. | Single shared budget with joint split percentages |
| Social / sharing features | Budget comparison and social benchmarking adds zero value to household budgeting and significant privacy risk | N/A |
| Gamification (streaks, badges, rewards) | Infantilising for household finance; adds UI complexity with no financial benefit | Motivate through goal progress and debt payoff milestones |
| Investment portfolio tracking | Completely different domain (prices, market data APIs, unrealised gains). Separate app territory. | Link accounts by balance only, not by holding detail |
| Subscription management service | Detecting and cancelling subscriptions requires bank sync + ML. Scope creep. | Bills CRUD already covers known subscriptions |
| Receipt scanning / OCR | Mobile-first feature requiring camera/file handling + OCR pipeline. Adds ops complexity. | Manual transaction entry |
| Cryptocurrency tracking | Volatile, different mental model from budgeting, requires price APIs | Treat as an asset line-item balance, not a live feed |
| "Insights" / spend coaching from ML | Requires sufficient transaction history, ML model, likely bank sync. Adds nothing without it. | Clear reporting is enough for self-hosted personal use |

---

## Feature Dependencies

```
Income entry → Disposable income calculation
Income entry → Pot allocation engine
Pot allocation engine → Balance per pot
Pot allocation engine → Unallocated residual display

Bills CRUD → Mark as paid
Bills CRUD → Upcoming bills view
Bills CRUD → Recurring bill auto-reset
Bills CRUD → Bill forecasting
Bills CRUD + Pots → Potless bills
Bills CRUD + Pots → Overspend detection

Pot balance → Rollover / carry-forward logic
Pot balance → Per-pot progress bar
Pot balance → Spending donut chart (aggregate)

Debt tracking → Avalanche / snowball calculation
Debt tracking → Disposable income calculation (reduces free cash)

Savings goals → Pot linkage (goal IS a pot)
Savings goals → Progress visualisation

Transfer history → All CRUD operations (must be logged)
Transfer history → Search / filter

Joint split % → Bills CRUD (per-bill attribute)
Joint split % → Disposable income (split affects each person's share)
```

---

## V1 Feature Validation

Validating the known v1 feature set against the research above:

| V1 Feature | Status | Gap / Note |
|------------|--------|------------|
| Pots / envelope budgeting | Table stakes — correct | Add: rollover balances, per-pot progress bar, reorder |
| Bills CRUD + mark-as-paid | Table stakes — correct | Add: recurring auto-reset, bill cadence (not just monthly), notes field |
| Joint bill percentage splits | Differentiator — correct | Well-positioned; ensure it's visible in UI not buried |
| Financial calculation engine (disposable income, forecasting) | Differentiator — correct | "Committed vs free cash" split is worth exposing explicitly |
| Debt tracking (avalanche/snowball) | Differentiator — correct | Strong edge; ensure strategies are clearly labelled and explained |
| Savings goals | Differentiator — correct | Link goals to pots directly for coherent mental model |
| Spending donut chart | Table stakes — correct | Add: per-pot spend bar / progress ring for granular view |
| Transfer history | Table stakes — correct | Add: search/filter capability |
| Clearbit logo suggestions | Differentiator (polish) — correct | Valuable UX polish; confirm Clearbit API still available (may need fallback) |
| Potless bills | Differentiator — correct | Genuine flexibility that most apps lack |

**Gaps identified (not in v1, commonly expected):**
1. Upcoming bills view / "due soon" panel — distinct from forecasting engine
2. Bill cadence beyond monthly (weekly, annual, quarterly)
3. Recurring bill auto-reset per period
4. Rollover/carry-forward balances on pots
5. Overspend detection / visual warnings per pot
6. Notes/memo field on bills
7. Monthly budget cycle view (planned vs actual)
8. Basic search/filter on transfer history
9. "Committed spend vs free cash" explicit display in UI
10. Mobile-responsive layout (confirmed as a requirement, not just nice-to-have)

---

## MVP Recommendation

### Must Have (table stakes risk if missing)
1. Pots with balances (creation, edit, delete, reorder)
2. Income entry and pot allocation engine
3. Bills CRUD with due dates, mark-as-paid, recurring cadence
4. Disposable income display (free cash after pots + bills)
5. Upcoming bills panel (next 30 days)
6. Spending breakdown by pot (donut or bar)
7. Transfer history with basic search
8. Mobile-responsive layout

### Should Have (differentiators that justify the rebuild)
9. Joint bill percentage splits
10. Debt tracking (avalanche/snowball)
11. Savings goals linked to pots
12. Bill forecasting / cash-flow projection
13. Clearbit logo enrichment
14. Potless bills
15. Per-pot spend progress bar
16. Overspend warnings

### Nice to Have (high value, lower urgency)
17. Rollover pot balances
18. Monthly budget cycle view
19. Notes/memo on bills
20. Recurring bill auto-reset
21. "Committed vs free cash" explicit UI panel

### Defer Indefinitely (anti-features)
- Bank sync
- AI categorisation
- Push/email notifications
- Multi-tenant

---

## Sources

**Confidence note:** No live web search was available during this research session. All findings are drawn from training knowledge (cutoff August 2025) covering extensive documentation, community discussions, and feature analyses of YNAB, Monzo, Emma, Actual Budget, and Copilot Money. Confidence is MEDIUM — the feature landscape for personal budgeting is mature and stable; these findings are unlikely to have shifted significantly by March 2026.

**Key reference apps:**
- YNAB (youneedabudget.com) — envelope budgeting gold standard
- Monzo — mainstream pot metaphor validation
- Actual Budget (actualbudget.org) — closest self-hosted equivalent
- Emma — analytics and aggregation patterns
- Copilot Money — UX and polish patterns
