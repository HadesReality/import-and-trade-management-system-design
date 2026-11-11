import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Mail, MapPin, MessageCircle, Pencil, Trash2 } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  DataTable,
  EmptyState,
  Modal,
  StatCard,
  StatusBadge,
  Tabs,
  Textarea,
  type Column,
} from '../../components/ui'
import { roleLabel } from '../../config/roles'
import { PAYMENT_TERM, PO_STATUS, SHIPMENT_STATUS } from '../../config/statuses'
import { poTotalUsd } from '../../lib/calc'
import { formatDate, formatUsd, todayISO } from '../../lib/format'
import { useDataStore } from '../../store/dataStore'
import { useUiStore } from '../../store/uiStore'
import type { PurchaseOrder, Shipment } from '../../types'
import { SupplierFormModal } from './SupplierFormModal'

type Tab = 'orders' | 'shipments' | 'notes'

export function SupplierDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const role = useUiStore((s) => s.role)
  const supplier = useDataStore((s) => s.suppliers.find((x) => x.id === id))
  const purchaseOrders = useDataStore((s) => s.purchaseOrders)
  const shipments = useDataStore((s) => s.shipments)
  const update = useDataStore((s) => s.update)
  const remove = useDataStore((s) => s.remove)

  const [tab, setTab] = useState<Tab>('orders')
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [noteText, setNoteText] = useState('')

  if (!supplier) {
    return (
      <Card>
        <EmptyState
          title="Supplier not found"
          hint="It may have been deleted."
          action={<Button onClick={() => navigate('/suppliers')}>Back to suppliers</Button>}
        />
      </Card>
    )
  }

  const orders = purchaseOrders.filter((p) => p.supplierId === supplier.id)
  const supplierShipments = shipments.filter((s) => s.supplierId === supplier.id)
  const activeOrders = orders.filter((p) => p.status !== 'CANCELLED')
  const totalUsd = activeOrders.reduce((sum, p) => sum + poTotalUsd(p), 0)
  const sortedNotes = [...supplier.notes].sort((a, b) => b.date.localeCompare(a.date))

  const addNote = () => {
    const text = noteText.trim()
    if (!text) return
    update('suppliers', supplier.id, {
      notes: [...supplier.notes, { id: `note-${Date.now().toString(36)}`, date: todayISO(), text, role }],
    })
    setNoteText('')
  }

  const deleteNote = (noteId: string) =>
    update('suppliers', supplier.id, { notes: supplier.notes.filter((n) => n.id !== noteId) })

  const orderColumns: Column<PurchaseOrder>[] = [
    { key: 'number', header: 'Number', sortValue: (p) => p.number, render: (p) => <span className="font-medium text-slate-900">{p.number}</span> },
    { key: 'type', header: 'Type', render: (p) => <Badge tone={p.kind === 'PO' ? 'blue' : 'gray'}>{p.kind}</Badge> },
    { key: 'date', header: 'Date', sortValue: (p) => p.date, render: (p) => formatDate(p.date) },
    { key: 'term', header: 'Term', render: (p) => <Badge tone={PAYMENT_TERM[p.paymentTerm].tone}>{PAYMENT_TERM[p.paymentTerm].label}</Badge> },
    { key: 'total', header: 'Total', align: 'right', sortValue: (p) => poTotalUsd(p), render: (p) => formatUsd(poTotalUsd(p)) },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge meta={PO_STATUS[p.status]} /> },
  ]

  const shipmentColumns: Column<Shipment>[] = [
    { key: 'ref', header: 'Shipment', sortValue: (s) => s.ref, render: (s) => <span className="font-medium text-slate-900">{s.ref}</span> },
    { key: 'vessel', header: 'Vessel', render: (s) => s.vessel || <span className="text-slate-400">Not booked yet</span> },
    { key: 'bl', header: 'BL number', render: (s) => s.blNumber || '—' },
    { key: 'eta', header: 'ETA', sortValue: (s) => s.eta ?? '', render: (s) => formatDate(s.eta) },
    { key: 'status', header: 'Status', render: (s) => <StatusBadge meta={SHIPMENT_STATUS[s.status]} /> },
  ]

  return (
    <div>
      <Link to="/suppliers" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Suppliers
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{supplier.name}</h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin size={14} />
            {[supplier.city, supplier.country].filter(Boolean).join(', ')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <Pencil size={15} /> Edit
          </Button>
          <Button variant="secondary" onClick={() => setConfirmDelete(true)} className="text-red-600 hover:bg-red-50">
            <Trash2 size={15} /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Contact & terms" />
          <CardBody>
            <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Contact person</dt>
                <dd className="mt-0.5 font-medium text-slate-900">{supplier.contactPerson}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Usual payment term</dt>
                <dd className="mt-0.5">
                  <Badge tone={PAYMENT_TERM[supplier.usualTerm].tone}>
                    {PAYMENT_TERM[supplier.usualTerm].label} — {PAYMENT_TERM[supplier.usualTerm].full}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">WhatsApp</dt>
                <dd className="mt-0.5">
                  {supplier.whatsapp ? (
                    <a
                      href={`https://wa.me/${supplier.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-green-700 hover:underline"
                    >
                      <MessageCircle size={14} /> {supplier.whatsapp}
                    </a>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Email</dt>
                <dd className="mt-0.5">
                  {supplier.email ? (
                    <a href={`mailto:${supplier.email}`} className="inline-flex items-center gap-1.5 font-medium text-brand-600 hover:underline">
                      <Mail size={14} /> {supplier.email}
                    </a>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-slate-500">Address</dt>
                <dd className="mt-0.5 text-slate-800">{supplier.address || '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-slate-500">Products supplied</dt>
                <dd className="mt-0.5 text-slate-800">{supplier.productsSupplied || '—'}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          <StatCard label="Orders placed" value={activeOrders.length} hint={`${supplierShipments.length} shipment(s)`} />
          <StatCard label="Total purchased" value={formatUsd(totalUsd)} tone="green" />
        </div>
      </div>

      <div className="mt-6">
        <Tabs
          tabs={[
            { id: 'orders', label: `Orders (${orders.length})` },
            { id: 'shipments', label: `Shipments (${supplierShipments.length})` },
            { id: 'notes', label: `Negotiation notes (${supplier.notes.length})` },
          ]}
          value={tab}
          onChange={setTab}
        />
        <div className="mt-4">
          {tab === 'orders' && (
            <DataTable columns={orderColumns} rows={orders} rowKey={(p) => p.id} emptyTitle="No orders yet" emptyHint="Purchase orders and LOIs for this supplier will appear here." />
          )}
          {tab === 'shipments' && (
            <DataTable columns={shipmentColumns} rows={supplierShipments} rowKey={(s) => s.id} emptyTitle="No shipments yet" />
          )}
          {tab === 'notes' && (
            <Card>
              <CardBody className="space-y-5">
                <div>
                  <Textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Record what was agreed — price, quantity, payment terms, loading date… (paste from WhatsApp)"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Saved as {roleLabel(role)}, {formatDate(todayISO())}</span>
                    <Button size="sm" onClick={addNote} disabled={!noteText.trim()}>
                      Add note
                    </Button>
                  </div>
                </div>
                {sortedNotes.length === 0 ? (
                  <EmptyState title="No notes yet" hint="Keep the negotiation history here instead of in WhatsApp chats." />
                ) : (
                  <ul className="space-y-3">
                    {sortedNotes.map((n) => (
                      <li key={n.id} className="rounded-lg border border-slate-200 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-xs text-slate-500">
                            {formatDate(n.date)} · {roleLabel(n.role)}
                          </p>
                          <button
                            onClick={() => deleteNote(n.id)}
                            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            aria-label="Delete note"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{n.text}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {editing && <SupplierFormModal supplier={supplier} onClose={() => setEditing(false)} />}

      <Modal
        open={confirmDelete}
        title="Delete supplier?"
        onClose={() => setConfirmDelete(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={orders.length > 0}
              onClick={() => {
                remove('suppliers', supplier.id)
                navigate('/suppliers')
              }}
            >
              Delete supplier
            </Button>
          </>
        }
      >
        {orders.length > 0 ? (
          <p className="text-sm text-slate-700">
            <strong>{supplier.name}</strong> has {orders.length} purchase order(s) / LOI(s), so it can't be deleted.
            Cancel or remove those orders first.
          </p>
        ) : (
          <p className="text-sm text-slate-700">
            This permanently removes <strong>{supplier.name}</strong> and its negotiation notes from the demo data.
          </p>
        )}
      </Modal>
    </div>
  )
}
