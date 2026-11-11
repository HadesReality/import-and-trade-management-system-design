import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Undo2 } from 'lucide-react'
import { Button, Modal, StatusBadge } from '../../components/ui'
import { CHEQUE_STATUS } from '../../config/statuses'
import { formatDate, formatLkr } from '../../lib/format'
import { useDataStore } from '../../store/dataStore'
import type { ChequeStatus } from '../../types'
import { ChequeActionModal } from './ChequeActionModal'
import { NEXT_STATUSES, PREVIOUS_STATUS, useChequeActions } from './useChequeActions'

const ACTION_LABEL: Record<ChequeStatus, string> = {
  PENDING: 'Pending',
  DEPOSITED: 'Deposit',
  CLEARED: 'Mark cleared',
  RETURNED: 'Mark returned',
}

/** Everything about one cheque: details, history and the next actions. */
export function ChequeDetailModal({ chequeId, onClose }: { chequeId: string; onClose: () => void }) {
  const cheque = useDataStore((s) => s.cheques.find((c) => c.id === chequeId))
  const customer = useDataStore((s) => s.customers.find((c) => c.id === cheque?.customerId))
  const sale = useDataStore((s) => s.sales.find((x) => x.id === cheque?.saleId))
  const { undo } = useChequeActions()
  const [acting, setActing] = useState<ChequeStatus | null>(null)

  if (!cheque) return null
  const received = sale?.payments.find((p) => p.chequeId === cheque.id)?.date
  const events = [{ status: 'PENDING' as const, date: received ?? cheque.chequeDate, note: 'Cheque received' }, ...(cheque.history ?? [])]

  return (
    <Modal open size="lg" title={`Cheque ${cheque.number}`} onClose={onClose}>
      <div className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
        <div>
          <p className="text-slate-500">Amount</p>
          <p className="mt-0.5 text-lg font-semibold text-slate-900">{formatLkr(cheque.amount)}</p>
        </div>
        <div>
          <p className="text-slate-500">Status</p>
          <div className="mt-1">
            <StatusBadge meta={CHEQUE_STATUS[cheque.status]} />
          </div>
        </div>
        <div>
          <p className="text-slate-500">Bank</p>
          <p className="mt-0.5 font-medium text-slate-900">
            {cheque.bank}
            {cheque.branch && `, ${cheque.branch}`}
          </p>
        </div>
        <div>
          <p className="text-slate-500">Cheque date</p>
          <p className="mt-0.5 font-medium text-slate-900">{formatDate(cheque.chequeDate)}</p>
        </div>
        <div>
          <p className="text-slate-500">Customer</p>
          <p className="mt-0.5">
            {customer ? (
              <Link to={`/customers/${customer.id}`} className="font-medium text-brand-600 hover:underline">
                {customer.business || customer.name}
              </Link>
            ) : (
              '—'
            )}
          </p>
        </div>
        <div>
          <p className="text-slate-500">Sale</p>
          <p className="mt-0.5">
            {sale ? (
              <Link to={`/sales/${sale.id}`} className="font-medium text-brand-600 hover:underline">
                {sale.number}
              </Link>
            ) : (
              '—'
            )}
          </p>
        </div>
      </div>

      <h3 className="mb-2 mt-5 text-sm font-semibold text-slate-900">History</h3>
      <ol className="relative space-y-3 border-l border-slate-200 pl-5">
        {[...events].reverse().map((e, i) => (
          <li key={`${e.status}-${i}`} className="relative">
            <span className={`absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full border-2 border-white ${i === 0 ? 'bg-brand-500' : 'bg-slate-300'}`} />
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge meta={CHEQUE_STATUS[e.status]} />
              <span className="text-xs text-slate-500">{formatDate(e.date)}</span>
            </div>
            {e.note && <p className="mt-0.5 text-sm text-slate-600">{e.note}</p>}
          </li>
        ))}
      </ol>

      <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
        {PREVIOUS_STATUS[cheque.status] && (
          <Button variant="ghost" onClick={() => undo(cheque)}>
            <Undo2 size={14} /> Undo last step
          </Button>
        )}
        {NEXT_STATUSES[cheque.status].map((s) => (
          <Button key={s} variant={s === 'RETURNED' ? 'secondary' : 'primary'} className={s === 'RETURNED' ? 'text-red-600 hover:bg-red-50' : undefined} onClick={() => setActing(s)}>
            {cheque.status === 'RETURNED' && s === 'DEPOSITED' ? 'Deposit again' : ACTION_LABEL[s]}
          </Button>
        ))}
      </div>

      {acting && <ChequeActionModal cheque={cheque} target={acting} onClose={() => setActing(null)} />}
    </Modal>
  )
}
