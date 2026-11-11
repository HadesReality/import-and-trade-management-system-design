import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button, Field, Input, Modal, Select } from '../../components/ui'
import { isValidContainerNumber } from '../../lib/shipments'
import { useDataStore } from '../../store/dataStore'
import type { ContainerSize, LoadType, Shipment } from '../../types'

interface Props {
  shipment: Shipment
  onClose: () => void
}

/** Edit vessel, BL, ports, dates and containers. Mount only while visible. */
export function ShippingInfoModal({ shipment, onClose }: Props) {
  const update = useDataStore((s) => s.update)
  const shipments = useDataStore((s) => s.shipments)
  const settings = useDataStore((s) => s.settings)

  const [vessel, setVessel] = useState(shipment.vessel)
  const [voyage, setVoyage] = useState(shipment.voyage)
  const [line, setLine] = useState(shipment.shippingLine)
  const [bl, setBl] = useState(shipment.blNumber)
  const [loadingPort, setLoadingPort] = useState(shipment.loadingPort)
  const [dischargePort, setDischargePort] = useState(shipment.dischargePort)
  const [etd, setEtd] = useState(shipment.etd ?? '')
  const [eta, setEta] = useState(shipment.eta ?? '')
  const [loadType, setLoadType] = useState<LoadType>(shipment.loadType)
  const [containers, setContainers] = useState(shipment.containers.map((c) => ({ ...c })))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const setContainer = (i: number, patch: Partial<{ number: string; size: ContainerSize }>) =>
    setContainers((cs) => cs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))

  const save = () => {
    const e: Record<string, string> = {}
    if (bl.trim() && shipments.some((s) => s.id !== shipment.id && s.blNumber.toLowerCase() === bl.trim().toLowerCase()))
      e.bl = 'This BL number is already used by another shipment'
    if (etd && eta && eta < etd) e.eta = 'ETA cannot be before ETD'
    const seen = new Set<string>()
    containers.forEach((c, i) => {
      const n = c.number.trim().toUpperCase()
      if (!isValidContainerNumber(n)) e[`c${i}`] = 'Use 4 letters + 7 digits, e.g. MSKU6841275'
      else if (seen.has(n) || shipments.some((s) => s.id !== shipment.id && s.containers.some((x) => x.number === n)))
        e[`c${i}`] = 'Container number already used'
      seen.add(n)
    })
    setErrors(e)
    if (Object.keys(e).length) return

    update('shipments', shipment.id, {
      vessel: vessel.trim(),
      voyage: voyage.trim(),
      shippingLine: line.trim(),
      blNumber: bl.trim(),
      loadingPort: loadingPort.trim(),
      dischargePort: dischargePort.trim() || 'Colombo',
      etd: etd || undefined,
      eta: eta || undefined,
      loadType,
      containers: containers.map((c) => ({ ...c, number: c.number.trim().toUpperCase() })),
    })
    onClose()
  }

  return (
    <Modal
      open
      size="lg"
      title="Edit shipping info"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Vessel name">
          <Input value={vessel} onChange={(e) => setVessel(e.target.value)} placeholder="e.g. MAERSK KOLKATA" />
        </Field>
        <Field label="Voyage number">
          <Input value={voyage} onChange={(e) => setVoyage(e.target.value)} placeholder="e.g. 438E" />
        </Field>
        <Field label="Shipping line">
          <Input value={line} onChange={(e) => setLine(e.target.value)} list="lines-list" />
          <datalist id="lines-list">
            {settings.shippingLines.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </Field>
        <Field label="BL number" error={errors.bl}>
          <Input value={bl} onChange={(e) => setBl(e.target.value)} />
        </Field>
        <Field label="Loading port">
          <Input value={loadingPort} onChange={(e) => setLoadingPort(e.target.value)} list="ports-edit" />
        </Field>
        <Field label="Discharge port">
          <Input value={dischargePort} onChange={(e) => setDischargePort(e.target.value)} list="ports-edit" />
          <datalist id="ports-edit">
            {settings.ports.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </Field>
        <Field label="ETD (departure)">
          <Input type="date" value={etd} onChange={(e) => setEtd(e.target.value)} />
        </Field>
        <Field label="ETA (arrival in Sri Lanka)" error={errors.eta}>
          <Input type="date" value={eta} onChange={(e) => setEta(e.target.value)} />
        </Field>
        <Field label="Load type" hint="FCL = full container, LCL = shared container">
          <Select value={loadType} onChange={(e) => setLoadType(e.target.value as LoadType)}>
            <option value="FCL">FCL — full container load</option>
            <option value="LCL">LCL — less than container load</option>
          </Select>
        </Field>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">Containers</p>
          <Button size="sm" variant="secondary" onClick={() => setContainers((cs) => [...cs, { number: '', size: '40HC' }])}>
            <Plus size={14} /> Add container
          </Button>
        </div>
        {containers.length === 0 && <p className="text-sm text-slate-500">No containers added yet.</p>}
        <div className="space-y-2">
          {containers.map((c, i) => (
            <div key={i} className="grid items-start gap-3 sm:grid-cols-12">
              <Field label="Container number" error={errors[`c${i}`]} className="sm:col-span-7">
                <Input value={c.number} onChange={(e) => setContainer(i, { number: e.target.value.toUpperCase() })} placeholder="MSKU6841275" />
              </Field>
              <Field label="Size" className="sm:col-span-4">
                <Select value={c.size} onChange={(e) => setContainer(i, { size: e.target.value as ContainerSize })}>
                  <option value="20FT">20 ft</option>
                  <option value="40FT">40 ft</option>
                  <option value="40HC">40 ft high cube</option>
                </Select>
              </Field>
              <div className="flex justify-end sm:col-span-1 sm:pt-6">
                <button
                  onClick={() => setContainers((cs) => cs.filter((_, idx) => idx !== i))}
                  className="rounded p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Remove container"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
