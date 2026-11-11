import { addDays, differenceInCalendarDays, format, parseISO, startOfDay } from 'date-fns'
import type {
  AppData,
  BankPayment,
  Cheque,
  Clearance,
  Customer,
  DocState,
  Product,
  PurchaseOrder,
  Sale,
  Shipment,
  ShipmentDocument,
  ShipmentStatus,
  StockItem,
  StockMovement,
  Supplier,
  SupplierInvoice,
  TimelineEntry,
} from '../types'
import type { Role } from '../config/roles'

/**
 * Seed dates are written against this "demo day" and shifted so the data always looks current
 * (arrivals stay a few days away, LCs about to expire, cheques due this week, and so on).
 */
const ANCHOR = new Date(2026, 10, 11)
const SHIFT = differenceInCalendarDays(startOfDay(new Date()), ANCHOR)
const D = (iso: string) => format(addDays(parseISO(iso), SHIFT), 'yyyy-MM-dd')

const T = (date: string, status: ShipmentStatus, role: Role, note?: string): TimelineEntry => ({
  date: D(date),
  status,
  role,
  note,
})

const docs = (bl: DocState, inv: DocState, pl: DocState, coo: DocState, ins: DocState): ShipmentDocument[] => [
  { type: 'BL', state: bl },
  { type: 'INVOICE', state: inv },
  { type: 'PACKING_LIST', state: pl },
  { type: 'CERT_OF_ORIGIN', state: coo },
  { type: 'INSURANCE', state: ins },
]

const products: Product[] = [
  { id: 'prd-tile', name: 'Porcelain Floor Tiles 60×60', hsCode: '6907.21', unit: 'Box' },
  { id: 'prd-ply', name: 'Plywood 18mm (Marine Grade)', hsCode: '4412.33', unit: 'Sheet' },
  { id: 'prd-steel', name: 'Stainless Steel Sheets 304', hsCode: '7219.31', unit: 'MT' },
  { id: 'prd-led', name: 'LED Panel Lights 24W', hsCode: '9405.42', unit: 'Piece' },
  { id: 'prd-pvc', name: 'PVC Pipes 110mm', hsCode: '3917.23', unit: 'Piece' },
  { id: 'prd-fan', name: 'Ceiling Fans 56"', hsCode: '8414.51', unit: 'Piece' },
]

const suppliers: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Guangdong Hengli Building Materials Co.',
    country: 'China',
    city: 'Foshan',
    contactPerson: 'Mr. Wei Zhang',
    whatsapp: '+86 138 0013 8000',
    email: 'wei.zhang@hengli-bm.example',
    address: 'No. 18 Jihua Road, Chancheng District, Foshan, Guangdong',
    usualTerm: 'TT',
    productsSupplied: 'Porcelain tiles, PVC pipes and fittings',
    notes: [
      { id: 'n-1', date: D('2026-07-22'), role: 'PURCHASING', text: 'Agreed USD 8.50/box FOB Shenzhen for 1,600 boxes. 30% advance, balance against BL copy.' },
      { id: 'n-2', date: D('2026-10-20'), role: 'PURCHASING', text: 'New quote: tiles USD 8.40/box and PVC USD 1.15/pc. Wants 30% advance again.' },
    ],
  },
  {
    id: 'sup-2',
    name: 'Saigon Wood Industries JSC',
    country: 'Vietnam',
    city: 'Ho Chi Minh City',
    contactPerson: 'Ms. Linh Nguyen',
    whatsapp: '+84 90 123 4567',
    email: 'linh@saigonwood.example',
    address: '45 Nguyen Van Linh, District 7, Ho Chi Minh City',
    usualTerm: 'LC',
    productsSupplied: 'Plywood, veneer, hardwood boards',
    notes: [
      { id: 'n-3', date: D('2026-08-28'), role: 'PURCHASING', text: 'Prefers irrevocable LC at sight. Price firm at USD 21.50/sheet for 640 sheets.' },
    ],
  },
  {
    id: 'sup-3',
    name: 'Mumbai Steel Traders Pvt Ltd',
    country: 'India',
    city: 'Mumbai',
    contactPerson: 'Mr. Rakesh Mehta',
    whatsapp: '+91 98200 12345',
    email: 'rakesh@mumbaisteel.example',
    address: 'Plot 12, MIDC Andheri East, Mumbai 400093',
    usualTerm: 'DP',
    productsSupplied: 'Stainless steel sheets and coils',
    notes: [{ id: 'n-4', date: D('2026-09-15'), role: 'PURCHASING', text: 'Documents against payment at HNB. USD 2,350/MT for 24 MT, 304 grade.' }],
  },
  {
    id: 'sup-4',
    name: 'Shenzhen BrightLite Technology Co.',
    country: 'China',
    city: 'Shenzhen',
    contactPerson: 'Ms. Amy Chen',
    whatsapp: '+86 139 2500 1122',
    email: 'amy@brightlite.example',
    address: 'Block B, Longhua Industrial Park, Shenzhen',
    usualTerm: 'TT',
    productsSupplied: 'LED lighting, ceiling fans, electrical fittings',
    notes: [
      { id: 'n-5', date: D('2026-06-05'), role: 'PURCHASING', text: 'Fans at USD 14.20 each, 1,100 pcs. 30% advance.' },
      { id: 'n-6', date: D('2026-09-28'), role: 'PURCHASING', text: 'LED panels USD 2.35 each for 12,000 pcs, 30% advance via TT.' },
    ],
  },
]

