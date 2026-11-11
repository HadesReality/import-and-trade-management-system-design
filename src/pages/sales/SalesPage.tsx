import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Badge, Button, DataTable, PageHeader, Select, StatCard, type Column } from '../../components/ui'
import { PAYMENT_METHOD, SALE_TYPE } from '../../config/statuses'
import { formatDate, formatLkr } from '../../lib/format'
import { saleStatus, type SaleStatus } from '../../lib/sales'
import { useDataStore } from '../../store/dataStore'
import type { Sale } from '../../types'

interface Row extends Sale {
  customerName: string
  status: SaleStatus
  units: number
}

export function SalesPage() {
  const navigate = useNavigate()
  const sales = useDataStore((s) => s.sales)
  const customers = useDataStore((s) => s.customers)
  const cheques = useDataStore((s) => s.cheques)
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [customerId, setCustomerId] = useState('')

  const all: Row[] = useMemo(
    () =>
      sales.map((s) => {
        const c = customers.find((x) => x.id === s.customerId)
        return { ...s, customerName: c?.business || c?.name || '—', status: saleStatus(s, cheques), units: s.items.reduce((sum, i) => sum + i.qty, 0) }
      }),
    [sales, customers, cheques],
  )

  const rows = all
    .filter((s) => (!type || s.type === type) && (!customerId || s.customerId === customerId) && (!status || s.status.label === status))
    .sort((a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number))

  const total = all.reduce((sum, s) => sum + s.status.total, 0)
  const collected = all.reduce((sum, s) => sum + s.status.paid, 0)
  const owing = all.filter((s) => s.status.balance > 0)

  const columns: Column<Row>[] = [
    { key: 'number', header: 'Sale', sortValue: (s) => s.number, render: (s) => <span className="font-medium text-slate-900">{s.number}</span> },
    { key: 'date', header: 'Date', sortValue: (s) => s.date, render: (s) => formatDate(s.date) },
    { key: 'type', header: 'Type', render: (s) => <Badge tone={SALE_TYPE[s.type].tone}>{SALE_TYPE[s.type].label}</Badge> },
    { key: 'customer', header: 'Customer', sortValue: (s) => s.customerName, render: (s) => s.customerName },
    { key: 'units', header: 'Units', align: 'right', sortValue: (s) => s.units, render: (s) => s.units.toLocaleString() },
    { key: 'total', header: 'Total', align: 'right', sortValue: (s) => s.status.total, render: (s) => formatLkr(s.status.total) },
    { key: 'paid', header: 'Paid', align: 'right', render: (s) => formatLkr(s.status.paid) },
    { key: 'bal', header: 'Balance', align: 'right', sortValue: (s) => s.status.balance, render: (s) => (s.status.balance > 0 ? <span className="font-medium text-red-600">{formatLkr(s.status.balance)}</span> : <span className="text-slate-400">—</span>) },
    { key: 'method', header: 'Method', render: (s) => <Badge tone={PAYMENT_METHOD[s.paymentMethod].tone}>{PAYMENT_METHOD[s.paymentMethod].label}</Badge> },
    {
      key: 'status',
      header: 'Status',
      render: (s) => (
        <div className="flex flex-wrap gap-1">
          <Badge tone={s.status.tone}>{s.status.label}</Badge>
          {s.status.chequeReturned && <Badge tone="red">Cheque returned</Badge>}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Sales"
        description="Whole-container and warehouse sales, with payments and printable invoices."
        actions={
          <Button onClick={() => navigate('/sales/new')}>
            <Plus size={16} /> New sale
          </Button>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sales" value={all.length} hint={`${all.filter((s) => s.type === 'FULL_CONTAINER').length} full container`} />
        <StatCard label="Total sales" value={formatLkr(total)} tone="green" />
        <StatCard label="Collected" value={formatLkr(collected)} hint="Cash and cheques not returned" tone="purple" />
        <StatCard label="Still to collect" value={formatLkr(owing.reduce((s, x) => s + x.status.balance, 0))} hint={`${owing.length} sale(s)`} tone="red" />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(s) => s.id}
        searchText={(s) => `${s.number} ${s.customerName} ${s.notes}`}
        searchPlaceholder="Search sale number, customer…"
        onRowClick={(s) => navigate(`/sales/${s.id}`)}
        emptyTitle="No sales found"
        emptyHint="Record a sale from warehouse stock or a whole container."
        toolbar={
          <>
            <Select value={type} onChange={(e) => setType(e.target.value)} className="w-auto" aria-label="Filter by type">
              <option value="">All types</option>
              <option value="WAREHOUSE">Warehouse</option>
              <option value="FULL_CONTAINER">Full container</option>
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto" aria-label="Filter by payment status">
              <option value="">All payment statuses</option>
              <option value="Paid">Paid</option>
              <option value="Part paid">Part paid</option>
              <option value="Unpaid">Unpaid</option>
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
    </div>
  )
}
