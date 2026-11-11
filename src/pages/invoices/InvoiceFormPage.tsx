import { useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Paperclip } from 'lucide-react'
import { AttachmentList } from '../../components/AttachmentList'
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Field, Input, PageHeader, Select, Textarea } from '../../components/ui'
import { PAYMENT_TERM } from '../../config/statuses'
import { poTotalUsd } from '../../lib/calc'
import { cacheFile, newAttachmentId } from '../../lib/fileCache'
import { formatUsd, todayISO } from '../../lib/format'
import { useDataStore } from '../../store/dataStore'
import { useUiStore } from '../../store/uiStore'
import type { Attachment, PaymentTerm, SupplierInvoice } from '../../types'

const round2 = (n: number) => Math.round(n * 100) / 100

/** Entry point: finds the invoice being edited (if any) or the order passed in `?po=`. */
export function InvoiceFormPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const existing = useDataStore((s) => (id ? s.invoices.find((i) => i.id === id) : undefined))

  if (id && !existing) {
    return (
      <Card>
        <EmptyState title="Invoice not found" action={<Button onClick={() => navigate('/invoices')}>Back to invoices</Button>} />
      </Card>
    )
  }
  return <FormBody key={existing?.id ?? 'new'} existing={existing} presetPoId={params.get('po') ?? ''} />
}