const purchaseOrders: PurchaseOrder[] = [
  {
    id: 'po-1', kind: 'PO', number: 'PO-2026-001', date: D('2026-08-01'), supplierId: 'sup-1',
    items: [{ productId: 'prd-tile', qty: 1600, unitPriceUsd: 8.5 }],
    incoterm: 'FOB', paymentTerm: 'TT', advancePercent: 30,
    conditions: 'Loading within 30 days of advance. Grade A only, 5% breakage allowance.',
    expectedShipDate: D('2026-09-10'), status: 'SHIPPED',
  },
  {
    id: 'po-2', kind: 'PO', number: 'PO-2026-002', date: D('2026-09-05'), supplierId: 'sup-2',
    items: [{ productId: 'prd-ply', qty: 640, unitPriceUsd: 21.5 }],
    incoterm: 'FOB', paymentTerm: 'LC', advancePercent: 0,
    conditions: 'Irrevocable LC at sight. Latest shipment date 15 Oct.',
    expectedShipDate: D('2026-10-05'), status: 'SHIPPED',
  },
  {
    id: 'po-3', kind: 'PO', number: 'PO-2026-003', date: D('2026-09-20'), supplierId: 'sup-3',
    items: [{ productId: 'prd-steel', qty: 24, unitPriceUsd: 2350 }],
    incoterm: 'CFR', paymentTerm: 'DP', advancePercent: 0,
    conditions: 'Mill test certificate required with documents.',
    expectedShipDate: D('2026-10-12'), status: 'SHIPPED',
  },
  {
    id: 'po-4', kind: 'PO', number: 'PO-2026-004', date: D('2026-10-02'), supplierId: 'sup-4',
    items: [{ productId: 'prd-led', qty: 12000, unitPriceUsd: 2.35 }],
    incoterm: 'FOB', paymentTerm: 'TT', advancePercent: 30,
    conditions: '2-year warranty. Individual carton packing.',
    expectedShipDate: D('2026-10-28'), status: 'SHIPPED',
  },
  {
    id: 'po-5', kind: 'PO', number: 'PO-2026-005', date: D('2026-10-25'), supplierId: 'sup-1',
    items: [
      { productId: 'prd-tile', qty: 1000, unitPriceUsd: 8.4 },
      { productId: 'prd-pvc', qty: 6000, unitPriceUsd: 1.15 },
    ],
    incoterm: 'FOB', paymentTerm: 'TT', advancePercent: 30,
    conditions: 'Mixed container. Ship within 3 weeks of advance.',
    expectedShipDate: D('2026-11-20'), status: 'INVOICED',
  },
  {
    id: 'po-6', kind: 'PO', number: 'PO-2026-006', date: D('2026-06-10'), supplierId: 'sup-4',
    items: [{ productId: 'prd-fan', qty: 1100, unitPriceUsd: 14.2 }],
    incoterm: 'FOB', paymentTerm: 'TT', advancePercent: 30,
    conditions: 'Remote control included. Copper winding.',
    expectedShipDate: D('2026-07-05'), status: 'SHIPPED',
  },
  {
    id: 'po-7', kind: 'LOI', number: 'LOI-2026-007', date: D('2026-11-09'), supplierId: 'sup-2',
    items: [{ productId: 'prd-ply', qty: 800, unitPriceUsd: 21.8 }],
    incoterm: 'FOB', paymentTerm: 'LC', advancePercent: 0,
    conditions: 'Letter of intent while price and LC terms are being finalised.',
    expectedShipDate: D('2026-12-15'), status: 'ISSUED',
  },
]

