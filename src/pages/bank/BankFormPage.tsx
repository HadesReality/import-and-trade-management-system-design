import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Field, Input, PageHeader, Select } from '../../components/ui'
import { PAYMENT_TERM, SHIPMENT_STATUS } from '../../config/statuses'
import { poTotalUsd } from '../../lib/calc'
import { formatLkr, formatUsd, todayISO } from '../../lib/format'
import { useDataStore } from '../../store/dataStore'
import type { BankPayment, BankPaymentKind, PaymentTerm } from '../../types'
import { usePaymentEffects } from './usePaymentEffects'

const PAYMENT_TERMS: PaymentTerm[] = ['TT', 'LC', 'DP']
const round2 = (n: number) => Math.round(n * 100) / 100

/** Entry point: finds the payment being edited (if any) and the `?shipment=` / `?pay=1` presets. */
export function BankFormPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const existing = useDataStore((s) => (id ? s.bankPayments.find((p) => p.id === id) : undefined))

  if (id && !existing) {
    return (
      <Card>
        <EmptyState title="Payment not found" action={<Button onClick={() => navigate('/bank')}>Back to payments</Button>} />
      </Card>
    )
  }
  return <FormBody key={existing?.id ?? 'new'} existing={existing} presetShipmentId={params.get('shipment') ?? ''} payNow={params.get('pay') === '1'} />
}

