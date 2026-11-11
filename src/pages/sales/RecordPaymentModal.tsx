import { useState } from 'react'
import { Button, Modal } from '../../components/ui'
import { formatLkr, todayISO } from '../../lib/format'
import { syncShipmentClosing } from '../../lib/settlement'
import type { Sale } from '../../types'
import { emptyPayment, PaymentFields, toNewPayment, validatePayment, type PaymentDraft } from './PaymentFields'
import { useSaleActions } from './useSaleActions'

/** Record a further payment on a sale. Mount only while visible. */
export function RecordPaymentModal({ sale, balance, onClose }: { sale: Sale; balance: number; onClose: () => void }) {
  const { addPayment } = useSaleActions()
  const [draft, setDraft] = useState<PaymentDraft>(emptyPayment(todayISO(), String(Math.round(balance * 100) / 100)))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const save = () => {
    const e = validatePayment(draft, balance)
    setErrors(e)
    if (Object.keys(e).length) return
    addPayment(sale, toNewPayment(draft))
    syncShipmentClosing()
    onClose()
  }

  return (
    <Modal
      open
      size="lg"
      title={`Record payment — ${sale.number}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Record payment</Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-slate-600">
        Amount still due: <strong>{formatLkr(balance)}</strong>
      </p>
      <PaymentFields draft={draft} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} errors={errors} />
    </Modal>
  )
}
