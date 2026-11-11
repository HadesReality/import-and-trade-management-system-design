import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Badge, Button, DataTable, PageHeader, Select, StatCard, type Column } from '../../components/ui'
import { SL_DISTRICTS } from '../../config/sriLanka'
import { saleTotal } from '../../lib/calc'
import { formatLkr } from '../../lib/format'
import { saleStatus } from '../../lib/sales'
import { useDataStore } from '../../store/dataStore'
import type { Customer } from '../../types'
import { CustomerFormModal } from './CustomerFormModal'

interface Row extends Customer {
  salesCount: number
  purchases: number
  outstanding: number
  returned: boolean
}

export function CustomersPage() {
  const navigate = useNavigate()
  const customers = useDataStore((s) => s.customers)
  const sales = useDataStore((s) => s.sales)
  const cheques = useDataStore((s) => s.cheques)
  const [district, setDistrict] = useState('')
  const [onlyOwing, setOnlyOwing] = useState(false)
  const [adding, setAdding] = useState(false)

  const all: Row[] = useMemo(
    () =>
      customers.map((c) => {
        const mine = sales.filter((s) => s.customerId === c.id)
        const statuses = mine.map((s) => saleStatus(s, cheques))
        return {
          ...c,
          salesCount: mine.length,
          purchases: mine.reduce((sum, s) => sum + saleTotal(s), 0),
          outstanding: statuses.reduce((sum, st) => sum + st.balance, 0),
          returned: statuses.some((st) => st.chequeReturned),
        }
      }),
    [customers, sales, cheques],
  )

  const rows = all.filter((c) => (!district || c.district === district) && (!onlyOwing || c.outstanding > 0))
  const owing = all.filter((c) => c.outstanding > 0)

  const columns: Column<Row>[] = [
    {
      key: 'name',
      header: 'Customer',
      sortValue: (c) => c.business || c.name,
      render: (c) => (
        <div>
          <p className="font-medium text-slate-900">{c.business || c.name}</p>
          {c.business && <p className="text-xs text-slate-500">{c.name}</p>}
        </div>
      ),
    },
    { key: 'place', header: 'Location', sortValue: (c) => c.district, render: (c) => [c.city, c.district].filter((v, i, a) => v && a.indexOf(v) === i).join(', ') },
    { key: 'phone', header: 'Phone', render: (c) => c.phone },
    { key: 'sales', header: 'Sales', align: 'right', sortValue: (c) => c.salesCount, render: (c) => c.salesCount },
    { key: 'purchases', header: 'Total purchases', align: 'right', sortValue: (c) => c.purchases, render: (c) => formatLkr(c.purchases) },
    {
      key: 'owing',
      header: 'Outstanding',
      align: 'right',
      sortValue: (c) => c.outstanding,
      render: (c) =>
        c.outstanding > 0 ? (
          <div>
            <p className="font-medium text-red-600">{formatLkr(c.outstanding)}</p>
            {c.returned && <Badge tone="red">Cheque returned</Badge>}
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Local buyers, what they have bought and what they still owe."
        actions={
          <Button onClick={() => setAdding(true)}>
            <Plus size={16} /> Add customer
          </Button>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Customers" value={customers.length} />
        <StatCard label="Total purchases" value={formatLkr(all.reduce((s, c) => s + c.purchases, 0))} tone="green" />
        <StatCard label="Outstanding" value={formatLkr(owing.reduce((s, c) => s + c.outstanding, 0))} hint={`${owing.length} customer(s) owe money`} tone="red" />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(c) => c.id}
        searchText={(c) => `${c.business} ${c.name} ${c.city} ${c.district} ${c.phone} ${c.email}`}
        searchPlaceholder="Search customer, town, phone…"
        onRowClick={(c) => navigate(`/customers/${c.id}`)}
        emptyTitle="No customers found"
        toolbar={
          <>
            <Select value={district} onChange={(e) => setDistrict(e.target.value)} className="w-auto" aria-label="Filter by district">
              <option value="">All districts</option>
              {SL_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={onlyOwing} onChange={(e) => setOnlyOwing(e.target.checked)} />
              Only customers who owe
            </label>
          </>
        }
      />
      {adding && <CustomerFormModal onClose={() => setAdding(false)} onSaved={(id) => navigate(`/customers/${id}`)} />}
    </div>
  )
}
