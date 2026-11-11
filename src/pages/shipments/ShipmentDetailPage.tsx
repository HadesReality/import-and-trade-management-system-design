import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRightLeft, Container, Pencil, Trash2, Undo2 } from 'lucide-react'
import { roleLabel } from '../../config/roles'
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Modal, StatusBadge, Tabs } from '../../components/ui'
import { SHIPMENT_STATUS } from '../../config/statuses'
import { formatDate, transitDays } from '../../lib/format'
import { etaInfo } from '../../lib/shipments'
import { useDataStore } from '../../store/dataStore'
import { ChangeStatusModal } from './ChangeStatusModal'
import { DocumentsCard } from './DocumentsCard'
import { BankTab, ClearanceTab, CostingTab, SalesTab } from './LinkedTabs'
import { ShippingInfoModal } from './ShippingInfoModal'
import { useShipmentStatus } from './useShipmentStatus'

type Tab = 'overview' | 'bank' | 'clearance' | 'costing' | 'sales'
type Dialog = 'status' | 'info' | 'delete' | 'undo' | null

export function ShipmentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const shipment = useDataStore((s) => s.shipments.find((x) => x.id === id))
  const order = useDataStore((s) => s.purchaseOrders.find((o) => o.id === shipment?.poId))
  const supplier = useDataStore((s) => s.suppliers.find((x) => x.id === shipment?.supplierId))
  const invoice = useDataStore((s) => s.invoices.find((i) => i.id === shipment?.invoiceId))
  const bankPayments = useDataStore((s) => s.bankPayments)
  const remove = useDataStore((s) => s.remove)
  const { undoLast } = useShipmentStatus()
  const [tab, setTab] = useState<Tab>('overview')
  const [dialog, setDialog] = useState<Dialog>(null)

  if (!shipment) {
    return (
      <Card>
        <EmptyState title="Shipment not found" hint="It may have been deleted." action={<Button onClick={() => navigate('/shipments')}>Back to shipments</Button>} />
      </Card>
    )
  }

  const eta = etaInfo(shipment)
  const transit = transitDays(shipment.etd, shipment.eta)
  const hasPayments = bankPayments.some((p) => p.shipmentId === shipment.id)
  const canDelete = ['PO_ISSUED', 'INVOICE_RECEIVED'].includes(shipment.status) && !hasPayments
  const canUndo = shipment.timeline.length > 1
  const previous = shipment.timeline[shipment.timeline.length - 2]

  return (
    <div>
      <Link to="/shipments" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Shipments
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-slate-900">{shipment.ref}</h2>
            <StatusBadge meta={SHIPMENT_STATUS[shipment.status]} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            <Link to={`/suppliers/${shipment.supplierId}`} className="hover:underline">{supplier?.name}</Link>
            {order && (
              <>
                {' · '}
                <Link to={`/purchase-orders/${order.id}`} className="hover:underline">{order.number}</Link>
              </>
            )}
            {invoice && (
              <>
                {' · '}
                <Link to={`/invoices/${invoice.id}`} className="hover:underline">Invoice {invoice.number}</Link>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setDialog('status')}>
            <ArrowRightLeft size={15} /> Change status
          </Button>
          <Button variant="secondary" onClick={() => setDialog('info')}>
            <Pencil size={15} /> Edit shipping info
          </Button>
          {canDelete && (
            <Button variant="secondary" className="text-red-600 hover:bg-red-50" onClick={() => setDialog('delete')}>
              <Trash2 size={15} /> Delete
            </Button>
          )}
        </div>
      </div>

      <Tabs
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'bank', label: 'Bank' },
          { id: 'clearance', label: 'Clearance' },
          { id: 'costing', label: 'Costing' },
          { id: 'sales', label: 'Sales' },
        ]}
        value={tab}
        onChange={setTab}
      />

      <div className="mt-5">
        {tab === 'overview' && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ['ETD (departure)', formatDate(shipment.etd), null],
                ['ETA (arrival)', formatDate(shipment.eta), <Badge key="eta" tone={eta.tone}>{eta.label}</Badge>],
                ['Transit time', transit !== undefined ? `${transit} days` : '—', null],
                ['Containers', `${shipment.containers.length} × ${shipment.loadType}`, null],
              ].map(([label, value, badge]) => (
                <div key={label as string} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-slate-900">
                    {value} {badge}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Card>
                <CardHeader title="Shipping info" />
                <CardBody>
                  <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                    {[
                      ['Vessel', shipment.vessel || '—'],
                      ['Voyage', shipment.voyage || '—'],
                      ['Shipping line', shipment.shippingLine || '—'],
                      ['BL number', shipment.blNumber || '—'],
                      ['Loading port', shipment.loadingPort || '—'],
                      ['Discharge port', shipment.dischargePort || '—'],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-slate-500">{k}</dt>
                        <dd className="mt-0.5 font-medium text-slate-900">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <p className="mb-2 text-sm text-slate-500">Containers</p>
                    {shipment.containers.length === 0 ? (
                      <p className="text-sm text-slate-400">None added yet</p>
                    ) : (
                      <ul className="flex flex-wrap gap-2">
                        {shipment.containers.map((c) => (
                          <li key={c.number} className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-2.5 py-1 text-sm">
                            <Container size={14} className="text-slate-500" />
                            {c.number}
                            <span className="text-xs text-slate-500">{c.size.replace('FT', ' ft').replace('HC', ' HC')}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader
                  title="Status timeline"
                  actions={
                    canUndo ? (
                      <Button size="sm" variant="ghost" onClick={() => setDialog('undo')}>
                        <Undo2 size={14} /> Undo last
                      </Button>
                    ) : undefined
                  }
                />
                <CardBody>
                  <ol className="relative space-y-4 border-l border-slate-200 pl-5">
                    {[...shipment.timeline].reverse().map((t, i) => (
                      <li key={`${t.status}-${i}`} className="relative">
                        <span className={`absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full border-2 border-white ${i === 0 ? 'bg-brand-500' : 'bg-slate-300'}`} />
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge meta={SHIPMENT_STATUS[t.status]} />
                          <span className="text-xs text-slate-500">
                            {formatDate(t.date)} · {roleLabel(t.role)}
                          </span>
                        </div>
                        {t.note && <p className="mt-1 text-sm text-slate-600">{t.note}</p>}
                      </li>
                    ))}
                  </ol>
                </CardBody>
              </Card>
            </div>

            <DocumentsCard shipment={shipment} />
          </div>
        )}
        {tab === 'bank' && <BankTab shipment={shipment} />}
        {tab === 'clearance' && <ClearanceTab shipment={shipment} />}
        {tab === 'costing' && <CostingTab shipment={shipment} />}
        {tab === 'sales' && <SalesTab shipment={shipment} />}
      </div>

      {dialog === 'status' && <ChangeStatusModal shipment={shipment} onClose={() => setDialog(null)} />}
      {dialog === 'info' && <ShippingInfoModal shipment={shipment} onClose={() => setDialog(null)} />}

      <Modal
        open={dialog === 'undo'}
        title="Undo last status change?"
        onClose={() => setDialog(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>
              Back
            </Button>
            <Button
              onClick={() => {
                undoLast(shipment)
                setDialog(null)
              }}
            >
              Undo
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-700">
          This removes the latest entry from the timeline and returns the shipment to{' '}
          <strong>{previous && SHIPMENT_STATUS[previous.status].label}</strong>.
        </p>
      </Modal>

      <Modal
        open={dialog === 'delete'}
        title="Delete shipment?"
        onClose={() => setDialog(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                remove('shipments', shipment.id)
                navigate('/shipments')
              }}
            >
              Delete shipment
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-700">
          Removes <strong>{shipment.ref}</strong> and its document checklist. The purchase order and invoice stay on record.
        </p>
      </Modal>
    </div>
  )
}
