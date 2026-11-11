import type { AppData, Cheque, PurchaseOrder, Sale, StockItem } from '../types'

const sum = (nums: number[]) => nums.reduce((a, b) => a + b, 0)

export const poTotalUsd = (po: PurchaseOrder) => sum(po.items.map((i) => i.qty * i.unitPriceUsd))
export const poTotalQty = (po: PurchaseOrder) => sum(po.items.map((i) => i.qty))

/** Quantity still on the shelf: received − sold + adjustments (adjustments are signed, losses are negative). */
export const stockRemaining = (s: StockItem) => s.qtyReceived - s.qtySold + s.qtyAdjusted

// ---------- Sales ----------

export const saleSubtotal = (sale: Sale) => sum(sale.items.map((i) => i.qty * i.unitPrice))
export const saleTotal = (sale: Sale) => saleSubtotal(sale) - sale.discount

/** Cash counts immediately; a cheque counts unless it has been returned. */
export function salePaid(sale: Sale, cheques: Cheque[]): number {
  return sum(
    sale.payments.map((p) => {
      if (p.method === 'CASH') return p.amount
      const cheque = cheques.find((c) => c.id === p.chequeId)
      return cheque?.status === 'RETURNED' ? 0 : p.amount
    }),
  )
}

export const saleBalance = (sale: Sale, cheques: Cheque[]) => saleTotal(sale) - salePaid(sale, cheques)

// ---------- Landed cost ----------

export interface CostLine {
  productId: string
  qty: number
  totalCost: number
  unitCost: number
}

export interface ShipmentCost {
  poTotalUsd: number
  /** USD already covered by recorded bank payments (paid or pending). */
  recordedUsd: number
  /** USD with no bank payment recorded yet — costed at the default exchange rate. */
  unrecordedUsd: number
  goodsLkr: number
  docCharges: number
  commission: number
  otherBankCharges: number
  bankCharges: number
  duties: number
  portCharges: number
  transport: number
  agentFee: number
  otherClearance: number
  clearanceTotal: number
  totalLanded: number
  totalQty: number
  perUnit: number
  /** True while bank payments are pending, amounts are unrecorded or the goods are not yet released. */
  isEstimate: boolean
}

/**
 * Landed cost = goods (USD × exchange rate paid) + bank charges + clearance costs.
 * Customs duties are entered from the clearing agent's bill, not calculated here.
 */
export function computeShipmentCost(data: AppData, shipmentId: string): ShipmentCost | undefined {
  const shipment = data.shipments.find((s) => s.id === shipmentId)
  const po = data.purchaseOrders.find((p) => p.id === shipment?.poId)
  if (!shipment || !po) return undefined

  const payments = data.bankPayments.filter((p) => p.shipmentId === shipmentId)
  const clearance = data.clearances.find((c) => c.shipmentId === shipmentId)

  const poUsd = poTotalUsd(po)
  const recordedUsd = sum(payments.map((p) => p.amountUsd))
  const unrecordedUsd = Math.max(0, poUsd - recordedUsd)
  const goodsLkr =
    sum(payments.map((p) => p.amountUsd * p.exchangeRate)) + unrecordedUsd * data.settings.exchangeRate

  const docCharges = sum(payments.map((p) => p.docCharges))
  const commission = sum(payments.map((p) => p.commission))
  const otherBankCharges = sum(payments.map((p) => p.otherCharges))
  const bankCharges = docCharges + commission + otherBankCharges

  const duties = clearance?.duties ?? 0
  const portCharges = clearance?.portCharges ?? 0
  const transport = clearance?.transport ?? 0
  const agentFee = clearance?.agentFee ?? 0
  const otherClearance = clearance?.otherCharges ?? 0
  const clearanceTotal = duties + portCharges + transport + agentFee + otherClearance

  const totalLanded = goodsLkr + bankCharges + clearanceTotal
  const totalQty = poTotalQty(po)

  return {
    poTotalUsd: poUsd,
    recordedUsd,
    unrecordedUsd,
    goodsLkr,
    docCharges,
    commission,
    otherBankCharges,
    bankCharges,
    duties,
    portCharges,
    transport,
    agentFee,
    otherClearance,
    clearanceTotal,
    totalLanded,
    totalQty,
    perUnit: totalQty > 0 ? totalLanded / totalQty : 0,
    isEstimate: payments.some((p) => p.status === 'PENDING') || unrecordedUsd > 0 || !clearance?.releaseDate,
  }
}

/** Spread a shipment's total landed cost across its products, by value share or by quantity share. */
export function allocateCost(po: PurchaseOrder, totalLanded: number, by: 'VALUE' | 'QTY'): CostLine[] {
  const totalValue = poTotalUsd(po)
  const totalQty = poTotalQty(po)
  return po.items.map((item) => {
    const share =
      by === 'VALUE'
        ? totalValue > 0
          ? (item.qty * item.unitPriceUsd) / totalValue
          : 0
        : totalQty > 0
          ? item.qty / totalQty
          : 0
    const totalCost = totalLanded * share
    return { productId: item.productId, qty: item.qty, totalCost, unitCost: item.qty > 0 ? totalCost / item.qty : 0 }
  })
}

export const suggestedPrice = (unitCost: number, marginPercent: number) => unitCost * (1 + marginPercent / 100)
