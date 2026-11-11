import type { Role } from '../config/roles'
import type { DocFunction } from './types'

/** Things every user needs, whatever their role. */
export const BASICS: DocFunction[] = [
  {
    id: 'role',
    title: 'Switch the role you are viewing as',
    steps: [
      'Click the role box in the top-right corner (it shows a person icon and, for example, **Owner / Admin**).',
      'Choose a role: Owner / Admin, Purchasing, Logistics Coordinator, Finance, Warehouse or Sales.',
      'The sidebar, dashboard and alerts change to that role. Your choice is remembered next time.',
    ],
    notes: ['This prototype has no login or passwords. In the real system each person would sign in and see only their role.'],
  },
  {
    id: 'navigate',
    title: 'Move around the system',
    steps: [
      'Use the sidebar on the left. Screens are grouped: Overview, Purchasing, Shipping & Clearance, Finance, Sales & Stock, Admin, Help.',
      'On a phone or small screen, tap the **☰** menu button at the top left to open the sidebar, and **×** to close it.',
      'Use the grey **←** link at the top of a detail page to go back to its list.',
      'Many names are links — a shipment number, an order number, a customer — click them to jump to that record.',
    ],
    notes: ['If you open a screen your role cannot use, you will see “Not available for this role”. Switch role or go back.'],
  },
  {
    id: 'tables',
    title: 'Search, sort, filter and page through lists',
    steps: [
      'Type in the search box above a list; matches show as you type.',
      'Use the dropdowns, tick boxes and date boxes next to the search to filter.',
      'Click a column heading with arrows to sort it; click again to reverse; a third click removes the sort.',
      'When a list is long, use the **‹ ›** arrows at the bottom right to change page (“1–10 of 25”).',
      'Click a row to open that record. Buttons inside a row (such as **Deposit**) work without opening it.',
    ],
  },
  {
    id: 'forms',
    title: 'Fill in forms',
    steps: [
      'Fields marked with a red star (*) are required.',
      'Grey text under a field is a hint; red text is a problem to fix before saving.',
      'Many fields fill themselves from related records (for example the invoice amount from the order) — always check them.',
      'Click the main button at the bottom (e.g. **Record invoice**) to save, or **Cancel** to leave without saving.',
      'Small windows (pop-ups) close with **Esc**, the **×**, or a click outside them.',
    ],
  },
  {
    id: 'money',
    title: 'Read amounts and dates',
    steps: [
      'Supplier amounts are in US dollars (`USD 12,500.00`); local amounts are in rupees (`LKR 3,812,500.00`).',
      'Dollars become rupees at the exchange rate recorded on each bank payment; unpaid amounts use the default rate from Settings.',
      'Dates are shown as `14 Oct 2026`.',
    ],
  },
  {
    id: 'colours',
    title: 'Understand the coloured badges',
    steps: [
      'Green — done, paid, cleared, matching.',
      'Amber / orange — waiting, due soon, estimate, needs checking.',
      'Red — late, missing, returned, unpaid, delayed.',
      'Blue / purple / grey — in progress or for information.',
    ],
  },
  {
    id: 'print',
    title: 'Print or save as PDF',
    steps: [
      'Click the **Print** button on a purchase order, sales invoice or report.',
      'In the print window choose a printer, or **Save as PDF**. Menus and buttons are left out of the printout.',
    ],
  },
  {
    id: 'files',
    title: 'Attach and preview files',
    steps: [
      'Click **Attach** or **Attach files** and choose a PDF or image.',
      'Click **Preview** to view it.',
    ],
    notes: ['Prototype limit: only the file name is saved. The file can be previewed until the page is reloaded.'],
  },
  {
    id: 'data',
    title: 'Where your data is kept',
    steps: [
      'Everything is saved in this browser automatically — there is no Save-all button.',
      'Another browser or computer starts with the sample data.',
      'The Owner can export a copy or reset to the sample data in **Settings → Demo data**.',
    ],
  },
]

