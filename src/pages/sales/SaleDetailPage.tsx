import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Banknote, Printer, Trash2 } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Modal, StatusBadge } from '../../components/ui'
import { CHEQUE_STATUS, PAYMENT_METHOD, SALE_TYPE, SHIPMENT_STATUS } from '../../config/statuses'
import { saleSubtotal } from '../../lib/calc'
import { formatDate, formatLkr, formatNumber } from '../../lib/format'
import { saleStatus } from '../../lib/sales'
import { syncShipmentClosing } from '../../lib/settlement'
import { useDataStore } from '../../store/dataStore'
import type { Customer, Sale } from '../../types'
import { RecordPaymentModal } from './RecordPaymentModal'
import { useSaleActions } from './useSaleActions'

export function SaleDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const sale = useDataStore((s) => s.sales.find((x) => x.id === id))
  const customer = useDataStore((s) => s.customers.find((c) => c.id === sale?.customerId))
  const cheques = useDataStore((s) => s.cheques)
  const shipments = useDataStore((s) => s.shipments)
  const stockItems = useDataStore((s) => s.stockItems)
  const remove = useDataStore((s) => s.remove)
  const { reverseSale } = useSaleActions()
  const [paying, setPaying] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!sale) {
    return (
      <Card>
        <EmptyState title="Sale not found" hint="It may have been deleted." action={<Button onClick={() => navigate('/sales')}>Back to sales</Button>} />
      </Card>
    )
  }

  const status = saleStatus(sale, cheques)
  const shipmentIds = new Set<string>()
  if (sale.shipmentId) shipmentIds.add(sale.shipmentId)
  sale.items.forEach((i) => {
    const s = stockItems.find((x) => x.id === i.stockItemId)
    if (s) shipmentIds.add(s.shipmentId)
  })
  const linkedShipments = shipments.filter((s) => shipmentIds.has(s.id))

  return (
    <div>
      <Link to="/sales" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 print:hidden">
        <ArrowLeft size={15} /> Sales
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold text-slate-900">{sale.number}</h2>
          <Badge tone={SALE_TYPE[sale.type].tone}>{SALE_TYPE[sale.type].label}</Badge>
          <Badge tone={status.tone}>{status.label}</Badge>
          {status.chequeReturned && <Badge tone="red">Cheque returned</Badge>}
        </div>
        <div className="flex flex-wrap gap-2">
          {status.balance > 0 && (
            <Button onClick={() => setPaying(true)}>
              <Banknote size={15} /> Record payment
            </Button>
          )}
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer size={15} /> Print invoice
          </Button>
          <Button variant="secondary" className="text-red-600 hover:bg-red-50" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={15} /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <Invoice sale={sale} customer={customer} paid={status.paid} balance={status.balance} />
        </div>

        <div className="space-y-5 print:hidden">
          <Card>
            <CardHeader title="Payments" description={`${formatLkr(status.paid)} received of ${formatLkr(status.total)}`} />
            <CardBody className="space-y-3 text-sm">
              {sale.payments.length === 0 && <p className="text-slate-500">No payment received yet.</p>}
              {sale.payments.map((p) => {
                const chq = cheques.find((c) => c.id === p.chequeId)
                return (
                  <div key={p.id} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-0">
                    <div>
                      <p className="font-medium text-slate-900">{p.method === 'CASH' ? 'Cash' : `Cheque ${chq?.number ?? ''}`}</p>
                      <p className="text-xs text-slate-500">
                        {formatDate(p.date)}
                        {chq && ` · ${chq.bank}${chq.branch ? `, ${chq.branch}` : ''} · dated ${formatDate(chq.chequeDate)}`}
                      </p>
                      {chq && <div className="mt-1"><StatusBadge meta={CHEQUE_STATUS[chq.status]} /></div>}
                    </div>
                    <span className={chq?.status === 'RETURNED' ? 'text-slate-400 line-through' : 'font-medium text-slate-900'}>{formatLkr(p.amount)}</span>
                  </div>
                )
              })}
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-500">Balance due</span>
                <strong className={status.balance > 0 ? 'text-red-600' : 'text-green-700'}>{formatLkr(status.balance)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment method</span>
                <Badge tone={PAYMENT_METHOD[sale.paymentMethod].tone}>{PAYMENT_METHOD[sale.paymentMethod].label}</Badge>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Linked records" />
            <CardBody className="space-y-3 text-sm">
              <div>
                <p className="mb-1 font-medium text-slate-700">Customer</p>
                {customer ? (
                  <Link to={`/customers/${customer.id}`} className="text-brand-600 hover:underline">
                    {customer.business || customer.name}
                  </Link>
                ) : (
                  '—'
                )}
              </div>
              <div>
                <p className="mb-1 font-medium text-slate-700">Shipment</p>
                {linkedShipments.map((s) => (
                  <p key={s.id} className="flex items-center justify-between gap-2">
                    <Link to={`/shipments/${s.id}`} className="text-brand-600 hover:underline">
                      {s.ref}
                    </Link>
                    <StatusBadge meta={SHIPMENT_STATUS[s.status]} />
                  </p>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {paying && <RecordPaymentModal sale={sale} balance={status.balance} onClose={() => setPaying(false)} />}

      <Modal
        open={confirmDelete}
        title="Delete this sale?"
        onClose={() => setConfirmDelete(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                reverseSale(sale)
                remove('sales', sale.id)
                syncShipmentClosing()
                navigate('/sales')
              }}
            >
              Delete sale
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-700">
          Removes <strong>{sale.number}</strong>, returns the {formatNumber(sale.items.reduce((s, i) => s + i.qty, 0))} units to stock, and deletes its cheques. The shipment's status is not changed — use <em>Undo last</em> on the shipment if needed.
        </p>
      </Modal>
    </div>
  )
}

/** The printable invoice. Print styles hide the app chrome, so only this card is printed. */
function Invoice({ sale, customer, paid, balance }: { sale: Sale; customer?: Customer; paid: number; balance: number }) {
  const company = useDataStore((s) => s.settings.company)
  const products = useDataStore((s) => s.products)
  const subtotal = saleSubtotal(sale)

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
          <p className="text-xl font-bold tracking-wide text-brand-700">INVOICE</p>
          <p className="mt-1 text-sm text-slate-700">No. {sale.number}</p>
          <p className="text-sm text-slate-700">Date: {formatDate(sale.date)}</p>
        </div>
      </div>

      <div className="border-b border-slate-200 py-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bill to</p>
        <p className="mt-1 font-semibold text-slate-900">{customer?.business || customer?.name}</p>
        {customer?.business && <p className="text-sm text-slate-600">Attn: {customer.name}</p>}
        <p className="text-sm text-slate-600">{customer?.address}</p>
        <p className="text-sm text-slate-600">{[customer?.city, customer?.district].filter((v, i, a) => v && a.indexOf(v) === i).join(', ')}</p>
        <p className="text-sm text-slate-600">{customer?.phone}</p>
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
            {sale.items.map((item, i) => {
              const p = products.find((x) => x.id === item.productId)
              return (
                <tr key={`${item.productId}-${i}`}>
                  <td className="py-2.5 pr-2 text-slate-500">{i + 1}</td>
                  <td className="py-2.5 pr-2 font-medium text-slate-900">{p?.name}</td>
                  <td className="whitespace-nowrap py-2.5 pr-2 text-right">
                    {formatNumber(item.qty)} {p?.unit}
                  </td>
                  <td className="whitespace-nowrap py-2.5 pr-2 text-right">{formatLkr(item.unitPrice)}</td>
                  <td className="whitespace-nowrap py-2.5 text-right font-medium">{formatLkr(item.qty * item.unitPrice)}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="text-sm">
            <tr className="border-t border-slate-300">
              <td colSpan={4} className="pt-3 text-right text-slate-600">Subtotal</td>
              <td className="whitespace-nowrap pt-3 text-right">{formatLkr(subtotal)}</td>
            </tr>
            {sale.discount > 0 && (
              <tr>
                <td colSpan={4} className="pt-1 text-right text-slate-600">Discount</td>
                <td className="whitespace-nowrap pt-1 text-right">−{formatLkr(sale.discount)}</td>
              </tr>
            )}
            <tr>
              <td colSpan={4} className="pt-2 text-right font-semibold text-slate-900">Total</td>
              <td className="whitespace-nowrap pt-2 text-right text-base font-bold text-slate-900">{formatLkr(subtotal - sale.discount)}</td>
            </tr>
            <tr>
              <td colSpan={4} className="pt-1 text-right text-slate-600">Paid</td>
              <td className="whitespace-nowrap pt-1 text-right">{formatLkr(paid)}</td>
            </tr>
            <tr>
              <td colSpan={4} className="pt-1 text-right font-semibold text-slate-900">Balance due</td>
              <td className="whitespace-nowrap pt-1 text-right font-bold text-slate-900">{formatLkr(balance)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {sale.notes && (
        <div className="border-t border-slate-200 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{sale.notes}</p>
        </div>
      )}

      <div className="grid gap-8 border-t border-slate-200 pt-10 sm:grid-cols-2">
        <div className="border-t border-slate-400 pt-1 text-xs text-slate-500">Authorised signature — {company.name}</div>
        <div className="border-t border-slate-400 pt-1 text-xs text-slate-500">Received by customer</div>
      </div>
    </div>
  )
}
