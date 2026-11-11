import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Badge, Button, DataTable, PageHeader, Select, StatCard, type Column } from '../../components/ui'
import { PAYMENT_TERM } from '../../config/statuses'
import { poTotalUsd } from '../../lib/calc'
import { formatDate, formatUsd } from '../../lib/format'
import { useDataStore } from '../../store/dataStore'
import type { SupplierInvoice } from '../../types'

interface Row extends SupplierInvoice {
  orderNumber: string
  supplierId: string
  supplierName: string
  poTotal: number
  diff: number
}

export function InvoicesPage() {
  const navigate = useNavigate()
  const invoices = useDataStore((s) => s.invoices)
  const orders = useDataStore((s) => s.purchaseOrders)
  const suppliers = useDataStore((s) => s.suppliers)
  const [supplierId, setSupplierId] = useState('')
  const [onlyMismatch, setOnlyMismatch] = useState(false)

  const all: Row[] = useMemo(
    () =>
      invoices.map((i) => {
        const po = orders.find((o) => o.id === i.poId)
        const poTotal = po ? poTotalUsd(po) : 0
        return {
          ...i,
          orderNumber: po?.number ?? '—',
          supplierId: po?.supplierId ?? '',
          supplierName: suppliers.find((s) => s.id === po?.supplierId)?.name ?? '—',
          poTotal,
          diff: Math.round((i.amountUsd - poTotal) * 100) / 100,
        }
      }),
    [invoices, orders, suppliers],
  )

  const rows = all
    .filter((r) => (!supplierId || r.supplierId === supplierId) && (!onlyMismatch || r.diff !== 0))
    .sort((a, b) => b.date.localeCompare(a.date))

  const columns: Column<Row>[] = [
    { key: 'number', header: 'Invoice', sortValue: (r) => r.number, render: (r) => <span className="font-medium text-slate-900">{r.number}</span> },
    { key: 'date', header: 'Date', sortValue: (r) => r.date, render: (r) => formatDate(r.date) },
    { key: 'order', header: 'Order', sortValue: (r) => r.orderNumber, render: (r) => r.orderNumber },
    { key: 'supplier', header: 'Supplier', sortValue: (r) => r.supplierName, render: (r) => r.supplierName },
    { key: 'amount', header: 'Amount', align: 'right', sortValue: (r) => r.amountUsd, render: (r) => formatUsd(r.amountUsd) },
    {
      key: 'check',
      header: 'vs order',
      render: (r) =>
        r.diff === 0 ? (
          <Badge tone="green">Matches</Badge>
        ) : (
          <Badge tone="amber">
            {r.diff > 0 ? '+' : '−'}
            {formatUsd(Math.abs(r.diff))}
          </Badge>
        ),
    },
    { key: 'term', header: 'Term', render: (r) => <Badge tone={PAYMENT_TERM[r.paymentTerm].tone}>{PAYMENT_TERM[r.paymentTerm].label}</Badge> },
    { key: 'advance', header: 'Advance', align: 'right', render: (r) => (r.advanceAmountUsd > 0 ? formatUsd(r.advanceAmountUsd) : '—') },
  ]

  return (
    <div>
      <PageHeader
        title="Invoices & Contracts"
        description="Supplier invoices and sales contracts, checked against the purchase order."
        actions={
          <Button onClick={() => navigate('/invoices/new')}>
            <Plus size={16} /> Record invoice
          </Button>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Invoices" value={all.length} />
        <StatCard label="Total invoiced" value={formatUsd(all.reduce((s, r) => s + r.amountUsd, 0))} tone="green" />
        <StatCard label="Advance payments" value={formatUsd(all.reduce((s, r) => s + r.advanceAmountUsd, 0))} tone="purple" />
        <StatCard label="Differs from order" value={all.filter((r) => r.diff !== 0).length} hint="Invoice amount ≠ PO total" tone="amber" />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        searchText={(r) => `${r.number} ${r.orderNumber} ${r.supplierName} ${r.contractNumber}`}
        searchPlaceholder="Search invoice, order, supplier, contract…"
        onRowClick={(r) => navigate(`/invoices/${r.id}`)}
        emptyTitle="No invoices found"
        emptyHint="Record the supplier's invoice once it arrives for an issued order."
        toolbar={
          <>
            <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-auto max-w-[12rem]" aria-label="Filter by supplier">
              <option value="">All suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={onlyMismatch} onChange={(e) => setOnlyMismatch(e.target.checked)} />
              Only differences
            </label>
          </>
        }
      />
    </div>
  )
}
