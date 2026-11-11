import { orderStatusFor } from '../../lib/shipments'
import { useDataStore } from '../../store/dataStore'
import { useUiStore } from '../../store/uiStore'
import type { ISODate, Shipment, ShipmentStatus } from '../../types'

/** Status changes for a shipment, keeping its purchase order's status in step. */
export function useShipmentStatus() {
  const role = useUiStore((s) => s.role)
  const orders = useDataStore((s) => s.purchaseOrders)
  const update = useDataStore((s) => s.update)

  const syncOrder = (shipment: Shipment, status: ShipmentStatus) => {
    const po = orders.find((o) => o.id === shipment.poId)
    const next = po && orderStatusFor(status, !!shipment.invoiceId, po.status)
    if (po && next && next !== po.status) update('purchaseOrders', po.id, { status: next })
  }

  return {
    changeStatus: (shipment: Shipment, status: ShipmentStatus, date: ISODate, note: string) => {
      update('shipments', shipment.id, {
        status,
        timeline: [...shipment.timeline, { date, status, role, note: note.trim() || undefined }],
      })
      syncOrder(shipment, status)
    },

    /** Remove the latest timeline entry and go back to the status before it. */
    undoLast: (shipment: Shipment) => {
      if (shipment.timeline.length < 2) return
      const timeline = shipment.timeline.slice(0, -1)
      const status = timeline[timeline.length - 1].status
      update('shipments', shipment.id, { status, timeline })
      syncOrder(shipment, status)
    },
  }
}
