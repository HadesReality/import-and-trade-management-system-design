import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { addDays, format } from 'date-fns'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Button, Card, CardBody, CardHeader, EmptyState, Field, Input, PageHeader, Select, Textarea } from '../../components/ui'
import { PAYMENT_TERM } from '../../config/statuses'
import { formatNumber, formatUsd, todayISO } from '../../lib/format'
import { nextOrderNumber } from '../../lib/orderNumber'
import { useDataStore } from '../../store/dataStore'
import type { Incoterm, OrderKind, PaymentTerm, POItem, POStatus, PurchaseOrder } from '../../types'
import { NewProductModal } from './NewProductModal'

const INCOTERMS: Incoterm[] = ['EXW', 'FCA', 'FOB', 'CFR', 'CIF']

interface Line {
  key: string
  productId: string
  qty: string
  price: string
}

const uid = () => Math.random().toString(36).slice(2)
const newLine = (): Line => ({ key: uid(), productId: '', qty: '', price: '' })

/** Entry point: finds the order being edited (if any) and blocks editing when it is no longer allowed. */
export function POFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const existing = useDataStore((s) => (id ? s.purchaseOrders.find((o) => o.id === id) : undefined))
  const hasLinks = useDataStore((s) =>
    id ? s.invoices.some((i) => i.poId === id) || s.shipments.some((x) => x.poId === id) : false,
  )

  if (id && !existing) {
    return (
      <Card>
        <EmptyState title="Order not found" action={<Button onClick={() => navigate('/purchase-orders')}>Back to orders</Button>} />
      </Card>
    )
  }
  if (existing && (hasLinks || !['DRAFT', 'ISSUED'].includes(existing.status))) {
    return (
      <Card>
        <EmptyState
          title={`${existing.number} can't be edited`}
          hint="It already has an invoice or shipment, or it is cancelled. Create a new order instead."
          action={<Button onClick={() => navigate(`/purchase-orders/${existing.id}`)}>View order</Button>}
        />
      </Card>
    )
  }

  return <FormBody key={existing?.id ?? 'new'} existing={existing} />
}