/** What each role is for, and the order they usually work in. */
export const ROLE_GUIDES: Record<Role, { purpose: string; routine: string[]; cannot?: string }> = {
  OWNER: {
    purpose: 'Sees and can do everything: every screen, every alert, profit and settings.',
    routine: [
      'Start on the **Dashboard**: check the cards, the pipeline and every alert.',
      'Review **Costing** and **Reports** for landed cost, profit, receivables and cheques.',
      'Keep company details, rates and lists up to date in **Settings**.',
      'Step in on any task when needed — every function in this guide is available to you.',
    ],
  },
  PURCHASING: {
    purpose: 'Finds suppliers, agrees prices and terms, issues orders and records supplier invoices.',
    routine: [
      'Record each negotiation in the supplier’s **Negotiation notes**.',
      'Create and issue the **Purchase order** or **LOI**.',
      'When the supplier’s invoice arrives, **Record invoice** and check the difference warning.',
      'Start the **Shipment** for the order and watch arrivals on the Dashboard.',
    ],
    cannot: 'Bank & Payments, Clearance, Costing, Warehouse, Customers, Sales, Cheques, Reports and Settings are handled by other roles.',
  },
  LOGISTICS: {
    purpose: 'Follows each shipment from loading to release: vessel, BL, dates, documents and the clearing agent.',
    routine: [
      'Enter vessel, BL, ETD, ETA and containers as soon as the supplier books the vessel.',
      'Keep the **Documents checklist** current and attach the scans.',
      'Update the status as the ship sails and arrives.',
      'Once Finance has collected the documents, **Hand over** to the clearing agent, then **Mark as released**.',
    ],
    cannot: 'Bank payments, costing, stock, sales and cheques are handled by Finance, Warehouse and Sales.',
  },
  FINANCE: {
    purpose: 'Pays the bank (TT, LC, DP), tracks bank charges and exchange rates, banks customer cheques and watches cost and profit.',
    routine: [
      'Pay advances, and pay the bank to collect documents when a shipment arrives.',
      'Watch LC expiry dates in **Bank & Payments**.',
      'Deposit cheques when they are due and mark them cleared or returned.',
      'Check **Costing** and **Reports** for landed cost, profit and receivables.',
    ],
    cannot: 'Suppliers, purchase orders, warehouse, sales and settings are handled by other roles.',
  },
  WAREHOUSE: {
    purpose: 'Receives released containers, keeps stock accurate and records damage or losses.',
    routine: [
      'Watch **Ready to receive** on the Dashboard or Warehouse screen.',
      '**Receive container** and enter the quantities actually delivered.',
      'Record damaged, lost or found stock with a reason.',
      'Check stock levels and movements.',
    ],
    cannot: 'All other screens are handled by other roles.',
  },
  SALES: {
    purpose: 'Sells from stock or as whole containers, takes payment and follows up what customers owe.',
    routine: [
      'Check what is in stock in **Warehouse / Stock**.',
      'Record each **Sale** — warehouse or full container — with cash, cheque or credit.',
      'Print the invoice for the customer.',
      'Follow up balances in **Customers** and record later payments.',
    ],
    cannot: 'Purchasing, shipping, bank, costing, reports and settings are handled by other roles.',
  },
}

