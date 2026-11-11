import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRightLeft, Ban, Pencil, Printer, Receipt, Send, Trash2 } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Modal, StatusBadge } from '../../components/ui'
import { PAYMENT_TERM, PO_STATUS, SHIPMENT_STATUS } from '../../config/statuses'
import { poTotalQty, poTotalUsd } from '../../lib/calc'
import { formatDate, formatNumber, formatUsd } from '../../lib/format'
import { nextOrderNumber } from '../../lib/orderNumber'
import { useDataStore } from '../../store/dataStore'
import type { PurchaseOrder, Supplier } from '../../types'

type Confirm = 'cancel' | 'delete' | 'convert' | null

export function PODetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const order = useDataStore((s) => s.purchaseOrders.find((o) => o.id === id))
  const orders = useDataStore((s) => s.purchaseOrders)
  const supplier = useDataStore((s) => s.suppliers.find((x) => x.id === order?.supplierId))
  // Select the stored arrays as-is and filter below: a selector that returns a new array every call loops forever.
  const allInvoices = useDataStore((s) => s.invoices)
  const allShipments = useDataStore((s) => s.shipments)
  const invoices = allInvoices.filter((i) => i.poId === id)
  const shipments = allShipments.filter((x) => x.poId === id)
  const update = useDataStore((s) => s.update)
  const remove = useDataStore((s) => s.remove)
  const [confirm, setConfirm] = useState<Confirm>(null)

  if (!order) {
    return (
      <Card>
        <EmptyState title="Order not found" hint="It may have been deleted." action={<Button onClick={() => navigate('/purchase-orders')}>Back to orders</Button>} />
      </Card>
    )
  }

  const linked = invoices.length > 0 || shipments.length > 0
  const editable = !linked && (order.status === 'DRAFT' || order.status === 'ISSUED')
  const cancellable = !linked && order.status === 'ISSUED'
  const deletable = !linked && (order.status === 'DRAFT' || order.status === 'CANCELLED')
  const convertible = order.kind === 'LOI' && (order.status === 'DRAFT' || order.status === 'ISSUED')

  const total = poTotalUsd(order)
  const advanceUsd = (total * order.advancePercent) / 100

  return (
    <div>
      <Link to="/purchase-orders" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 print:hidden">
        <ArrowLeft size={15} /> Purchase orders
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold text-slate-900">{order.number}</h2>
          <Badge tone={order.kind === 'PO' ? 'blue' : 'gray'}>{order.kind === 'PO' ? 'Purchase Order' : 'Letter of Intent'}</Badge>
          <StatusBadge meta={PO_STATUS[order.status]} />
        </div>
        <div className="flex flex-wrap gap-2">
          {order.status === 'ISSUED' && invoices.length === 0 && (
            <Button onClick={() => navigate(`/invoices/new?po=${order.id}`)}>
              <Receipt size={15} /> Record invoice
            </Button>
          )}
          {order.status === 'DRAFT' && (
            <Button onClick={() => update('purchaseOrders', order.id, { status: 'ISSUED' })}>
              <Send size={15} /> Issue
            </Button>
          )}
          {convertible && (
            <Button variant="secondary" onClick={() => setConfirm('convert')}>
              <ArrowRightLeft size={15} /> Convert to PO
            </Button>
          )}
          {editable && (
            <Button variant="secondary" onClick={() => navigate(`/purchase-orders/${order.id}/edit`)}>
              <Pencil size={15} /> Edit
            </Button>
          )}
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer size={15} /> Print / Save PDF
          </Button>
          {cancellable && (
            <Button variant="secondary" className="text-red-600 hover:bg-red-50" onClick={() => setConfirm('cancel')}>
              <Ban size={15} /> Cancel order
            </Button>
          )}
          {deletable && (
            <Button variant="secondary" className="text-red-600 hover:bg-red-50" onClick={() => setConfirm('delete')}>
              <Trash2 size={15} /> Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <OrderDocument order={order} supplier={supplier} />
        </div>

        <div className="space-y-5 print:hidden">
          <Card>
            <CardHeader title="Payment plan" />
            <CardBody className="space-y-2 text-sm">
              <Row label="Payment term">
                <Badge tone={PAYMENT_TERM[order.paymentTerm].tone}>{PAYMENT_TERM[order.paymentTerm].label}</Badge>
              </Row>
              <Row label={`Advance (${order.advancePercent}%)`}>{formatUsd(advanceUsd)}</Row>
              <Row label="Balance against documents">{formatUsd(total - advanceUsd)}</Row>
              <Row label="Order total">
                <strong>{formatUsd(total)}</strong>
              </Row>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Linked records" />
            <CardBody className="space-y-4 text-sm">
              <div>
                <p className="mb-1 font-medium text-slate-700">Supplier invoices</p>
                {invoices.length === 0 ? (
                  <p className="text-slate-500">None yet — record the supplier's invoice when it arrives.</p>
                ) : (
                  invoices.map((i) => (
                    <p key={i.id} className="flex justify-between">
                      <span>{i.number}</span>
                      <span>{formatUsd(i.amountUsd)}</span>
                    </p>
                  ))
                )}
              </div>
              <div>
                <p className="mb-1 font-medium text-slate-700">Shipments</p>
                {shipments.length === 0 ? (
                  <p className="text-slate-500">None yet.</p>
                ) : (
                  shipments.map((s) => (
                    <p key={s.id} className="flex items-center justify-between gap-2">
                      <span>{s.ref}</span>
                      <StatusBadge meta={SHIPMENT_STATUS[s.status]} />
                    </p>
                  ))
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        open={confirm !== null}
        title={confirm === 'cancel' ? 'Cancel this order?' : confirm === 'delete' ? 'Delete this order?' : 'Convert LOI to purchase order?'}
        onClose={() => setConfirm(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Back
            </Button>
            {confirm === 'convert' ? (
              <Button
                onClick={() => {
                  update('purchaseOrders', order.id, { kind: 'PO', number: nextOrderNumber('PO', orders, order.date), status: 'ISSUED' })
                  setConfirm(null)
                }}
              >
                Convert to PO
              </Button>
            ) : (
              <Button
                variant="danger"
                onClick={() => {
                  if (confirm === 'cancel') {
                    update('purchaseOrders', order.id, { status: 'CANCELLED' })
                    setConfirm(null)
                  } else {
                    remove('purchaseOrders', order.id)
                    navigate('/purchase-orders')
                  }
                }}
              >
                {confirm === 'cancel' ? 'Cancel order' : 'Delete order'}
              </Button>
            )}
          </>
        }
      >
        <p className="text-sm text-slate-700">
          {confirm === 'cancel' && <>Mark <strong>{order.number}</strong> as cancelled. It stays on record but can no longer be edited or invoiced.</>}
          {confirm === 'delete' && <>Permanently remove <strong>{order.number}</strong> from the demo data.</>}
          {confirm === 'convert' && <><strong>{order.number}</strong> becomes a purchase order with a new PO number and is marked Issued.</>}
        </p>
      </Modal>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900">{children}</span>
    </div>
  )
}

/** The printable document. Print styles hide the app chrome, so only this card is printed. */
function OrderDocument({ order, supplier }: { order: PurchaseOrder; supplier?: Supplier }) {
  const company = useDataStore((s) => s.settings.company)
  const products = useDataStore((s) => s.products)
  const total = poTotalUsd(order)
  const advanceUsd = (total * order.advancePercent) / 100

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 print:rounded-none print:border-0 print:p-0 print:shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-lg font-bold text-slate-900">{company.name}</p>
          <p className="mt-1 text-sm text-slate-600">{company.address}</p>
          <p className="text-sm text-slate-600">
            {company.phone} · {company.email}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            TIN {company.tin} · VAT {company.vatNo}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold tracking-wide text-brand-700">{order.kind === 'PO' ? 'PURCHASE ORDER' : 'LETTER OF INTENT'}</p>
          <p className="mt-1 text-sm text-slate-700">No. {order.number}</p>
          <p className="text-sm text-slate-700">Date: {formatDate(order.date)}</p>
        </div>
      </div>

      <div className="grid gap-6 border-b border-slate-200 py-5 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Supplier</p>
          <p className="mt-1 font-semibold text-slate-900">{supplier?.name ?? '—'}</p>
          <p className="text-sm text-slate-600">{supplier?.address}</p>
          <p className="text-sm text-slate-600">{supplier?.country}</p>
          <p className="mt-1 text-sm text-slate-600">Attn: {supplier?.contactPerson}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Shipping & payment terms</p>
          <dl className="mt-1 space-y-0.5 text-sm text-slate-700">
            <div className="flex justify-between gap-4">
              <dt>Incoterm</dt>
              <dd>{order.incoterm} Colombo, Sri Lanka</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Payment term</dt>
              <dd>{PAYMENT_TERM[order.paymentTerm].full}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Advance</dt>
              <dd>{order.advancePercent > 0 ? `${order.advancePercent}% (${formatUsd(advanceUsd)})` : 'None'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Expected shipment</dt>
              <dd>{formatDate(order.expectedShipDate)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="overflow-x-auto py-5">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-300 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="py-2 pr-2">#</th>
              <th className="py-2 pr-2">Description</th>
              <th className="py-2 pr-2 text-right">Quantity</th>
              <th className="py-2 pr-2 text-right">Unit price</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items.map((item, i) => {
              const p = products.find((x) => x.id === item.productId)
              return (
                <tr key={item.productId}>
                  <td className="py-2.5 pr-2 text-slate-500">{i + 1}</td>
                  <td className="py-2.5 pr-2">
                    <p className="font-medium text-slate-900">{p?.name ?? 'Unknown product'}</p>
                    {p?.hsCode && <p className="text-xs text-slate-500">HS {p.hsCode}</p>}
                  </td>
                  <td className="whitespace-nowrap py-2.5 pr-2 text-right">
                    {formatNumber(item.qty)} {p?.unit}
                  </td>
                  <td className="whitespace-nowrap py-2.5 pr-2 text-right">{formatUsd(item.unitPriceUsd)}</td>
                  <td className="whitespace-nowrap py-2.5 text-right font-medium">{formatUsd(item.qty * item.unitPriceUsd)}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-300">
              <td colSpan={2} className="pt-3 text-slate-500">
                {formatNumber(poTotalQty(order))} units in total
              </td>
              <td colSpan={2} className="pt-3 text-right font-semibold text-slate-700">
                Order total
              </td>
              <td className="whitespace-nowrap pt-3 text-right text-base font-bold text-slate-900">{formatUsd(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {order.conditions && (
        <div className="border-t border-slate-200 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Special conditions</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{order.conditions}</p>
        </div>
      )}

      <div className="grid gap-8 border-t border-slate-200 pt-10 sm:grid-cols-2">
        <div className="border-t border-slate-400 pt-1 text-xs text-slate-500">Authorised signature — {company.name}</div>
        <div className="border-t border-slate-400 pt-1 text-xs text-slate-500">Supplier acceptance — {supplier?.name}</div>
      </div>
    </div>
  )
}