function FormBody({ existing, presetShipmentId, payNow }: { existing?: BankPayment; presetShipmentId: string; payNow: boolean }) {
  const navigate = useNavigate()
  const applyEffects = usePaymentEffects()
  const shipments = useDataStore((s) => s.shipments)
  const suppliers = useDataStore((s) => s.suppliers)
  const orders = useDataStore((s) => s.purchaseOrders)
  const invoices = useDataStore((s) => s.invoices)
  const payments = useDataStore((s) => s.bankPayments)
  const settings = useDataStore((s) => s.settings)
  const add = useDataStore((s) => s.add)
  const update = useDataStore((s) => s.update)

  const today = todayISO()

  /** Invoice (or order) total, and what is already covered by other payments. */
  const figures = (shipmentId: string) => {
    const shipment = shipments.find((s) => s.id === shipmentId)
    const order = orders.find((o) => o.id === shipment?.poId)
    const invoice = invoices.find((i) => i.id === shipment?.invoiceId)
    const base = invoice ? invoice.amountUsd : order ? poTotalUsd(order) : 0
    const advance = invoice ? invoice.advanceAmountUsd : order ? round2((poTotalUsd(order) * order.advancePercent) / 100) : 0
    const others = payments.filter((p) => p.shipmentId === shipmentId && p.id !== existing?.id)
    const othersUsd = others.reduce((sum, p) => sum + p.amountUsd, 0)
    const term = (invoice?.paymentTerm ?? order?.paymentTerm ?? 'TT') as PaymentTerm
    return { shipment, order, invoice, base, advance, others, othersUsd, term: term === 'ADVANCE' ? ('TT' as const) : term }
  }

  const suggestAmount = (shipmentId: string, k: BankPaymentKind) => {
    const f = figures(shipmentId)
    return k === 'ADVANCE' ? f.advance : Math.max(0, round2(f.base - f.othersUsd))
  }

  const start = figures(existing?.shipmentId ?? presetShipmentId)
  const startKind: BankPaymentKind = existing?.kind ?? (start.shipment && start.others.length === 0 && start.advance > 0 ? 'ADVANCE' : 'DOCUMENTS')

  const [shipmentId, setShipmentId] = useState(existing?.shipmentId ?? (start.shipment?.id ?? ''))
  const [kind, setKind] = useState<BankPaymentKind>(startKind)
  const [term, setTerm] = useState<PaymentTerm>(existing?.term ?? start.term)
  const [bank, setBank] = useState(existing?.bank ?? settings.banks[0] ?? '')
  const [lcNumber, setLcNumber] = useState(existing?.lcNumber ?? '')
  const [lcOpen, setLcOpen] = useState(existing?.lcOpenDate ?? '')
  const [lcExpiry, setLcExpiry] = useState(existing?.lcExpiry ?? '')
  const [amount, setAmount] = useState(existing ? String(existing.amountUsd) : start.shipment ? String(suggestAmount(start.shipment.id, startKind)) : '')
  const [rate, setRate] = useState(existing ? String(existing.exchangeRate) : String(settings.exchangeRate))
  const [docCharges, setDocCharges] = useState(String(existing?.docCharges ?? 0))
  const [commission, setCommission] = useState(String(existing?.commission ?? 0))
  const [other, setOther] = useState(String(existing?.otherCharges ?? 0))
  const [status, setStatus] = useState<'PENDING' | 'PAID'>(payNow ? 'PAID' : (existing?.status ?? 'PENDING'))
  const [paidDate, setPaidDate] = useState(existing?.paidDate ?? (payNow ? today : ''))
  const [docsCollected, setDocsCollected] = useState(existing?.docsCollectedDate ?? (payNow && startKind === 'DOCUMENTS' ? today : ''))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const f = figures(shipmentId)
  const amountNum = Number(amount) || 0
  const rateNum = Number(rate) || 0
  const lkr = amountNum * rateNum
  const charges = (Number(docCharges) || 0) + (Number(commission) || 0) + (Number(other) || 0)
  const covered = f.othersUsd + amountNum
  const backTo = existing ? `/bank/${existing.id}` : '/bank'
  const rateOff = rateNum > 0 && Math.abs(rateNum - settings.exchangeRate) / settings.exchangeRate > 0.1

  const changeShipment = (sid: string) => {
    setShipmentId(sid)
    if (existing) return
    const ff = figures(sid)
    const k: BankPaymentKind = ff.others.length === 0 && ff.advance > 0 ? 'ADVANCE' : 'DOCUMENTS'
    setKind(k)
    setTerm(ff.term)
    setAmount(String(suggestAmount(sid, k)))
  }

  const changeKind = (k: BankPaymentKind) => {
    setKind(k)
    if (!existing && shipmentId) setAmount(String(suggestAmount(shipmentId, k)))
  }

  const changeStatus = (s: 'PENDING' | 'PAID') => {
    setStatus(s)
    if (s === 'PAID' && !paidDate) setPaidDate(today)
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!shipmentId) e.shipment = 'Select the shipment this payment is for'
    if (!bank) e.bank = 'Select the bank'
    if (!(amountNum > 0)) e.amount = 'Amount must be greater than zero'
    if (!(rateNum > 0)) e.rate = 'Enter the exchange rate (LKR per USD)'
    if (term === 'LC') {
      if (!lcNumber.trim()) e.lcNumber = 'LC number is required'
      if (!lcExpiry) e.lcExpiry = 'LC expiry date is required'
      else if (lcOpen && lcExpiry < lcOpen) e.lcExpiry = 'Expiry cannot be before the opening date'
    }
    for (const [key, v] of [['docCharges', docCharges], ['commission', commission], ['other', other]] as const)
      if (Number(v) < 0) e[key] = 'Cannot be negative'
    if (status === 'PAID') {
      if (!paidDate) e.paidDate = 'Enter the payment date'
      if (kind === 'DOCUMENTS' && docsCollected && paidDate && docsCollected < paidDate) e.docsCollected = 'Cannot be before the payment date'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const save = () => {
    if (!validate()) return
    const paid = status === 'PAID'
    const payload = {
      shipmentId,
      kind,
      term,
      bank,
      lcNumber: term === 'LC' ? lcNumber.trim() : '',
      lcOpenDate: term === 'LC' && lcOpen ? lcOpen : undefined,
      lcExpiry: term === 'LC' ? lcExpiry : undefined,
      amountUsd: amountNum,
      exchangeRate: rateNum,
      docCharges: Number(docCharges) || 0,
      commission: Number(commission) || 0,
      otherCharges: Number(other) || 0,
      paidDate: paid ? paidDate : undefined,
      docsCollectedDate: paid && kind === 'DOCUMENTS' && docsCollected ? docsCollected : undefined,
      status,
    }
    let saved: BankPayment
    if (existing) {
      update('bankPayments', existing.id, payload)
      saved = { ...existing, ...payload }
    } else {
      saved = add('bankPayments', payload)
    }
    applyEffects(saved)
    navigate(`/bank/${saved.id}`)
  }

  return (
    <div>
      <Link to={backTo} className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> {existing ? 'Payment' : 'Bank & payments'}
      </Link>
      <PageHeader
        title={existing ? (payNow ? 'Mark payment as paid' : 'Edit payment') : 'Record bank payment'}
        description="Enter the amount in USD and the exchange rate the bank used — the rupee amount is worked out for you."
      />

      <div className="space-y-5">
        <Card>
          <CardHeader title="Shipment & payment type" />
          <CardBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Shipment" required error={errors.shipment} className="sm:col-span-2">
                <Select value={shipmentId} onChange={(e) => changeShipment(e.target.value)} disabled={!!existing}>
                  <option value="">Select shipment…</option>
                  {shipments
                    .filter((s) => s.status !== 'CLOSED' || s.id === existing?.shipmentId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.ref} — {suppliers.find((x) => x.id === s.supplierId)?.name} — {SHIPMENT_STATUS[s.status].label}
                      </option>
                    ))}
                </Select>
              </Field>
              <Field label="Payment" required hint={kind === 'ADVANCE' ? 'Paid to the supplier before shipping' : 'Paid to the bank to collect the shipping documents'}>
                <Select value={kind} onChange={(e) => changeKind(e.target.value as BankPaymentKind)}>
                  <option value="ADVANCE">Advance payment</option>
                  <option value="DOCUMENTS">Documents payment</option>
                </Select>
              </Field>
              <Field label="Payment term" required hint={PAYMENT_TERM[term].full}>
                <Select value={term} onChange={(e) => setTerm(e.target.value as PaymentTerm)}>
                  {PAYMENT_TERMS.map((t) => (
                    <option key={t} value={t}>
                      {PAYMENT_TERM[t].label} — {PAYMENT_TERM[t].full}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Bank" required error={errors.bank}>
                <Select value={bank} onChange={(e) => setBank(e.target.value)}>
                  <option value="">Select bank…</option>
                  {[...new Set([...settings.banks, ...(bank ? [bank] : [])])].map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            {f.shipment && (
              <div className="grid gap-2 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-xs text-slate-500">{f.invoice ? 'Invoice amount' : 'Order total'}</p>
                  <p className="font-medium text-slate-900">{formatUsd(f.base)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Agreed advance</p>
                  <p className="font-medium text-slate-900">{formatUsd(f.advance)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Other payments recorded</p>
                  <p className="font-medium text-slate-900">{formatUsd(f.othersUsd)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Left after this payment</p>
                  <p className="font-medium text-slate-900">{formatUsd(f.base - covered)}</p>
                </div>
              </div>
            )}
            {f.shipment && covered > f.base + 0.005 && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                <p>
                  Payments for this shipment would total <strong>{formatUsd(covered)}</strong>, which is {formatUsd(covered - f.base)} more than the{' '}
                  {f.invoice ? 'invoice' : 'order'}. Check the amount before saving.
                </p>
              </div>
            )}
          </CardBody>
        </Card>

        {term === 'LC' && (
          <Card>
            <CardHeader title="Letter of credit" description="Documents must be collected before the LC expires." />
            <CardBody>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="LC number" required error={errors.lcNumber}>
                  <Input value={lcNumber} onChange={(e) => setLcNumber(e.target.value)} />
                </Field>
                <Field label="Opened on">
                  <Input type="date" value={lcOpen} onChange={(e) => setLcOpen(e.target.value)} />
                </Field>
                <Field label="Expires on" required error={errors.lcExpiry}>
                  <Input type="date" value={lcExpiry} onChange={(e) => setLcExpiry(e.target.value)} />
                </Field>
              </div>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader title="Amount & exchange rate" />
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Amount (USD)" required error={errors.amount}>
                <Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </Field>
              <Field
                label="Exchange rate (LKR per USD)"
                required
                error={errors.rate}
                hint={rateOff ? `More than 10% away from the default rate (${settings.exchangeRate.toFixed(2)})` : `Default rate ${settings.exchangeRate.toFixed(2)} — use the bank's rate on the payment day`}
              >
                <Input type="number" min={0} step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} />
              </Field>
              <div>
                <p className="mb-1 text-sm font-medium text-slate-700">Amount in LKR</p>
                <p className="rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">{formatLkr(lkr)}</p>
              </div>
              <Field label="Document charges (LKR)" error={errors.docCharges}>
                <Input type="number" min={0} value={docCharges} onChange={(e) => setDocCharges(e.target.value)} />
              </Field>
              <Field label="Commission (LKR)" error={errors.commission}>
                <Input type="number" min={0} value={commission} onChange={(e) => setCommission(e.target.value)} />
              </Field>
              <Field label="Other bank charges (LKR)" error={errors.other}>
                <Input type="number" min={0} value={other} onChange={(e) => setOther(e.target.value)} />
              </Field>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-sm">
              <span className="text-slate-500">Bank charges {formatLkr(charges)}</span>
              <span className="text-base font-semibold text-slate-900">Total cash out {formatLkr(lkr + charges)}</span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Payment status" />
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Status" required>
                <Select value={status} onChange={(e) => changeStatus(e.target.value as 'PENDING' | 'PAID')}>
                  <option value="PENDING">Pending — not paid yet</option>
                  <option value="PAID">Paid</option>
                </Select>
              </Field>
              {status === 'PAID' && (
                <Field label="Paid on" required error={errors.paidDate}>
                  <Input type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} />
                </Field>
              )}
              {status === 'PAID' && kind === 'DOCUMENTS' && (
                <Field label="Documents collected on" error={errors.docsCollected} hint="Date the bank handed over the originals">
                  <Input type="date" value={docsCollected} onChange={(e) => setDocsCollected(e.target.value)} />
                </Field>
              )}
            </div>
            {status === 'PAID' && f.shipment && (
              <p className="mt-3 text-xs text-slate-500">
                {kind === 'ADVANCE'
                  ? 'Saving a paid advance moves an unshipped order to “Advance Paid”.'
                  : 'Saving a paid payment with a collection date makes the bank documents “Original received” and moves an arrived shipment to “Bank Docs Collected”.'}{' '}
                Current shipment status: <Badge tone={SHIPMENT_STATUS[f.shipment.status].tone}>{SHIPMENT_STATUS[f.shipment.status].label}</Badge>
              </p>
            )}
          </CardBody>
        </Card>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate(backTo)}>
            Cancel
          </Button>
          <Button onClick={save}>{existing ? 'Save changes' : 'Record payment'}</Button>
        </div>
      </div>
    </div>
  )
}
