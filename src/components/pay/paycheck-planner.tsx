'use client'

import { useState, useMemo, type CSSProperties } from 'react'
import { format } from 'date-fns'
import type { Bill } from '@/lib/engine/types'
import {
  calculatePayWindowAllocations,
  PAY_FREQUENCY_LABELS,
  type PayFrequency,
  type Account,
  type Pot,
} from '@/lib/engine/paycheck'
import { Input } from '@/components/ui/input'
import { Receipt, PiggyBank, CreditCard, Banknote } from 'lucide-react'

const FREQUENCIES: PayFrequency[] = ['weekly', 'biweekly', 'four_weekly', 'monthly']

const POT_ACCENTS = [
  { bar: '#FF5555', bg: '#FFF2F2', text: '#B91C1C' },
  { bar: '#14B8A6', bg: '#F0FDFA', text: '#0F766E' },
  { bar: '#3B82F6', bg: '#EFF6FF', text: '#1D4ED8' },
  { bar: '#22C55E', bg: '#F0FDF4', text: '#15803D' },
  { bar: '#F59E0B', bg: '#FFFBEB', text: '#B45309' },
  { bar: '#8B5CF6', bg: '#F5F3FF', text: '#6D28D9' },
  { bar: '#EC4899', bg: '#FDF2F8', text: '#BE185D' },
  { bar: '#6366F1', bg: '#EEF2FF', text: '#4338CA' },
]

