'use client'

import { useState, useMemo } from 'react'
import { useMember } from '@/lib/context/member-context'
import { format } from 'date-fns'
import { Plus, Pencil, Trash2, CreditCard, PiggyBank, Receipt, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { AccountForm } from '@/components/accounts/account-form'
import { PotForm } from '@/components/pots/pot-form'
import { BillForm } from '@/components/bills/bill-form'
import { deleteAccountAction } from '@/app/actions/accounts'
import { deletePotAction } from '@/app/actions/pots'
import { deleteBillAction } from '@/app/actions/bills'
import { BillLogo } from '@/components/bill-logo'

interface AccountShare { memberId: number; memberName: string; defaultPercentage: number }
interface Account { id: number; name: string; ownerId: number | null; ownerName: string | null; shares: AccountShare[] }
interface Pot { id: number; name: string; allocatedPence: number; rollover: boolean; accountId: number | null }
interface Split { id: number; memberId: number; memberName: string; percentage: number }
interface Bill { id: number; name: string; amountPence: number; frequency: string; potId: number | null; accountId: number | null; nextDueDate: Date; splits: Split[] }
interface Debt { id: number; name: string; minimumPaymentPence: number; paymentDueDate: Date | null; accountId: number | null; potId: number | null }
interface Member { id: number; name: string }

interface Props {
  accounts: Account[]
  pots: Pot[]
  bills: Bill[]
  debts: Debt[]
  members: Member[]
}

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Weekly', biweekly: 'Every 2 wks', four_weekly: 'Every 4 wks', monthly: 'Monthly', annual: 'Annual',
}

const ACCOUNT_COLORS = ['#FF3B30', '#00B9A9', '#FFC800', '#14233C', '#E8634A', '#3EC9BA']

