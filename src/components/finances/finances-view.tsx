'use client'

import { useState, useMemo, type CSSProperties } from 'react'
import { format } from 'date-fns'
import { Plus, Pencil, Trash2, Check, X, CreditCard, PiggyBank, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { deleteBillAction, markBillPaidAction, markBillUnpaidAction } from '@/app/actions/bills'
import { BillLogo } from '@/components/bill-logo'

interface Account { id: number; name: string }
interface Pot { id: number; name: string; allocatedPence: number; rollover: boolean; accountId: number | null }
interface Split { id: number; memberName: string; percentage: number }
interface Bill { id: number; name: string; amountPence: number; frequency: string; potId: number | null; accountId: number | null; nextDueDate: Date; isPaid: boolean; splits: Split[] }

interface Props {
  accounts: Account[]
  pots: Pot[]
  bills: Bill[]
}

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Weekly', biweekly: 'Every 2 wks', four_weekly: 'Every 4 wks', monthly: 'Monthly', annual: 'Annual',
}

const ACCOUNT_COLORS = ['#7c3aed', '#FF5555', '#14B8A6', '#3B82F6', '#F59E0B', '#EC4899']

function fmt(pence: number) {
  return `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function FinancesView({ accounts, pots, bills }: Props) {
  const [createAccountOpen, setCreateAccountOpen] = useState(false)
  const [editAccount, setEditAccount] = useState<Account | null>(null)
  const [createPotFor, setCreatePotFor] = useState<number | null | undefined>(undefined) // undefined = closed
  const [editPot, setEditPot] = useState<Pot | null>(null)
  const [createBillFor, setCreateBillFor] = useState<number | null | undefined>(undefined) // undefined = closed
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

  const unassignedPots = potsByAccount.get(null) ?? []
  const unlinkedBills = billsByPot.get(null) ?? []

  return (
    <div className="px-8 py-8 max-w-3xl">
      {/* Header */}
      <div className="animate-reveal-up flex items-center justify-between mb-8" style={{ '--delay': '0ms' } as CSSProperties}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {accounts.length} account{accounts.length !== 1 ? 's' : ''} · {pots.length} pot{pots.length !== 1 ? 's' : ''} · {bills.length} bill{bills.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateAccountOpen(true)}>
          <Plus className="h-4 w-4" />
          Add account
        </Button>
      </div>

      {/* Accounts */}
      {accounts.length === 0 && (
        <div
          className="animate-reveal-up flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border py-20 text-center mb-6"
          style={{ '--delay': '60ms' } as CSSProperties}
        >
          <CreditCard className="h-8 w-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-semibold mb-1">No accounts yet</p>
          <p className="text-xs text-muted-foreground mb-5">Add an account to start organising your pots and bills.</p>
          <Button variant="outline" size="sm" onClick={() => setCreateAccountOpen(true)}>Add account</Button>
        </div>
      )}

      {accounts.map((account, acctIdx) => {
        const acctPots = potsByAccount.get(account.id) ?? []
        const acctColor = ACCOUNT_COLORS[acctIdx % ACCOUNT_COLORS.length]

        return (
          <div
            key={account.id}
            className="animate-reveal-up card-elevated mb-5 overflow-hidden"
            style={{ '--delay': `${60 + acctIdx * 40}ms` } as CSSProperties}
          >
            {/* Account header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderLeft: `4px solid ${acctColor}` }}
            >
              <div className="flex items-center gap-3">
                <CreditCard size={16} style={{ color: acctColor }} />
                <p className="text-[13px] font-bold tracking-tight">{account.name}</p>
              </div>
              <div className="flex items-center gap-1">
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
                    allPots={pots}
                    onEditPot={() => setEditPot(pot)}
                    onAddBill={() => setCreateBillFor(pot.id)}
                    onEditBill={setEditBill}
                  />
                ))}
              </div>
            )}

            {acctPots.length === 0 && (
              <div className="border-t border-border/40 px-5 py-4 text-center">
                <p className="text-[12px] text-muted-foreground/60">No pots in this account yet.</p>
                <button onClick={() => setCreatePotFor(account.id)} className="text-[12px] text-primary hover:underline mt-0.5">
                  Add first pot
                </button>
              </div>
            )}
          </div>
        )
      })}

      {/* Unassigned pots */}
      {unassignedPots.length > 0 && (
        <div className="animate-reveal-up card-elevated mb-5 overflow-hidden" style={{ '--delay': '200ms' } as CSSProperties}>
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
                allPots={pots}
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
        <div className="animate-reveal-up card-elevated mb-5 overflow-hidden" style={{ '--delay': '240ms' } as CSSProperties}>
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
              <BillRow key={bill.id} bill={bill} allPots={pots} onEdit={() => setEditBill(bill)} />
            ))}
          </div>
        </div>
      )}

      {/* Add bill button when nothing unlinked exists yet */}
      {unlinkedBills.length === 0 && bills.length === 0 && pots.length === 0 && accounts.length > 0 && (
        <div className="animate-reveal-up text-center py-4" style={{ '--delay': '200ms' } as CSSProperties}>
          <p className="text-sm text-muted-foreground">Add pots to your accounts, then add bills to your pots.</p>
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={createAccountOpen} onOpenChange={setCreateAccountOpen}>
        <AccountForm onClose={() => setCreateAccountOpen(false)} />
      </Dialog>
      <Dialog open={editAccount !== null} onOpenChange={(o) => !o && setEditAccount(null)}>
        <AccountForm account={editAccount} onClose={() => setEditAccount(null)} />
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
          defaultPotId={createBillFor ?? null}
          onClose={() => setCreateBillFor(undefined)}
        />
      </Dialog>
      <Dialog open={editBill !== null} onOpenChange={(o) => !o && setEditBill(null)}>
        <BillForm bill={editBill} pots={pots} accounts={accounts} onClose={() => setEditBill(null)} />
      </Dialog>
    </div>
  )
}

interface PotSectionProps {
  pot: Pot
  bills: Bill[]
  allPots: Pot[]
  onEditPot: () => void
  onAddBill: () => void
  onEditBill: (bill: Bill) => void
}

function PotSection({ pot, bills, allPots, onEditPot, onAddBill, onEditBill }: PotSectionProps) {
  const totalBillsPence = bills.reduce((s, b) => s + b.amountPence, 0)

  return (
    <div className="group">
      {/* Pot header row */}
      <div className="flex items-center justify-between px-5 py-3 bg-muted/20 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2.5">
          <PiggyBank size={13} className="text-primary/70 shrink-0" />
          <p className="text-[12px] font-semibold text-foreground">{pot.name}</p>
          {pot.allocatedPence > 0 && (
            <span className="text-[11px] text-muted-foreground tabular-nums">{fmt(pot.allocatedPence)}/mo</span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {totalBillsPence > 0 && (
            <span className="text-[11px] text-muted-foreground tabular-nums mr-2">{fmt(totalBillsPence)}</span>
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

      {/* Bills under this pot */}
      {bills.length > 0 && (
        <div className="divide-y divide-border/20">
          {bills.map((bill) => (
            <BillRow key={bill.id} bill={bill} allPots={allPots} onEdit={() => onEditBill(bill)} />
          ))}
        </div>
      )}

      {bills.length === 0 && (
        <div className="px-8 py-2">
          <button onClick={onAddBill} className="text-[11px] text-muted-foreground/50 hover:text-primary transition-colors">
            + Add first bill
          </button>
        </div>
      )}
    </div>
  )
}

interface BillRowProps {
  bill: Bill
  allPots: Pot[]
  onEdit: () => void
}

function BillRow({ bill, allPots: _allPots, onEdit }: BillRowProps) {
  const [pending, setPending] = useState(false)

  async function handleTogglePaid() {
    setPending(true)
    if (bill.isPaid) await markBillUnpaidAction(bill.id)
    else await markBillPaidAction(bill.id)
    setPending(false)
  }

  async function handleDelete() {
    setPending(true)
    await deleteBillAction(bill.id)
    setPending(false)
  }

  return (
    <div className={`group flex items-center justify-between px-8 py-2.5 hover:bg-muted/10 transition-colors ${bill.isPaid ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3">
        <BillLogo name={bill.name} size={24} />
        <div>
          <p className={`text-[12px] font-medium ${bill.isPaid ? 'line-through text-muted-foreground' : ''}`}>
            {bill.name}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {FREQUENCY_LABELS[bill.frequency]} · {format(new Date(bill.nextDueDate), 'd MMM yyyy')}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-semibold tabular-nums mr-1">{fmt(bill.amountPence)}</span>
        {bill.isPaid ? (
          <Badge variant="success" className="text-[10px] px-1.5 py-0">Paid</Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">Due</Badge>
        )}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleTogglePaid}
            disabled={pending}
            className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${bill.isPaid ? 'text-muted-foreground hover:bg-muted' : 'text-green-600 hover:bg-green-50'}`}
          >
            {bill.isPaid ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
          </button>
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