function fmt(pence: number) {
  return `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Format date as DD/MM/YYYY for the date input
function toInputDate(d: Date) {
  return d.toISOString().split('T')[0]
}

interface Props {
  accounts: Account[]
  pots: Pot[]
  bills: Bill[]
}

export function PaycheckPlanner({ accounts, pots, bills }: Props) {
  const [payInput, setPayInput] = useState('')
  const [frequency, setFrequency] = useState<PayFrequency>('monthly')
  const [fromDate, setFromDate] = useState(() => toInputDate(new Date()))

  const payPence = useMemo(() => {
    const val = parseFloat(payInput)
    if (isNaN(val) || val < 0) return 0
    return Math.round(val * 100)
  }, [payInput])

  const windowStart = useMemo(() => {
    const d = new Date(fromDate)
    return isNaN(d.getTime()) ? new Date() : d
  }, [fromDate])

  const allocation = useMemo(
    () => calculatePayWindowAllocations(windowStart, frequency, accounts, pots, bills),
    [windowStart, frequency, accounts, pots, bills]
  )

  const hasInput = payInput.trim() !== '' && payPence > 0
  const remaining = payPence - allocation.totalNeededPence
  const isShort = hasInput && remaining < 0
  const commitPct = hasInput && payPence > 0 ? Math.min(100, (allocation.totalNeededPence / payPence) * 100) : 0
  const hasAnything =
    allocation.accountAllocations.length > 0 ||
    allocation.unassignedPots.length > 0 ||
    allocation.unlinkedBills.length > 0

  // Flatten all pots to assign accent colours consistently
  const allPots = [
    ...allocation.accountAllocations.flatMap((a) => a.pots),
    ...allocation.unassignedPots,
  ]
  const potAccentMap = new Map(allPots.map((p, i) => [p.potId, POT_ACCENTS[i % POT_ACCENTS.length]]))

  return (
    <div className="px-8 py-8 max-w-2xl">

      {/* Header */}
      <div className="animate-reveal-up mb-6" style={{ '--delay': '0ms' } as CSSProperties}>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Pay Planner</h1>
        <p className="text-sm text-muted-foreground">
          See which bills fall in your pay window and how much to put in each pot.
        </p>
      </div>

      {/* Pay input card */}
      <div className="animate-reveal-up card-elevated p-6 mb-5" style={{ '--delay': '60ms' } as CSSProperties}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-4">
          Your pay
        </p>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="text-[11px] text-muted-foreground font-medium block mb-1.5">Take-home pay (£)</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">£</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={payInput}
                onChange={(e) => setPayInput(e.target.value)}
                className="pl-7 text-base font-semibold tabular-nums"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground font-medium block mb-1.5">From date</label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        {/* Frequency picker */}
        <div className="grid grid-cols-4 gap-1.5">
          {FREQUENCIES.map((f) => (
            <button
              key={f}
              onClick={() => setFrequency(f)}
              className={`rounded-xl px-3 py-2.5 text-[12px] font-semibold transition-all ${
                frequency === f
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              }`}
            >
              {PAY_FREQUENCY_LABELS[f]}
            </button>
          ))}
        </div>

        <p className="mt-3 text-[11px] text-muted-foreground/70">
          Window: {format(allocation.windowStart, 'd MMM yyyy')} → {format(allocation.windowEnd, 'd MMM yyyy')}
        </p>
      </div>

      {/* Summary bar — only when pay entered */}
      {hasInput && (
        <div className="animate-reveal-up card-elevated p-5 mb-5" style={{ '--delay': '80ms' } as CSSProperties}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Bills in window</p>
              <p className="text-xl font-bold tabular-nums">{fmt(allocation.totalNeededPence)}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {isShort ? 'Shortfall' : 'Left over'}
              </p>
              <p className={`text-xl font-bold tabular-nums ${isShort ? 'text-destructive' : 'text-green-600'}`}>
                {fmt(Math.abs(remaining))}
              </p>
            </div>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden bg-muted">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${commitPct}%`, backgroundColor: isShort ? '#EF4444' : '#7c3aed' }}
            />
          </div>
          {isShort && (
            <p className="mt-2 text-xs text-destructive font-medium">
              Bills this cycle exceed your pay by {fmt(Math.abs(remaining))}.
            </p>
          )}
        </div>
      )}

      {/* No bills in window */}
      {!hasAnything && (
        <div className="animate-reveal-up card-elevated p-8 text-center" style={{ '--delay': '120ms' } as CSSProperties}>
          <Banknote size={32} className="mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No bills fall in this window.</p>
          <p className="text-[12px] text-muted-foreground/60 mt-1">
            Adjust the date or frequency to see upcoming bills.
          </p>
        </div>
      )}

      {/* Account → Pot → Bills */}
      {allocation.accountAllocations.map((acct) => (
        <div key={acct.accountId} className="animate-reveal-up card-elevated p-6 mb-4" style={{ '--delay': '120ms' } as CSSProperties}>
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={14} className="text-muted-foreground" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground flex-1">
              {acct.accountName}
            </p>
            <span className="text-[12px] font-bold tabular-nums text-foreground">{fmt(acct.totalPence)}</span>
          </div>

          <div className="space-y-3">
            {acct.pots.map((pot) => {
              const accent = potAccentMap.get(pot.potId) ?? POT_ACCENTS[0]
              return (
                <div key={pot.potId} className="rounded-2xl border border-border/40 overflow-hidden" style={{ backgroundColor: accent.bg }}>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <PiggyBank size={13} style={{ color: accent.bar }} />
                      <span className="text-[13px] font-semibold" style={{ color: accent.text }}>
                        {pot.potName}
                      </span>
                    </div>
                    <span className="text-[15px] font-bold tabular-nums" style={{ color: pot.totalPence === 0 ? undefined : accent.text }}>
                      {fmt(pot.totalPence)}
                    </span>
                  </div>

                  {pot.bills.length > 0 && (
                    <div className="border-t border-border/20 px-4 pb-3 pt-2 space-y-1.5">
                      {pot.bills.map((bill, i) => (
                        <div key={i} className="flex items-center justify-between text-[12px]">
                          <div className="flex items-center gap-1.5">
                            <Receipt size={11} className="text-muted-foreground/50 shrink-0" />
                            <span className="text-muted-foreground">{bill.name}</span>
                            <span className="text-muted-foreground/40">· {format(bill.dueDate, 'd MMM')}</span>
                          </div>
                          <span className="font-semibold tabular-nums text-foreground/70">{fmt(bill.amountPence)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {pot.bills.length === 0 && (
                    <div className="border-t border-border/20 px-4 py-2">
                      <p className="text-[11px] text-muted-foreground/50">No bills due this window</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Unassigned pots (no account) */}
      {allocation.unassignedPots.length > 0 && (
        <div className="animate-reveal-up card-elevated p-6 mb-4" style={{ '--delay': '160ms' } as CSSProperties}>
          <div className="flex items-center gap-2 mb-4">
            <PiggyBank size={14} className="text-muted-foreground" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground flex-1">
              Unassigned pots
            </p>
            <span className="text-[12px] font-bold tabular-nums text-foreground">
              {fmt(allocation.unassignedPots.reduce((s, p) => s + p.totalPence, 0))}
            </span>
          </div>

          <div className="space-y-3">
            {allocation.unassignedPots.map((pot) => {
              const accent = potAccentMap.get(pot.potId) ?? POT_ACCENTS[0]
              return (
                <div key={pot.potId} className="rounded-2xl border border-border/40 overflow-hidden" style={{ backgroundColor: accent.bg }}>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <PiggyBank size={13} style={{ color: accent.bar }} />
                      <span className="text-[13px] font-semibold" style={{ color: accent.text }}>{pot.potName}</span>
                    </div>
                    <span className="text-[15px] font-bold tabular-nums" style={{ color: pot.totalPence === 0 ? undefined : accent.text }}>
                      {fmt(pot.totalPence)}
                    </span>
                  </div>
                  {pot.bills.length > 0 && (
                    <div className="border-t border-border/20 px-4 pb-3 pt-2 space-y-1.5">
                      {pot.bills.map((bill, i) => (
                        <div key={i} className="flex items-center justify-between text-[12px]">
                          <div className="flex items-center gap-1.5">
                            <Receipt size={11} className="text-muted-foreground/50 shrink-0" />
                            <span className="text-muted-foreground">{bill.name}</span>
                            <span className="text-muted-foreground/40">· {format(bill.dueDate, 'd MMM')}</span>
                          </div>
                          <span className="font-semibold tabular-nums text-foreground/70">{fmt(bill.amountPence)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Unlinked bills */}
      {allocation.unlinkedBills.length > 0 && (
        <div className="animate-reveal-up card-elevated p-6 mb-4" style={{ '--delay': '200ms' } as CSSProperties}>
          <div className="flex items-center gap-2 mb-4">
            <Receipt size={14} className="text-muted-foreground" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground flex-1">
              Bills with no pot
            </p>
            <span className="text-[12px] font-bold tabular-nums text-foreground">
              {fmt(allocation.unlinkedBills.reduce((s, b) => s + b.amountPence, 0))}
            </span>
          </div>
          <div className="space-y-2.5">
            {allocation.unlinkedBills.map((bill, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt size={12} className="text-muted-foreground/50 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{bill.name}</p>
                    <p className="text-[11px] text-muted-foreground">{format(bill.dueDate, 'd MMM yyyy')}</p>
                  </div>
                </div>
                <p className="text-sm font-bold tabular-nums">{fmt(bill.amountPence)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
