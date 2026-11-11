import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Mail, MapPin, Pencil, Phone, Plus, Trash2 } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, DataTable, EmptyState, Modal, StatCard, StatusBadge, Tabs, type Column } from '../../components/ui'
import { CHEQUE_STATUS, SALE_TYPE } from '../../config/statuses'
import { saleTotal } from '../../lib/calc'
import { formatDate, formatLkr } from '../../lib/format'
import { saleStatus } from '../../lib/sales'
import { useDataStore } from '../../store/dataStore'
import type { Cheque, Sale } from '../../types'
import { CustomerFormModal } from './CustomerFormModal'

type Tab = 'sales' | 'cheques'

export function CustomerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const customer = useDataStore((s) => s.customers.find((c) => c.id === id))
  const sales = useDataStore((s) => s.sales)
  const cheques = useDataStore((s) => s.cheques)
  const remove = useDataStore((s) => s.remove)
  const [tab, setTab] = useState<Tab>('sales')
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!customer) {
    return (
      <Card>
        <EmptyState title="Customer not found" hint="It may have been deleted." action={<Button onClick={() => navigate('/customers')}>Back to customers</Button>} />
      </Card>
    )
  }

  const mySales = sales.filter((s) => s.customerId === customer.id).sort((a, b) => b.date.localeCompare(a.date))
  const myCheques = cheques.filter((c) => c.customerId === customer.id).sort((a, b) => b.chequeDate.localeCompare(a.chequeDate))
  const statuses = mySales.map((s) => saleStatus(s, cheques))
  const outstanding = statuses.reduce((sum, st) => sum + st.balance, 0)
  const title = customer.business || customer.name

  const saleColumns: Column<Sale>[] = [
    { key: 'number', header: 'Sale', sortValue: (s) => s.number, render: (s) => <span className="font-medium text-slate-900">{s.number}</span> },
    { key: 'date', header: 'Date', sortValue: (s) => s.date, render: (s) => formatDate(s.date) },
    { key: 'type', header: 'Type', render: (s) => <Badge tone={SALE_TYPE[s.type].tone}>{SALE_TYPE[s.type].label}</Badge> },
    { key: 'total', header: 'Total', align: 'right', sortValue: (s) => saleTotal(s), render: (s) => formatLkr(saleTotal(s)) },
    { key: 'bal', header: 'Balance', align: 'right', render: (s) => formatLkr(saleStatus(s, cheques).balance) },
    { key: 'status', header: 'Status', render: (s) => { const st = saleStatus(s, cheques); return <Badge tone={st.tone}>{st.label}</Badge> } },
  ]

  const chequeColumns: Column<Cheque>[] = [
    { key: 'no', header: 'Cheque no.', render: (c) => <span className="font-medium text-slate-900">{c.number}</span> },
    { key: 'bank', header: 'Bank', render: (c) => `${c.bank}, ${c.branch}` },
    { key: 'date', header: 'Cheque date', sortValue: (c) => c.chequeDate, render: (c) => formatDate(c.chequeDate) },
    { key: 'sale', header: 'Sale', render: (c) => sales.find((s) => s.id === c.saleId)?.number ?? '—' },
    { key: 'amount', header: 'Amount', align: 'right', render: (c) => formatLkr(c.amount) },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge meta={CHEQUE_STATUS[c.status]} /> },
  ]

  return (
    <div>
      <Link to="/customers" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Customers
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin size={14} /> {[customer.city, customer.district].filter((v, i, a) => v && a.indexOf(v) === i).join(', ')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate(`/sales/new?customer=${customer.id}`)}>
            <Plus size={15} /> New sale
          </Button>
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <Pencil size={15} /> Edit
          </Button>
          <Button variant="secondary" className="text-red-600 hover:bg-red-50" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={15} /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Contact" />
          <CardBody>
            <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Contact person</dt>
                <dd className="mt-0.5 font-medium text-slate-900">{customer.name}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Phone</dt>
                <dd className="mt-0.5">
                  <a href={`tel:${customer.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 font-medium text-brand-600 hover:underline">
                    <Phone size={14} /> {customer.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Email</dt>
                <dd className="mt-0.5">
                  {customer.email ? (
                    <a href={`mailto:${customer.email}`} className="inline-flex items-center gap-1.5 font-medium text-brand-600 hover:underline">
                      <Mail size={14} /> {customer.email}
                    </a>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">District</dt>
                <dd className="mt-0.5 font-medium text-slate-900">{customer.district}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-slate-500">Address</dt>
                <dd className="mt-0.5 text-slate-800">{customer.address || '—'}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          <StatCard label="Total purchases" value={formatLkr(mySales.reduce((s, x) => s + saleTotal(x), 0))} hint={`${mySales.length} sale(s)`} tone="green" />
          <StatCard label="Outstanding" value={formatLkr(outstanding)} tone={outstanding > 0 ? 'red' : 'green'} />
        </div>
      </div>

      <div className="mt-6">
        <Tabs
          tabs={[
            { id: 'sales', label: `Sales (${mySales.length})` },
            { id: 'cheques', label: `Cheques (${myCheques.length})` },
          ]}
          value={tab}
          onChange={setTab}
        />
        <div className="mt-4">
          {tab === 'sales' ? (
            <DataTable columns={saleColumns} rows={mySales} rowKey={(s) => s.id} onRowClick={(s) => navigate(`/sales/${s.id}`)} emptyTitle="No sales yet" />
          ) : (
            <DataTable columns={chequeColumns} rows={myCheques} rowKey={(c) => c.id} emptyTitle="No cheques" />
          )}
        </div>
      </div>

      {editing && <CustomerFormModal customer={customer} onClose={() => setEditing(false)} />}

      <Modal
        open={confirmDelete}
        title="Delete customer?"
        onClose={() => setConfirmDelete(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={mySales.length > 0}
              onClick={() => {
                remove('customers', customer.id)
                navigate('/customers')
              }}
            >
              Delete customer
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-700">
          {mySales.length > 0 ? (
            <>
              <strong>{title}</strong> has {mySales.length} sale(s), so it can't be deleted.
            </>
          ) : (
            <>
              This permanently removes <strong>{title}</strong> from the demo data.
            </>
          )}
        </p>
      </Modal>
    </div>
  )
}
