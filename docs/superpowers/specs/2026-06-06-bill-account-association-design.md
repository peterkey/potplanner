# Design: Bill–Account Association

**Date:** 2026-06-06
**Status:** Approved

## Problem

Bills currently have an optional `pot_id`. When no pot is assigned ("potless"), the bill has no account link either — the transfer history records `source_type: 'account'` but `source_id: NULL`, meaning the system doesn't know which account was debited.

Every bill should fall within an account, either directly or via a pot that belongs to that account.

## Goal

Add the ability to assign a bill directly to an account (when it isn't covered by a pot). Every bill must have either a `pot_id` or an `account_id`.

---

## Schema

Add a nullable `account_id` FK to the `bills` table:

```sql
ALTER TABLE bills ADD COLUMN account_id INTEGER REFERENCES accounts(id);
```

**Invariant (enforced at app level):** `pot_id IS NOT NULL OR account_id IS NOT NULL`

- When `pot_id` is set → `account_id` is null; the account is derived via `pots.account_id`
- When `pot_id` is null → `account_id` must be set

Existing potless bills will need `account_id` populated via a migration default or a one-time data fix.

---

## DAL

**`createBill(name, amountPence, frequency, potId, accountId, nextDueDate, splits)`**
- Add `accountId: number | null` parameter
- Pass to insert: `{ name, amountPence, frequency, potId, accountId, nextDueDate }`

**`updateBill(id, name, amountPence, frequency, potId, accountId, nextDueDate, splits)`**
- Same addition

**`markBillPaid` / `markBillUnpaid`**
- Transfer history source fixed:
  ```typescript
  sourceType: bill.potId ? 'pot' : 'account',
  sourceId: bill.potId ?? bill.accountId,   // previously null for potless bills
  ```

---

## Server Actions

**`createBillAction` / `updateBillAction`**
- Parse `accountIdStr` from form data
- Validation: if `potId` is null, `accountId` must be a valid integer
- Pass `accountId` through to the DAL

---

## UI — BillForm

The form restructures to account-first:

1. **Account** (required) — dropdown of all accounts; always shown
2. **Pot** (optional) — dropdown filtered to pots belonging to the selected account; option for "No pot (direct from account)"

When the account selection changes, the pot selection resets.

Pot filtering is client-side: `pots.filter(p => p.accountId === selectedAccountId)`.

**Props change:**
```typescript
interface BillFormProps {
  bill?: { ..., accountId: number | null } | null
  pots: Array<{ id: number; name: string; accountId: number | null }>
  accounts: Array<{ id: number; name: string }>   // new
  defaultPotId?: number | null
  onClose: () => void
}
```

---

## UI — BillList

- "Potless" label replaced by the account name for bills with `accountId`
- Section heading "Potless bills" → "Account bills"
- Helper `getPotName` extended to `getSourceLabel(bill, pots, accounts)` returning pot name or account name

**Props change:**
```typescript
interface BillListProps {
  bills: Bill[]   // Bill gains accountId: number | null
  pots: Pot[]
  accounts: Array<{ id: number; name: string }>   // new
}
```

The bills page already has access to accounts (they're fetched for the app); they just need passing down.

---

## Data Migration

Existing potless bills have `account_id = NULL`. Two options:
- **Simple:** migration sets `account_id = NULL` by default (no data fix needed for existing rows during dev; a follow-up script can assign accounts manually)
- **Better:** if only one account exists, migration can default-assign it

For now, the migration just adds the nullable column. The form validation prevents new bills from being created without an account. Existing data is soft-broken (potless + no account) but doesn't block the feature.

---

## Out of Scope

- Requiring `account_id` at the DB level via CHECK constraint (app validation is sufficient)
- Filtering bills by account on the bills page
- Showing account bills under the accounts page
