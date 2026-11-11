import { statusIndex } from '../../lib/shipments'
import { useDataStore } from '../../store/dataStore'
import { useUiStore } from '../../store/uiStore'
import type { Clearance, ShipmentStatus, TimelineEntry } from '../../types'

/**
 * When a clearance is saved, move its shipment forward:
 * - handing over moves an arrived shipment to "With Clearing Agent";
 * - a release date moves it on to "Cleared & Released".
 * Saving never moves a shipment backwards — use "Undo last" on the shipment for that.
 */
export function useClearanceEffects() {
  const role = useUiStore((s) => s.role)
  const shipments = useDataStore((s) => s.shipments)
  const update = useDataStore((s) => s.update)

  return (c: Clearance) => {
    const shipment = shipments.find((s) => s.id === c.shipmentId)
    if (!shipment) return

    let status = shipment.status
    const timeline = [...shipment.timeline]
    let lastDate = timeline[timeline.length - 1]?.date ?? ''
    const push = (next: ShipmentStatus, date: string, note: string) => {
      const entry: TimelineEntry = { date: date < lastDate ? lastDate : date, status: next, role, note }
      timeline.push(entry)
      lastDate = entry.date
      status = next
    }

    if (statusIndex(status) < statusIndex('WITH_CLEARING_AGENT')) {
      push('WITH_CLEARING_AGENT', c.handoverDate, `Handed to ${c.clearingCompany}`)
    }
    if (c.releaseDate && statusIndex(status) < statusIndex('RELEASED')) {
      push('RELEASED', c.releaseDate, c.cusdecNumber ? `Released — CusDec ${c.cusdecNumber}` : 'Released by Customs')
    }

    if (status !== shipment.status) update('shipments', shipment.id, { status, timeline })
  }
}
