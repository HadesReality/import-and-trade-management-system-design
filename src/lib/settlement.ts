import { useDataStore } from '../store/dataStore'
import { useUiStore } from '../store/uiStore'
import type { ShipmentStatus } from '../types'
import { saleBalance } from './calc'
import { todayISO } from './format'
import { salesOfShipment } from './sales'

const SOLD_OUT: ShipmentStatus[] = ['FULLY_SOLD', 'SOLD_FULL_CONTAINER']

/**
 * Close a shipment once everything is sold and every sale is paid with cheques cleared; reopen it if a
 * payment problem appears later (for example a returned cheque). Safe to call after any sale or payment change.
 */
export function syncShipmentClosing() {
  const store = useDataStore.getState()
  const role = useUiStore.getState().role

  for (const shipment of store.shipments) {
    if (!SOLD_OUT.includes(shipment.status) && shipment.status !== 'CLOSED') continue
    const sales = salesOfShipment(store, shipment.id)
    if (sales.length === 0) continue

    const settled = sales.every(
      (sale) =>
        saleBalance(sale, store.cheques) <= 0.005 &&
        sale.payments.every((p) => !p.chequeId || store.cheques.find((c) => c.id === p.chequeId)?.status === 'CLEARED'),
    )

    const last = shipment.timeline[shipment.timeline.length - 1]?.date ?? ''
    const stamp = todayISO() < last ? last : todayISO()

    if (shipment.status !== 'CLOSED' && settled) {
      store.update('shipments', shipment.id, {
        status: 'CLOSED',
        timeline: [...shipment.timeline, { date: stamp, status: 'CLOSED', role, note: 'All payments received and cleared' }],
      })
    } else if (shipment.status === 'CLOSED' && !settled) {
      const before = [...shipment.timeline].reverse().find((t) => t.status !== 'CLOSED')?.status ?? 'FULLY_SOLD'
      store.update('shipments', shipment.id, {
        status: before,
        timeline: [...shipment.timeline, { date: stamp, status: before, role, note: 'Reopened — a payment is outstanding again' }],
      })
    }
  }
}
