import { useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { addDays, format } from 'date-fns'
import { Badge, Button, Card, CardBody, CardHeader, DataTable, PageHeader, Select, StatCard, StatusBadge, type Column } from '../../components/ui'
import { CHEQUE_STATUS } from '../../config/statuses'
import { daysFromToday, formatDate, formatLkr, todayISO } from '../../lib/format'
import { useDataStore } from '../../store/dataStore'
import type { Cheque, ChequeStatus } from '../../types'
import { ChequeActionModal } from './ChequeActionModal'
import { ChequeDetailModal } from './ChequeDetailModal'

interface Row extends Cheque {
  customerName: string
  saleNumber: string
}

/** Days after depositing at which a cheque still not cleared is flagged. */
const SLOW_CLEARANCE_DAYS = 3

export function ChequesPage() {
  const cheques = useDataStore((s) => s.cheques)
  const customers = useDataStore((s) => s.customers)
  const sales = useDataStore((s) => s.sales)
  const [status, setStatus] = useState<ChequeStatus | ''>('')
  const [customerId, setCustomerId] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [acting, setActing] = useState<{ id: string; target: ChequeStatus } | null>(null)

  const today = todayISO()
  const weekAhead = format(addDays(new Date(), 7), 'yyyy-MM-dd')

  const all: Row[] = useMemo(
    () =>
      cheques.map((c) => {
        const cust = customers.find((x) => x.id === c.customerId)
        return { ...c, customerName: cust?.business || cust?.name || '—', saleNumber: sales.find((s) => s.id === c.saleId)?.number ?? '—' }
      }),
    [cheques, customers, sales],
  )

  const rows = all
    .filter((c) => (!status || c.status === status) && (!customerId || c.customerId === customerId))
    .sort((a, b) => a.chequeDate.localeCompare(b.chequeDate))

  const sum = (list: Row[]) => list.reduce((s, c) => s + c.amount, 0)
  const pending = all.filter((c) => c.status === 'PENDING')
  const dueSoon = pending.filter((c) => c.chequeDate <= weekAhead)
  const readyToDeposit = pending.filter((c) => c.chequeDate <= today)
  const deposited = all.filter((c) => c.status === 'DEPOSITED')
  const slow = deposited.filter((c) => c.statusDate && -daysFromToday(c.statusDate) >= SLOW_CLEARANCE_DAYS)
  const returned = all.filter((c) => c.status === 'RETURNED')
  const attention = readyToDeposit.length + slow.length + returned.length

  const dueBadge = (c: Row) => {
    if (c.status === 'PENDING') {
      const d = daysFromToday(c.chequeDate)
      if (d <= 0) return <Badge tone="amber">{d === 0 ? 'Due today' : 'Ready to deposit'}</Badge>
      return <Badge tone={d <= 7 ? 'blue' : 'gray'}>in {d}d</Badge>
    }
    if (c.status === 'DEPOSITED' && c.statusDate && -daysFromToday(c.statusDate) >= SLOW_CLEARANCE_DAYS) return <Badge tone="amber">Not cleared yet</Badge>
    return null
  }

  const columns: Column<Row>[] = [
    {
      key: 'no',
      header: 'Cheque',
      sortValue: (c) => c.number,
      render: (c) => (
        <div>
          <p className="font-medium text-slate-900">{c.number}</p>
          <p className="text-xs text-slate-500">
            {c.bank}
            {c.branch && `, ${c.branch}`}
          </p>
        </div>
      ),
    },
    { key: 'cust', header: 'Customer', sortValue: (c) => c.customerName, render: (c) => <div><p>{c.customerName}</p><p className="text-xs text-slate-500">{c.saleNumber}</p></div> },
    {
      key: 'date',
      header: 'Cheque date',
      sortValue: (c) => c.chequeDate,
      render: (c) => (
        <div className="flex flex-wrap items-center gap-1.5">
          {formatDate(c.chequeDate)} {dueBadge(c)}
        </div>
      ),
    },
    { key: 'amount', header: 'Amount', align: 'right', sortValue: (c) => c.amount, render: (c) => <span className="font-medium text-slate-900">{formatLkr(c.amount)}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (c) => (
        <div>
          <StatusBadge meta={CHEQUE_STATUS[c.status]} />
          {c.statusDate && c.status !== 'PENDING' && <p className="mt-0.5 text-xs text-slate-500">{formatDate(c.statusDate)}</p>}
        </div>
      ),
    },
    {
      key: 'act',
      header: '',
      align: 'right',
      render: (c) => (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {c.status === 'PENDING' && (
            <Button size="sm" onClick={() => setActing({ id: c.id, target: 'DEPOSITED' })}>
              Deposit
            </Button>
          )}
          {c.status === 'DEPOSITED' && (
            <>
              <Button size="sm" onClick={() => setActing({ id: c.id, target: 'CLEARED' })}>
                Cleared
              </Button>
              <Button size="sm" variant="secondary" className="text-red-600 hover:bg-red-50" onClick={() => setActing({ id: c.id, target: 'RETURNED' })}>
                Returned
              </Button>
            </>
          )}
          {c.status === 'RETURNED' && (
            <Button size="sm" variant="secondary" onClick={() => setActing({ id: c.id, target: 'DEPOSITED' })}>
              Deposit again
            </Button>
          )}
        </div>
      ),
    },
  ]

  const actingCheque = acting ? cheques.find((c) => c.id === acting.id) : undefined

  return (
    <div>
      <PageHeader title="Cheques" description="Customer cheques from the day they are received until the bank clears them." />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending" value={pending.length} hint={formatLkr(sum(pending))} tone="amber" />
        <StatCard label="Due within 7 days" value={dueSoon.length} hint={formatLkr(sum(dueSoon))} />
        <StatCard label="Deposited, awaiting bank" value={deposited.length} hint={formatLkr(sum(deposited))} tone="purple" />
        <StatCard label="Returned" value={returned.length} hint={formatLkr(sum(returned))} tone="red" />
      </div>

      <Card className="mb-5">
        <CardHeader title="Needs attention" description={attention === 0 ? 'Nothing urgent right now.' : `${attention} item(s)`} />
        {attention > 0 && (
          <CardBody className="space-y-2">
            {readyToDeposit.map((c) => (
              <button key={c.id} onClick={() => setActing({ id: c.id, target: 'DEPOSITED' })} className="flex w-full items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-left text-sm text-blue-900 hover:bg-blue-100">
                <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                <span>
                  Cheque <strong>{c.number}</strong> from {c.customerName} ({formatLkr(c.amount)}) is dated {formatDate(c.chequeDate)} — it can be deposited now.
                </span>
              </button>
            ))}
            {slow.map((c) => (
              <button key={c.id} onClick={() => setOpen(c.id)} className="flex w-full items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-left text-sm text-amber-900 hover:bg-amber-100">
                <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                <span>
                  Cheque <strong>{c.number}</strong> ({c.customerName}) was deposited on {formatDate(c.statusDate)} and has not cleared yet — check with the bank.
                </span>
              </button>
            ))}
            {returned.map((c) => (
              <button key={c.id} onClick={() => setOpen(c.id)} className="flex w-full items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-left text-sm text-red-900 hover:bg-red-100">
                <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                <span>
                  Cheque <strong>{c.number}</strong> from {c.customerName} ({formatLkr(c.amount)}) was returned on {formatDate(c.statusDate)} — collect payment another way or deposit it again.
                </span>
              </button>
            ))}
          </CardBody>
        )}
      </Card>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(c) => c.id}
        searchText={(c) => `${c.number} ${c.customerName} ${c.bank} ${c.branch} ${c.saleNumber}`}
        searchPlaceholder="Search cheque no., customer, bank…"
        onRowClick={(c) => setOpen(c.id)}
        emptyTitle="No cheques found"
        emptyHint="Cheques appear here when a customer pays a sale by cheque."
        toolbar={
          <>
            <Select value={status} onChange={(e) => setStatus(e.target.value as ChequeStatus | '')} className="w-auto" aria-label="Filter by status">
              <option value="">All statuses</option>
              {Object.entries(CHEQUE_STATUS).map(([id, m]) => (
                <option key={id} value={id}>
                  {m.label}
                </option>
              ))}
            </Select>
            <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-auto max-w-[11rem]" aria-label="Filter by customer">
              <option value="">All customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.business || c.name}
                </option>
              ))}
            </Select>
          </>
        }
      />

      {open && <ChequeDetailModal chequeId={open} onClose={() => setOpen(null)} />}
      {acting && actingCheque && <ChequeActionModal cheque={actingCheque} target={acting.target} onClose={() => setActing(null)} />}
    </div>
  )
}
