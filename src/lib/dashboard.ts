import { addDays, differenceInCalendarDays, format, parseISO, startOfMonth, subMonths } from 'date-fns'
import type { Role } from '../config/roles'
import { DOC_TYPE } from '../config/statuses'
import type { AppData, Shipment } from '../types'
import { lcStatus } from './bank'
import { poTotalUsd, saleTotal, stockRemaining } from './calc'
import { clearanceStatus } from './clearance'
import { computeShipmentResult } from './costing'
import { daysFromToday, formatLkr, formatUsd, todayISO } from './format'
import { saleStatus } from './sales'
import { hasArrived, hasShipped } from './shipments'
import { stockUnitCosts } from './stock'

export type AlertLevel = 'high' | 'medium' | 'info'

export interface Alert {
  id: string
  level: AlertLevel
  text: string
  to: string
  /** Roles that should act on this alert and can open its screen (the owner sees everything). */
  roles: Role[]
}

const LEVEL_ORDER: Record<AlertLevel, number> = { high: 0, medium: 1, info: 2 }

export interface Dashboard {
  inTransit: Shipment[]
  arrivingSoon: Shipment[]
  awaitingBank: Shipment[]
  withAgent: number
  readyToHandOver: Shipment[]
  readyToReceive: Shipment[]
  stockValue: number
  stockLines: number
  receivables: number
  owingCustomers: number
  chequesDue: { count: number; total: number }
  pendingPayments: { count: number; usd: number }
  ordersAwaitingInvoice: number
  salesThisMonth: number
  profit: number
  revenue: number
  stageCounts: Record<string, number>
  upcoming: Shipment[]
  alerts: Alert[]
  months: { key: string; label: string; purchasesUsd: number; salesLkr: number }[]
  profitByShipment: { shipment: string; profit: number }[]
}

