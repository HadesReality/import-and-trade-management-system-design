import { useState } from 'react'
import { Button, Field, Input, Modal, Select } from '../../components/ui'
import { poTotalUsd } from '../../lib/calc'
import { formatUsd, todayISO } from '../../lib/format'
import { nextShipmentRef } from '../../lib/shipments'
import { useDataStore } from '../../store/dataStore'
import { useUiStore } from '../../store/uiStore'
import type { DocType, ShipmentDocument, TimelineEntry } from '../../types'

const DOC_TYPES: DocType[] = ['BL', 'INVOICE', 'PACKING_LIST', 'CERT_OF_ORIGIN', 'INSURANCE']

/** Start a shipment file for an order. Mount only while visible. */
export function NewShipmentModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const role = useUiStore((s) => s.role)
  const orders = useDataStore((s) => s.purchaseOrders)
  const suppliers = useDataStore((s) => s.suppliers)
  const invoices = useDataStore((s) => s.invoices)
  const shipments = useDataStore((s) => s.shipments)
  const ports = useDataStore((s) => s.settings.ports)
  const add = useDataStore((s) => s.add)

  // An order can have one shipment file; draft and cancelled orders can't ship.
  const eligible = orders.filter((o) => (o.status === 'ISSUED' || o.status === 'INVOICED') && !shipments.some((s) => s.poId === o.id))
  const [poId, setPoId] = useState('')
  const [loadingPort, setLoadingPort] = useState('')
  const [error, setError] = useState('')

  const create = () => {
    const po = orders.find((o) => o.id === poId)
    if (!po) return setError('Select the order this shipment is for')
    const invoice = invoices.find((i) => i.poId === po.id)
    const today = todayISO()
    const timeline: TimelineEntry[] = [{ date: today, status: 'PO_ISSUED', role }]
    if (invoice) timeline.push({ date: today, status: 'INVOICE_RECEIVED', role, note: `Invoice ${invoice.number}` })
    const documents: ShipmentDocument[] = DOC_TYPES.map((type) => ({
      type,
      state: type === 'INVOICE' && invoice ? 'COPY_RECEIVED' : 'MISSING',
    }))
    const created = add('shipments', {
      ref: nextShipmentRef(shipments, today),
      poId: po.id,
      invoiceId: invoice?.id,
      supplierId: po.supplierId,
      vessel: '',
      voyage: '',
      shippingLine: '',
      blNumber: '',
      loadingPort: loadingPort.trim(),
      dischargePort: 'Colombo',
      loadType: 'FCL',
      containers: [],
      documents,
      status: invoice ? 'INVOICE_RECEIVED' : 'PO_ISSUED',
      timeline,
    })
    onCreated(created.id)
    onClose()
  }

  return (
    <Modal
      open
      title="New shipment"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={create} disabled={eligible.length === 0}>
            Create shipment
          </Button>
        </>
      }
    >
      {eligible.length === 0 ? (
        <p className="text-sm text-slate-600">
          Every issued order already has a shipment. Issue a new purchase order first, then start its shipment here.
        </p>
      ) : (
        <div className="space-y-4">
          <Field label="Purchase order / LOI" required error={error}>
            <Select value={poId} onChange={(e) => (setPoId(e.target.value), setError(''))}>
              <option value="">Select order…</option>
              {eligible.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.number} — {suppliers.find((s) => s.id === o.supplierId)?.name} — {formatUsd(poTotalUsd(o))}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Loading port" hint="Optional — you can fill vessel and dates later">
            <Input value={loadingPort} onChange={(e) => setLoadingPort(e.target.value)} list="ports-list" placeholder="e.g. Shenzhen (Yantian)" />
            <datalist id="ports-list">
              {ports.filter((p) => p !== 'Colombo').map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </Field>
        </div>
      )}
    </Modal>
  )
}
