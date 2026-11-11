import type { Role } from './config/roles'

/** ISO date string, YYYY-MM-DD. */
export type ISODate = string

export type PaymentTerm = 'TT' | 'LC' | 'DP' | 'ADVANCE'
export type Incoterm = 'EXW' | 'FCA' | 'FOB' | 'CFR' | 'CIF'
export type OrderKind = 'PO' | 'LOI'
export type POStatus = 'DRAFT' | 'ISSUED' | 'INVOICED' | 'SHIPPED' | 'CANCELLED'

export type ShipmentStatus =
  | 'PO_ISSUED'
  | 'INVOICE_RECEIVED'
  | 'ADVANCE_PAID'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'BANK_DOCS_COLLECTED'
  | 'WITH_CLEARING_AGENT'
  | 'RELEASED'
  | 'IN_WAREHOUSE'
  | 'PARTLY_SOLD'
  | 'SOLD_FULL_CONTAINER'
  | 'FULLY_SOLD'
  | 'CLOSED'

export type DocType = 'BL' | 'INVOICE' | 'PACKING_LIST' | 'CERT_OF_ORIGIN' | 'INSURANCE'
export type DocState = 'MISSING' | 'COPY_RECEIVED' | 'ORIGINAL_AT_BANK' | 'ORIGINAL_RECEIVED'
export type ContainerSize = '20FT' | '40FT' | '40HC'
export type LoadType = 'FCL' | 'LCL'

export type BankPaymentKind = 'ADVANCE' | 'DOCUMENTS'
export type BankPaymentStatus = 'PENDING' | 'PAID'

export type SaleType = 'FULL_CONTAINER' | 'WAREHOUSE'
export type PaymentMethod = 'CASH' | 'CHEQUE' | 'CREDIT'
export type ChequeStatus = 'PENDING' | 'DEPOSITED' | 'CLEARED' | 'RETURNED'
export type StockMoveType = 'RECEIVED' | 'SOLD' | 'ADJUSTED'

/** File metadata only — the file itself is never stored (frontend prototype). */
export interface Attachment {
  id: string
  name: string
  size: number
  addedAt: ISODate
}

export interface NegotiationNote {
  id: string
  date: ISODate
  text: string
  role: Role
}

export interface Supplier {
  id: string
  name: string
  country: string
  city: string
  contactPerson: string
  whatsapp: string
  email: string
  address: string
  usualTerm: PaymentTerm
  productsSupplied: string
  notes: NegotiationNote[]
}

export interface Product {
  id: string
  name: string
  hsCode: string
  unit: string
}

export interface POItem {
  productId: string
  qty: number
  unitPriceUsd: number
}

export interface PurchaseOrder {
  id: string
  kind: OrderKind
  number: string
  date: ISODate
  supplierId: string
  items: POItem[]
  incoterm: Incoterm
  paymentTerm: PaymentTerm
  /** Advance percentage when the supplier asks for part payment before shipping. */
  advancePercent: number
  conditions: string
  expectedShipDate: ISODate
  status: POStatus
}

export interface SupplierInvoice {
  id: string
  number: string
  date: ISODate
  poId: string
  amountUsd: number
  contractNumber: string
  paymentTerm: PaymentTerm
  advanceAmountUsd: number
  advanceDate?: ISODate
  notes: string
  attachments: Attachment[]
}

export interface ShipmentContainer {
  number: string
  size: ContainerSize
}

export interface ShipmentDocument {
  type: DocType
  state: DocState
  fileName?: string
}

export interface TimelineEntry {
  date: ISODate
  status: ShipmentStatus
  role: Role
  note?: string
}

export interface Shipment {
  id: string
  ref: string
  poId: string
  invoiceId?: string
  supplierId: string
  vessel: string
  voyage: string
  shippingLine: string
  blNumber: string
  loadingPort: string
  dischargePort: string
  etd?: ISODate
  eta?: ISODate
  loadType: LoadType
  containers: ShipmentContainer[]
  documents: ShipmentDocument[]
  status: ShipmentStatus
  timeline: TimelineEntry[]
}

