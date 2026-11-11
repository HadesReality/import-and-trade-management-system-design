import { useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Paperclip } from 'lucide-react'
import { AttachmentList } from '../../components/AttachmentList'
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Field, Input, PageHeader, Select } from '../../components/ui'
import { SHIPMENT_STATUS } from '../../config/statuses'
import { DUTY_FIELDS, EMPTY_BREAKDOWN, sumBreakdown } from '../../lib/clearance'
import { cacheFile, newAttachmentId } from '../../lib/fileCache'
import { formatLkr, todayISO } from '../../lib/format'
import { useDataStore } from '../../store/dataStore'
import type { Attachment, Clearance, DutyBreakdown } from '../../types'
import { useClearanceEffects } from './useClearanceEffects'

/** Entry point: finds the clearance being edited (if any) and the `?shipment=` / `?release=1` presets. */
export function ClearanceFormPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const existing = useDataStore((s) => (id ? s.clearances.find((c) => c.id === id) : undefined))

  if (id && !existing) {
    return (
      <Card>
        <EmptyState title="Clearance not found" action={<Button onClick={() => navigate('/clearance')}>Back to clearance</Button>} />
      </Card>
    )
  }
  return <FormBody key={existing?.id ?? 'new'} existing={existing} presetShipmentId={params.get('shipment') ?? ''} releaseNow={params.get('release') === '1'} />
}

const num = (v: string) => Number(v) || 0

