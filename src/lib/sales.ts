import type { Tone } from '../config/statuses'
import type { AppData, Cheque, Sale } from '../types'
import { saleBalance, salePaid, saleTotal } from './calc'

/** Next number like `SL-0005`. */
export function nextSaleNumber(sales: Sale[]): string {
  const max = sales.reduce((m, s) => Math.max(m, parseInt(s.number.split('-')[1] ?? '', 10) || 0), 0)
  return `SL-${String(max + 1).padStart(4, '0')}`
}

export interface SaleStatus {
  label: string
  tone: Tone
  total: number
  paid: number
  balance: number
  /** True when a cheque for this sale has bounced. */
  chequeReturned: boolean
}

export function saleStatus(sale: Sale, cheques: Cheque[]): SaleStatus {
  const total = saleTotal(sale)
  const paid = salePaid(sale, cheques)
  const balance = saleBalance(sale, cheques)
  const chequeReturned = sale.payments.some((p) => cheques.find((c) => c.id === p.chequeId)?.status === 'RETURNED')
  if (balance <= 0.005) return { label: 'Paid', tone: 'green', total, paid, balance: 0, chequeReturned }
  if (paid > 0) return { label: 'Part paid', tone: 'amber', total, paid, balance, chequeReturned }
  return { label: 'Unpaid', tone: 'red', total, paid, balance, chequeReturned }
}

/** Every sale that sells goods from a shipment: a full-container sale, or a warehouse sale from its stock. */
export function salesOfShipment(data: AppData, shipmentId: string): Sale[] {
  const stockIds = new Set(data.stockItems.filter((s) => s.shipmentId === shipmentId).map((s) => s.id))
  return data.sales.filter((s) => s.shipmentId === shipmentId || s.items.some((i) => i.stockItemId && stockIds.has(i.stockItemId)))
}

/** Sri Lankan mobile or landline: +94 followed by 9 digits, or 0 followed by 9 digits. */
export const isValidSriLankanPhone = (p: string) => /^(?:\+94|0)\d{9}$/.test(p.replace(/[\s-]/g, ''))