const invoices: SupplierInvoice[] = [
  { id: 'inv-1', number: 'HL-INV-26-0815', date: D('2026-08-05'), poId: 'po-1', amountUsd: 13600, contractNumber: 'HL-SC-26-044', paymentTerm: 'TT', advanceAmountUsd: 4080, advanceDate: D('2026-08-10'), notes: '', attachments: [{ id: 'att-1', name: 'HL-INV-26-0815.pdf', size: 184320, addedAt: D('2026-08-05') }] },
  { id: 'inv-2', number: 'SW-2026-1190', date: D('2026-09-10'), poId: 'po-2', amountUsd: 13760, contractNumber: '', paymentTerm: 'LC', advanceAmountUsd: 0, notes: 'LC to be opened by Sampath Bank.', attachments: [] },
  { id: 'inv-3', number: 'MST/EXP/26/0932', date: D('2026-09-25'), poId: 'po-3', amountUsd: 56400, contractNumber: 'MST-SC-26-17', paymentTerm: 'DP', advanceAmountUsd: 0, notes: '', attachments: [] },
  { id: 'inv-4', number: 'BL-26-4471', date: D('2026-10-06'), poId: 'po-4', amountUsd: 28500, contractNumber: '', paymentTerm: 'TT', advanceAmountUsd: 8460, advanceDate: D('2026-10-10'), notes: 'Invoice is USD 300 higher than the PO — supplier says extra packing. Needs checking.', attachments: [] },
  { id: 'inv-5', number: 'HL-INV-26-1028', date: D('2026-10-28'), poId: 'po-5', amountUsd: 15300, contractNumber: 'HL-SC-26-071', paymentTerm: 'TT', advanceAmountUsd: 4590, advanceDate: D('2026-11-03'), notes: '', attachments: [] },
  { id: 'inv-6', number: 'BL-26-2218', date: D('2026-06-18'), poId: 'po-6', amountUsd: 15620, contractNumber: '', paymentTerm: 'TT', advanceAmountUsd: 4686, advanceDate: D('2026-06-12'), notes: '', attachments: [] },
]