function FormBody({ existing }: { existing?: PurchaseOrder }) {
  const navigate = useNavigate()
  const orders = useDataStore((s) => s.purchaseOrders)
  const suppliers = useDataStore((s) => s.suppliers)
  const products = useDataStore((s) => s.products)
  const add = useDataStore((s) => s.add)
  const update = useDataStore((s) => s.update)

  const today = todayISO()
  const [kind, setKind] = useState<OrderKind>(existing?.kind ?? 'PO')
  const [date, setDate] = useState(existing?.date ?? today)
  const [number, setNumber] = useState(existing?.number ?? nextOrderNumber('PO', orders, today))
  const [numberTouched, setNumberTouched] = useState(!!existing)
  const [supplierId, setSupplierId] = useState(existing?.supplierId ?? '')
  const [incoterm, setIncoterm] = useState<Incoterm>(existing?.incoterm ?? 'FOB')
  const [term, setTerm] = useState<PaymentTerm>(existing?.paymentTerm ?? 'TT')
  const [advance, setAdvance] = useState(String(existing?.advancePercent ?? 30))
  const [shipDate, setShipDate] = useState(existing?.expectedShipDate ?? format(addDays(new Date(), 30), 'yyyy-MM-dd'))
  const [conditions, setConditions] = useState(existing?.conditions ?? '')
  const [lines, setLines] = useState<Line[]>(
    existing?.items.map((i) => ({ key: uid(), productId: i.productId, qty: String(i.qty), price: String(i.unitPriceUsd) })) ?? [newLine()],
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [newProductFor, setNewProductFor] = useState<string | null>(null)

  const setLine = (key: string, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)))

  const items: POItem[] = useMemo(
    () => lines.map((l) => ({ productId: l.productId, qty: Number(l.qty) || 0, unitPriceUsd: Number(l.price) || 0 })),
    [lines],
  )
  const total = items.reduce((sum, i) => sum + i.qty * i.unitPriceUsd, 0)
  const advancePct = Math.min(100, Math.max(0, Number(advance) || 0))
  const advanceUsd = (total * advancePct) / 100
  const isDraft = !existing || existing.status === 'DRAFT'

  const changeKind = (k: OrderKind) => {
    setKind(k)
    if (!numberTouched) setNumber(nextOrderNumber(k, orders, date))
  }

  const changeSupplier = (sid: string) => {
    setSupplierId(sid)
    const sup = suppliers.find((s) => s.id === sid)
    if (sup && !existing) setTerm(sup.usualTerm)
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!supplierId) e.supplier = 'Select a supplier'
    if (!number.trim()) e.number = 'Order number is required'
    else if (orders.some((o) => o.number.toLowerCase() === number.trim().toLowerCase() && o.id !== existing?.id))
      e.number = 'This number is already used'
    if (!date) e.date = 'Date is required'
    if (shipDate && date && shipDate < date) e.shipDate = 'Cannot be before the order date'
    if (Number(advance) < 0 || Number(advance) > 100) e.advance = 'Enter 0–100'
    const used = new Set<string>()
    lines.forEach((l, i) => {
      if (!l.productId) e[`l${i}p`] = 'Select a product'
      else if (used.has(l.productId)) e[`l${i}p`] = 'Product already added'
      used.add(l.productId)
      if (!(Number(l.qty) > 0)) e[`l${i}q`] = 'Qty must be > 0'
      if (!(Number(l.price) > 0)) e[`l${i}u`] = 'Price must be > 0'
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const save = (status: POStatus) => {
    if (!validate()) return
    const payload = {
      kind,
      number: number.trim(),
      date,
      supplierId,
      items,
      incoterm,
      paymentTerm: term,
      advancePercent: advancePct,
      conditions: conditions.trim(),
      expectedShipDate: shipDate,
      status,
    }
    if (existing) {
      update('purchaseOrders', existing.id, payload)
      navigate(`/purchase-orders/${existing.id}`)
    } else {
      navigate(`/purchase-orders/${add('purchaseOrders', payload).id}`)
    }
  }

  const takenBy = (key: string) => new Set(lines.filter((l) => l.key !== key && l.productId).map((l) => l.productId))
  const backTo = existing ? `/purchase-orders/${existing.id}` : '/purchase-orders'

  return (
    <div>
      <Link to={backTo} className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> {existing ? existing.number : 'Purchase orders'}
      </Link>
      <PageHeader title={existing ? `Edit ${existing.number}` : 'New purchase order / LOI'} description="Record what was agreed with the supplier." />

      <div className="space-y-5">
        <Card>
          <CardHeader title="Order details" />
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Document type" required>
                <Select value={kind} onChange={(e) => changeKind(e.target.value as OrderKind)}>
                  <option value="PO">Purchase Order (PO)</option>
                  <option value="LOI">Letter of Intent (LOI)</option>
                </Select>
              </Field>
              <Field label="Number" required error={errors.number} hint="Suggested automatically — you can change it">
                <Input
                  value={number}
                  onChange={(e) => {
                    setNumber(e.target.value)
                    setNumberTouched(true)
                  }}
                />
              </Field>
              <Field label="Date" required error={errors.date}>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value)
                    if (!numberTouched && e.target.value) setNumber(nextOrderNumber(kind, orders, e.target.value))
                  }}
                />
              </Field>
              <Field label="Supplier" required error={errors.supplier} className="sm:col-span-2">
                <Select value={supplierId} onChange={(e) => changeSupplier(e.target.value)}>
                  <option value="">Select supplier…</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.country}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Expected shipment date" error={errors.shipDate}>
                <Input type="date" value={shipDate} onChange={(e) => setShipDate(e.target.value)} />
              </Field>
              <Field label="Incoterm" hint="Who pays freight and insurance up to Colombo">
                <Select value={incoterm} onChange={(e) => setIncoterm(e.target.value as Incoterm)}>
                  {INCOTERMS.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Payment term" required hint={PAYMENT_TERM[term].full}>
                <Select value={term} onChange={(e) => setTerm(e.target.value as PaymentTerm)}>
                  {Object.entries(PAYMENT_TERM).map(([tid, m]) => (
                    <option key={tid} value={tid}>
                      {m.label} — {m.full}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Advance payment (%)" error={errors.advance} hint={advancePct > 0 ? `${formatUsd(advanceUsd)} before shipping` : 'No advance'}>
                <Input type="number" min={0} max={100} value={advance} onChange={(e) => setAdvance(e.target.value)} />
              </Field>
              <Field label="Special conditions" className="sm:col-span-2 lg:col-span-3">
                <Textarea value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder="Packing, quality, warranty, loading deadline, LC latest shipment date…" />
              </Field>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Items"
            actions={
              <Button size="sm" variant="secondary" onClick={() => setLines((ls) => [...ls, newLine()])}>
                <Plus size={14} /> Add item
              </Button>
            }
          />
          <CardBody className="space-y-3">
            {lines.map((l, i) => {
              const product = products.find((p) => p.id === l.productId)
              const lineTotal = (Number(l.qty) || 0) * (Number(l.price) || 0)
              const taken = takenBy(l.key)
              return (
                <div key={l.key} className="grid items-start gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-12">
                  <Field label="Product" error={errors[`l${i}p`]} className="sm:col-span-5">
                    <Select
                      value={l.productId}
                      onChange={(e) => (e.target.value === '__new' ? setNewProductFor(l.key) : setLine(l.key, { productId: e.target.value }))}
                    >
                      <option value="">Select product…</option>
                      {products
                        .filter((p) => !taken.has(p.id))
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      <option value="__new">+ New product…</option>
                    </Select>
                  </Field>
                  <Field label={`Qty${product ? ` (${product.unit})` : ''}`} error={errors[`l${i}q`]} className="sm:col-span-2">
                    <Input type="number" min={0} value={l.qty} onChange={(e) => setLine(l.key, { qty: e.target.value })} />
                  </Field>
                  <Field label="Unit price (USD)" error={errors[`l${i}u`]} className="sm:col-span-2">
                    <Input type="number" min={0} step="0.01" value={l.price} onChange={(e) => setLine(l.key, { price: e.target.value })} />
                  </Field>
                  <div className="sm:col-span-2">
                    <p className="mb-1 text-sm font-medium text-slate-700">Line total</p>
                    <p className="py-2 text-sm font-semibold text-slate-900">{formatUsd(lineTotal)}</p>
                  </div>
                  <div className="flex justify-end sm:col-span-1 sm:pt-6">
                    <button
                      onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}
                      disabled={lines.length === 1}
                      className="rounded p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-sm">
              <span className="text-slate-500">
                {formatNumber(items.reduce((s, i) => s + i.qty, 0))} units · {lines.length} item(s)
              </span>
              <span className="text-base font-semibold text-slate-900">Total {formatUsd(total)}</span>
            </div>
          </CardBody>
        </Card>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate(backTo)}>
            Cancel
          </Button>
          {isDraft && (
            <Button variant="secondary" onClick={() => save('DRAFT')}>
              Save as draft
            </Button>
          )}
          <Button onClick={() => save(isDraft ? 'ISSUED' : existing.status)}>
            {!isDraft ? 'Save changes' : existing ? 'Save & issue' : 'Create & issue'}
          </Button>
        </div>
      </div>

      {newProductFor && (
        <NewProductModal onClose={() => setNewProductFor(null)} onCreated={(pid) => setLine(newProductFor, { productId: pid })} />
      )}
    </div>
  )
}
