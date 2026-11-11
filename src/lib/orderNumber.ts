import type { ISODate, OrderKind, PurchaseOrder } from '../types'

/** Next number like `PO-2026-008`. PO and LOI share one counter per year, matching the existing numbering. */
export function nextOrderNumber(kind: OrderKind, orders: PurchaseOrder[], date: ISODate): string {
  const year = date.slice(0, 4)
  const max = orders
    .filter((o) => o.number.split('-')[1] === year)
    .reduce((m, o) => Math.max(m, parseInt(o.number.split('-')[2] ?? '', 10) || 0), 0)
  return `${kind}-${year}-${String(max + 1).padStart(3, '0')}`
}
