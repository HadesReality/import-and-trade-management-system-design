import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Badge, Button, DataTable, PageHeader, Select, StatCard, StatusBadge, type Column } from '../../components/ui'
import { PAYMENT_TERM, PO_STATUS } from '../../config/statuses'
import { poTotalUsd } from '../../lib/calc'
import { formatDate, formatUsd } from '../../lib/format'
import { useDataStore } from '../../store/dataStore'
import type { OrderKind, POStatus, PurchaseOrder } from '../../types'

export function PurchaseOrdersPage() {
  const navigate = useNavigate()
  const orders = useDataStore((s) => s.purchaseOrders)
  const suppliers = useDataStore((s) => s.suppliers)
  const [kind, setKind] = useState<OrderKind | ''>('')
  const [status, setStatus] = useState<POStatus | ''>('')
  const [supplierId, setSupplierId] = useState('')

  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.name ?? '—'

  const rows = useMemo(
    () =>
      orders
        .filter((o) => (!kind || o.kind === kind) && (!status || o.status === status) && (!supplierId || o.supplierId === supplierId))
        .sort((a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number)),
    [orders, kind, status, supplierId],
  )

  const live = orders.filter((o) => o.status !== 'CANCELLED')
  const awaitingInvoice = orders.filter((o) => o.status === 'ISSUED')

  const columns: Column<PurchaseOrder>[] = [
    { key: 'number', header: 'Number', sortValue: (o) => o.number, render: (o) => <span className="font-medium text-slate-900">{o.number}</span> },
    { key: 'kind', header: 'Type', render: (o) => <Badge tone={o.kind === 'PO' ? 'blue' : 'gray'}>{o.kind}</Badge> },
    { key: 'date', header: 'Date', sortValue: (o) => o.date, render: (o) => formatDate(o.date) },
    { key: 'supplier', header: 'Supplier', sortValue: (o) => supplierName(o.supplierId), render: (o) => supplierName(o.supplierId) },
    { key: 'term', header: 'Term', render: (o) => <Badge tone={PAYMENT_TERM[o.paymentTerm].tone}>{PAYMENT_TERM[o.paymentTerm].label}</Badge> },
    { key: 'total', header: 'Total', align: 'right', sortValue: (o) => poTotalUsd(o), render: (o) => formatUsd(poTotalUsd(o)) },
    { key: 'status', header: 'Status', render: (o) => <StatusBadge meta={PO_STATUS[o.status]} /> },
  ]

  return (
    <div>
      <PageHeader
        title="Purchase Orders / LOI"
        description="Letters of intent and purchase orders issued to overseas suppliers."
        actions={
          <Button onClick={() => navigate('/purchase-orders/new')}>
            <Plus size={16} /> New order
          </Button>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Orders on record" value={live.length} hint={`${live.filter((o) => o.kind === 'LOI').length} LOI · ${live.filter((o) => o.kind === 'PO').length} PO`} />
        <StatCard label="Awaiting supplier invoice" value={awaitingInvoice.length} tone="amber" />
        <StatCard label="Total value ordered" value={formatUsd(live.reduce((sum, o) => sum + poTotalUsd(o), 0))} tone="green" />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(o) => o.id}
        searchText={(o) => `${o.number} ${supplierName(o.supplierId)} ${o.conditions}`}
        searchPlaceholder="Search number, supplier…"
        onRowClick={(o) => navigate(`/purchase-orders/${o.id}`)}
        emptyTitle="No orders found"
        emptyHint="Create a purchase order or LOI once the price and payment terms are agreed."
        toolbar={
          <>
            <Select value={kind} onChange={(e) => setKind(e.target.value as OrderKind | '')} className="w-auto" aria-label="Filter by type">
              <option value="">PO and LOI</option>
              <option value="PO">Purchase orders</option>
              <option value="LOI">LOIs</option>
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value as POStatus | '')} className="w-auto" aria-label="Filter by status">
              <option value="">All statuses</option>
              {Object.entries(PO_STATUS).map(([id, m]) => (
                <option key={id} value={id}>
                  {m.label}
                </option>
              ))}
            </Select>
            <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-auto max-w-[12rem]" aria-label="Filter by supplier">
              <option value="">All suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </>
        }
      />
    </div>
  )
}
