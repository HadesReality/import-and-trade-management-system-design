import type {
  BankPaymentStatus,
  ChequeStatus,
  DocState,
  DocType,
  PaymentMethod,
  PaymentTerm,
  POStatus,
  SaleType,
  ShipmentStatus,
} from '../types'

export type Tone = 'gray' | 'blue' | 'indigo' | 'teal' | 'green' | 'amber' | 'orange' | 'red' | 'purple'

export interface StatusMeta {
  label: string
  tone: Tone
}

/** Shipment statuses in lifecycle order (DOCUMENT.md §5). */
export const SHIPMENT_STATUS_ORDER: ShipmentStatus[] = [
  'PO_ISSUED',
  'INVOICE_RECEIVED',
  'ADVANCE_PAID',
  'SHIPPED',
  'IN_TRANSIT',
  'ARRIVED',
  'BANK_DOCS_COLLECTED',
  'WITH_CLEARING_AGENT',
  'RELEASED',
  'IN_WAREHOUSE',
  'PARTLY_SOLD',
  'SOLD_FULL_CONTAINER',
  'FULLY_SOLD',
  'CLOSED',
]

export const SHIPMENT_STATUS: Record<ShipmentStatus, StatusMeta> = {
  PO_ISSUED: { label: 'PO / LOI Issued', tone: 'gray' },
  INVOICE_RECEIVED: { label: 'Invoice Received', tone: 'gray' },
  ADVANCE_PAID: { label: 'Advance Paid', tone: 'indigo' },
  SHIPPED: { label: 'Loaded / Shipped', tone: 'blue' },
  IN_TRANSIT: { label: 'In Transit', tone: 'blue' },
  ARRIVED: { label: 'Arrived in Sri Lanka', tone: 'amber' },
  BANK_DOCS_COLLECTED: { label: 'Bank Docs Collected', tone: 'orange' },
  WITH_CLEARING_AGENT: { label: 'With Clearing Agent', tone: 'purple' },
  RELEASED: { label: 'Cleared & Released', tone: 'teal' },
  IN_WAREHOUSE: { label: 'In Warehouse', tone: 'teal' },
  PARTLY_SOLD: { label: 'Partly Sold', tone: 'green' },
  SOLD_FULL_CONTAINER: { label: 'Sold as Full Container', tone: 'green' },
  FULLY_SOLD: { label: 'Fully Sold', tone: 'green' },
  CLOSED: { label: 'Closed', tone: 'gray' },
}

/** Kanban columns on the shipments board. */
export const SHIPMENT_STAGES: { id: string; label: string; statuses: ShipmentStatus[] }[] = [
  { id: 'ordering', label: 'Ordering', statuses: ['PO_ISSUED', 'INVOICE_RECEIVED', 'ADVANCE_PAID'] },
  { id: 'water', label: 'On the Water', statuses: ['SHIPPED', 'IN_TRANSIT'] },
  { id: 'bank', label: 'Arrived & Bank', statuses: ['ARRIVED', 'BANK_DOCS_COLLECTED'] },
  { id: 'clearance', label: 'Clearance', statuses: ['WITH_CLEARING_AGENT', 'RELEASED'] },
  { id: 'selling', label: 'Selling', statuses: ['IN_WAREHOUSE', 'PARTLY_SOLD'] },
  { id: 'done', label: 'Completed', statuses: ['SOLD_FULL_CONTAINER', 'FULLY_SOLD', 'CLOSED'] },
]

export const PO_STATUS: Record<POStatus, StatusMeta> = {
  DRAFT: { label: 'Draft', tone: 'gray' },
  ISSUED: { label: 'Issued', tone: 'blue' },
  INVOICED: { label: 'Invoiced', tone: 'indigo' },
  SHIPPED: { label: 'Shipped', tone: 'green' },
  CANCELLED: { label: 'Cancelled', tone: 'red' },
}

export const PAYMENT_TERM: Record<PaymentTerm, StatusMeta & { full: string }> = {
  TT: { label: 'TT', full: 'Telegraphic Transfer', tone: 'blue' },
  LC: { label: 'LC', full: 'Letter of Credit', tone: 'purple' },
  DP: { label: 'DP', full: 'Documents against Payment', tone: 'teal' },
  ADVANCE: { label: 'Advance', full: 'Advance Payment', tone: 'amber' },
}

export const DOC_TYPE: Record<DocType, string> = {
  BL: 'Bill of Lading',
  INVOICE: 'Commercial Invoice',
  PACKING_LIST: 'Packing List',
  CERT_OF_ORIGIN: 'Certificate of Origin',
  INSURANCE: 'Insurance Certificate',
}

export const DOC_STATE: Record<DocState, StatusMeta> = {
  MISSING: { label: 'Missing', tone: 'red' },
  COPY_RECEIVED: { label: 'Copy Received', tone: 'amber' },
  ORIGINAL_AT_BANK: { label: 'Original at Bank', tone: 'blue' },
  ORIGINAL_RECEIVED: { label: 'Original Received', tone: 'green' },
}

export const BANK_PAYMENT_STATUS: Record<BankPaymentStatus, StatusMeta> = {
  PENDING: { label: 'Pending', tone: 'amber' },
  PAID: { label: 'Paid', tone: 'green' },
}

export const CHEQUE_STATUS: Record<ChequeStatus, StatusMeta> = {
  PENDING: { label: 'Pending', tone: 'amber' },
  DEPOSITED: { label: 'Deposited', tone: 'blue' },
  CLEARED: { label: 'Cleared', tone: 'green' },
  RETURNED: { label: 'Returned', tone: 'red' },
}

export const SALE_TYPE: Record<SaleType, StatusMeta> = {
  FULL_CONTAINER: { label: 'Full Container', tone: 'purple' },
  WAREHOUSE: { label: 'Warehouse', tone: 'teal' },
}

export const PAYMENT_METHOD: Record<PaymentMethod, StatusMeta> = {
  CASH: { label: 'Cash', tone: 'green' },
  CHEQUE: { label: 'Cheque', tone: 'blue' },
  CREDIT: { label: 'Credit', tone: 'amber' },
}