const shipments: Shipment[] = [
  {
    id: 'shp-1', ref: 'SHP-2026-001', poId: 'po-1', invoiceId: 'inv-1', supplierId: 'sup-1',
    vessel: 'MAERSK KOLKATA', voyage: '438E', shippingLine: 'Maersk', blNumber: 'MAEU254318976',
    loadingPort: 'Shenzhen (Yantian)', dischargePort: 'Colombo', etd: D('2026-09-10'), eta: D('2026-10-02'),
    loadType: 'FCL', containers: [{ number: 'MSKU6841275', size: '40HC' }],
    documents: docs('ORIGINAL_RECEIVED', 'ORIGINAL_RECEIVED', 'ORIGINAL_RECEIVED', 'ORIGINAL_RECEIVED', 'MISSING'),
    status: 'PARTLY_SOLD',
    timeline: [
      T('2026-08-01', 'PO_ISSUED', 'PURCHASING'),
      T('2026-08-05', 'INVOICE_RECEIVED', 'PURCHASING'),
      T('2026-08-10', 'ADVANCE_PAID', 'FINANCE', '30% advance by TT'),
      T('2026-09-10', 'SHIPPED', 'LOGISTICS', 'Loaded on MAERSK KOLKATA'),
      T('2026-09-12', 'IN_TRANSIT', 'LOGISTICS'),
      T('2026-10-02', 'ARRIVED', 'LOGISTICS'),
      T('2026-10-05', 'BANK_DOCS_COLLECTED', 'FINANCE', 'Balance paid, originals collected'),
      T('2026-10-06', 'WITH_CLEARING_AGENT', 'LOGISTICS', 'Handed to Ceylon Logistics Services'),
      T('2026-10-14', 'RELEASED', 'LOGISTICS'),
      T('2026-10-16', 'IN_WAREHOUSE', 'WAREHOUSE', 'Received 1,600 boxes'),
      T('2026-10-22', 'PARTLY_SOLD', 'SALES'),
    ],
  },
  {
    id: 'shp-2', ref: 'SHP-2026-002', poId: 'po-2', invoiceId: 'inv-2', supplierId: 'sup-2',
    vessel: 'COSCO PRIDE', voyage: '051W', shippingLine: 'COSCO', blNumber: 'COSU6318452201',
    loadingPort: 'Ho Chi Minh City (Cat Lai)', dischargePort: 'Colombo', etd: D('2026-10-05'), eta: D('2026-11-01'),
    loadType: 'FCL', containers: [{ number: 'CSNU3329917', size: '40HC' }],
    documents: docs('ORIGINAL_RECEIVED', 'ORIGINAL_RECEIVED', 'ORIGINAL_RECEIVED', 'ORIGINAL_RECEIVED', 'MISSING'),
    status: 'WITH_CLEARING_AGENT',
    timeline: [
      T('2026-09-05', 'PO_ISSUED', 'PURCHASING'),
      T('2026-09-10', 'INVOICE_RECEIVED', 'PURCHASING'),
      T('2026-10-05', 'SHIPPED', 'LOGISTICS'),
      T('2026-10-07', 'IN_TRANSIT', 'LOGISTICS'),
      T('2026-11-01', 'ARRIVED', 'LOGISTICS'),
      T('2026-11-04', 'BANK_DOCS_COLLECTED', 'FINANCE', 'LC documents retired at Sampath Bank'),
      T('2026-11-06', 'WITH_CLEARING_AGENT', 'LOGISTICS'),
    ],
  },
  {
    id: 'shp-3', ref: 'SHP-2026-003', poId: 'po-3', invoiceId: 'inv-3', supplierId: 'sup-3',
    vessel: 'ONE HELSINKI', voyage: '112E', shippingLine: 'ONE', blNumber: 'ONEYBOMF12984700',
    loadingPort: 'Nhava Sheva (JNPT)', dischargePort: 'Colombo', etd: D('2026-10-12'), eta: D('2026-11-09'),
    loadType: 'FCL', containers: [{ number: 'TCLU7710346', size: '20FT' }],
    documents: docs('ORIGINAL_AT_BANK', 'ORIGINAL_AT_BANK', 'COPY_RECEIVED', 'MISSING', 'COPY_RECEIVED'),
    status: 'ARRIVED',
    timeline: [
      T('2026-09-20', 'PO_ISSUED', 'PURCHASING'),
      T('2026-09-25', 'INVOICE_RECEIVED', 'PURCHASING'),
      T('2026-10-12', 'SHIPPED', 'LOGISTICS'),
      T('2026-10-14', 'IN_TRANSIT', 'LOGISTICS'),
      T('2026-11-09', 'ARRIVED', 'LOGISTICS', 'Waiting for DP payment at HNB'),
    ],
  },
  {
    id: 'shp-4', ref: 'SHP-2026-004', poId: 'po-4', invoiceId: 'inv-4', supplierId: 'sup-4',
    vessel: 'EVER LUCID', voyage: '0127-045W', shippingLine: 'Evergreen', blNumber: 'EGLV142604518830',
    loadingPort: 'Shenzhen (Yantian)', dischargePort: 'Colombo', etd: D('2026-10-28'), eta: D('2026-11-22'),
    loadType: 'FCL', containers: [{ number: 'EGHU9054418', size: '40HC' }],
    documents: docs('COPY_RECEIVED', 'COPY_RECEIVED', 'COPY_RECEIVED', 'MISSING', 'MISSING'),
    status: 'IN_TRANSIT',
    timeline: [
      T('2026-10-02', 'PO_ISSUED', 'PURCHASING'),
      T('2026-10-06', 'INVOICE_RECEIVED', 'PURCHASING'),
      T('2026-10-10', 'ADVANCE_PAID', 'FINANCE', '30% advance by TT'),
      T('2026-10-28', 'SHIPPED', 'LOGISTICS'),
      T('2026-10-30', 'IN_TRANSIT', 'LOGISTICS'),
    ],
  },
  {
    id: 'shp-5', ref: 'SHP-2026-005', poId: 'po-5', invoiceId: 'inv-5', supplierId: 'sup-1',
    vessel: '', voyage: '', shippingLine: '', blNumber: '',
    loadingPort: 'Shenzhen (Yantian)', dischargePort: 'Colombo',
    loadType: 'FCL', containers: [],
    documents: docs('MISSING', 'COPY_RECEIVED', 'MISSING', 'MISSING', 'MISSING'),
    status: 'ADVANCE_PAID',
    timeline: [
      T('2026-10-25', 'PO_ISSUED', 'PURCHASING'),
      T('2026-10-28', 'INVOICE_RECEIVED', 'PURCHASING'),
      T('2026-11-03', 'ADVANCE_PAID', 'FINANCE', 'Waiting for supplier to book vessel'),
    ],
  },
  {
    id: 'shp-6', ref: 'SHP-2026-006', poId: 'po-6', invoiceId: 'inv-6', supplierId: 'sup-4',
    vessel: 'MSC ELOANE', voyage: 'ZT402R', shippingLine: 'MSC', blNumber: 'MSCUZT401228',
    loadingPort: 'Shenzhen (Yantian)', dischargePort: 'Colombo', etd: D('2026-07-05'), eta: D('2026-07-28'),
    loadType: 'FCL', containers: [{ number: 'MSCU4412907', size: '40HC' }],
    documents: docs('ORIGINAL_RECEIVED', 'ORIGINAL_RECEIVED', 'ORIGINAL_RECEIVED', 'ORIGINAL_RECEIVED', 'ORIGINAL_RECEIVED'),
    status: 'CLOSED',
    timeline: [
      T('2026-06-10', 'PO_ISSUED', 'PURCHASING'),
      T('2026-06-12', 'ADVANCE_PAID', 'FINANCE'),
      T('2026-07-05', 'SHIPPED', 'LOGISTICS'),
      T('2026-07-28', 'ARRIVED', 'LOGISTICS'),
      T('2026-07-30', 'BANK_DOCS_COLLECTED', 'FINANCE'),
      T('2026-07-31', 'WITH_CLEARING_AGENT', 'LOGISTICS'),
      T('2026-08-10', 'RELEASED', 'LOGISTICS'),
      T('2026-08-20', 'SOLD_FULL_CONTAINER', 'SALES', 'Whole container sold to Kandy City Hardware'),
      T('2026-09-22', 'CLOSED', 'FINANCE', 'All payments received and cleared'),
    ],
  },
]

