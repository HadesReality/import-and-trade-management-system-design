import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, DataTable, EmptyState, StatusBadge, type Column } from '../../components/ui'
import { BANK_PAYMENT_STATUS, PAYMENT_TERM } from '../../config/statuses'
import { computeShipmentCost, saleTotal } from '../../lib/calc'
import { formatDate, formatLkr, formatUsd } from '../../lib/format'
import { useDataStore } from '../../store/dataStore'
import type { BankPayment, Sale, Shipment } from '../../types'

/** Read-only summaries of records managed in other screens (Bank, Clearance, Costing, Sales). */

export function BankTab({ shipment }: { shipment: Shipment }) {
  const navigate = useNavigate()
  const payments = useDataStore((s) => s.bankPayments)
  const rows = payments.filter((p) => p.shipmentId === shipment.id)

  const columns: Column<BankPayment>[] = [
    { key: 'kind', header: 'Payment', render: (p) => (p.kind === 'ADVANCE' ? 'Advance' : 'Documents') },
    { key: 'term', header: 'Term', render: (p) => <Badge tone={PAYMENT_TERM[p.term].tone}>{PAYMENT_TERM[p.term].label}</Badge> },
    { key: 'bank', header: 'Bank', render: (p) => <div>{p.bank}{p.lcNumber && <p className="text-xs text-slate-500">{p.lcNumber}</p>}</div> },
    { key: 'usd', header: 'Amount', align: 'right', render: (p) => formatUsd(p.amountUsd) },
    { key: 'rate', header: 'Rate', align: 'right', render: (p) => p.exchangeRate.toFixed(2) },
    { key: 'lkr', header: 'In LKR', align: 'right', render: (p) => formatLkr(p.amountUsd * p.exchangeRate) },
    { key: 'charges', header: 'Bank charges', align: 'right', render: (p) => formatLkr(p.docCharges + p.commission + p.otherCharges) },
    { key: 'date', header: 'Paid on', render: (p) => formatDate(p.paidDate) },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge meta={BANK_PAYMENT_STATUS[p.status]} /> },
  ]

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => navigate(`/bank/new?shipment=${shipment.id}`)}>
          <Plus size={14} /> Record payment
        </Button>
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(p) => p.id}
        onRowClick={(p) => navigate(`/bank/${p.id}`)}
        emptyTitle="No bank payments yet"
        emptyHint="Advance and document payments appear here once recorded."
      />
    </div>
  )
}

export function ClearanceTab({ shipment }: { shipment: Shipment }) {
  const clearances = useDataStore((s) => s.clearances)
  const navigate = useNavigate()
  const c = clearances.find((x) => x.shipmentId === shipment.id)
  const canHandOver = shipment.status === 'ARRIVED' || shipment.status === 'BANK_DOCS_COLLECTED'
  if (!c) {
    return (
      <Card>
        <EmptyState
          title="Not handed to a clearing agent yet"
          hint="Clearance details appear here once the documents are handed over."
          action={
            canHandOver ? (
              <Button size="sm" onClick={() => navigate(`/clearance/new?shipment=${shipment.id}`)}>
                Hand over to clearing agent
              </Button>
            ) : undefined
          }
        />
      </Card>
    )
  }
  const total = c.duties + c.portCharges + c.transport + c.agentFee + c.otherCharges
  return (
    <Card>
      <CardHeader
        title={c.clearingCompany}
        description={`Handed over ${formatDate(c.handoverDate)}`}
        actions={
          <>
            {c.releaseDate ? <Badge tone="green">Released {formatDate(c.releaseDate)}</Badge> : <Badge tone="amber">Not released</Badge>}
            <Button size="sm" variant="secondary" onClick={() => navigate(`/clearance/${c.id}`)}>
              Open
            </Button>
          </>
        }
      />
      <CardBody>
        <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          {[
            ['CusDec number', c.cusdecNumber || '—'],
            ['Customs duties & taxes', formatLkr(c.duties)],
            ['Port & handling', formatLkr(c.portCharges)],
            ['Transport', formatLkr(c.transport)],
            ['Clearing agent fee', formatLkr(c.agentFee)],
            ['Other charges', formatLkr(c.otherCharges)],
            ['Total clearance cost', formatLkr(total)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-slate-100 py-1.5">
              <dt className="text-slate-500">{k}</dt>
              <dd className="font-medium text-slate-900">{v}</dd>
            </div>
          ))}
        </dl>
      </CardBody>
    </Card>
  )
}

export function CostingTab({ shipment }: { shipment: Shipment }) {
  const data = useDataStore()
  const cost = computeShipmentCost(data, shipment.id)
  if (!cost) return <Card><EmptyState title="No cost data yet" /></Card>
  return (
    <Card>
      <CardHeader
        title="Landed cost"
        description="Goods + bank charges + clearance"
        actions={cost.isEstimate ? <Badge tone="amber">Estimate — not all costs are in yet</Badge> : <Badge tone="green">Final</Badge>}
      />
      <CardBody>
        <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          {[
            ['Goods (USD × rate paid)', formatLkr(cost.goodsLkr)],
            ['Bank charges', formatLkr(cost.bankCharges)],
            ['Clearance costs', formatLkr(cost.clearanceTotal)],
            ['Total landed cost', formatLkr(cost.totalLanded)],
            ['Quantity', cost.totalQty.toLocaleString()],
            ['Landed cost per unit', formatLkr(cost.perUnit)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-slate-100 py-1.5">
              <dt className="text-slate-500">{k}</dt>
              <dd className="font-medium text-slate-900">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-sm">
          <Link to={`/costing/${shipment.id}`} className="font-medium text-brand-600 hover:underline">
            Open full costing →
          </Link>{' '}
          <span className="text-xs text-slate-500">with per-product costs, suggested prices and profit.</span>
        </p>
      </CardBody>
    </Card>
  )
}

export function SalesTab({ shipment }: { shipment: Shipment }) {
  const sales = useDataStore((s) => s.sales)
  const stockItems = useDataStore((s) => s.stockItems)
  const customers = useDataStore((s) => s.customers)

  const stockIds = new Set(stockItems.filter((i) => i.shipmentId === shipment.id).map((i) => i.id))
  const rows = sales.filter((s) => s.shipmentId === shipment.id || s.items.some((i) => i.stockItemId && stockIds.has(i.stockItemId)))
  const customerName = (id: string) => customers.find((c) => c.id === id)?.business ?? '—'

  const columns: Column<Sale>[] = [
    { key: 'number', header: 'Sale', render: (s) => <span className="font-medium text-slate-900">{s.number}</span> },
    { key: 'date', header: 'Date', render: (s) => formatDate(s.date) },
    { key: 'type', header: 'Type', render: (s) => (s.type === 'FULL_CONTAINER' ? 'Full container' : 'Warehouse') },
    { key: 'customer', header: 'Customer', render: (s) => customerName(s.customerId) },
    { key: 'qty', header: 'Units', align: 'right', render: (s) => s.items.reduce((sum, i) => sum + i.qty, 0).toLocaleString() },
    { key: 'total', header: 'Total', align: 'right', render: (s) => formatLkr(saleTotal(s)) },
  ]
  return <DataTable columns={columns} rows={rows} rowKey={(s) => s.id} emptyTitle="No sales yet" emptyHint="Sales of this shipment's goods appear here." />
}