function fmt(pence: number) {
  return `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getMemberBillAmount(bill: Bill, activeMemberId: number | null): number {
  if (!activeMemberId || bill.splits.length === 0) return bill.amountPence
  const split = bill.splits.find((s) => s.memberId === activeMemberId)
  if (!split) return bill.amountPence
  return Math.round(bill.amountPence * split.percentage / 100)
}

function isBillRelevantToMember(bill: Bill, activeMemberId: number | null): boolean {
  if (!activeMemberId || bill.splits.length === 0) return true
  return bill.splits.some((s) => s.memberId === activeMemberId)
}

export function FinancesView({ accounts, pots, bills, debts, members }: Props) {
  const { activeMemberId } = useMember()
  const visibleAccounts = activeMemberId
    ? accounts.filter(
        (a) => a.ownerId === activeMemberId || a.shares.some((s) => s.memberId === activeMemberId)
      )
    : accounts

  const [createAccountOpen, setCreateAccountOpen] = useState(false)
  const [editAccount, setEditAccount] = useState<Account | null>(null)
  const [createPotFor, setCreatePotFor] = useState<number | null | undefined>(undefined) // undefined = closed
  const [editPot, setEditPot] = useState<Pot | null>(null)
  const [createBillFor, setCreateBillFor] = useState<number | null | undefined>(undefined) // pot ID, undefined = closed
  const [createAccountBillFor, setCreateAccountBillFor] = useState<number | undefined>(undefined) // account ID, undefined = closed
  const [editBill, setEditBill] = useState<Bill | null>(null)

  const potsByAccount = useMemo(() => {
    const map = new Map<number | null, Pot[]>()
    for (const pot of pots) {
      const key = pot.accountId ?? null
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(pot)
    }
    return map
  }, [pots])

  const billsByPot = useMemo(() => {
    const map = new Map<number | null, Bill[]>()
    for (const bill of bills) {
      const key = bill.potId ?? null
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(bill)
    }
    return map
  }, [bills])

  // Bills with no pot, grouped by their account
  const accountDirectBills = useMemo(() => {
    const map = new Map<number | null, Bill[]>()
    for (const bill of bills) {
      if (bill.potId !== null) continue
      const key = bill.accountId ?? null
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(bill)
    }
    return map
  }, [bills])

  // Debts grouped by potId (for pot-level) and accountId (for account-level direct)
  const debtsByPot = useMemo(() => {
    const map = new Map<number, Debt[]>()
    for (const debt of debts) {
      if (debt.potId === null) continue
      if (!map.has(debt.potId)) map.set(debt.potId, [])
      map.get(debt.potId)!.push(debt)
    }
    return map
  }, [debts])

  const accountDirectDebts = useMemo(() => {
    const map = new Map<number, Debt[]>()
    for (const debt of debts) {
      if (debt.potId !== null || debt.accountId === null) continue
      if (!map.has(debt.accountId)) map.set(debt.accountId, [])
      map.get(debt.accountId)!.push(debt)
    }
    return map
  }, [debts])

  const allUnassignedPots = potsByAccount.get(null) ?? []
  const allUnlinkedBills = accountDirectBills.get(null) ?? []

  // When a member is active, only show pots/bills that have at least one bill relevant to that member
  const unassignedPots = activeMemberId
    ? allUnassignedPots.filter((pot) =>
        (billsByPot.get(pot.id) ?? []).some((b) => isBillRelevantToMember(b, activeMemberId))
      )
    : allUnassignedPots
  const unlinkedBills = activeMemberId
    ? allUnlinkedBills.filter((b) => isBillRelevantToMember(b, activeMemberId))
    : allUnlinkedBills

  const visibleAccountIds = useMemo(() => new Set(visibleAccounts.map((a) => a.id)), [visibleAccounts])

  const visiblePotsCount = useMemo(() => {
    const accountPotsCount = pots.filter((p) => p.accountId !== null && visibleAccountIds.has(p.accountId)).length
    return accountPotsCount + unassignedPots.length
  }, [pots, visibleAccountIds, unassignedPots])

  const visibleBillsCount = useMemo(() => {
    const visiblePotIds = new Set(
      pots.filter((p) => p.accountId !== null && visibleAccountIds.has(p.accountId)).map((p) => p.id),
    )
    unassignedPots.forEach((p) => visiblePotIds.add(p.id))
    return bills.filter((b) => {
      if (b.potId !== null) return visiblePotIds.has(b.potId)
      if (b.accountId !== null) return visibleAccountIds.has(b.accountId)
      return isBillRelevantToMember(b, activeMemberId)
    }).length
  }, [bills, pots, visibleAccountIds, unassignedPots, activeMemberId])

  return (
    <div className="px-8 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="t-h1">Accounts</h1>
          <p className="t-body text-muted-foreground mt-0.5">
            {visibleAccounts.length} account{visibleAccounts.length !== 1 ? 's' : ''} · {visiblePotsCount} pot{visiblePotsCount !== 1 ? 's' : ''} · {visibleBillsCount} bill{visibleBillsCount !== 1 ? 's' : ''}
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateAccountOpen(true)}>
          <Plus className="h-4 w-4" />
          Add account
        </Button>
      </div>

      {/* Accounts */}
      {visibleAccounts.length === 0 && (
        <div
          className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border py-20 text-center mb-6"
        >
          <CreditCard className="h-8 w-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-semibold mb-1">
            {activeMemberId ? 'No accounts for this member' : 'No accounts yet'}
          </p>
          <p className="text-xs text-muted-foreground mb-5">
            {activeMemberId ? 'Switch to "All members" or add an account for this member.' : 'Add an account to start organising your pots and bills.'}
          </p>
          {!activeMemberId && (
            <Button variant="outline" size="sm" onClick={() => setCreateAccountOpen(true)}>Add account</Button>
          )}
        </div>
      )}

      {visibleAccounts.map((account, acctIdx) => {
        const acctPots = potsByAccount.get(account.id) ?? []
        const acctColor = ACCOUNT_COLORS[acctIdx % ACCOUNT_COLORS.length]

        return (
          <div
            key={account.id}
            className="elevation-1 mb-5 overflow-hidden"
          >
            {/* Account header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderLeft: `4px solid ${acctColor}` }}
            >
              <div className="flex items-center gap-3">
                <CreditCard size={16} style={{ color: acctColor }} />
                <div>
                  <p className="text-[13px] font-bold tracking-tight">{account.name}</p>
                  <p className="text-[11px] text-muted-foreground/70">
                    {account.ownerName ?? 'Unassigned'}
                    {account.shares.length > 0 && ' · Shared'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1.5 text-muted-foreground" onClick={() => setCreateAccountBillFor(account.id)}>
                  <Plus className="h-3 w-3" />
                  Add bill
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1.5 text-muted-foreground" onClick={() => setCreatePotFor(account.id)}>
                  <Plus className="h-3 w-3" />
                  Add pot
                </Button>
                <button onClick={() => setEditAccount(account)} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete account?</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently delete &ldquo;{account.name}&rdquo;. Pots linked to this account will become unassigned.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={() => deleteAccountAction(account.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* Pots */}
            {acctPots.length > 0 && (
              <div className="border-t border-border/40 divide-y divide-border/30">
                {acctPots.map((pot) => (
                  <PotSection
                    key={pot.id}
                    pot={pot}
                    bills={billsByPot.get(pot.id) ?? []}
                    debts={debtsByPot.get(pot.id) ?? []}
                    allPots={pots}
                    activeMemberId={activeMemberId}
                    onEditPot={() => setEditPot(pot)}
                    onAddBill={() => setCreateBillFor(pot.id)}
                    onEditBill={setEditBill}
                  />
                ))}
              </div>
            )}

            {acctPots.length === 0 && (accountDirectBills.get(account.id) ?? []).length === 0 && (
              <div className="border-t border-border/40 px-5 py-4 text-center">
                <p className="text-[12px] text-muted-foreground/60">No pots or bills in this account yet.</p>
                <button onClick={() => setCreatePotFor(account.id)} className="text-[12px] text-primary hover:underline mt-0.5">
                  Add first pot
                </button>
              </div>
            )}

            {/* Account-level bills and debts (no pot) */}
            {((accountDirectBills.get(account.id) ?? []).length > 0 || (accountDirectDebts.get(account.id) ?? []).length > 0) && (
              <div className="border-t border-border/40">
                <div className="flex items-center gap-2 px-5 py-2 bg-muted/10">
                  <Receipt size={12} className="text-muted-foreground/60" />
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Direct bills</p>
                </div>
                <div className="divide-y divide-border/20">
                  {(accountDirectBills.get(account.id) ?? []).map((bill) => (
                    <BillRow key={bill.id} bill={bill} allPots={pots} activeMemberId={activeMemberId} onEdit={() => setEditBill(bill)} />
                  ))}
                  {(accountDirectDebts.get(account.id) ?? []).map((debt) => (
                    <DebtPaymentRow key={debt.id} debt={debt} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Unassigned pots */}
      {unassignedPots.length > 0 && (
        <div className="elevation-1 mb-5 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-l-4 border-l-muted-foreground/30">
            <div className="flex items-center gap-3">
              <PiggyBank size={16} className="text-muted-foreground/50" />
              <p className="text-[13px] font-bold text-muted-foreground">Unassigned pots</p>
            </div>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1.5 text-muted-foreground" onClick={() => setCreatePotFor(null)}>
              <Plus className="h-3 w-3" />
              Add pot
            </Button>
          </div>
          <div className="border-t border-border/40 divide-y divide-border/30">
            {unassignedPots.map((pot) => (
              <PotSection
                key={pot.id}
                pot={pot}
                bills={billsByPot.get(pot.id) ?? []}
                debts={debtsByPot.get(pot.id) ?? []}
                allPots={pots}
                activeMemberId={activeMemberId}
                onEditPot={() => setEditPot(pot)}
                onAddBill={() => setCreateBillFor(pot.id)}
                onEditBill={setEditBill}
              />
            ))}
          </div>
        </div>
      )}

      {/* Unlinked bills */}
      {unlinkedBills.length > 0 && (
        <div className="elevation-1 mb-5 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-l-4 border-l-muted-foreground/20">
            <div className="flex items-center gap-3">
              <Receipt size={16} className="text-muted-foreground/50" />
              <p className="text-[13px] font-bold text-muted-foreground">Bills not in a pot</p>
            </div>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1.5 text-muted-foreground" onClick={() => setCreateBillFor(null)}>
              <Plus className="h-3 w-3" />
              Add bill
            </Button>
          </div>
          <div className="border-t border-border/40 divide-y divide-border/30">
            {unlinkedBills.map((bill) => (
              <BillRow key={bill.id} bill={bill} allPots={pots} activeMemberId={activeMemberId} onEdit={() => setEditBill(bill)} />
            ))}
          </div>
        </div>
      )}

      {/* Add bill button when nothing unlinked exists yet */}
      {unlinkedBills.length === 0 && bills.length === 0 && pots.length === 0 && accounts.length > 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">Add pots to your accounts, then add bills to your pots.</p>
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={createAccountOpen} onOpenChange={setCreateAccountOpen}>
        <AccountForm members={members} onClose={() => setCreateAccountOpen(false)} />
      </Dialog>
      <Dialog open={editAccount !== null} onOpenChange={(o) => !o && setEditAccount(null)}>
        <AccountForm account={editAccount} members={members} onClose={() => setEditAccount(null)} />
      </Dialog>
      <Dialog open={createPotFor !== undefined} onOpenChange={(o) => !o && setCreatePotFor(undefined)}>
        <PotForm
          accounts={accounts}
          defaultAccountId={createPotFor ?? null}
          onClose={() => setCreatePotFor(undefined)}
        />
      </Dialog>
      <Dialog open={editPot !== null} onOpenChange={(o) => !o && setEditPot(null)}>
        <PotForm pot={editPot} accounts={accounts} onClose={() => setEditPot(null)} />
      </Dialog>
      <Dialog open={createBillFor !== undefined} onOpenChange={(o) => !o && setCreateBillFor(undefined)}>
        <BillForm
          pots={pots}
          accounts={accounts}
          members={members}
          defaultPotId={createBillFor ?? null}
          onClose={() => setCreateBillFor(undefined)}
        />
      </Dialog>
      <Dialog open={createAccountBillFor !== undefined} onOpenChange={(o) => !o && setCreateAccountBillFor(undefined)}>
        <BillForm
          pots={pots}
          accounts={accounts}
          members={members}
          defaultAccountId={createAccountBillFor ?? null}
          onClose={() => setCreateAccountBillFor(undefined)}
        />
      </Dialog>
      <Dialog open={editBill !== null} onOpenChange={(o) => !o && setEditBill(null)}>
        <BillForm bill={editBill} pots={pots} accounts={accounts} members={members} onClose={() => setEditBill(null)} />
      </Dialog>
    </div>
  )
}

interface PotSectionProps {
  pot: Pot
  bills: Bill[]
  debts: Debt[]
  allPots: Pot[]
  activeMemberId: number | null
  onEditPot: () => void
  onAddBill: () => void
  onEditBill: (bill: Bill) => void
}

function PotSection({ pot, bills, debts, allPots, activeMemberId, onEditPot, onAddBill, onEditBill }: PotSectionProps) {
  const totalBillsPence = bills.reduce((s, b) => s + getMemberBillAmount(b, activeMemberId), 0) + debts.reduce((s, d) => s + d.minimumPaymentPence, 0)

  return (
    <div className="group">
      {/* Pot header row */}
      <div className="flex items-center justify-between px-5 py-3 bg-muted/20 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2.5">
          <PiggyBank size={13} className="text-primary/70 shrink-0" />
          <p className="text-[12px] font-semibold text-foreground">{pot.name}</p>
          {pot.allocatedPence > 0 && (
            <span className="text-[11px] text-muted-foreground tabular-nums font-money">{fmt(pot.allocatedPence)}/mo</span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {totalBillsPence > 0 && (
            <span className="text-[11px] text-muted-foreground tabular-nums font-money mr-2">{fmt(totalBillsPence)}</span>
          )}
          <button onClick={onAddBill} className="flex items-center gap-1 h-6 px-2 text-[11px] font-medium text-primary hover:bg-primary/10 rounded-md transition-colors">
            <Plus className="h-3 w-3" />
            Bill
          </button>
          <button onClick={onEditPot} className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Pencil className="h-3 w-3" />
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                <Trash2 className="h-3 w-3" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete pot?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete &ldquo;{pot.name}&rdquo;.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={() => deletePotAction(pot.id)}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Bills and debts under this pot */}
      {(bills.length > 0 || debts.length > 0) && (
        <div className="divide-y divide-border/20">
          {bills.map((bill) => (
            <BillRow key={bill.id} bill={bill} allPots={allPots} activeMemberId={activeMemberId} onEdit={() => onEditBill(bill)} />
          ))}
          {debts.map((debt) => (
            <DebtPaymentRow key={debt.id} debt={debt} />
          ))}
        </div>
      )}

      {bills.length === 0 && debts.length === 0 && (
        <div className="px-8 py-2">
          <button onClick={onAddBill} className="text-[11px] text-muted-foreground/50 hover:text-primary transition-colors">
            + Add first bill
          </button>
        </div>
      )}
    </div>
  )
}

function DebtPaymentRow({ debt }: { debt: Debt }) {
  const dueDateLabel = debt.paymentDueDate
    ? format(new Date(debt.paymentDueDate), 'd MMM yyyy')
    : null

  return (
    <div className="flex items-center justify-between px-8 py-2.5 hover:bg-muted/10 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive/10 shrink-0">
          <TrendingDown className="h-3 w-3 text-destructive" />
        </div>
        <div>
          <p className="text-[12px] font-medium">{debt.name}</p>
          <p className="text-[11px] text-muted-foreground">
            Monthly · min. payment{dueDateLabel ? ` · due ${dueDateLabel}` : ''}
          </p>
        </div>
      </div>
      <span className="text-[12px] font-semibold tabular-nums font-money">{fmt(debt.minimumPaymentPence)}</span>
    </div>
  )
}

interface BillRowProps {
  bill: Bill
  allPots: Pot[]
  activeMemberId: number | null
  onEdit: () => void
}

function BillRow({ bill, allPots: _allPots, activeMemberId, onEdit }: BillRowProps) {
  const [pending, setPending] = useState(false)

  async function handleDelete() {
    setPending(true)
    await deleteBillAction(bill.id)
    setPending(false)
  }

  return (
    <div className="group flex items-center justify-between px-8 py-2.5 hover:bg-muted/10 transition-colors">
      <div className="flex items-center gap-3">
        <BillLogo name={bill.name} size={24} />
        <div>
          <p className="text-[12px] font-medium">
            {bill.name}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {FREQUENCY_LABELS[bill.frequency]} · {format(new Date(bill.nextDueDate), 'd MMM yyyy')}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-semibold tabular-nums font-money mr-1">{fmt(getMemberBillAmount(bill, activeMemberId))}</span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Pencil className="h-3 w-3" />
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                <Trash2 className="h-3 w-3" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete bill?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete &ldquo;{bill.name}&rdquo;.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={pending}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
