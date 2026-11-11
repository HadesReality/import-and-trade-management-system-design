import { computeShipmentResult } from './costing'
import type { AppData } from '../types'

/** Landed cost per unit for every stock item, taken from its shipment's costing (spread by value). */
export function stockUnitCosts(data: AppData): Map<string, number> {
  const byShipment = new Map<string, Map<string, number>>()
  const costs = new Map<string, number>()
  for (const item of data.stockItems) {
    if (!byShipment.has(item.shipmentId)) {
      const result = computeShipmentResult(data, item.shipmentId, 'VALUE')
      byShipment.set(item.shipmentId, new Map(result?.products.map((p) => [p.productId, p.unitCost]) ?? []))
    }
    costs.set(item.id, byShipment.get(item.shipmentId)?.get(item.productId) ?? 0)
  }
  return costs
}