/** The full journey of one shipment, and who does each step. */
export const WORKFLOW: { step: string; who: Role[]; where: string; path: string }[] = [
  { step: 'Agree price and terms with the supplier; save the notes', who: ['PURCHASING'], where: 'Suppliers → Negotiation notes', path: '/suppliers' },
  { step: 'Issue the purchase order or LOI', who: ['PURCHASING'], where: 'Purchase Orders / LOI → New order', path: '/purchase-orders/new' },
  { step: 'Record the supplier’s invoice and contract', who: ['PURCHASING'], where: 'Invoices & Contracts → Record invoice', path: '/invoices/new' },
  { step: 'Start the shipment for the order', who: ['LOGISTICS', 'PURCHASING'], where: 'Shipments → New shipment', path: '/shipments' },
  { step: 'Pay the advance through the bank', who: ['FINANCE'], where: 'Bank & Payments → Record payment', path: '/bank/new' },
  { step: 'Enter vessel, BL, ETD, ETA; attach BL and packing list', who: ['LOGISTICS'], where: 'Shipment → Edit shipping info, Documents', path: '/shipments' },
  { step: 'Mark loaded, in transit, then arrived', who: ['LOGISTICS'], where: 'Shipment → Change status', path: '/shipments' },
  { step: 'Pay the bank and collect the original documents', who: ['FINANCE'], where: 'Bank & Payments → Record payment', path: '/bank' },
  { step: 'Hand over to the clearing agent; enter duties and bills', who: ['LOGISTICS'], where: 'Clearance → Hand over shipment', path: '/clearance' },
  { step: 'Mark the goods released by Customs', who: ['LOGISTICS'], where: 'Clearance record → Mark as released', path: '/clearance' },
  { step: 'Receive the container into the warehouse (or sell it whole)', who: ['WAREHOUSE', 'SALES'], where: 'Warehouse → Receive container / Sales → Full container', path: '/warehouse' },
  { step: 'Check landed cost and set prices', who: ['FINANCE'], where: 'Costing → shipment', path: '/costing' },
  { step: 'Sell and take payment', who: ['SALES'], where: 'Sales → New sale', path: '/sales/new' },
  { step: 'Deposit and clear cheques; follow up returns', who: ['FINANCE'], where: 'Cheques', path: '/cheques' },
  { step: 'Review profit and reports', who: ['OWNER', 'FINANCE'], where: 'Costing, Reports, Dashboard', path: '/reports' },
]

/** Updates the system makes for you, so nobody enters the same fact twice. */
export const AUTOMATIC: { when: string; then: string }[] = [
  { when: 'A supplier is chosen on a new order', then: 'Their usual payment term is filled in.' },
  { when: 'An invoice is recorded', then: 'The order becomes Invoiced; its shipment (if started) becomes Invoice Received.' },
  { when: 'A shipment is created for an invoiced order', then: 'It starts at Invoice Received with the invoice linked.' },
  { when: 'A shipment is marked loaded', then: 'Its purchase order becomes Shipped (and back again if undone).' },
  { when: 'A file is attached to a missing document', then: 'The document becomes Copy Received.' },
  { when: 'An advance is saved as paid', then: 'An unshipped shipment moves to Advance Paid.' },
  { when: 'A documents payment is paid with a collection date', then: 'BL, invoice and packing list become Original Received; an arrived shipment moves to Bank Docs Collected.' },
  { when: 'A shipment is handed to a clearing agent', then: 'It moves to With Clearing Agent.' },
  { when: 'A release date is saved', then: 'The shipment moves to Cleared & Released and appears as ready to receive.' },
  { when: 'A container is received', then: 'Stock is created, a short or extra delivery is recorded as an adjustment, and the shipment moves to In Warehouse.' },
  { when: 'A warehouse sale is saved', then: 'Stock goes down, a movement is recorded, and the shipment becomes Partly Sold or Fully Sold.' },
  { when: 'A full-container sale is saved', then: 'The shipment becomes Sold as Full Container.' },
  { when: 'A sale is paid by cheque', then: 'A Pending cheque is created on the Cheques screen.' },
  { when: 'A cheque is returned', then: 'The amount is owed again and the sale shows Cheque returned.' },
  { when: 'Everything is sold, paid and every cheque cleared', then: 'The shipment becomes Closed — and reopens if a payment problem appears later.' },
  { when: 'Any cost or sale changes', then: 'Landed cost, profit, stock value, the dashboard and reports update straight away.' },
]