const bankPayments: BankPayment[] = [
  { id: 'bp-1', shipmentId: 'shp-1', kind: 'ADVANCE', term: 'TT', bank: 'Commercial Bank', lcNumber: '', amountUsd: 4080, exchangeRate: 304.8, docCharges: 0, commission: 3500, otherCharges: 1200, paidDate: D('2026-08-10'), status: 'PAID' },
  { id: 'bp-2', shipmentId: 'shp-1', kind: 'DOCUMENTS', term: 'TT', bank: 'Commercial Bank', lcNumber: '', amountUsd: 9520, exchangeRate: 306.4, docCharges: 12500, commission: 18200, otherCharges: 0, paidDate: D('2026-10-05'), docsCollectedDate: D('2026-10-05'), status: 'PAID' },
  { id: 'bp-3', shipmentId: 'shp-2', kind: 'DOCUMENTS', term: 'LC', bank: 'Sampath Bank', lcNumber: 'LC-SB-26-0418', lcOpenDate: D('2026-09-12'), lcExpiry: D('2026-11-28'), amountUsd: 13760, exchangeRate: 307.1, docCharges: 15000, commission: 27500, otherCharges: 0, paidDate: D('2026-11-04'), docsCollectedDate: D('2026-11-04'), status: 'PAID' },
  { id: 'bp-4', shipmentId: 'shp-3', kind: 'DOCUMENTS', term: 'DP', bank: 'Hatton National Bank', lcNumber: '', amountUsd: 56400, exchangeRate: 308.5, docCharges: 0, commission: 0, otherCharges: 0, status: 'PENDING' },
  { id: 'bp-5', shipmentId: 'shp-4', kind: 'ADVANCE', term: 'TT', bank: 'Commercial Bank', lcNumber: '', amountUsd: 8460, exchangeRate: 307.9, docCharges: 0, commission: 3500, otherCharges: 0, paidDate: D('2026-10-10'), status: 'PAID' },
  { id: 'bp-6', shipmentId: 'shp-4', kind: 'DOCUMENTS', term: 'TT', bank: 'Commercial Bank', lcNumber: '', amountUsd: 19740, exchangeRate: 308.5, docCharges: 0, commission: 0, otherCharges: 0, status: 'PENDING' },
  { id: 'bp-7', shipmentId: 'shp-5', kind: 'ADVANCE', term: 'TT', bank: 'Commercial Bank', lcNumber: '', amountUsd: 4590, exchangeRate: 308.2, docCharges: 0, commission: 3500, otherCharges: 0, paidDate: D('2026-11-03'), status: 'PAID' },
  { id: 'bp-8', shipmentId: 'shp-6', kind: 'ADVANCE', term: 'TT', bank: 'Commercial Bank', lcNumber: '', amountUsd: 4686, exchangeRate: 299.9, docCharges: 0, commission: 3500, otherCharges: 0, paidDate: D('2026-06-12'), status: 'PAID' },
  { id: 'bp-9', shipmentId: 'shp-6', kind: 'DOCUMENTS', term: 'TT', bank: 'Commercial Bank', lcNumber: '', amountUsd: 10934, exchangeRate: 301.2, docCharges: 11000, commission: 12300, otherCharges: 0, paidDate: D('2026-07-30'), docsCollectedDate: D('2026-07-30'), status: 'PAID' },
]

