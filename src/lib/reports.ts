import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { CHEQUE_STATUS, PAYMENT_TERM, PO_STATUS, SHIPMENT_STATUS, SHIPMENT_STATUS_ORDER } from '../config/statuses'
import type { AppData } from '../types'
import { poTotalUsd, saleSubtotal, saleTotal } from './calc'
import { computeShipmentResult } from './costing'
import { saleStatus } from './sales'
import { hasArrived, hasShipped } from './shipments'

export type Fmt = 'text' | 'int' | 'lkr' | 'usd' | 'pct' | 'date'
export type Cell = string | number | undefined

export interface ReportColumn {
  header: string
  fmt?: Fmt
}

export interface ReportTable {
  title: string
  columns: ReportColumn[]
  rows: Cell[][]
  /** Optional last row with totals, shown in bold and included in the CSV. */
  totals?: Cell[]
}

export interface Report {
  summary: { label: string; value: number; fmt: Fmt }[]
  tables: ReportTable[]
}

export type ReportId = 'shipments' | 'purchases' | 'costing' | 'sales' | 'receivables' | 'cheques'

export const REPORTS: { id: ReportId; label: string; description: string; usesRange: boolean }[] = [
  { id: 'shipments', label: 'Shipments', description: 'Shipments by status and by supplier, with order value.', usesRange: true },
  { id: 'purchases', label: 'Purchases', description: 'What was ordered, by month and by supplier (USD).', usesRange: true },
  { id: 'costing', label: 'Landed cost & profit', description: 'What each shipment cost in rupees and what it earned.', usesRange: false },
  { id: 'sales', label: 'Sales', description: 'Sales by customer, by product and by month (LKR).', usesRange: true },
  { id: 'receivables', label: 'Receivables', description: 'Who owes money and for how long (as of today).', usesRange: false },
  { id: 'cheques', label: 'Cheques', description: 'Customer cheques by status.', usesRange: true },
]

export interface DateRange {
  from: string
  to: string
}

const sum = (nums: number[]) => nums.reduce((a, b) => a + b, 0)
const monthLabel = (key: string) => format(parseISO(`${key}-01`), 'MMM yyyy')

/** Group rows by key, keeping first-seen order. */
function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) map.set(key(item), [...(map.get(key(item)) ?? []), item])
  return map
}