export const GLOSSARY: [string, string][] = [
  ['PO', 'Purchase Order — the firm order sent to the supplier.'],
  ['LOI', 'Letter of Intent — a commitment sent before the final order; can be converted into a PO.'],
  ['TT', 'Telegraphic Transfer — paying the supplier directly by bank transfer.'],
  ['LC', 'Letter of Credit — the bank promises to pay the supplier when correct documents are presented before the expiry date.'],
  ['DP', 'Documents against Payment — the bank releases the shipping documents only when you pay.'],
  ['Advance', 'Part of the price paid before the goods are shipped.'],
  ['BL', 'Bill of Lading — the shipping line’s document; the original is needed to take the goods.'],
  ['ETD / ETA', 'Estimated Time of Departure / Arrival.'],
  ['FCL / LCL', 'Full Container Load / Less than Container Load (a shared container).'],
  ['Incoterm', 'Who pays freight and insurance: EXW, FCA, FOB, CFR (freight paid to Colombo), CIF (freight and insurance paid).'],
  ['HS code', 'The customs classification number of a product, used by the clearing agent.'],
  ['CHA', 'Customs House Agent — the clearing agent who clears goods through Sri Lanka Customs.'],
  ['CusDec', 'Customs Declaration filed by the agent (in ASYCUDA World); it has a CusDec number.'],
  ['CID', 'Customs Import Duty.'],
  ['PAL', 'Port and Airport Development Levy.'],
  ['SSCL', 'Social Security Contribution Levy.'],
  ['VAT', 'Value Added Tax.'],
  ['Cess', 'An additional levy on some imports.'],
  ['TIN', 'Taxpayer Identification Number from the Inland Revenue Department (9 digits).'],
  ['Landed cost', 'Everything a shipment cost in rupees: goods at the exchange rate paid, bank charges and clearance bills.'],
  ['Mark-up', 'Profit as a percentage of cost (30% mark-up: cost 100 → price 130).'],
  ['Margin', 'Profit as a percentage of the selling price (price 130, cost 100 → about 23%).'],
  ['Post-dated cheque', 'A cheque dated in the future; it cannot be deposited before that date.'],
  ['Estimate / Final', 'A cost is an estimate while payments are pending or goods are not released; final once all costs are in.'],
]

export const FAQ: [string, string][] = [
  ['Why is the Edit button missing on a purchase order?', 'Orders with an invoice or shipment, or that are cancelled, can’t be edited. Create a new order instead.'],
  ['Why is a Delete button disabled or missing?', 'Records that others depend on are protected: a supplier with orders, a customer with sales, an invoice whose shipment has moved on, a shipment that is loaded or has a payment. The message explains which.'],
  ['I can’t mark a shipment as Loaded / Shipped.', 'Enter the vessel name, BL number, ETD and ETA first (Edit shipping info). The warning lists what is missing.'],
  ['I can’t deposit a cheque.', 'It is post-dated: it can’t be deposited before the date written on it.'],
  ['Why does Costing say “Estimate”?', 'A bank payment is still pending, part of the order has no payment recorded (valued at the default rate), or the goods are not released yet. The note at the top says which.'],
  ['The shipment I want isn’t in the hand-over list.', 'Only shipments that have arrived and don’t already have a clearance record are listed.'],
  ['The container isn’t offered for a full-container sale.', 'Only released containers that haven’t been received into the warehouse or sold are listed.'],
  ['I see “Not available for this role”.', 'Your role can’t open that screen. Switch role in the top bar, or ask the right person.'],
  ['My file preview button is greyed out.', 'This prototype keeps only file names; files can be previewed only in the session they were added.'],
  ['Where did my changes go?', 'Data is kept in this browser. A different browser, private window, or cleared site data starts from the sample data.'],
  ['How do I fix a status set by mistake?', 'Open the shipment and click Undo last in the Status timeline. For cheques, use Undo last step.'],
  ['Are customs duties calculated?', 'No. They are copied from the clearing agent’s bill, because Sri Lankan rates change by gazette.'],
]
