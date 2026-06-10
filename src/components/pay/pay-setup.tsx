'use client'

import { useActionState, type CSSProperties } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { savePaySettingsAction, type PaySettingsState } from '@/app/actions/pay-settings'
import { PAY_FREQUENCY_LABELS, type PayFrequency } from '@/lib/engine/paycheck'
import { CheckCircle2 } from 'lucide-react'

const FREQUENCIES: PayFrequency[] = ['weekly', 'biweekly', 'four_weekly', 'monthly']

function toInputDate(d: Date) {
  return new Date(d).toISOString().split('T')[0]
}

interface Props {
  saved: {
    amountPence: number
    frequency: string
    nextPayDate: Date
  } | null
}

export function PaySetup({ saved }: Props) {
  const [state, formAction, pending] = useActionState<PaySettingsState, FormData>(
    savePaySettingsAction,
    {} as PaySettingsState
  )

  const defaultFrequency = (saved?.frequency ?? 'monthly') as PayFrequency
  const defaultDate = saved?.nextPayDate ? toInputDate(new Date(saved.nextPayDate)) : toInputDate(new Date())

  return (
    <div className="px-8 py-8 max-w-md">
      <div className="animate-reveal-up mb-6" style={{ '--delay': '0ms' } as CSSProperties}>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Pay</h1>
        <p className="text-sm text-muted-foreground">
          Set your take-home pay so the dashboard can show what to transfer each cycle.
        </p>
      </div>

      <div className="animate-reveal-up card-elevated p-6" style={{ '--delay': '60ms' } as CSSProperties}>
        <form action={formAction} className="space-y-5">
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
              Take-home pay
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">£</span>
              <Input
                name="amountPounds"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                defaultValue={saved ? (saved.amountPence / 100).toFixed(2) : ''}
                className="pl-7 text-base font-semibold tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
              Pay frequency
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FREQUENCIES.map((f) => (
                <label
                  key={f}
                  className="relative flex cursor-pointer items-center gap-2.5 rounded-xl border border-border px-3.5 py-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors"
                >
                  <input
                    type="radio"
                    name="frequency"
                    value={f}
                    defaultChecked={f === defaultFrequency}
                    className="sr-only"
                  />
                  <div className="h-4 w-4 rounded-full border-2 border-border flex items-center justify-center has-sibling-checked:border-primary shrink-0">
                    <div className="h-2 w-2 rounded-full bg-primary opacity-0 scale-0 transition-all" />
                  </div>
                  <span className="text-sm font-medium">{PAY_FREQUENCY_LABELS[f]}</span>
                </label>
              ))}
            </div>
            {/* Hidden input to capture selected radio via form — radios handle this natively */}
          </div>

          <div>
            <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
              Next pay date
            </label>
            <Input
              name="nextPayDate"
              type="date"
              defaultValue={defaultDate}
              className="text-sm"
            />
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          {state.success && (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <CheckCircle2 size={16} />
              Saved — dashboard updated.
            </div>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Saving…' : saved ? 'Update pay settings' : 'Save pay settings'}
          </Button>
        </form>
      </div>
    </div>
  )
}
