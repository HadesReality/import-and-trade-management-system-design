import { Field, Input, Select } from '../../components/ui'
import { useDataStore } from '../../store/dataStore'
import type { NewPayment } from './useSaleActions'

export interface PaymentDraft {
  method: 'CASH' | 'CHEQUE'
  amount: string
  date: string
  number: string
  bank: string
  branch: string
  chequeDate: string
}

export const emptyPayment = (today: string, amount = ''): PaymentDraft => ({
  method: 'CASH',
  amount,
  date: today,
  number: '',
  bank: '',
  branch: '',
  chequeDate: today,
})

/** Returns error messages by field; `max` is the most that can be paid now. */
export function validatePayment(d: PaymentDraft, max: number): Record<string, string> {
  const e: Record<string, string> = {}
  const amount = Number(d.amount)
  if (!(amount > 0)) e.amount = 'Enter the amount received'
  else if (amount > max + 0.005) e.amount = 'Cannot be more than the amount still due'
  if (!d.date) e.date = 'Enter the date'
  if (d.method === 'CHEQUE') {
    if (!d.number.trim()) e.number = 'Cheque number is required'
    if (!d.bank.trim()) e.bank = 'Bank is required'
    if (!d.chequeDate) e.chequeDate = 'Cheque date is required'
  }
  return e
}

export function toNewPayment(d: PaymentDraft): NewPayment {
  return {
    method: d.method,
    amount: Number(d.amount),
    date: d.date,
    cheque: d.method === 'CHEQUE' ? { number: d.number.trim(), bank: d.bank.trim(), branch: d.branch.trim(), chequeDate: d.chequeDate } : undefined,
  }
}

interface Props {
  draft: PaymentDraft
  onChange: (patch: Partial<PaymentDraft>) => void
  errors: Record<string, string>
  /** Hide the amount field when it is controlled elsewhere. */
  showAmount?: boolean
  /** Hide the cash/cheque choice when it is chosen elsewhere. */
  hideMethod?: boolean
}

export function PaymentFields({ draft, onChange, errors, showAmount = true, hideMethod = false }: Props) {
  const banks = useDataStore((s) => s.settings.banks)
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {!hideMethod && (
        <Field label="Paid by" required>
          <Select value={draft.method} onChange={(e) => onChange({ method: e.target.value as 'CASH' | 'CHEQUE' })}>
            <option value="CASH">Cash</option>
            <option value="CHEQUE">Cheque</option>
          </Select>
        </Field>
      )}
      {showAmount && (
        <Field label="Amount (LKR)" required error={errors.amount}>
          <Input type="number" min={0} value={draft.amount} onChange={(e) => onChange({ amount: e.target.value })} />
        </Field>
      )}
      <Field label="Received on" required error={errors.date}>
        <Input type="date" value={draft.date} onChange={(e) => onChange({ date: e.target.value })} />
      </Field>
      {draft.method === 'CHEQUE' && (
        <>
          <Field label="Cheque number" required error={errors.number}>
            <Input value={draft.number} onChange={(e) => onChange({ number: e.target.value })} />
          </Field>
          <Field label="Bank" required error={errors.bank}>
            <Input value={draft.bank} onChange={(e) => onChange({ bank: e.target.value })} list="cheque-banks" />
            <datalist id="cheque-banks">
              {banks.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </Field>
          <Field label="Branch">
            <Input value={draft.branch} onChange={(e) => onChange({ branch: e.target.value })} />
          </Field>
          <Field label="Cheque date" required error={errors.chequeDate} hint="Post-dated cheques: use the date written on the cheque">
            <Input type="date" value={draft.chequeDate} onChange={(e) => onChange({ chequeDate: e.target.value })} />
          </Field>
        </>
      )}
    </div>
  )
}
