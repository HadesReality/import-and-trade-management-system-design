import { useState } from 'react'
import { Button, Field, Input, Modal, Select } from '../../components/ui'
import { formatDate, formatLkr, todayISO } from '../../lib/format'
import type { Cheque, ChequeStatus } from '../../types'
import { RETURN_REASONS, useChequeActions } from './useChequeActions'

const TITLE: Record<ChequeStatus, string> = {
  PENDING: 'Mark as pending',
  DEPOSITED: 'Deposit cheque',
  CLEARED: 'Mark cheque as cleared',
  RETURNED: 'Mark cheque as returned',
}

/** Move a cheque to its next status. Mount only while visible. */
export function ChequeActionModal({ cheque, target, onClose }: { cheque: Cheque; target: ChequeStatus; onClose: () => void }) {
  const { move } = useChequeActions()
  const today = todayISO()
  const [date, setDate] = useState(today)
  const [reason, setReason] = useState<string>(RETURN_REASONS[0])
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  // A cheque can't be deposited before the date written on it, or cleared/returned before it was deposited.
  const minDate = target === 'DEPOSITED' ? [cheque.chequeDate, cheque.status === 'RETURNED' ? cheque.statusDate ?? '' : ''].sort().pop()! : cheque.statusDate ?? cheque.chequeDate

  const save = () => {
    if (!date) return setError('Enter the date')
    if (date > today) return setError('The date cannot be in the future')
    if (date < minDate) {
      return setError(
        target === 'DEPOSITED'
          ? `This cheque is dated ${formatDate(cheque.chequeDate)} — it cannot be deposited before then`
          : `Cannot be before the deposit date (${formatDate(minDate)})`,
      )
    }
    const text = target === 'RETURNED' ? [reason, note.trim()].filter(Boolean).join(' — ') : note
    move(cheque, target, date, text)
    onClose()
  }

  return (
    <Modal
      open
      title={`${TITLE[target]} — ${cheque.number}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={target === 'RETURNED' ? 'danger' : 'primary'} onClick={save}>
            {target === 'DEPOSITED' ? 'Deposit' : target === 'CLEARED' ? 'Mark cleared' : 'Mark returned'}
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-slate-600">
        {formatLkr(cheque.amount)} · {cheque.bank}
        {cheque.branch && `, ${cheque.branch}`} · dated {formatDate(cheque.chequeDate)}
      </p>
      <div className="space-y-4">
        <Field label={target === 'DEPOSITED' ? 'Deposited on' : target === 'CLEARED' ? 'Cleared on' : 'Returned on'} required error={error}>
          <Input type="date" value={date} max={today} onChange={(e) => (setDate(e.target.value), setError(''))} />
        </Field>
        {target === 'RETURNED' && (
          <Field label="Reason" required>
            <Select value={reason} onChange={(e) => setReason(e.target.value)}>
              {RETURN_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Note" hint={target === 'RETURNED' ? 'e.g. customer promised a new cheque on Friday' : 'Optional'}>
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        {target === 'RETURNED' && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            The amount goes back onto the customer's balance, so you can record a new payment from the sale.
          </p>
        )}
      </div>
    </Modal>
  )
}
