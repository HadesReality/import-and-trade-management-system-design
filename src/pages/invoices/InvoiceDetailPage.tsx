import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { AttachmentList } from '../../components/AttachmentList'
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Modal, StatusBadge } from '../../components/ui'
import { PAYMENT_TERM, SHIPMENT_STATUS } from '../../config/statuses'
import { poTotalUsd } from '../../lib/calc'
import { dropCachedFile } from '../../lib/fileCache'
import { formatDate, formatUsd } from '../../lib/format'
import { useDataStore } from '../../store/dataStore'
import type { ShipmentStatus } from '../../types'

/** Statuses at which deleting the invoice is still safe (nothing has been paid or shipped on it). */
const DELETABLE_SHIPMENT: ShipmentStatus[] = ['PO_ISSUED', 'INVOICE_RECEIVED']

export function InvoiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const invoice = useDataStore((s) => s.invoices.find((i) => i.id === id))
  const order = useDataStore((s) => s.purchaseOrders.find((o) => o.id === invoice?.poId))
  const supplier = useDataStore((s) => s.suppliers.find((x) => x.id === order?.supplierId))
  const shipments = useDataStore((s) => s.shipments)
  const update = useDataStore((s) => s.update)
  const remove = useDataStore((s) => s.remove)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!invoice) {
    return (
      <Card>
        <EmptyState title="Invoice not found" hint="It may have been deleted." action={<Button onClick={() => navigate('/invoices')}>Back to invoices</Button>} />
      </Card>
    )
  }

  const shipment = shipments.find((s) => s.poId === invoice.poId)
  const canDelete = !shipment || DELETABLE_SHIPMENT.includes(shipment.status)
  const poTotal = order ? poTotalUsd(order) : 0
  const diff = Math.round((invoice.amountUsd - poTotal) * 100) / 100
  const balance = invoice.amountUsd - invoice.advanceAmountUsd

  const deleteInvoice = () => {
    invoice.attachments.forEach((a) => dropCachedFile(a.id))
    if (order) update('purchaseOrders', order.id, { status: 'ISSUED' })
    if (shipment) {
      const undo = shipment.status === 'INVOICE_RECEIVED'
      update('shipments', shipment.id, {
        invoiceId: undefined,
        ...(undo && { status: 'PO_ISSUED' as const, timeline: shipment.timeline.filter((t) => t.status !== 'INVOICE_RECEIVED') }),
      })
    }
    remove('invoices', invoice.id)
    navigate('/invoices')
  }

  return (
    <div>
      <Link to="/invoices" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Invoices & contracts
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Invoice {invoice.number}</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {supplier?.name} · {formatDate(invoice.date)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate(`/invoices/${invoice.id}/edit`)}>
            <Pencil size={15} /> Edit
          </Button>
          <Button variant="secondary" className="text-red-600 hover:bg-red-50" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={15} /> Delete
          </Button>
        </div>
      </div>

      {diff !== 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p>
            This invoice is <strong>{formatUsd(Math.abs(diff))} {diff > 0 ? 'higher' : 'lower'}</strong> than order {order?.number} (
            {formatUsd(poTotal)}). Confirm with the supplier.
          </p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Invoice details" />
          <CardBody>
            <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              <Item label="Invoice number">{invoice.number}</Item>
              <Item label="Invoice date">{formatDate(invoice.date)}</Item>
              <Item label="Sales contract">{invoice.contractNumber || '—'}</Item>
              <Item label="Payment term">
                <Badge tone={PAYMENT_TERM[invoice.paymentTerm].tone}>
                  {PAYMENT_TERM[invoice.paymentTerm].label} — {PAYMENT_TERM[invoice.paymentTerm].full}
                </Badge>
              </Item>
              <Item label="Purchase order">
                {order ? (
                  <Link to={`/purchase-orders/${order.id}`} className="font-medium text-brand-600 hover:underline">
                    {order.number}
                  </Link>
                ) : (
                  '—'
                )}
              </Item>
              <Item label="Shipment">
                {shipment ? (
                  <span className="inline-flex items-center gap-2">
                    {shipment.ref} <StatusBadge meta={SHIPMENT_STATUS[shipment.status]} />
                  </span>
                ) : (
                  <span className="text-slate-500">Not created yet</span>
                )}
              </Item>
              <div className="sm:col-span-2">
                <dt className="text-slate-500">Special conditions / notes</dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-slate-800">{invoice.notes || '—'}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Amounts" />
          <CardBody className="space-y-2 text-sm">
            <Line label="Order total">{formatUsd(poTotal)}</Line>
            <Line label="Invoice amount">
              <strong>{formatUsd(invoice.amountUsd)}</strong>
            </Line>
            <Line label="Difference">
              {diff === 0 ? <Badge tone="green">Matches</Badge> : <Badge tone="amber">{`${diff > 0 ? '+' : '−'}${formatUsd(Math.abs(diff))}`}</Badge>}
            </Line>
            <hr className="border-slate-100" />
            <Line label="Advance">{invoice.advanceAmountUsd > 0 ? formatUsd(invoice.advanceAmountUsd) : 'None'}</Line>
            <Line label="Advance paid on">{invoice.advanceAmountUsd > 0 ? formatDate(invoice.advanceDate) : '—'}</Line>
            <Line label="Balance against documents">
              <strong>{formatUsd(balance)}</strong>
            </Line>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader title="Scanned invoice / contract" />
        <CardBody>
          <AttachmentList attachments={invoice.attachments} emptyText="No files attached. Use Edit to attach the scanned invoice." />
        </CardBody>
      </Card>

      <Modal
        open={confirmDelete}
        title="Delete invoice?"
        onClose={() => setConfirmDelete(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="danger" disabled={!canDelete} onClick={deleteInvoice}>
              Delete invoice
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-700">
          {canDelete ? (
            <>
              Removes invoice <strong>{invoice.number}</strong>; order {order?.number} goes back to <em>Issued</em>.
            </>
          ) : (
            <>
              Invoice <strong>{invoice.number}</strong> can't be deleted because shipment {shipment?.ref} is already{' '}
              <strong>{shipment && SHIPMENT_STATUS[shipment.status].label}</strong>.
            </>
          )}
        </p>
      </Modal>
    </div>
  )
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-900">{children}</dd>
    </div>
  )
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900">{children}</span>
    </div>
  )
}