const clearances: Clearance[] = [
  { id: 'clr-1', shipmentId: 'shp-6', clearingCompany: 'Ceylon Logistics Services (Pvt) Ltd', handoverDate: D('2026-07-31'), cusdecNumber: 'CUS-2026-0734512', duties: 1640000, portCharges: 185000, transport: 95000, agentFee: 65000, otherCharges: 24000, releaseDate: D('2026-08-10'), attachments: [] },
  { id: 'clr-2', shipmentId: 'shp-1', clearingCompany: 'Ceylon Logistics Services (Pvt) Ltd', handoverDate: D('2026-10-06'), cusdecNumber: 'CUS-2026-1013877', duties: 1380000, portCharges: 210000, transport: 120000, agentFee: 70000, otherCharges: 18000, releaseDate: D('2026-10-14'), attachments: [] },
  { id: 'clr-3', shipmentId: 'shp-2', clearingCompany: 'Island Clearing & Forwarding', handoverDate: D('2026-11-06'), cusdecNumber: 'CUS-2026-1182290', duties: 1150000, portCharges: 95000, transport: 0, agentFee: 0, otherCharges: 0, attachments: [] },
]

const stockItems: StockItem[] = [
  { id: 'stk-1', shipmentId: 'shp-1', productId: 'prd-tile', warehouse: 'Colombo Main Warehouse', qtyReceived: 1600, qtySold: 1000, qtyAdjusted: -20, receivedDate: D('2026-10-16') },
]

