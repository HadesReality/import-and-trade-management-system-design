import { SHIPMENT_STATUS_ORDER, type Tone } from '../config/statuses'
import type { ISODate, POStatus, Shipment, ShipmentStatus } from '../types'
import { daysFromToday } from './format'

export const statusIndex = (s: ShipmentStatus) => SHIPMENT_STATUS_ORDER.indexOf(s)

/** True once the goods have reached Sri Lanka. */
export const hasArrived = (s: ShipmentStatus) => statusIndex(s) >= statusIndex('ARRIVED')

/** True once the supplier has loaded the goods. */
export const hasShipped = (s: ShipmentStatus) => statusIndex(s) >= statusIndex('SHIPPED')

/** Next reference like `SHP-2026-007`. */
export function nextShipmentRef(shipments: Shipment[], date: ISODate): string {
  const year = date.slice(0, 4)
  const max = shipments
    .filter((s) => s.ref.split('-')[1] === year)
    .reduce((m, s) => Math.max(m, parseInt(s.ref.split('-')[2] ?? '', 10) || 0), 0)
  return `SHP-${year}-${String(max + 1).padStart(3, '0')}`
}

/** Short "when does it arrive" text with a colour, e.g. `in 11d` / `2d late` / `Arrived`. */
export function etaInfo(s: Shipment): { label: string; tone: Tone } {
  if (hasArrived(s.status)) return { label: 'Arrived', tone: 'green' }
  if (!s.eta) return { label: 'ETA not set', tone: 'gray' }
  const d = daysFromToday(s.eta)
  if (d < 0) return { label: `${-d}d late`, tone: 'red' }
  if (d === 0) return { label: 'Today', tone: 'amber' }
  return { label: `in ${d}d`, tone: d <= 7 ? 'amber' : 'blue' }
}

/** What must be filled in before a shipment can be marked as loaded / shipped. */
export function missingShippingInfo(s: Shipment): string[] {
  const missing: string[] = []
  if (!s.vessel.trim()) missing.push('Vessel name')
  if (!s.blNumber.trim()) missing.push('BL number')
  if (!s.etd) missing.push('ETD')
  if (!s.eta) missing.push('ETA')
  return missing
}

/**
 * The order's status follows its shipment: Shipped once goods are loaded, otherwise Invoiced / Issued.
 * Returns undefined when the order should be left alone (draft or cancelled).
 */
export function orderStatusFor(shipmentStatus: ShipmentStatus, hasInvoice: boolean, current: POStatus): POStatus | undefined {
  if (!['ISSUED', 'INVOICED', 'SHIPPED'].includes(current)) return undefined
  if (hasShipped(shipmentStatus)) return 'SHIPPED'
  return hasInvoice ? 'INVOICED' : 'ISSUED'
}

/** ISO 6346 container number: 4 letters + 7 digits, e.g. MSKU6841275. */
export const isValidContainerNumber = (n: string) => /^[A-Z]{4}\d{7}$/.test(n)
