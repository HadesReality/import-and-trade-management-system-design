import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Button, Card, CardBody, CardHeader, Field, Input, PageHeader, Select, Textarea } from '../../components/ui'
import { stockRemaining, suggestedPrice } from '../../lib/calc'
import { computeShipmentResult } from '../../lib/costing'
import { formatDate, formatLkr, formatNumber, todayISO } from '../../lib/format'
import { nextSaleNumber } from '../../lib/sales'
import { syncShipmentClosing } from '../../lib/settlement'
import { stockUnitCosts } from '../../lib/stock'
import { cn } from '../../lib/cn'
import { useDataStore } from '../../store/dataStore'
import type { PaymentMethod, SaleItem, SaleType } from '../../types'
import { CustomerFormModal } from '../customers/CustomerFormModal'
import { emptyPayment, PaymentFields, toNewPayment, validatePayment, type PaymentDraft } from './PaymentFields'
import { useSaleActions } from './useSaleActions'

interface Line {
  key: string
  stockItemId: string
  productId: string
  qty: string
  price: string
}

const uid = () => Math.random().toString(36).slice(2)
const newLine = (): Line => ({ key: uid(), stockItemId: '', productId: '', qty: '', price: '' })
const roundPrice = (n: number) => Math.round(n)

export function SaleFormPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const data = useDataStore()
  const { applySale, addPayment } = useSaleActions()
  const markup = data.settings.targetMarginPercent
  const today = todayISO()

  const [type, setType] = useState<SaleType>('WAREHOUSE')
  const [customerId, setCustomerId] = useState(params.get('customer') ?? '')
  const [date, setDate] = useState(today)
  const [shipmentId, setShipmentId] = useState('')
  const [lines, setLines] = useState<Line[]>([newLine()])
  const [discount, setDiscount] = useState('0')
  const [notes, setNotes] = useState('')
  const [payMode, setPayMode] = useState<PaymentMethod>('CASH')
  const [draft, setDraft] = useState<PaymentDraft>(emptyPayment(today))
  const [amountEdited, setAmountEdited] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [addingCustomer, setAddingCustomer] = useState(false)

  const unitCosts = useMemo(() => stockUnitCosts(data), [data])
  const productName = (id: string) => data.products.find((p) => p.id === id)?.name ?? '—'
  const unitOf = (id: string) => data.products.find((p) => p.id === id)?.unit ?? ''

  // Stock that can still be sold, and containers that can be sold whole (released, not yet in the warehouse, not sold).
  const stockOptions = data.stockItems.filter((s) => stockRemaining(s) > 0)
  const containerOptions = data.shipments.filter(
    (s) => s.status === 'RELEASED' && !data.stockItems.some((i) => i.shipmentId === s.id) && !data.sales.some((x) => x.shipmentId === s.id),
  )

  const shipment = data.shipments.find((s) => s.id === shipmentId)
  const containerResult = useMemo(() => (shipmentId ? computeShipmentResult(data, shipmentId, 'VALUE') : undefined), [data, shipmentId])

  const setLine = (key: string, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)))

  const changeType = (t: SaleType) => {
    setType(t)
    setShipmentId('')
    setLines([newLine()])
    setErrors({})
  }

  const changeShipment = (id: string) => {
    setShipmentId(id)
    const result = computeShipmentResult(data, id, 'VALUE')
    const po = data.purchaseOrders.find((o) => o.id === data.shipments.find((s) => s.id === id)?.poId)
    setLines(
      po && result
        ? po.items.map((i) => {
            const cost = result.products.find((p) => p.productId === i.productId)?.unitCost ?? 0
            return { key: uid(), stockItemId: '', productId: i.productId, qty: String(i.qty), price: String(roundPrice(suggestedPrice(cost, markup))) }
          })
        : [newLine()],
    )
  }

  const pickStock = (key: string, stockItemId: string) => {
    const stock = data.stockItems.find((s) => s.id === stockItemId)
    if (!stock) return setLine(key, { stockItemId: '', productId: '' })
    const line = lines.find((l) => l.key === key)
    setLine(key, {
      stockItemId,
      productId: stock.productId,
      price: line?.price || String(roundPrice(suggestedPrice(unitCosts.get(stockItemId) ?? 0, markup))),
    })
  }

  const items: SaleItem[] = lines.map((l) => ({
    productId: l.productId,
    stockItemId: l.stockItemId || undefined,
    qty: Number(l.qty) || 0,
    unitPrice: Number(l.price) || 0,
  }))
  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  const discountNum = Number(discount) || 0
  const total = subtotal - discountNum

  const costOf = (l: Line) => (type === 'WAREHOUSE' ? (unitCosts.get(l.stockItemId) ?? 0) : (containerResult?.products.find((p) => p.productId === l.productId)?.unitCost ?? 0))
  const belowCost = lines.filter((l) => l.productId && Number(l.price) > 0 && Number(l.price) < costOf(l))

  const effectiveDraft: PaymentDraft = { ...draft, method: payMode === 'CHEQUE' ? 'CHEQUE' : 'CASH', amount: amountEdited ? draft.amount : String(Math.max(0, Math.round(total * 100) / 100)) }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!customerId) e.customer = 'Select the customer'
    if (!date) e.date = 'Date is required'
    if (type === 'FULL_CONTAINER') {
      if (!shipmentId) e.shipment = 'Select the container being sold'
      else {
        const last = shipment?.timeline[shipment.timeline.length - 1]?.date ?? ''
        if (date && date < last) e.date = `Cannot be before the shipment was released (${formatDate(last)})`
      }
    }
    const used = new Set<string>()
    lines.forEach((l, i) => {
      if (type === 'WAREHOUSE') {
        const stock = data.stockItems.find((s) => s.id === l.stockItemId)
        if (!stock) e[`l${i}s`] = 'Select a product from stock'
        else {
          if (used.has(stock.id)) e[`l${i}s`] = 'This stock line is already added'
          used.add(stock.id)
          if (Number(l.qty) > stockRemaining(stock)) e[`l${i}q`] = `Only ${formatNumber(stockRemaining(stock))} in stock`
          if (date && date < stock.receivedDate) e.date = `Cannot be before the stock was received (${formatDate(stock.receivedDate)})`
        }
      }
      if (!(Number(l.qty) > 0)) e[`l${i}q`] = e[`l${i}q`] ?? 'Qty must be > 0'
      if (!(Number(l.price) > 0)) e[`l${i}p`] = 'Price must be > 0'
    })
    if (discountNum < 0) e.discount = 'Cannot be negative'
    else if (discountNum > subtotal) e.discount = 'Discount is more than the sale value'
    if (payMode !== 'CREDIT') Object.assign(e, validatePayment(effectiveDraft, total))
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const save = () => {
    if (!validate()) return
    const sale = data.add('sales', {
      number: nextSaleNumber(data.sales),
      date,
      type,
      customerId,
      shipmentId: type === 'FULL_CONTAINER' ? shipmentId : undefined,
      items,
      discount: discountNum,
      paymentMethod: payMode,
      payments: [],
      notes: notes.trim(),
    })
    const saved = payMode === 'CREDIT' ? sale : addPayment(sale, toNewPayment(effectiveDraft))
    applySale(saved)
    syncShipmentClosing()
    navigate(`/sales/${saved.id}`)
  }

  return (
    <div>
      <Link to="/sales" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Sales
      </Link>
      <PageHeader title="New sale" description={`Invoice number ${nextSaleNumber(data.sales)}. Saving reduces stock and records the payment.`} />

      <div className="space-y-5">
        <Card>
          <CardHeader title="Sale details" />
          <CardBody className="space-y-4">
            <div className="flex w-fit rounded-md border border-slate-300 bg-white p-0.5" role="group" aria-label="Sale type">
              {([['WAREHOUSE', 'Warehouse sale'], ['FULL_CONTAINER', 'Full container']] as const).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => changeType(id)}
                  aria-pressed={type === id}
                  className={cn('rounded px-4 py-1.5 text-sm font-medium', type === id ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100')}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Customer" required error={errors.customer}>
                <Select value={customerId} onChange={(e) => (e.target.value === '__new' ? setAddingCustomer(true) : setCustomerId(e.target.value))}>
                  <option value="">Select customer…</option>
                  {data.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.business || c.name} — {c.district}
                    </option>
                  ))}
                  <option value="__new">+ New customer…</option>
                </Select>
              </Field>
              <Field label="Sale date" required error={errors.date}>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
              {type === 'FULL_CONTAINER' && (
                <Field label="Container (shipment)" required error={errors.shipment} hint={containerOptions.length === 0 ? 'No released container is waiting to be sold' : undefined}>
                  <Select value={shipmentId} onChange={(e) => changeShipment(e.target.value)}>
                    <option value="">Select container…</option>
                    {containerOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.ref} — {data.suppliers.find((x) => x.id === s.supplierId)?.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Items"
            description={type === 'FULL_CONTAINER' ? 'The whole container is sold — set the price per unit.' : 'Choose from stock in the warehouse.'}
            actions={
              type === 'WAREHOUSE' && (
                <Button size="sm" variant="secondary" onClick={() => setLines((ls) => [...ls, newLine()])}>
                  <Plus size={14} /> Add item
                </Button>
              )
            }
          />
          <CardBody className="space-y-3">
            {type === 'FULL_CONTAINER' && !shipmentId && <p className="text-sm text-slate-500">Select a container above to load its goods.</p>}
            {(type === 'WAREHOUSE' || shipmentId) &&
              lines.map((l, i) => {
                const stock = data.stockItems.find((s) => s.id === l.stockItemId)
                const lineTotal = (Number(l.qty) || 0) * (Number(l.price) || 0)
                const taken = new Set(lines.filter((x) => x.key !== l.key).map((x) => x.stockItemId))
                return (
                  <div key={l.key} className="grid items-start gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-12">
                    {type === 'WAREHOUSE' ? (
                      <Field label="Product in stock" error={errors[`l${i}s`]} className="sm:col-span-5">
                        <Select value={l.stockItemId} onChange={(e) => pickStock(l.key, e.target.value)}>
                          <option value="">Select stock…</option>
                          {stockOptions
                            .filter((s) => !taken.has(s.id))
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {productName(s.productId)} — {data.shipments.find((x) => x.id === s.shipmentId)?.ref} — {formatNumber(stockRemaining(s))} left
                              </option>
                            ))}
                        </Select>
                      </Field>
                    ) : (
                      <div className="sm:col-span-5">
                        <p className="mb-1 text-sm font-medium text-slate-700">Product</p>
                        <p className="py-2 text-sm font-medium text-slate-900">{productName(l.productId)}</p>
                      </div>
                    )}
                    <Field label={`Qty${l.productId ? ` (${unitOf(l.productId)})` : ''}`} error={errors[`l${i}q`]} hint={stock ? `Max ${formatNumber(stockRemaining(stock))}` : undefined} className="sm:col-span-2">
                      <Input type="number" min={0} value={l.qty} disabled={type === 'FULL_CONTAINER'} onChange={(e) => setLine(l.key, { qty: e.target.value })} />
                    </Field>
                    <Field
                      label="Unit price (LKR)"
                      error={errors[`l${i}p`]}
                      hint={l.productId ? `Cost ${formatLkr(costOf(l))} · suggested ${formatLkr(roundPrice(suggestedPrice(costOf(l), markup)))}` : undefined}
                      className="sm:col-span-3"
                    >
                      <Input type="number" min={0} value={l.price} onChange={(e) => setLine(l.key, { price: e.target.value })} />
                    </Field>
                    <div className="sm:col-span-2">
                      <p className="mb-1 text-sm font-medium text-slate-700">Line total</p>
                      <p className="py-2 text-sm font-semibold text-slate-900">{formatLkr(lineTotal)}</p>
                    </div>
                    {type === 'WAREHOUSE' && lines.length > 1 && (
                      <div className="flex justify-end sm:col-span-12">
                        <button onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))} className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600">
                          <Trash2 size={13} /> Remove item
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}

            {belowCost.length > 0 && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                <p>
                  Selling below landed cost: <strong>{belowCost.map((l) => productName(l.productId)).join(', ')}</strong>. This sale will make a loss on those items. You can still save it.
                </p>
              </div>
            )}

            <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
              <Field label="Discount (LKR)" error={errors.discount}>
                <Input type="number" min={0} value={discount} onChange={(e) => setDiscount(e.target.value)} />
              </Field>
              <div className="space-y-1 text-right text-sm">
                <p className="text-slate-500">Subtotal {formatLkr(subtotal)}</p>
                {discountNum > 0 && <p className="text-slate-500">Discount −{formatLkr(discountNum)}</p>}
                <p className="text-base font-semibold text-slate-900">Total {formatLkr(total)}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Payment" description="How the customer is paying now. Further payments can be added from the sale." />
          <CardBody className="space-y-4">
            <div className="flex w-fit rounded-md border border-slate-300 bg-white p-0.5" role="group" aria-label="Payment method">
              {([['CASH', 'Cash'], ['CHEQUE', 'Cheque'], ['CREDIT', 'Credit (pays later)']] as const).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setPayMode(id)}
                  aria-pressed={payMode === id}
                  className={cn('rounded px-4 py-1.5 text-sm font-medium', payMode === id ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100')}
                >
                  {label}
                </button>
              ))}
            </div>
            {payMode === 'CREDIT' ? (
              <p className="text-sm text-slate-600">No payment is recorded now — the full amount of {formatLkr(total)} stays outstanding until the customer pays.</p>
            ) : (
              <PaymentFields
                hideMethod
                draft={effectiveDraft}
                errors={errors}
                onChange={(patch) => {
                  if (patch.amount !== undefined) setAmountEdited(true)
                  setDraft((d) => ({ ...d, ...patch }))
                }}
              />
            )}
            {payMode !== 'CREDIT' && Number(effectiveDraft.amount) < total && Number(effectiveDraft.amount) > 0 && (
              <p className="text-sm text-slate-600">Balance after this payment: <strong>{formatLkr(total - Number(effectiveDraft.amount))}</strong></p>
            )}
            <Field label="Notes">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Delivery arrangements, agreed credit period…" />
            </Field>
          </CardBody>
        </Card>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate('/sales')}>
            Cancel
          </Button>
          <Button onClick={save}>Save sale</Button>
        </div>
      </div>

      {addingCustomer && <CustomerFormModal onClose={() => setAddingCustomer(false)} onSaved={(id) => setCustomerId(id)} />}
    </div>
  )
}