export interface BankPayment {
  id: string
  shipmentId: string
  kind: BankPaymentKind
  term: PaymentTerm
  bank: string
  lcNumber: string
  lcOpenDate?: ISODate
  lcExpiry?: ISODate
  amountUsd: number
  /** LKR per 1 USD on the payment date. */
  exchangeRate: number
  docCharges: number
  commission: number
  otherCharges: number
  paidDate?: ISODate
  docsCollectedDate?: ISODate
  status: BankPaymentStatus
}

/** Optional split of the customs duties & taxes, as listed on the clearing agent's bill (all LKR). */
export interface DutyBreakdown {
  /** Customs Import Duty (CID). */
  cid: number
  /** Port and Airport Development Levy (PAL). */
  pal: number
  vat: number
  /** Social Security Contribution Levy (SSCL). */
  sscl: number
  cess: number
  /** Excise, surcharge or anything else on the bill. */
  other: number
}

export interface Clearance {
  id: string
  shipmentId: string
  clearingCompany: string
  handoverDate: ISODate
  cusdecNumber: string
  /** Customs duties & taxes in LKR, entered from the clearing agent's bill. */
  duties: number
  dutyBreakdown?: DutyBreakdown
  portCharges: number
  transport: number
  agentFee: number
  otherCharges: number
  releaseDate?: ISODate
  attachments: Attachment[]
}

export interface StockItem {
  id: string
  shipmentId: string
  productId: string
  warehouse: string
  qtyReceived: number
  qtySold: number
  qtyAdjusted: number
  receivedDate: ISODate
}

export interface StockMovement {
  id: string
  stockItemId: string
  date: ISODate
  type: StockMoveType
  /** Positive for stock in, negative for stock out. */
  qty: number
  note: string
}

export interface Customer {
  id: string
  name: string
  business: string
  phone: string
  email: string
  address: string
  city: string
  /** One of Sri Lanka's 25 districts. */
  district: string
}

export interface SaleItem {
  productId: string
  stockItemId?: string
  qty: number
  unitPrice: number
}

export interface SalePayment {
  id: string
  date: ISODate
  method: 'CASH' | 'CHEQUE'
  amount: number
  chequeId?: string
}

export interface Sale {
  id: string
  number: string
  date: ISODate
  type: SaleType
  customerId: string
  /** Set for full-container sales; warehouse sales link through stock items. */
  shipmentId?: string
  items: SaleItem[]
  discount: number
  paymentMethod: PaymentMethod
  payments: SalePayment[]
  notes: string
}

/** One step in a cheque's life, newest last. */
export interface ChequeEvent {
  status: ChequeStatus
  date: ISODate
  note?: string
}

export interface Cheque {
  id: string
  saleId: string
  customerId: string
  number: string
  bank: string
  branch: string
  amount: number
  chequeDate: ISODate
  status: ChequeStatus
  statusDate?: ISODate
  /** Deposit / clearance / return steps. Older records may not have it. */
  history?: ChequeEvent[]
}

export interface CompanyProfile {
  name: string
  /** Taxpayer Identification Number (Inland Revenue Department). */
  tin: string
  vatNo: string
  address: string
  phone: string
  email: string
}

export interface Settings {
  company: CompanyProfile
  banks: string[]
  ports: string[]
  shippingLines: string[]
  clearingCompanies: string[]
  warehouses: string[]
  units: string[]
  /** Default LKR per USD used when no bank rate is recorded yet. */
  exchangeRate: number
  targetMarginPercent: number
}

export interface AppData {
  suppliers: Supplier[]
  products: Product[]
  purchaseOrders: PurchaseOrder[]
  invoices: SupplierInvoice[]
  shipments: Shipment[]
  bankPayments: BankPayment[]
  clearances: Clearance[]
  stockItems: StockItem[]
  stockMovements: StockMovement[]
  customers: Customer[]
  sales: Sale[]
  cheques: Cheque[]
  settings: Settings
}

export type CollectionKey = Exclude<keyof AppData, 'settings'>
export type EntityOf<K extends CollectionKey> = AppData[K][number]