function FormBody({ existing, presetShipmentId, releaseNow }: { existing?: Clearance; presetShipmentId: string; releaseNow: boolean }) {
  const navigate = useNavigate()
  const applyEffects = useClearanceEffects()
  const shipments = useDataStore((s) => s.shipments)
  const suppliers = useDataStore((s) => s.suppliers)
  const clearances = useDataStore((s) => s.clearances)
  const companies = useDataStore((s) => s.settings.clearingCompanies)
  const add = useDataStore((s) => s.add)
  const update = useDataStore((s) => s.update)

  const today = todayISO()
  // A shipment can be handed over once it has reached Sri Lanka, and only once.
  const eligible = shipments.filter((s) => (s.status === 'ARRIVED' || s.status === 'BANK_DOCS_COLLECTED') && !clearances.some((c) => c.shipmentId === s.id))
  const startShipment = existing ? existing.shipmentId : eligible.some((s) => s.id === presetShipmentId) ? presetShipmentId : ''

  const [shipmentId, setShipmentId] = useState(startShipment)
  const [company, setCompany] = useState(existing?.clearingCompany ?? companies[0] ?? '')
  const [handover, setHandover] = useState(existing?.handoverDate ?? today)
  const [cusdec, setCusdec] = useState(existing?.cusdecNumber ?? '')
  const [useBreakdown, setUseBreakdown] = useState(!!existing?.dutyBreakdown)
  const [breakdown, setBreakdown] = useState<Record<keyof DutyBreakdown, string>>(() => {
    const b = existing?.dutyBreakdown ?? EMPTY_BREAKDOWN
    return Object.fromEntries(Object.entries(b).map(([k, v]) => [k, String(v)])) as Record<keyof DutyBreakdown, string>
  })
  const [duties, setDuties] = useState(String(existing?.duties ?? 0))
  const [port, setPort] = useState(String(existing?.portCharges ?? 0))
  const [transport, setTransport] = useState(String(existing?.transport ?? 0))
  const [agentFee, setAgentFee] = useState(String(existing?.agentFee ?? 0))
  const [otherCharges, setOtherCharges] = useState(String(existing?.otherCharges ?? 0))
  const [release, setRelease] = useState(existing?.releaseDate ?? (releaseNow ? today : ''))
  const [attachments, setAttachments] = useState<Attachment[]>(existing?.attachments ?? [])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInput = useRef<HTMLInputElement>(null)

  const shipment = shipments.find((s) => s.id === shipmentId)
  const breakdownNum: DutyBreakdown = {
    cid: num(breakdown.cid),
    pal: num(breakdown.pal),
    vat: num(breakdown.vat),
    sscl: num(breakdown.sscl),
    cess: num(breakdown.cess),
    other: num(breakdown.other),
  }
  const dutiesNum = useBreakdown ? sumBreakdown(breakdownNum) : num(duties)
  const total = dutiesNum + num(port) + num(transport) + num(agentFee) + num(otherCharges)
  const backTo = existing ? `/clearance/${existing.id}` : '/clearance'

  const addFiles = (files: FileList | null) => {
    if (!files) return
    const added: Attachment[] = [...files].map((f) => {
      const id = newAttachmentId()
      cacheFile(id, f)
      return { id, name: f.name, size: f.size, addedAt: today }
    })
    setAttachments((a) => [...a, ...added])
    if (fileInput.current) fileInput.current.value = ''
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!shipmentId) e.shipment = 'Select the shipment being handed over'
    if (!company) e.company = 'Select the clearing agent'
    if (!handover) e.handover = 'Handover date is required'
    const cus = cusdec.trim()
    if (cus && clearances.some((c) => c.id !== existing?.id && c.cusdecNumber.toLowerCase() === cus.toLowerCase())) e.cusdec = 'This CusDec number is already recorded'
    if (release) {
      if (handover && release < handover) e.release = 'Release cannot be before the handover date'
      if (!cus) e.cusdec = 'Enter the CusDec number before marking the goods as released'
    }
    for (const [key, v] of [
      ['duties', useBreakdown ? '0' : duties],
      ['port', port],
      ['transport', transport],
      ['agentFee', agentFee],
      ['otherCharges', otherCharges],
      ...Object.entries(breakdown).map(([k, v]) => [`b_${k}`, useBreakdown ? v : '0'] as const),
    ] as const)
      if (Number(v) < 0) e[key] = 'Cannot be negative'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const save = () => {
    if (!validate()) return
    const payload = {
      shipmentId,
      clearingCompany: company,
      handoverDate: handover,
      cusdecNumber: cusdec.trim(),
      duties: dutiesNum,
      dutyBreakdown: useBreakdown ? breakdownNum : undefined,
      portCharges: num(port),
      transport: num(transport),
      agentFee: num(agentFee),
      otherCharges: num(otherCharges),
      releaseDate: release || undefined,
      attachments,
    }
    let saved: Clearance
    if (existing) {
      update('clearances', existing.id, payload)
      saved = { ...existing, ...payload }
    } else {
      saved = add('clearances', payload)
    }
    applyEffects(saved)
    navigate(`/clearance/${saved.id}`)
  }

  return (
    <div>
      <Link to={backTo} className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> {existing ? 'Clearance record' : 'Clearance'}
      </Link>
      <PageHeader
        title={existing ? (releaseNow ? 'Mark goods as released' : 'Edit clearance') : 'Hand over to clearing agent'}
        description="Record what the clearing agent bills, exactly as shown on their bill and the Customs declaration (CusDec)."
      />

      <div className="space-y-5">
        <Card>
          <CardHeader title="Shipment & agent" />
          <CardBody className="space-y-4">
            {!existing && eligible.length === 0 ? (
              <p className="text-sm text-slate-600">No shipment is waiting for clearance. A shipment can be handed over once it has arrived in Sri Lanka.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Shipment" required error={errors.shipment} className="sm:col-span-2">
                  <Select value={shipmentId} onChange={(e) => setShipmentId(e.target.value)} disabled={!!existing}>
                    <option value="">Select shipment…</option>
                    {(existing ? shipments.filter((s) => s.id === existing.shipmentId) : eligible).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.ref} — {suppliers.find((x) => x.id === s.supplierId)?.name} — {SHIPMENT_STATUS[s.status].label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Clearing agent (CHA)" required error={errors.company}>
                  <Select value={company} onChange={(e) => setCompany(e.target.value)}>
                    <option value="">Select agent…</option>
                    {[...new Set([...companies, ...(company ? [company] : [])])].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Handed over on" required error={errors.handover}>
                  <Input type="date" value={handover} onChange={(e) => setHandover(e.target.value)} />
                </Field>
                <Field label="CusDec number" error={errors.cusdec} hint="From the Customs declaration the agent files in ASYCUDA">
                  <Input value={cusdec} onChange={(e) => setCusdec(e.target.value)} placeholder="e.g. CUS-2026-1182290" />
                </Field>
                <Field label="Released on" error={errors.release} hint="Leave empty until Customs releases the goods">
                  <Input type="date" value={release} onChange={(e) => setRelease(e.target.value)} />
                </Field>
              </div>
            )}
            {shipment && shipment.status === 'ARRIVED' && !existing && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                <p>
                  The original documents haven't been collected from the bank yet. The agent needs the originals to file the declaration — pay the bank first
                  (Bank &amp; Payments).
                </p>
              </div>
            )}
            {shipment && (
              <p className="text-xs text-slate-500">
                Current shipment status: <Badge tone={SHIPMENT_STATUS[shipment.status].tone}>{SHIPMENT_STATUS[shipment.status].label}</Badge>. Saving moves it to “With Clearing Agent”
                {release ? ' and then “Cleared & Released”' : ''}.
              </p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Customs duties & taxes (LKR)"
            description="Enter the amounts from the agent's bill — they are not calculated here."
            actions={
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={useBreakdown} onChange={(e) => setUseBreakdown(e.target.checked)} />
                Enter each levy separately
              </label>
            }
          />
          <CardBody>
            {useBreakdown ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {DUTY_FIELDS.map((f) => (
                  <Field key={f.key} label={f.label} error={errors[`b_${f.key}`]}>
                    <Input type="number" min={0} value={breakdown[f.key]} onChange={(e) => setBreakdown((b) => ({ ...b, [f.key]: e.target.value }))} />
                  </Field>
                ))}
              </div>
            ) : (
              <div className="max-w-sm">
                <Field label="Total duties & taxes" error={errors.duties}>
                  <Input type="number" min={0} value={duties} onChange={(e) => setDuties(e.target.value)} />
                </Field>
              </div>
            )}
            {useBreakdown && <p className="mt-3 text-sm text-slate-600">Total duties & taxes: <strong>{formatLkr(dutiesNum)}</strong></p>}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Other clearance bills (LKR)" />
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Port & handling" error={errors.port}>
                <Input type="number" min={0} value={port} onChange={(e) => setPort(e.target.value)} />
              </Field>
              <Field label="Transport" error={errors.transport}>
                <Input type="number" min={0} value={transport} onChange={(e) => setTransport(e.target.value)} />
              </Field>
              <Field label="Clearing agent fee" error={errors.agentFee}>
                <Input type="number" min={0} value={agentFee} onChange={(e) => setAgentFee(e.target.value)} />
              </Field>
              <Field label="Other charges" error={errors.otherCharges}>
                <Input type="number" min={0} value={otherCharges} onChange={(e) => setOtherCharges(e.target.value)} />
              </Field>
            </div>
            <div className="mt-4 flex justify-end border-t border-slate-100 pt-3 text-base font-semibold text-slate-900">Total clearance cost {formatLkr(total)}</div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Bills & CusDec copy"
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
          <Button onClick={save} disabled={!existing && eligible.length === 0}>
            {existing ? 'Save changes' : 'Hand over'}
          </Button>
        </div>
      </div>
    </div>
  )
}
