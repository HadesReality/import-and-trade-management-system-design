import { allocateCost, computeShipmentCost, type ShipmentCost } from './calc'
import type { AppData } from '../types'

export type AllocateBy = 'VALUE' | 'QTY'

export interface ProductResult {
  productId: string
  qty: number
  /** Share of the shipment's landed cost given to this product. */
  allocated: number
  unitCost: number
  soldQty: number
  revenue: number
  /** Cost of the units sold (units sold × landed cost per unit). */
  cogs: number
  /** Units lost (damaged, short) — counted as a cost. */
  writtenOffQty: number
  writeOffCost: number
  /** Units still to sell. */
  remainingQty: number
  remainingValue: number
  avgSellingPrice: number
}

export interface ShipmentResult {
  cost: ShipmentCost
  products: ProductResult[]
  revenue: number
  cogs: number
  writeOff: number
  /** Revenue − cost of units sold − write-offs. */
  profit: number
  /** Profit as a percentage of revenue. */
  marginPercent: number
  soldQty: number
  remainingValue: number
  hasSales: boolean
}

/**
 * Landed cost split per product, matched with what has been sold from this shipment.
 * Sales count when they are a full-container sale of the shipment, or a warehouse sale of its stock.
 * A sale's discount is spread over its lines in proportion to their value.
 */
export function computeShipmentResult(data: AppData, shipmentId: string, by: AllocateBy): ShipmentResult | undefined {
  const cost = computeShipmentCost(data, shipmentId)
  const shipment = data.shipments.find((s) => s.id === shipmentId)
  const po = data.purchaseOrders.find((p) => p.id === shipment?.poId)
  if (!cost || !shipment || !po) return undefined

  const lines = allocateCost(po, cost.totalLanded, by)
  const stock = data.stockItems.filter((s) => s.shipmentId === shipmentId)
  const stockIds = new Set(stock.map((s) => s.id))

  const sold = new Map<string, { qty: number; revenue: number }>()
  for (const sale of data.sales) {
    const subtotal = sale.items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0)
    const keep = subtotal > 0 ? 1 - sale.discount / subtotal : 1
    for (const item of sale.items) {
      const fromHere = sale.shipmentId === shipmentId || (!!item.stockItemId && stockIds.has(item.stockItemId))
      if (!fromHere) continue
      const prev = sold.get(item.productId) ?? { qty: 0, revenue: 0 }
      sold.set(item.productId, { qty: prev.qty + item.qty, revenue: prev.revenue + item.qty * item.unitPrice * keep })
    }
  }

  const products: ProductResult[] = lines.map((l) => {
    const s = sold.get(l.productId) ?? { qty: 0, revenue: 0 }
    const adjusted = stock.filter((x) => x.productId === l.productId).reduce((sum, x) => sum + x.qtyAdjusted, 0)
    const writtenOffQty = Math.max(0, -adjusted)
    const remainingQty = Math.max(0, l.qty - s.qty + adjusted)
    return {
      productId: l.productId,
      qty: l.qty,
      allocated: l.totalCost,
      unitCost: l.unitCost,
      soldQty: s.qty,
      revenue: s.revenue,
      cogs: s.qty * l.unitCost,
      writtenOffQty,
      writeOffCost: writtenOffQty * l.unitCost,
      remainingQty,
      remainingValue: remainingQty * l.unitCost,
      avgSellingPrice: s.qty > 0 ? s.revenue / s.qty : 0,
    }
  })

  const revenue = products.reduce((sum, p) => sum + p.revenue, 0)
  const cogs = products.reduce((sum, p) => sum + p.cogs, 0)
  const writeOff = products.reduce((sum, p) => sum + p.writeOffCost, 0)
  const profit = revenue - cogs - writeOff
  return {
    cost,
    products,
    revenue,
    cogs,
    writeOff,
    profit,
    marginPercent: revenue > 0 ? (profit / revenue) * 100 : 0,
    soldQty: products.reduce((sum, p) => sum + p.soldQty, 0),
    remainingValue: products.reduce((sum, p) => sum + p.remainingValue, 0),
    hasSales: products.some((p) => p.soldQty > 0),
  }
}
