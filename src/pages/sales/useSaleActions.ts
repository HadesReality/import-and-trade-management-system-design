import { stockRemaining } from '../../lib/calc'
import { todayISO } from '../../lib/format'
import { useDataStore } from '../../store/dataStore'
import { useUiStore } from '../../store/uiStore'
import type { ISODate, PaymentMethod, Sale, ShipmentStatus } from '../../types'

export interface NewPayment {
  method: Exclude<PaymentMethod, 'CREDIT'>
  amount: number
  date: ISODate
  cheque?: { number: string; bank: string; branch: string; chequeDate: ISODate }
}

/** Everything that happens as a result of selling: stock, shipment status, payments and cheques. */
export function useSaleActions() {
  const role = useUiStore((s) => s.role)
  const stockItems = useDataStore((s) => s.stockItems)
  const shipments = useDataStore((s) => s.shipments)
  const add = useDataStore((s) => s.add)
  const update = useDataStore((s) => s.update)

  const setShipmentStatus = (shipmentId: string, status: ShipmentStatus, date: ISODate, note: string) => {
    const shipment = shipments.find((s) => s.id === shipmentId)
    if (!shipment || shipment.status === status) return
    const last = shipment.timeline[shipment.timeline.length - 1]?.date ?? ''
    update('shipments', shipmentId, {
      status,
      timeline: [...shipment.timeline, { date: date < last ? last : date, status, role, note }],
    })
  }

  /** Reduce stock and move shipments along after a sale has been saved. */
  const applySale = (sale: Sale) => {
    if (sale.type === 'FULL_CONTAINER' && sale.shipmentId) {
      setShipmentStatus(sale.shipmentId, 'SOLD_FULL_CONTAINER', sale.date, `Sale ${sale.number}`)
      return
    }
    const touched = new Set<string>()
    for (const item of sale.items) {
      const stock = stockItems.find((s) => s.id === item.stockItemId)
      if (!stock) continue
      update('stockItems', stock.id, { qtySold: stock.qtySold + item.qty })
      add('stockMovements', { stockItemId: stock.id, date: sale.date, type: 'SOLD', qty: -item.qty, note: sale.number })
      touched.add(stock.shipmentId)
    }
    for (const shipmentId of touched) {
      const lines = stockItems.filter((s) => s.shipmentId === shipmentId)
      const left = lines.reduce((sum, s) => {
        const sold = sale.items.filter((i) => i.stockItemId === s.id).reduce((a, i) => a + i.qty, 0)
        return sum + stockRemaining(s) - sold
      }, 0)
      const status = shipments.find((s) => s.id === shipmentId)?.status
      if (left <= 0) setShipmentStatus(shipmentId, 'FULLY_SOLD', sale.date, `Last stock sold — ${sale.number}`)
      else if (status === 'IN_WAREHOUSE') setShipmentStatus(shipmentId, 'PARTLY_SOLD', sale.date, `First sale — ${sale.number}`)
    }
  }

  /** Put stock back and remove the sale's movements and cheques. Shipment status is left alone. */
  const reverseSale = (sale: Sale) => {
    const movements = useDataStore.getState().stockMovements
    for (const item of sale.items) {
      const stock = useDataStore.getState().stockItems.find((s) => s.id === item.stockItemId)
      if (stock) update('stockItems', stock.id, { qtySold: Math.max(0, stock.qtySold - item.qty) })
    }
    movements.filter((m) => m.type === 'SOLD' && m.note === sale.number).forEach((m) => useDataStore.getState().remove('stockMovements', m.id))
    sale.payments.forEach((p) => p.chequeId && useDataStore.getState().remove('cheques', p.chequeId))
  }

  /** Record a payment on a sale; a cheque payment also creates a pending cheque. */
  const addPayment = (sale: Sale, payment: NewPayment): Sale => {
    let chequeId: string | undefined
    if (payment.method === 'CHEQUE' && payment.cheque) {
      chequeId = add('cheques', {
        saleId: sale.id,
        customerId: sale.customerId,
        number: payment.cheque.number,
        bank: payment.cheque.bank,
        branch: payment.cheque.branch,
        amount: payment.amount,
        chequeDate: payment.cheque.chequeDate,
        status: 'PENDING',
      }).id
    }
    const entry = { id: `pay-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, date: payment.date || todayISO(), method: payment.method, amount: payment.amount, chequeId }
    const payments = [...sale.payments, entry]
    update('sales', sale.id, { payments })
    return { ...sale, payments }
  }

  return { applySale, reverseSale, addPayment }
}