function FormBody({ existing, presetPoId }: { existing?: SupplierInvoice; presetPoId: string }) {
  const navigate = useNavigate()
  const role = useUiStore((s) => s.role)
  const orders = useDataStore((s) => s.purchaseOrders)
  const suppliers = useDataStore((s) => s.suppliers)
  const invoices = useDataStore((s) => s.invoices)
  const shipments = useDataStore((s) => s.shipments)
  const add = useDataStore((s) => s.add)
  const update = useDataStore((s) => s.update)

  // New invoices can only be recorded for issued orders that have no invoice yet.
  const openOrders = orders.filter((o) => o.status === 'ISSUED' && !invoices.some((i) => i.poId === o.id))
  const startPo = existing ? orders.find((o) => o.id === existing.poId) : openOrders.find((o) => o.id === presetPoId)

  const startAmount = existing ? existing.amountUsd : startPo ? poTotalUsd(startPo) : 0
  const [poId, setPoId] = useState(startPo?.id ?? '')
  const [number, setNumber] = useState(existing?.number ?? '')
  const [date, setDate] = useState(existing?.date ?? todayISO())
  const [amount, setAmount] = useState(startAmount ? String(startAmount) : '')
  const [contract, setContract] = useState(existing?.contractNumber ?? '')
  const [term, setTerm] = useState<PaymentTerm>(existing?.paymentTerm ?? startPo?.paymentTerm ?? 'TT')
  const [advance, setAdvance] = useState(
    existing ? String(existing.advanceAmountUsd) : startPo ? String(round2((poTotalUsd(startPo) * startPo.advancePercent) / 100)) : '0',
  )
  const [advanceDate, setAdvanceDate] = useState(existing?.advanceDate ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [attachments, setAttachments] = useState<Attachment[]>(existing?.attachments ?? [])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInput = useRef<HTMLInputElement>(null)

  const po = orders.find((o) => o.id === poId)
  const supplier = suppliers.find((s) => s.id === po?.supplierId)
  const poTotal = po ? poTotalUsd(po) : 0
  const amountNum = Number(amount) || 0
  const advanceNum = Number(advance) || 0
  const diff = round2(amountNum - poTotal)
  const backTo = existing ? `/invoices/${existing.id}` : '/invoices'

  const changePo = (pid: string) => {
    setPoId(pid)
    const o = orders.find((x) => x.id === pid)
    if (!o) return
    const total = poTotalUsd(o)
    setAmount(String(total))
    setTerm(o.paymentTerm)
    setAdvance(String(round2((total * o.advancePercent) / 100)))
  }

  const addFiles = (files: FileList | null) => {
    if (!files) return
    const added: Attachment[] = [...files].map((f) => {
      const id = newAttachmentId()
      cacheFile(id, f)
      return { id, name: f.name, size: f.size, addedAt: todayISO() }
    })
    setAttachments((a) => [...a, ...added])
    if (fileInput.current) fileInput.current.value = ''
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!poId) e.po = 'Select the order this invoice belongs to'
    if (!number.trim()) e.number = 'Invoice number is required'
    else if (invoices.some((i) => i.number.toLowerCase() === number.trim().toLowerCase() && i.id !== existing?.id))
      e.number = 'This invoice number is already recorded'
    if (!date) e.date = 'Date is required'
    if (!(amountNum > 0)) e.amount = 'Amount must be greater than zero'
    if (advanceNum < 0) e.advance = 'Cannot be negative'
    else if (advanceNum > amountNum) e.advance = 'Advance cannot be more than the invoice amount'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const save = () => {
    if (!validate()) return
    const payload = {
      number: number.trim(),
      date,
      poId,
      amountUsd: amountNum,
      contractNumber: contract.trim(),
      paymentTerm: term,
      advanceAmountUsd: advanceNum,
      advanceDate: advanceNum > 0 && advanceDate ? advanceDate : undefined,
      notes: notes.trim(),
      attachments,
    }
    if (existing) {
      update('invoices', existing.id, payload)
      navigate(`/invoices/${existing.id}`)
      return
    }
    const created = add('invoices', payload)
    update('purchaseOrders', poId, { status: 'INVOICED' })
    const shipment = shipments.find((s) => s.poId === poId)
    if (shipment) {
      const progressed = shipment.status === 'PO_ISSUED'
      update('shipments', shipment.id, {
        invoiceId: created.id,
        ...(progressed && {
          status: 'INVOICE_RECEIVED' as const,
          timeline: [...shipment.timeline, { date: todayISO(), status: 'INVOICE_RECEIVED' as const, role, note: `Invoice ${payload.number}` }],
        }),
      })
    }
    navigate(`/invoices/${created.id}`)
  }

  return (
    <div>
      <Link to={backTo} className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> {existing ? existing.number : 'Invoices'}
      </Link>
      <PageHeader
        title={existing ? `Edit invoice ${existing.number}` : 'Record supplier invoice'}
        description="Enter the invoice and contract details exactly as the supplier sent them."
      />

      <div className="space-y-5">
        <Card>
          <CardHeader title="Linked order" />
          <CardBody className="space-y-3">
            {!existing && openOrders.length === 0 ? (
              <p className="text-sm text-slate-600">
                There are no issued orders waiting for an invoice. Issue a purchase order or LOI first.
              </p>
            ) : (
              <Field label="Purchase order / LOI" required error={errors.po}>
                <Select value={poId} onChange={(e) => changePo(e.target.value)} disabled={!!existing}>
                  <option value="">Select order…</option>
                  {(existing ? orders.filter((o) => o.id === existing.poId) : openOrders).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.number} — {suppliers.find((s) => s.id === o.supplierId)?.name} — {formatUsd(poTotalUsd(o))}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            {po && (
              <div className="grid gap-2 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-xs text-slate-500">Supplier</p>
                  <p className="font-medium text-slate-900">{supplier?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Order total</p>
                  <p className="font-medium text-slate-900">{formatUsd(poTotal)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Order payment term</p>
                  <Badge tone={PAYMENT_TERM[po.paymentTerm].tone}>{PAYMENT_TERM[po.paymentTerm].full}</Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Agreed advance</p>
                  <p className="font-medium text-slate-900">{po.advancePercent}%</p>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Invoice & contract" />
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Invoice number" required error={errors.number}>
                <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="As printed on the invoice" />
              </Field>
              <Field label="Invoice date" required error={errors.date}>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
              <Field label="Sales contract number" hint="If the supplier sent a contract">
                <Input value={contract} onChange={(e) => setContract(e.target.value)} />
              </Field>
              <Field label="Invoice amount (USD)" required error={errors.amount}>
                <Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
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
              <div />
              <Field label="Advance amount (USD)" error={errors.advance} hint={advanceNum > 0 ? `Balance ${formatUsd(Math.max(0, amountNum - advanceNum))} against documents` : 'No advance'}>
                <Input type="number" min={0} step="0.01" value={advance} onChange={(e) => setAdvance(e.target.value)} />
              </Field>
              <Field label="Advance paid on" hint="Leave empty if not paid yet">
                <Input type="date" value={advanceDate} onChange={(e) => setAdvanceDate(e.target.value)} disabled={advanceNum <= 0} />
              </Field>
              <Field label="Special conditions / notes" className="sm:col-span-2 lg:col-span-3">
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything different from the order, extra charges, special terms…" />
              </Field>
            </div>

            {po && diff !== 0 && (
              <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                <p>
                  The invoice is <strong>{formatUsd(Math.abs(diff))} {diff > 0 ? 'higher' : 'lower'}</strong> than the order total (
                  {formatUsd(poTotal)}). Check with the supplier before paying. You can still save it.
                </p>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Scanned invoice / contract"
            description="PDF or images. Only file names are kept in this prototype."
            actions={
              <>
                <input ref={fileInput} type="file" multiple accept=".pdf,image/*" className="hidden" onChange={(e) => addFiles(e.target.files)} />
                <Button size="sm" variant="secondary" onClick={() => fileInput.current?.click()}>
                  <Paperclip size={14} /> Attach files
                </Button>
              </>
            }
          />
          <CardBody>
            <AttachmentList attachments={attachments} onRemove={(aid) => setAttachments((a) => a.filter((x) => x.id !== aid))} />
          </CardBody>
        </Card>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate(backTo)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!existing && openOrders.length === 0}>
            {existing ? 'Save changes' : 'Record invoice'}
          </Button>
        </div>
      </div>
    </div>
  )
}
