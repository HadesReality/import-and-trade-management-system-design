import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Badge, Button, DataTable, PageHeader, Select, type Column } from '../../components/ui'
import { PAYMENT_TERM } from '../../config/statuses'
import { poTotalUsd } from '../../lib/calc'
import { formatUsd } from '../../lib/format'
import { useDataStore } from '../../store/dataStore'
import type { Supplier } from '../../types'
import { SupplierFormModal } from './SupplierFormModal'

interface Row extends Supplier {
  orders: number
  totalUsd: number
}

export function SuppliersPage() {
  const navigate = useNavigate()
  const suppliers = useDataStore((s) => s.suppliers)
  const purchaseOrders = useDataStore((s) => s.purchaseOrders)
  const [country, setCountry] = useState('')
  const [adding, setAdding] = useState(false)

  const rows: Row[] = useMemo(
    () =>
      suppliers
        .filter((s) => !country || s.country === country)
        .map((s) => {
          const pos = purchaseOrders.filter((p) => p.supplierId === s.id && p.status !== 'CANCELLED')
          return { ...s, orders: pos.length, totalUsd: pos.reduce((sum, p) => sum + poTotalUsd(p), 0) }
        }),
    [suppliers, purchaseOrders, country],
  )

  const countries = useMemo(() => [...new Set(suppliers.map((s) => s.country))].sort(), [suppliers])

  const columns: Column<Row>[] = [
    {
      key: 'name',
      header: 'Supplier',
      sortValue: (r) => r.name,
      render: (r) => (
        <div>
          <p className="font-medium text-slate-900">{r.name}</p>
          <p className="text-xs text-slate-500">{r.productsSupplied}</p>
        </div>
      ),
    },
    { key: 'country', header: 'Country', sortValue: (r) => r.country, render: (r) => `${r.city ? `${r.city}, ` : ''}${r.country}` },
    {
      key: 'contact',
      header: 'Contact',
      render: (r) => (
        <div>
          <p>{r.contactPerson}</p>
          {r.whatsapp && (
            <a
              href={`https://wa.me/${r.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-green-700 hover:underline"
            >
              WhatsApp {r.whatsapp}
            </a>
          )}
        </div>
      ),
    },
    { key: 'term', header: 'Usual term', render: (r) => <Badge tone={PAYMENT_TERM[r.usualTerm].tone}>{PAYMENT_TERM[r.usualTerm].label}</Badge> },
    { key: 'orders', header: 'Orders', align: 'right', sortValue: (r) => r.orders, render: (r) => r.orders },
    { key: 'total', header: 'Total purchased', align: 'right', sortValue: (r) => r.totalUsd, render: (r) => formatUsd(r.totalUsd) },
  ]

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Overseas suppliers you buy from, with contacts and negotiation notes."
        actions={
          <Button onClick={() => setAdding(true)}>
            <Plus size={16} /> Add supplier
          </Button>
        }
      />
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        searchText={(r) => `${r.name} ${r.country} ${r.city} ${r.contactPerson} ${r.productsSupplied} ${r.email}`}
        searchPlaceholder="Search suppliers, products, contacts…"
        onRowClick={(r) => navigate(`/suppliers/${r.id}`)}
        emptyTitle="No suppliers found"
        emptyHint="Add your first supplier to start recording purchase orders."
        toolbar={
          <Select value={country} onChange={(e) => setCountry(e.target.value)} className="w-auto" aria-label="Filter by country">
            <option value="">All countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        }
      />
      {adding && <SupplierFormModal onClose={() => setAdding(false)} onSaved={(id) => navigate(`/suppliers/${id}`)} />}
    </div>
  )
}