export function computeDashboard(data: AppData): Dashboard {
  const today = todayISO()
  const weekAhead = format(addDays(new Date(), 7), 'yyyy-MM-dd')
  const supplier = (id: string) => data.suppliers.find((s) => s.id === id)?.name ?? 'supplier'
  const customer = (id: string) => {
    const c = data.customers.find((x) => x.id === id)
    return c?.business || c?.name || 'customer'
  }

  // ---- Shipments ----
  const inTransit = data.shipments.filter((s) => hasShipped(s.status) && !hasArrived(s.status))
  const arrivingSoon = inTransit.filter((s) => s.eta && s.eta <= weekAhead)
  const awaitingBank = data.shipments.filter((s) => s.status === 'ARRIVED')
  const hasClearance = (id: string) => data.clearances.some((c) => c.shipmentId === id)
  const readyToHandOver = data.shipments.filter((s) => s.status === 'BANK_DOCS_COLLECTED' && !hasClearance(s.id))
  const readyToReceive = data.shipments.filter((s) => s.status === 'RELEASED' && !data.stockItems.some((i) => i.shipmentId === s.id))
  const withAgent = data.clearances.filter((c) => !c.releaseDate).length

  // ---- Money ----
  const unitCosts = stockUnitCosts(data)
  const stockValue = data.stockItems.reduce((sum, i) => sum + stockRemaining(i) * (unitCosts.get(i.id) ?? 0), 0)
  const stockLines = data.stockItems.filter((i) => stockRemaining(i) > 0).length
  const statuses = data.sales.map((s) => saleStatus(s, data.cheques))
  const receivables = statuses.reduce((sum, s) => sum + s.balance, 0)
  const owingCustomers = new Set(data.sales.filter((_, i) => statuses[i].balance > 0).map((s) => s.customerId)).size
  const due = data.cheques.filter((c) => c.status === 'PENDING' && c.chequeDate <= weekAhead)
  const pending = data.bankPayments.filter((p) => p.status === 'PENDING')
  const month = today.slice(0, 7)

  const results = data.shipments.flatMap((s) => {
    const r = computeShipmentResult(data, s.id, 'VALUE')
    return r && r.hasSales ? [{ ref: s.ref, ...r }] : []
  })

  // ---- Pipeline ----
  const stageCounts: Record<string, number> = {}
  const stageOf: Record<string, string> = {
    PO_ISSUED: 'ordering', INVOICE_RECEIVED: 'ordering', ADVANCE_PAID: 'ordering',
    SHIPPED: 'water', IN_TRANSIT: 'water',
    ARRIVED: 'bank', BANK_DOCS_COLLECTED: 'bank',
    WITH_CLEARING_AGENT: 'clearance', RELEASED: 'clearance',
    IN_WAREHOUSE: 'selling', PARTLY_SOLD: 'selling',
    SOLD_FULL_CONTAINER: 'done', FULLY_SOLD: 'done', CLOSED: 'done',
  }
  data.shipments.forEach((s) => (stageCounts[stageOf[s.status]] = (stageCounts[stageOf[s.status]] ?? 0) + 1))

  // ---- Alerts ----
  const alerts: Alert[] = []
  const push = (a: Alert) => alerts.push(a)

  for (const p of data.bankPayments) {
    const lc = lcStatus(p)
    if (lc?.urgent) {
      const ref = data.shipments.find((s) => s.id === p.shipmentId)?.ref
      push({ id: `lc-${p.id}`, level: 'high', roles: ['FINANCE'], to: `/bank/${p.id}`, text: `LC ${p.lcNumber} (${ref}) — ${lc.label.toLowerCase()}. Collect the documents before it lapses.` })
    }
  }
  for (const s of inTransit) {
    if (s.eta && s.eta < today) {
      push({ id: `late-${s.id}`, level: 'high', roles: ['LOGISTICS', 'PURCHASING'], to: `/shipments/${s.id}`, text: `${s.ref} (${s.vessel || 'no vessel'}) is ${-daysFromToday(s.eta)} days past its ETA and has not arrived.` })
    }
  }
  for (const c of data.clearances) {
    const st = clearanceStatus(c)
    if (st.delayed) {
      const ref = data.shipments.find((s) => s.id === c.shipmentId)?.ref
      push({ id: `clr-${c.id}`, level: 'high', roles: ['LOGISTICS', 'FINANCE'], to: `/clearance/${c.id}`, text: `${ref} has been with ${c.clearingCompany} for ${st.days} days and is not released.` })
    }
  }
  for (const c of data.cheques) {
    if (c.status === 'RETURNED') {
      push({ id: `chq-r-${c.id}`, level: 'high', roles: ['FINANCE', 'SALES'], to: '/cheques', text: `Cheque ${c.number} from ${customer(c.customerId)} (${formatLkr(c.amount)}) was returned — collect payment another way or deposit it again.` })
    }
  }
  for (const s of awaitingBank) {
    const pay = data.bankPayments.find((p) => p.shipmentId === s.id && p.kind === 'DOCUMENTS' && p.status === 'PENDING')
    push({
      id: `bank-${s.id}`, level: 'medium', roles: ['FINANCE'],
      to: pay ? `/bank/${pay.id}/edit?pay=1` : `/bank/new?shipment=${s.id}`,
      text: `${s.ref} has arrived — pay the bank${pay ? ` (${formatUsd(pay.amountUsd)} at ${pay.bank})` : ''} to collect the original documents.`,
    })
  }
  for (const s of readyToHandOver) {
    push({ id: `hand-${s.id}`, level: 'medium', roles: ['LOGISTICS'], to: `/clearance/new?shipment=${s.id}`, text: `${s.ref} has its bank documents — hand it to a clearing agent.` })
  }
  for (const s of readyToReceive) {
    push({ id: `recv-${s.id}`, level: 'medium', roles: ['WAREHOUSE'], to: `/warehouse?receive=${s.id}`, text: `${s.ref} was released by Customs — receive it into a warehouse.` })
  }
  for (const c of data.cheques) {
    if (c.status === 'PENDING' && c.chequeDate <= today) {
      push({ id: `chq-d-${c.id}`, level: 'medium', roles: ['FINANCE', 'SALES'], to: '/cheques', text: `Cheque ${c.number} from ${customer(c.customerId)} (${formatLkr(c.amount)}) can be deposited now.` })
    }
    if (c.status === 'DEPOSITED' && c.statusDate && differenceInCalendarDays(new Date(), parseISO(c.statusDate)) >= 3) {
      push({ id: `chq-s-${c.id}`, level: 'medium', roles: ['FINANCE'], to: '/cheques', text: `Cheque ${c.number} (${customer(c.customerId)}) was deposited on ${c.statusDate} and has not cleared yet.` })
    }
  }
  for (const s of data.shipments) {
    if (!hasShipped(s.status) || s.status === 'CLOSED') continue
    const missing = s.documents.filter((d) => d.state === 'MISSING').map((d) => DOC_TYPE[d.type])
    if (missing.length) {
      push({ id: `docs-${s.id}`, level: 'medium', roles: ['LOGISTICS'], to: `/shipments/${s.id}`, text: `${s.ref} is missing: ${missing.join(', ')}.` })
    }
  }
  for (const inv of data.invoices) {
    const po = data.purchaseOrders.find((o) => o.id === inv.poId)
    if (po && Math.abs(inv.amountUsd - poTotalUsd(po)) > 0.005) {
      push({ id: `inv-${inv.id}`, level: 'medium', roles: ['PURCHASING', 'FINANCE'], to: `/invoices/${inv.id}`, text: `Invoice ${inv.number} from ${supplier(po.supplierId)} differs from order ${po.number} by ${formatUsd(Math.abs(inv.amountUsd - poTotalUsd(po)))}.` })
    }
  }
  for (const o of data.purchaseOrders) {
    const waiting = o.status === 'ISSUED' ? differenceInCalendarDays(new Date(), parseISO(o.date)) : 0
    if (waiting > 7) {
      push({ id: `po-${o.id}`, level: 'info', roles: ['PURCHASING'], to: `/purchase-orders/${o.id}`, text: `${o.number} was issued ${waiting} days ago and has no supplier invoice yet.` })
    }
  }
  alerts.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level])

  // ---- Monthly series (last 6 months) ----
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = startOfMonth(subMonths(new Date(), 5 - i))
    return { key: format(d, 'yyyy-MM'), label: format(d, 'MMM'), purchasesUsd: 0, salesLkr: 0 }
  })
  for (const o of data.purchaseOrders) {
    if (o.status === 'CANCELLED' || o.status === 'DRAFT') continue
    const m = months.find((x) => x.key === o.date.slice(0, 7))
    if (m) m.purchasesUsd += poTotalUsd(o)
  }
  for (const s of data.sales) {
    const m = months.find((x) => x.key === s.date.slice(0, 7))
    if (m) m.salesLkr += saleTotal(s)
  }

  return {
    inTransit,
    arrivingSoon,
    awaitingBank,
    withAgent,
    readyToHandOver,
    readyToReceive,
    stockValue,
    stockLines,
    receivables,
    owingCustomers,
    chequesDue: { count: due.length, total: due.reduce((s, c) => s + c.amount, 0) },
    pendingPayments: { count: pending.length, usd: pending.reduce((s, p) => s + p.amountUsd, 0) },
    ordersAwaitingInvoice: data.purchaseOrders.filter((o) => o.status === 'ISSUED').length,
    salesThisMonth: data.sales.filter((s) => s.date.slice(0, 7) === month).reduce((sum, s) => sum + saleTotal(s), 0),
    profit: results.reduce((s, r) => s + r.profit, 0),
    revenue: results.reduce((s, r) => s + r.revenue, 0),
    stageCounts,
    upcoming: [...inTransit].sort((a, b) => (a.eta ?? '9999').localeCompare(b.eta ?? '9999')),
    alerts,
    months,
    // Not named `ref`: chart libraries pass row fields to elements as props, and `ref` is special in React.
    profitByShipment: results.map((r) => ({ shipment: r.ref, profit: Math.round(r.profit) })),
  }
}