const stockMovements: StockMovement[] = [
  { id: 'mov-1', stockItemId: 'stk-1', date: D('2026-10-16'), type: 'RECEIVED', qty: 1600, note: 'Container MSKU6841275 unloaded' },
  { id: 'mov-2', stockItemId: 'stk-1', date: D('2026-10-22'), type: 'SOLD', qty: -450, note: 'SL-0002' },
  { id: 'mov-3', stockItemId: 'stk-1', date: D('2026-10-25'), type: 'SOLD', qty: -350, note: 'SL-0003' },
  { id: 'mov-4', stockItemId: 'stk-1', date: D('2026-11-05'), type: 'SOLD', qty: -200, note: 'SL-0004' },
  { id: 'mov-5', stockItemId: 'stk-1', date: D('2026-11-07'), type: 'ADJUSTED', qty: -20, note: 'Damaged boxes' },
]

const customers: Customer[] = [
  { id: 'cus-1', name: 'Nimal Perera', business: 'Lanka Builders Supplies', phone: '+94 77 123 4567', email: 'nimal@lankabuilders.example', address: '120 Sri Jayawardenepura Mawatha', city: 'Colombo 07', district: 'Colombo' },
  { id: 'cus-2', name: 'Kasun Bandara', business: 'Kandy City Hardware', phone: '+94 71 234 5678', email: 'kasun@kandyhardware.example', address: '45 Peradeniya Road', city: 'Kandy', district: 'Kandy' },
  { id: 'cus-3', name: 'Dilani Fernando', business: 'Matale Tile Centre', phone: '+94 76 345 6789', email: 'dilani@matale-tiles.example', address: '8 Main Street', city: 'Matale', district: 'Matale' },
  { id: 'cus-4', name: 'Sameera Jayasuriya', business: 'Galle Interiors', phone: '+94 70 456 7890', email: 'sameera@galleinteriors.example', address: '22 Matara Road', city: 'Galle', district: 'Galle' },
  { id: 'cus-5', name: 'Ruwan Silva', business: 'Negombo Trading Co.', phone: '+94 75 567 8901', email: 'ruwan@negombotrading.example', address: '67 Lewis Place', city: 'Negombo', district: 'Gampaha' },
]

const sales: Sale[] = [
  {
    id: 'sal-1', number: 'SL-0001', date: D('2026-08-20'), type: 'FULL_CONTAINER', customerId: 'cus-2', shipmentId: 'shp-6',
    items: [{ productId: 'prd-fan', qty: 1100, unitPrice: 8400 }], discount: 0, paymentMethod: 'CHEQUE',
    payments: [
      { id: 'pay-1', date: D('2026-08-20'), method: 'CASH', amount: 3240000 },
      { id: 'pay-2', date: D('2026-08-20'), method: 'CHEQUE', amount: 6000000, chequeId: 'chq-1' },
    ],
    notes: 'Whole container, collected from port by buyer.',
  },
  {
    id: 'sal-2', number: 'SL-0002', date: D('2026-10-22'), type: 'WAREHOUSE', customerId: 'cus-1', shipmentId: undefined,
    items: [{ productId: 'prd-tile', stockItemId: 'stk-1', qty: 450, unitPrice: 4900 }], discount: 0, paymentMethod: 'CHEQUE',
    payments: [{ id: 'pay-3', date: D('2026-10-22'), method: 'CHEQUE', amount: 2205000, chequeId: 'chq-2' }],
    notes: '',
  },
  {
    id: 'sal-3', number: 'SL-0003', date: D('2026-10-25'), type: 'WAREHOUSE', customerId: 'cus-3', shipmentId: undefined,
    items: [{ productId: 'prd-tile', stockItemId: 'stk-1', qty: 350, unitPrice: 4950 }], discount: 0, paymentMethod: 'CHEQUE',
    payments: [
      { id: 'pay-4', date: D('2026-10-25'), method: 'CHEQUE', amount: 1000000, chequeId: 'chq-3' },
      { id: 'pay-5', date: D('2026-10-25'), method: 'CHEQUE', amount: 500000, chequeId: 'chq-5' },
    ],
    notes: 'Balance LKR 232,500 to be paid on delivery of next lot.',
  },
  {
    id: 'sal-4', number: 'SL-0004', date: D('2026-11-05'), type: 'WAREHOUSE', customerId: 'cus-4', shipmentId: undefined,
    items: [{ productId: 'prd-tile', stockItemId: 'stk-1', qty: 200, unitPrice: 5000 }], discount: 0, paymentMethod: 'CHEQUE',
    payments: [
      { id: 'pay-6', date: D('2026-11-05'), method: 'CASH', amount: 300000 },
      { id: 'pay-7', date: D('2026-11-05'), method: 'CHEQUE', amount: 700000, chequeId: 'chq-4' },
    ],
    notes: 'Cheque returned — follow up with buyer.',
  },
]

