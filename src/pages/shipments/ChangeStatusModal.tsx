import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button, Field, Input, Modal, Select, StatusBadge } from '../../components/ui'
import { SHIPMENT_STATUS, SHIPMENT_STATUS_ORDER } from '../../config/statuses'
import { todayISO } from '../../lib/format'
import { hasShipped, missingShippingInfo, statusIndex } from '../../lib/shipments'
import type { Shipment, ShipmentStatus } from '../../types'
import { useShipmentStatus } from './useShipmentStatus'

/** Move a shipment forward in its lifecycle. Mount only while visible. */
export function ChangeStatusModal({ shipment, onClose }: { shipment: Shipment; onClose: () => void }) {
  const { changeStatus } = useShipmentStatus()
  const later = SHIPMENT_STATUS_ORDER.filter((s) => statusIndex(s) > statusIndex(shipment.status))
  const [target, setTarget] = useState<ShipmentStatus | ''>(later[0] ?? '')
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')

  const lastDate = shipment.timeline[shipment.timeline.length - 1]?.date ?? ''
  const missing = target && hasShipped(target) ? missingShippingInfo(shipment) : []
  const dateError = date && lastDate && date < lastDate ? `Cannot be before the last change (${lastDate})` : ''
  const canSave = !!target && !!date && missing.length === 0 && !dateError

  return (
    <Modal
      open
      title="Change status"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!canSave}
            onClick={() => {
              if (!target) return
              changeStatus(shipment, target, date, note)
              onClose()
            }}
          >
            Update status
          </Button>
        </>
      }
    >
      {later.length === 0 ? (
        <p className="text-sm text-slate-600">This shipment is already at its final status.</p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            Current: <StatusBadge meta={SHIPMENT_STATUS[shipment.status]} />
          </div>
          <Field label="New status" required>
            <Select value={target} onChange={(e) => setTarget(e.target.value as ShipmentStatus)}>
              {later.map((s) => (
                <option key={s} value={s}>
                  {SHIPMENT_STATUS[s].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date" required error={dateError}>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Note" hint="Optional — e.g. “Documents collected from Sampath Bank”">
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          {missing.length > 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <p>
                Fill in <strong>{missing.join(', ')}</strong> under <em>Edit shipping info</em> before marking this shipment as loaded.
              </p>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
