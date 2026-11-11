import { useState } from 'react'
import { Button, Field, Input, Modal, Select } from '../../components/ui'
import { formatDate, formatNumber, todayISO } from '../../lib/format'
import { useDataStore } from '../../store/dataStore'
import { useUiStore } from '../../store/uiStore'

interface Props {
  presetShipmentId?: string
  onClose: () => void
}

/** Receive a released container into a warehouse. Mount only while visible. */
export function ReceiveModal({ presetShipmentId = '', onClose }: Props) {
  const role = useUiStore((s) => s.role)
  const shipments = useDataStore((s) => s.shipments)
  const stockItems = useDataStore((s) => s.stockItems)
  const orders = useDataStore((s) => s.purchaseOrders)
  const suppliers = useDataStore((s) => s.suppliers)
  const products = useDataStore((s) => s.products)
  const warehouses = useDataStore((s) => s.settings.warehouses)
  const add = useDataStore((s) => s.add)
  const update = useDataStore((s) => s.update)

  // Only released shipments that haven't been received yet.
  const eligible = shipments.filter((s) => s.status === 'RELEASED' && !stockItems.some((i) => i.shipmentId === s.id))
  const initial = eligible.some((s) => s.id === presetShipmentId) ? presetShipmentId : ''

  const orderedFor = (shipmentId: string) => orders.find((o) => o.id === shipments.find((s) => s.id === shipmentId)?.poId)?.items ?? []
  const defaultQtys = (shipmentId: string) => Object.fromEntries(orderedFor(shipmentId).map((i) => [i.productId, String(i.qty)]))

  const [shipmentId, setShipmentId] = useState(initial)
  const [warehouse, setWarehouse] = useState(warehouses[0] ?? '')
  const [date, setDate] = useState(todayISO())
  const [qtys, setQtys] = useState<Record<string, string>>(initial ? defaultQtys(initial) : {})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const shipment = shipments.find((s) => s.id === shipmentId)
  const ordered = orderedFor(shipmentId)
  const lastDate = shipment?.timeline[shipment.timeline.length - 1]?.date ?? ''

  const changeShipment = (id: string) => {
    setShipmentId(id)
    setQtys(defaultQtys(id))
    setErrors({})
  }

  const receive = () => {
    const e: Record<string, string> = {}
    if (!shipment) e.shipment = 'Select the shipment you are receiving'
    if (!warehouse) e.warehouse = 'Select the warehouse'
    if (!date) e.date = 'Enter the date received'
    else if (lastDate && date < lastDate) e.date = `Cannot be before the release date (${formatDate(lastDate)})`
    const received = ordered.map((i) => Number(qtys[i.productId]) || 0)
    ordered.forEach((i, idx) => {
      if (received[idx] < 0) e[i.productId] = 'Cannot be negative'
    })
    if (shipment && received.every((q) => q === 0)) e.qty = 'Enter the quantity received for at least one product'
    setErrors(e)
    if (Object.keys(e).length || !shipment) return

    ordered.forEach((item, idx) => {
      const diff = received[idx] - item.qty
      // Stock is booked at the ordered quantity; a short or extra delivery is a visible adjustment,
      // so the landed cost per unit (spread over the ordered quantity) stays consistent.
      const stock = add('stockItems', {
        shipmentId: shipment.id,
        productId: item.productId,
        warehouse,
        qtyReceived: item.qty,
        qtySold: 0,
        qtyAdjusted: diff,
        receivedDate: date,
      })
      add('stockMovements', { stockItemId: stock.id, date, type: 'RECEIVED', qty: item.qty, note: `Received from ${shipment.ref}` })
      if (diff !== 0) {
        add('stockMovements', {
          stockItemId: stock.id,
          date,
          type: 'ADJUSTED',
          qty: diff,
          note: diff < 0 ? `Short-landed on arrival (${-diff} fewer than ordered)` : `Delivered ${diff} more than ordered`,
        })
      }
    })

    const total = received.reduce((s, q) => s + q, 0)
    update('shipments', shipment.id, {
      status: 'IN_WAREHOUSE',
      timeline: [...shipment.timeline, { date, status: 'IN_WAREHOUSE', role, note: `Received ${formatNumber(total)} units at ${warehouse}` }],
    })
    onClose()
  }

  return (
    <Modal
      open
      size="lg"
      title="Receive container into warehouse"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={receive} disabled={eligible.length === 0}>
            Receive stock
          </Button>
        </>
      }
    >
      {eligible.length === 0 ? (
        <p className="text-sm text-slate-600">No released shipment is waiting to be received. A shipment appears here once Customs has released it (Clearance).</p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Shipment" required error={errors.shipment} className="sm:col-span-2">
              <Select value={shipmentId} onChange={(e) => changeShipment(e.target.value)}>
                <option value="">Select released shipment…</option>
                {eligible.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.ref} — {suppliers.find((x) => x.id === s.supplierId)?.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Warehouse" required error={errors.warehouse}>
              <Select value={warehouse} onChange={(e) => setWarehouse(e.target.value)}>
                {warehouses.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Received on" required error={errors.date}>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
          </div>

          {shipment && (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Quantity received</p>
              {errors.qty && <p className="mb-2 text-xs text-red-600">{errors.qty}</p>}
              <div className="space-y-2">
                {ordered.map((item) => {
                  const p = products.find((x) => x.id === item.productId)
                  const diff = (Number(qtys[item.productId]) || 0) - item.qty
                  return (
                    <div key={item.productId} className="grid items-start gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-12">
                      <div className="sm:col-span-6">
                        <p className="text-sm font-medium text-slate-900">{p?.name}</p>
                        <p className="text-xs text-slate-500">
                          Ordered {formatNumber(item.qty)} {p?.unit}
                        </p>
                      </div>
                      <Field label={`Received (${p?.unit})`} error={errors[item.productId]} className="sm:col-span-3">
                        <Input type="number" min={0} value={qtys[item.productId] ?? ''} onChange={(e) => setQtys((q) => ({ ...q, [item.productId]: e.target.value }))} />
                      </Field>
                      <div className="sm:col-span-3 sm:pt-6">
                        {diff === 0 ? (
                          <span className="text-xs text-green-700">Matches the order</span>
                        ) : (
                          <span className={`text-xs ${diff < 0 ? 'text-red-600' : 'text-amber-700'}`}>
                            {diff < 0 ? `${formatNumber(-diff)} short` : `${formatNumber(diff)} extra`} — recorded as an adjustment
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="mt-2 text-xs text-slate-500">Saving moves the shipment to “In Warehouse”.</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