const cheques: Cheque[] = [
  { id: 'chq-1', saleId: 'sal-1', customerId: 'cus-2', number: '004512', bank: 'Bank of Ceylon', branch: 'Kandy', amount: 6000000, chequeDate: D('2026-09-20'), status: 'CLEARED', statusDate: D('2026-09-22') },
  { id: 'chq-2', saleId: 'sal-2', customerId: 'cus-1', number: '778201', bank: 'Commercial Bank', branch: 'Colombo Fort', amount: 2205000, chequeDate: D('2026-11-05'), status: 'CLEARED', statusDate: D('2026-11-06') },
  { id: 'chq-3', saleId: 'sal-3', customerId: 'cus-3', number: '310945', bank: 'Sampath Bank', branch: 'Matale', amount: 1000000, chequeDate: D('2026-11-15'), status: 'PENDING' },
  { id: 'chq-4', saleId: 'sal-4', customerId: 'cus-4', number: '552038', bank: 'Hatton National Bank', branch: 'Galle', amount: 700000, chequeDate: D('2026-11-06'), status: 'RETURNED', statusDate: D('2026-11-09') },
  { id: 'chq-5', saleId: 'sal-3', customerId: 'cus-3', number: '310946', bank: 'Sampath Bank', branch: 'Matale', amount: 500000, chequeDate: D('2026-11-13'), status: 'PENDING' },
]

/** Fresh copy of the demo data (called on first run and by "Reset demo data"). */
export const createSeedData = (): AppData => ({
  suppliers: structuredClone(suppliers),
  products: structuredClone(products),
  purchaseOrders: structuredClone(purchaseOrders),
  invoices: structuredClone(invoices),
  shipments: structuredClone(shipments),
  bankPayments: structuredClone(bankPayments),
  clearances: structuredClone(clearances),
  stockItems: structuredClone(stockItems),
  stockMovements: structuredClone(stockMovements),
  customers: structuredClone(customers),
  sales: structuredClone(sales),
  cheques: structuredClone(cheques),
  settings: {
    company: {
      name: 'Ceylon Trade Imports (Pvt) Ltd',
      tin: '134567890',
      vatNo: '134567890-7000',
      address: '24 Sir Baron Jayatilaka Mawatha, Colombo 01',
      phone: '+94 11 234 5678',
      email: 'info@ceylontrade.example',
    },
    banks: ['Commercial Bank', 'Hatton National Bank', 'Sampath Bank', 'Bank of Ceylon', "People's Bank", 'Seylan Bank', 'NDB Bank'],
    ports: ['Colombo', 'Shenzhen (Yantian)', 'Shanghai', 'Guangzhou (Nansha)', 'Ho Chi Minh City (Cat Lai)', 'Nhava Sheva (JNPT)', 'Chennai', 'Singapore'],
    shippingLines: ['Maersk', 'MSC', 'CMA CGM', 'Evergreen', 'COSCO', 'ONE', 'Hapag-Lloyd'],
    clearingCompanies: ['Ceylon Logistics Services (Pvt) Ltd', 'Island Clearing & Forwarding', 'Lanka Cargo Handlers'],
    warehouses: ['Colombo Main Warehouse', 'Peliyagoda Yard'],
    units: ['Box', 'Sheet', 'MT', 'Piece', 'Set', 'Sqm'],
    exchangeRate: 308.5,
    targetMarginPercent: 30,
  },
})