export function buildReport(id: ReportId, data: AppData, range: DateRange): Report {
  const inRange = (date: string) => (!range.from || date >= range.from) && (!range.to || date <= range.to)
  const supplier = (sid: string) => data.suppliers.find((s) => s.id === sid)?.name ?? '—'
  const customerName = (cid: string) => {
    const c = data.customers.find((x) => x.id === cid)
    return c?.business || c?.name || '—'
  }
  const product = (pid: string) => data.products.find((p) => p.id === pid)

  switch (id) {
    case 'shipments': {
      const rows = data.shipments
        .map((s) => ({ s, po: data.purchaseOrders.find((o) => o.id === s.poId) }))
        .filter(({ po }) => po && inRange(po.date))
        .map(({ s, po }) => ({ s, usd: poTotalUsd(po!) }))
      const byStatus = SHIPMENT_STATUS_ORDER.map((st) => {
        const list = rows.filter((r) => r.s.status === st)
        return [SHIPMENT_STATUS[st].label, list.length, sum(list.map((r) => r.usd))] as Cell[]
      }).filter((r) => (r[1] as number) > 0)
      const bySupplier = [...groupBy(rows, (r) => r.s.supplierId)].map(([sid, list]) => [supplier(sid), list.length, sum(list.map((r) => r.usd))] as Cell[])
      return {
        summary: [
          { label: 'Shipments', value: rows.length, fmt: 'int' },
          { label: 'On the water', value: rows.filter((r) => hasShipped(r.s.status) && !hasArrived(r.s.status)).length, fmt: 'int' },
          { label: 'Completed', value: rows.filter((r) => r.s.status === 'CLOSED').length, fmt: 'int' },
          { label: 'Order value', value: sum(rows.map((r) => r.usd)), fmt: 'usd' },
        ],
        tables: [
          { title: 'By status', columns: [{ header: 'Status' }, { header: 'Shipments', fmt: 'int' }, { header: 'Order value', fmt: 'usd' }], rows: byStatus, totals: ['Total', rows.length, sum(rows.map((r) => r.usd))] },
          { title: 'By supplier', columns: [{ header: 'Supplier' }, { header: 'Shipments', fmt: 'int' }, { header: 'Order value', fmt: 'usd' }], rows: bySupplier, totals: ['Total', rows.length, sum(rows.map((r) => r.usd))] },
          {
            title: 'All shipments',
            columns: [{ header: 'Shipment' }, { header: 'Supplier' }, { header: 'Status' }, { header: 'Vessel' }, { header: 'BL number' }, { header: 'ETD', fmt: 'date' }, { header: 'ETA', fmt: 'date' }, { header: 'Order value', fmt: 'usd' }],
            rows: rows.map(({ s, usd }) => [s.ref, supplier(s.supplierId), SHIPMENT_STATUS[s.status].label, s.vessel || undefined, s.blNumber || undefined, s.etd, s.eta, usd]),
          },
        ],
      }
    }

    case 'purchases': {
      const orders = data.purchaseOrders.filter((o) => o.status !== 'CANCELLED' && o.status !== 'DRAFT' && inRange(o.date))
      const total = sum(orders.map(poTotalUsd))
      const byMonth = [...groupBy([...orders].sort((a, b) => a.date.localeCompare(b.date)), (o) => o.date.slice(0, 7))].map(([m, list]) => [monthLabel(m), list.length, sum(list.map(poTotalUsd))] as Cell[])
      const bySupplier = [...groupBy(orders, (o) => o.supplierId)]
        .map(([sid, list]) => ({ name: supplier(sid), n: list.length, usd: sum(list.map(poTotalUsd)) }))
        .sort((a, b) => b.usd - a.usd)
        .map((r) => [r.name, r.n, r.usd, total > 0 ? (r.usd / total) * 100 : 0] as Cell[])
      return {
        summary: [
          { label: 'Orders', value: orders.length, fmt: 'int' },
          { label: 'Total ordered', value: total, fmt: 'usd' },
          { label: 'Suppliers', value: new Set(orders.map((o) => o.supplierId)).size, fmt: 'int' },
          { label: 'Average order', value: orders.length ? total / orders.length : 0, fmt: 'usd' },
        ],
        tables: [
          { title: 'By month', columns: [{ header: 'Month' }, { header: 'Orders', fmt: 'int' }, { header: 'Value', fmt: 'usd' }], rows: byMonth, totals: ['Total', orders.length, total] },
          { title: 'By supplier', columns: [{ header: 'Supplier' }, { header: 'Orders', fmt: 'int' }, { header: 'Value', fmt: 'usd' }, { header: 'Share', fmt: 'pct' }], rows: bySupplier, totals: ['Total', orders.length, total, 100] },
          {
            title: 'All orders',
            columns: [{ header: 'Number' }, { header: 'Date', fmt: 'date' }, { header: 'Supplier' }, { header: 'Term' }, { header: 'Status' }, { header: 'Value', fmt: 'usd' }],
            rows: [...orders].sort((a, b) => a.date.localeCompare(b.date)).map((o) => [o.number, o.date, supplier(o.supplierId), PAYMENT_TERM[o.paymentTerm].label, PO_STATUS[o.status].label, poTotalUsd(o)]),
          },
        ],
      }
    }

    case 'costing': {
      const results = data.shipments.flatMap((s) => {
        const r = computeShipmentResult(data, s.id, 'VALUE')
        return r ? [{ s, r }] : []
      })
      const rows = results.map(({ s, r }) => [
        s.ref, supplier(s.supplierId), SHIPMENT_STATUS[s.status].label, r.cost.goodsLkr, r.cost.bankCharges, r.cost.clearanceTotal, r.cost.totalLanded, r.cost.perUnit,
        r.hasSales ? r.revenue : undefined, r.hasSales ? r.profit : undefined, r.hasSales ? r.marginPercent : undefined, r.cost.isEstimate ? 'Estimate' : 'Final',
      ])
      const sold = results.filter(({ r }) => r.hasSales)
      const revenue = sum(sold.map(({ r }) => r.revenue))
      const profit = sum(sold.map(({ r }) => r.profit))
      return {
        summary: [
          { label: 'Total landed cost', value: sum(results.map(({ r }) => r.cost.totalLanded)), fmt: 'lkr' },
          { label: 'Sales so far', value: revenue, fmt: 'lkr' },
          { label: 'Profit so far', value: profit, fmt: 'lkr' },
          { label: 'Margin on sales', value: revenue > 0 ? (profit / revenue) * 100 : 0, fmt: 'pct' },
        ],
        tables: [
          {
            title: 'Cost and profit per shipment',
            columns: [{ header: 'Shipment' }, { header: 'Supplier' }, { header: 'Status' }, { header: 'Goods', fmt: 'lkr' }, { header: 'Bank charges', fmt: 'lkr' }, { header: 'Clearance', fmt: 'lkr' }, { header: 'Landed cost', fmt: 'lkr' }, { header: 'Per unit', fmt: 'lkr' }, { header: 'Sales', fmt: 'lkr' }, { header: 'Profit', fmt: 'lkr' }, { header: 'Margin', fmt: 'pct' }, { header: 'Basis' }],
            rows,
            totals: ['Total', undefined, undefined, sum(results.map(({ r }) => r.cost.goodsLkr)), sum(results.map(({ r }) => r.cost.bankCharges)), sum(results.map(({ r }) => r.cost.clearanceTotal)), sum(results.map(({ r }) => r.cost.totalLanded)), undefined, revenue, profit, revenue > 0 ? (profit / revenue) * 100 : undefined, undefined],
          },
        ],
      }
    }

    case 'sales': {
      const sales = data.sales.filter((s) => inRange(s.date))
      const total = sum(sales.map(saleTotal))
      const byCustomer = [...groupBy(sales, (s) => s.customerId)]
        .map(([cid, list]) => ({ cid, n: list.length, units: sum(list.flatMap((s) => s.items.map((i) => i.qty))), rev: sum(list.map(saleTotal)) }))
        .sort((a, b) => b.rev - a.rev)
        .map((r) => [customerName(r.cid), data.customers.find((c) => c.id === r.cid)?.district, r.n, r.units, r.rev] as Cell[])
      // Product revenue after spreading each sale's discount over its lines.
      const prod = new Map<string, { qty: number; rev: number }>()
      for (const sale of sales) {
        const sub = saleSubtotal(sale)
        const keep = sub > 0 ? 1 - sale.discount / sub : 1
        for (const i of sale.items) {
          const p = prod.get(i.productId) ?? { qty: 0, rev: 0 }
          prod.set(i.productId, { qty: p.qty + i.qty, rev: p.rev + i.qty * i.unitPrice * keep })
        }
      }
      const byProduct = [...prod].map(([pid, v]) => [product(pid)?.name ?? '—', v.qty, product(pid)?.unit, v.qty > 0 ? v.rev / v.qty : 0, v.rev] as Cell[])
      const byMonth = [...groupBy([...sales].sort((a, b) => a.date.localeCompare(b.date)), (s) => s.date.slice(0, 7))].map(([m, list]) => [monthLabel(m), list.length, sum(list.map(saleTotal))] as Cell[])
      return {
        summary: [
          { label: 'Sales', value: sales.length, fmt: 'int' },
          { label: 'Total sales', value: total, fmt: 'lkr' },
          { label: 'Customers', value: new Set(sales.map((s) => s.customerId)).size, fmt: 'int' },
          { label: 'Average sale', value: sales.length ? total / sales.length : 0, fmt: 'lkr' },
        ],
        tables: [
          { title: 'By customer', columns: [{ header: 'Customer' }, { header: 'District' }, { header: 'Sales', fmt: 'int' }, { header: 'Units', fmt: 'int' }, { header: 'Total', fmt: 'lkr' }], rows: byCustomer, totals: ['Total', undefined, sales.length, sum(sales.flatMap((s) => s.items.map((i) => i.qty))), total] },
          { title: 'By product', columns: [{ header: 'Product' }, { header: 'Units sold', fmt: 'int' }, { header: 'Unit' }, { header: 'Average price', fmt: 'lkr' }, { header: 'Sales', fmt: 'lkr' }], rows: byProduct },
          { title: 'By month', columns: [{ header: 'Month' }, { header: 'Sales', fmt: 'int' }, { header: 'Total', fmt: 'lkr' }], rows: byMonth, totals: ['Total', sales.length, total] },
        ],
      }
    }

    case 'receivables': {
      const owing = data.sales
        .map((s) => ({ s, st: saleStatus(s, data.cheques), age: differenceInCalendarDays(new Date(), parseISO(s.date)) }))
        .filter((r) => r.st.balance > 0)
        .sort((a, b) => b.age - a.age)
      const bucket = (age: number) => (age <= 30 ? '0–30 days' : age <= 60 ? '31–60 days' : 'Over 60 days')
      const buckets = ['0–30 days', '31–60 days', 'Over 60 days']
      const byBucket = buckets.map((b) => [b, owing.filter((r) => bucket(r.age) === b).length, sum(owing.filter((r) => bucket(r.age) === b).map((r) => r.st.balance))] as Cell[])
      const byCustomer = [...groupBy(owing, (r) => r.s.customerId)].map(([cid, list]) => [customerName(cid), list.length, Math.max(...list.map((r) => r.age)), sum(list.map((r) => r.st.balance))] as Cell[])
      return {
        summary: [
          { label: 'Outstanding', value: sum(owing.map((r) => r.st.balance)), fmt: 'lkr' },
          { label: 'Sales owing', value: owing.length, fmt: 'int' },
          { label: 'Customers owing', value: new Set(owing.map((r) => r.s.customerId)).size, fmt: 'int' },
          { label: 'Over 60 days', value: sum(owing.filter((r) => r.age > 60).map((r) => r.st.balance)), fmt: 'lkr' },
        ],
        tables: [
          { title: 'Ageing', columns: [{ header: 'Age' }, { header: 'Sales', fmt: 'int' }, { header: 'Outstanding', fmt: 'lkr' }], rows: byBucket, totals: ['Total', owing.length, sum(owing.map((r) => r.st.balance))] },
          { title: 'By customer', columns: [{ header: 'Customer' }, { header: 'Sales', fmt: 'int' }, { header: 'Oldest (days)', fmt: 'int' }, { header: 'Outstanding', fmt: 'lkr' }], rows: byCustomer },
          {
            title: 'Unpaid sales',
            columns: [{ header: 'Sale' }, { header: 'Date', fmt: 'date' }, { header: 'Customer' }, { header: 'Total', fmt: 'lkr' }, { header: 'Paid', fmt: 'lkr' }, { header: 'Balance', fmt: 'lkr' }, { header: 'Age (days)', fmt: 'int' }, { header: 'Note' }],
            rows: owing.map((r) => [r.s.number, r.s.date, customerName(r.s.customerId), r.st.total, r.st.paid, r.st.balance, r.age, r.st.chequeReturned ? 'Cheque returned' : undefined]),
          },
        ],
      }
    }

    case 'cheques': {
      const list = data.cheques.filter((c) => inRange(c.chequeDate))
      const byStatus = (Object.keys(CHEQUE_STATUS) as (keyof typeof CHEQUE_STATUS)[]).map((st) => {
        const l = list.filter((c) => c.status === st)
        return [CHEQUE_STATUS[st].label, l.length, sum(l.map((c) => c.amount))] as Cell[]
      })
      return {
        summary: [
          { label: 'Cheques', value: list.length, fmt: 'int' },
          { label: 'Total value', value: sum(list.map((c) => c.amount)), fmt: 'lkr' },
          { label: 'Cleared', value: sum(list.filter((c) => c.status === 'CLEARED').map((c) => c.amount)), fmt: 'lkr' },
          { label: 'Returned', value: sum(list.filter((c) => c.status === 'RETURNED').map((c) => c.amount)), fmt: 'lkr' },
        ],
        tables: [
          { title: 'By status', columns: [{ header: 'Status' }, { header: 'Cheques', fmt: 'int' }, { header: 'Amount', fmt: 'lkr' }], rows: byStatus, totals: ['Total', list.length, sum(list.map((c) => c.amount))] },
          {
            title: 'All cheques',
            columns: [{ header: 'Cheque no.' }, { header: 'Customer' }, { header: 'Bank' }, { header: 'Cheque date', fmt: 'date' }, { header: 'Amount', fmt: 'lkr' }, { header: 'Status' }, { header: 'Status date', fmt: 'date' }],
            rows: [...list].sort((a, b) => a.chequeDate.localeCompare(b.chequeDate)).map((c) => [c.number, customerName(c.customerId), `${c.bank}${c.branch ? `, ${c.branch}` : ''}`, c.chequeDate, c.amount, CHEQUE_STATUS[c.status].label, c.statusDate]),
          },
        ],
      }
    }
  }
}

// ---------- CSV ----------

const csvCell = (v: Cell) => {
  if (v === undefined) return ''
  const s = typeof v === 'number' ? String(Math.round(v * 100) / 100) : v
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(table: ReportTable): string {
  const lines = [table.columns.map((c) => csvCell(c.header)).join(','), ...table.rows.map((r) => r.map(csvCell).join(','))]
  if (table.totals) lines.push(table.totals.map(csvCell).join(','))
  return lines.join('\r\n')
}

/** Saves text as a file through the browser (the only "export" this frontend-only prototype needs). */
export function downloadFile(filename: string, content: string, mime = 'text/csv') {
  // BOM so Excel opens UTF-8 CSV correctly.
  const blob = new Blob([mime === 'text/csv' ? '﻿' : '', content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
