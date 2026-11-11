import type { DocModule } from './types'

/**
 * Every screen and every function in it, in sidebar order.
 * Keep this in step with the screens: button and field names here are the exact labels in the app.
 */
export const DOC_MODULES: DocModule[] = [
  // ---------------------------------------------------------------- Dashboard
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/',
    summary: 'The home page. It shows the numbers and to-dos for the role you are viewing as, so each person sees their own work first.',
    functions: [
      {
        id: 'cards',
        title: 'Read your summary cards',
        steps: [
          'Click **Dashboard** at the top of the sidebar (it is also the page that opens first).',
          'Read the cards at the top. Each card is one number with a short explanation under it.',
          'To act on a number, use the screen it comes from in the sidebar (for example **Cheques** for cheques due).',
        ],
        notes: [
          '**Owner / Admin** sees all twelve cards.',
          '**Purchasing**: Orders awaiting invoice, On the water, Arriving within 7 days.',
          '**Logistics Coordinator**: On the water, Arriving within 7 days, Awaiting bank documents, With clearing agent.',
          '**Finance**: Awaiting bank documents, With clearing agent, Stock value, Pending bank payments, Receivables outstanding, Cheques due within 7 days, Sales this month, Profit so far.',
          '**Warehouse**: Ready to receive, Stock value.',
          '**Sales**: Stock value, Receivables outstanding, Cheques due within 7 days, Sales this month.',
        ],
      },
      {
        id: 'quick-actions',
        title: 'Use the quick-action buttons',
        by: ['PURCHASING', 'LOGISTICS', 'FINANCE', 'WAREHOUSE', 'SALES'],
        steps: [
          'Open the **Dashboard**.',
          'Next to the page title, click the shortcut you need. It opens that form or screen directly.',
        ],
        notes: [
          'Purchasing: **New purchase order**, **Record invoice**, **New shipment**.',
          'Logistics: **Hand over to agent**, **New shipment**.',
          'Finance: **Record bank payment**, **Cheques**.',
          'Warehouse: **Receive container**. Sales: **New sale**.',
          'The Owner has no shortcuts here because every screen is already in the sidebar.',
        ],
      },
      {
        id: 'pipeline',
        title: 'See where every shipment is (pipeline)',
        by: ['PURCHASING', 'LOGISTICS', 'FINANCE'],
        steps: [
          'Open the **Dashboard** and find **Shipment pipeline**.',
          'Read the count under each stage: Ordering, On the Water, Arrived & Bank, Clearance, Selling, Completed.',
          'Click a stage to open **Shipments** showing only the shipments in that stage.',
          'On the Shipments screen, click the **×** on the stage chip to show all shipments again.',
        ],
        notes: ['Shown to the Owner, Purchasing, Logistics and Finance — the roles that can open Shipments.'],
      },
      {
        id: 'arrivals',
        title: 'Check upcoming arrivals',
        by: ['PURCHASING', 'LOGISTICS'],
        steps: [
          'Open the **Dashboard** and find **Upcoming arrivals** (right-hand side on a wide screen).',
          'Each card shows the shipment, supplier, vessel, ETA and a badge such as `in 11d` or `3d late`.',
          'Click a card to open that shipment.',
        ],
        notes: ['Amber badge = arriving within 7 days. Red badge = past its ETA and not yet marked as arrived.'],
      },
      {
        id: 'alerts',
        title: 'Act on “Needs attention” alerts',
        steps: [
          'Open the **Dashboard** and read **Needs attention**. Red items are the most urgent, then amber, then grey.',
          'Click an alert to jump straight to the screen or form where you fix it (for example the bank payment form).',
          'If there are more than six, click **Show all** to see the rest.',
          'When nothing needs you, the box says “All clear”.',
        ],
        notes: [
          'Finance: LC expiring or expired, shipment arrived and the bank is not yet paid, clearance delayed, cheque ready to deposit, cheque not cleared after 3 days, cheque returned, invoice different from the order.',
          'Logistics: shipment past its ETA, clearance delayed, ready to hand over to a clearing agent, documents missing.',
          'Purchasing: shipment past its ETA, invoice different from the order, order issued more than 7 days ago with no invoice.',
          'Warehouse: shipment released by Customs and ready to receive. Sales: cheque ready to deposit, cheque returned.',
          'The Owner sees every alert.',
        ],
      },
      {
        id: 'charts',
        title: 'Read the charts',
        by: ['FINANCE', 'OWNER'],
        steps: [
          'Scroll to the bottom of the **Dashboard**.',
          'Hover over (or tap) a bar to see its exact amount.',
        ],
        notes: [
          '**Purchases by month** (USD) — Owner, Purchasing, Finance.',
          '**Sales by month** (LKR) — Owner, Sales, Finance.',
          '**Profit by shipment** (green = profit, red = loss) — Owner, Finance.',
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- Suppliers
  {
    id: 'suppliers',
    title: 'Suppliers',
    path: '/suppliers',
    summary: 'Overseas suppliers, their contacts and the history of what was agreed with them.',
    functions: [
      {
        id: 'find',
        title: 'Find a supplier',
        by: ['PURCHASING'],
        steps: [
          'Click **Suppliers** in the sidebar.',
          'Type in the search box to search by name, country, city, contact person, products or email.',
          'Use the **All countries** dropdown to show one country only.',
          'Click a column heading (Supplier, Country, Orders, Total purchased) to sort; click again to reverse.',
          'Click a row to open the supplier.',
        ],
      },
      {
        id: 'add',
        title: 'Add a supplier',
        by: ['PURCHASING'],
        steps: [
          'On **Suppliers**, click **Add supplier**.',
          'Fill in **Supplier name**, **Country** and **Contact person** (required).',
          'Add **City**, **WhatsApp number** (with the country code — the hint shows it, e.g. `+86` for China), **Email**, **Usual payment term**, **Address** and **Products supplied**.',
          'Click **Add supplier**. The new supplier opens.',
        ],
        notes: [
          'The usual payment term is filled in automatically when you create an order for this supplier.',
          'Mistakes are shown in red under the field; the supplier is not saved until they are fixed.',
        ],
      },
      {
        id: 'contact',
        title: 'Message or email a supplier',
        by: ['PURCHASING'],
        steps: [
          'Open the supplier.',
          'Under **Contact & terms**, click the WhatsApp number to open a WhatsApp chat, or the email address to write an email.',
        ],
        notes: ['The WhatsApp number in the list is also clickable.'],
      },
      {
        id: 'notes',
        title: 'Record what was negotiated (notes)',
        by: ['PURCHASING'],
        steps: [
          'Open the supplier and click the **Negotiation notes** tab.',
          'Type or paste what was agreed — price, quantity, payment terms, loading date. You can paste straight from WhatsApp.',
          'Click **Add note**. It is saved with today’s date and your role.',
          'To remove a note, click the bin icon on it.',
        ],
        notes: ['Notes keep the negotiation history in one place instead of scattered across chats.'],
      },
      {
        id: 'history',
        title: 'See a supplier’s orders and shipments',
        by: ['PURCHASING'],
        steps: [
          'Open the supplier.',
          'The cards show **Orders placed** and **Total purchased** (USD).',
          'Click the **Orders** tab for every PO and LOI, or the **Shipments** tab for every shipment and its status.',
        ],
      },
      {
        id: 'edit',
        title: 'Edit a supplier',
        by: ['PURCHASING'],
        steps: ['Open the supplier and click **Edit**.', 'Change the details and click **Save changes**.'],
      },
      {
        id: 'delete',
        title: 'Delete a supplier',
        by: ['PURCHASING', 'OWNER'],
        steps: ['Open the supplier and click **Delete**.', 'Read the message and click **Delete supplier** to confirm.'],
        notes: ['A supplier that has any purchase order or LOI cannot be deleted — the button is disabled and the message explains why.'],
      },
    ],
  },

  // ---------------------------------------------------------------- Purchase orders
  {
    id: 'purchase-orders',
    title: 'Purchase Orders / LOI',
    path: '/purchase-orders',
    summary: 'Letters of intent and purchase orders sent to suppliers once price and payment terms are agreed.',
    functions: [
      {
        id: 'browse',
        title: 'Browse and filter orders',
        by: ['PURCHASING'],
        steps: [
          'Click **Purchase Orders / LOI** in the sidebar.',
          'The cards show orders on record, orders awaiting a supplier invoice, and total value ordered (USD).',
          'Filter with **PO and LOI**, **All statuses** and **All suppliers**, or search by number or supplier.',
          'Click a row to open the order.',
        ],
        notes: ['Statuses: Draft → Issued → Invoiced → Shipped, or Cancelled.'],
      },
      {
        id: 'create',
        title: 'Create a purchase order or LOI',
        by: ['PURCHASING'],
        steps: [
          'On **Purchase Orders / LOI**, click **New order**.',
          'Choose the **Document type**: Purchase Order (PO) or Letter of Intent (LOI). The **Number** is suggested automatically (e.g. `PO-2026-008`); you can change it.',
          'Check the **Date** and choose the **Supplier**. The supplier’s usual payment term is filled in for you.',
          'Set the **Expected shipment date**, **Incoterm** (EXW, FCA, FOB, CFR, CIF) and **Payment term** (TT, LC, DP or Advance).',
          'Enter the **Advance payment (%)** — the hint shows the amount in USD. Use 0 for no advance.',
          'Add any **Special conditions** (packing, warranty, loading deadline…).',
          'Under **Items**, pick a **Product**, enter the **Qty** and **Unit price (USD)**. Click **Add item** for more lines; the bin icon removes a line.',
          'If the product is new, choose **+ New product…** in the product list, enter its name, HS code and unit, and click **Add product**.',
          'Click **Create & issue** to send it, or **Save as draft** to finish later.',
        ],
        notes: [
          'Checks: a supplier, at least one product with quantity and price above zero, no product twice, a unique number, and a shipment date not before the order date.',
          'The total and the advance amount update as you type.',
        ],
      },
      {
        id: 'issue',
        title: 'Issue a draft order',
        by: ['PURCHASING'],
        steps: ['Open the draft order.', 'Click **Issue**. The status changes to Issued.'],
      },
      {
        id: 'edit',
        title: 'Edit an order',
        by: ['PURCHASING'],
        steps: [
          'Open the order and click **Edit**.',
          'Change what you need and click **Save changes** (or **Save as draft** / **Save & issue** for a draft).',
        ],
        notes: ['Only draft or issued orders without an invoice or shipment can be edited. Otherwise create a new order.'],
      },
      {
        id: 'convert',
        title: 'Convert an LOI into a purchase order',
        by: ['PURCHASING'],
        steps: ['Open the LOI.', 'Click **Convert to PO** and confirm.'],
        notes: ['It gets the next PO number and becomes Issued.'],
      },
      {
        id: 'print',
        title: 'Print or save an order as PDF',
        by: ['PURCHASING'],
        steps: [
          'Open the order and click **Print / Save PDF**.',
          'In the print window choose your printer, or **Save as PDF**.',
        ],
        notes: ['The printout shows your company name, TIN and VAT number (from Settings), the supplier, terms, items with HS codes, totals and signature lines.'],
      },
      {
        id: 'record-invoice',
        title: 'Record the supplier’s invoice from the order',
        by: ['PURCHASING'],
        steps: ['Open an issued order that has no invoice yet.', 'Click **Record invoice**. The invoice form opens with this order already chosen.'],
        notes: ['See “Record a supplier invoice” under Invoices & Contracts.'],
      },
      {
        id: 'cancel',
        title: 'Cancel an order',
        by: ['PURCHASING', 'OWNER'],
        steps: ['Open the issued order.', 'Click **Cancel order** and confirm.'],
        notes: ['Only issued orders without an invoice or shipment can be cancelled. A cancelled order stays on record.'],
      },
      {
        id: 'delete',
        title: 'Delete an order',
        by: ['PURCHASING', 'OWNER'],
        steps: ['Open a draft or cancelled order.', 'Click **Delete** and confirm.'],
        notes: ['Orders with an invoice or shipment cannot be deleted.'],
      },
      {
        id: 'payment-plan',
        title: 'See the payment plan and linked records',
        by: ['PURCHASING', 'FINANCE'],
        steps: [
          'Open the order.',
          'The **Payment plan** card shows the advance, the balance against documents and the total.',
          '**Linked records** shows the supplier invoice and the shipment with its status.',
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- Invoices
  {
    id: 'invoices',
    title: 'Invoices & Contracts',
    path: '/invoices',
    summary: 'Supplier invoices and sales contracts, checked against the purchase order.',
    functions: [
      {
        id: 'browse',
        title: 'Browse invoices and spot differences',
        by: ['PURCHASING', 'FINANCE'],
        steps: [
          'Click **Invoices & Contracts** in the sidebar.',
          'The **vs order** column shows `Matches` or the difference from the order total.',
          'Tick **Only differences** to see only invoices that do not match their order.',
          'Filter by supplier or search by invoice, order, supplier or contract number. Click a row to open it.',
        ],
      },
      {
        id: 'record',
        title: 'Record a supplier invoice',
        by: ['PURCHASING'],
        steps: [
          'Click **Record invoice** (on this screen, or on an issued order).',
          'Choose the **Purchase order / LOI**. Only issued orders without an invoice are listed. The amount, payment term and advance fill in from the order.',
          'Enter the **Invoice number** exactly as printed, the **Invoice date** and the **Sales contract number** if there is one.',
          'Check the **Invoice amount (USD)**. If it differs from the order, a yellow warning shows by how much — check with the supplier. You can still save.',
          'Check the **Payment term**, **Advance amount (USD)** and, if the advance is already paid, **Advance paid on**.',
          'Add **Special conditions / notes** if needed.',
          'Click **Attach files** to add the scanned invoice or contract (PDF or image).',
          'Click **Record invoice**.',
        ],
        notes: [
          'The order becomes **Invoiced**. If its shipment already exists, the shipment moves to **Invoice Received**.',
          'Checks: the invoice number must be new, the amount above zero, and the advance not more than the invoice.',
        ],
      },
      {
        id: 'view',
        title: 'View an invoice and its amounts',
        by: ['PURCHASING', 'FINANCE'],
        steps: [
          'Open the invoice from the list.',
          'The **Amounts** card shows the order total, invoice amount, difference, advance and balance against documents.',
          'Click the order number or the shipment to go to them.',
        ],
      },
      {
        id: 'preview',
        title: 'Preview an attached scan',
        by: ['PURCHASING', 'FINANCE'],
        steps: ['Open the invoice.', 'Under **Scanned invoice / contract**, click **Preview** next to the file.'],
        notes: ['This prototype keeps only the file name. A file can be previewed in the session where it was added; after a reload the button is disabled.'],
      },
      {
        id: 'edit',
        title: 'Edit an invoice',
        by: ['PURCHASING'],
        steps: ['Open the invoice and click **Edit**.', 'Change the details (the order cannot be changed) and click **Save changes**.'],
      },
      {
        id: 'delete',
        title: 'Delete an invoice',
        by: ['PURCHASING', 'OWNER'],
        steps: ['Open the invoice and click **Delete**, then **Delete invoice**.'],
        notes: [
          'The order goes back to **Issued** and the shipment back to **PO / LOI Issued**.',
          'Not allowed once the shipment has moved past Invoice Received (paid, shipped and so on).',
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- Shipments
  {
    id: 'shipments',
    title: 'Shipments',
    path: '/shipments',
    summary: 'One record per purchase — vessel, BL, dates, containers, documents and status from order to sale.',
    functions: [
      {
        id: 'browse',
        title: 'Browse shipments (table or board)',
        by: ['LOGISTICS', 'PURCHASING'],
        steps: [
          'Click **Shipments** in the sidebar.',
          'Use **Table** for a list or **Board** for columns by stage (Ordering, On the Water, Arrived & Bank, Clearance, Selling, Completed).',
          'Search by reference, supplier, vessel, BL number or container number.',
          'Filter by status, supplier, or an **ETA** date range (from – to).',
          'Click a row or a card to open the shipment.',
        ],
        notes: ['The cards show shipments on the water, arriving within 7 days, arrived and awaiting the bank, and shipped with missing documents.'],
      },
      {
        id: 'create',
        title: 'Start a shipment for an order',
        by: ['LOGISTICS', 'PURCHASING'],
        steps: [
          'On **Shipments**, click **New shipment**.',
          'Choose the **Purchase order / LOI** (issued or invoiced orders without a shipment).',
          'Optionally type the **Loading port**.',
          'Click **Create shipment**. It opens at **PO / LOI Issued**, or **Invoice Received** if the invoice is already recorded.',
        ],
      },
      {
        id: 'info',
        title: 'Enter vessel, BL, dates and containers',
        by: ['LOGISTICS'],
        steps: [
          'Open the shipment and click **Edit shipping info**.',
          'Fill in **Vessel name**, **Voyage number**, **Shipping line**, **BL number**, **Loading port** and **Discharge port** (Colombo by default).',
          'Enter **ETD (departure)** and **ETA (arrival in Sri Lanka)**, and choose **FCL** or **LCL**.',
          'Click **Add container** for each container and enter its number (4 letters + 7 digits, e.g. `MSKU6841275`) and size.',
          'Click **Save**.',
        ],
        notes: [
          'Checks: the BL number and container numbers must not belong to another shipment, and the ETA cannot be before the ETD.',
          'The overview then shows the transit time and an arrival badge.',
        ],
      },
      {
        id: 'status',
        title: 'Change a shipment’s status',
        by: ['LOGISTICS'],
        steps: [
          'Open the shipment and click **Change status**.',
          'Choose the **New status** (only later stages are offered), the **Date** and an optional **Note**.',
          'Click **Update status**. A new line appears in the **Status timeline**.',
        ],
        notes: [
          'Before **Loaded / Shipped** you must enter the vessel name, BL number, ETD and ETA — a warning lists what is missing.',
          'The date cannot be before the last change.',
          'Most later statuses are set for you automatically by Bank, Clearance, Warehouse, Sales and Cheques — you rarely need to set them by hand.',
          'When the shipment is loaded, its purchase order becomes **Shipped**.',
        ],
      },
      {
        id: 'undo',
        title: 'Undo the last status change',
        by: ['LOGISTICS'],
        steps: ['Open the shipment.', 'In **Status timeline**, click **Undo last** and confirm.'],
        notes: ['Removes the latest timeline entry and returns to the previous status. Use it if a status was set by mistake.'],
      },
      {
        id: 'documents',
        title: 'Track shipping documents',
        by: ['LOGISTICS'],
        steps: [
          'Open the shipment and scroll to **Documents checklist** (Bill of Lading, Commercial Invoice, Packing List, Certificate of Origin, Insurance Certificate).',
          'For each document, choose its state: **Missing**, **Copy Received**, **Original at Bank** or **Original Received**.',
          'Click **Attach** to add the scan (PDF or image); a missing document then becomes **Copy Received**. **Replace** swaps the file, **Preview** opens it.',
        ],
        notes: [
          'Paying the bank and collecting the documents changes the BL, invoice and packing list to **Original Received** for you.',
          'Shipped shipments with a missing document appear in the dashboard alerts.',
        ],
      },
      {
        id: 'tabs',
        title: 'See bank, clearance, costing and sales for a shipment',
        by: ['LOGISTICS', 'FINANCE'],
        steps: [
          'Open the shipment and click the **Bank**, **Clearance**, **Costing** or **Sales** tab.',
          '**Bank**: payments for this shipment; **Record payment** starts a new one.',
          '**Clearance**: the agent’s bills; **Hand over to clearing agent** or **Open**.',
          '**Costing**: the landed cost; **Open full costing →** for details. **Sales**: what was sold from it.',
        ],
      },
      {
        id: 'delete',
        title: 'Delete a shipment',
        by: ['LOGISTICS', 'OWNER'],
        steps: ['Open the shipment and click **Delete**, then **Delete shipment**.'],
        notes: ['Only possible before it is loaded and when it has no bank payment. The order and invoice stay.'],
      },
    ],
  },

  // ---------------------------------------------------------------- Clearance
  {
    id: 'clearance',
    title: 'Clearance',
    path: '/clearance',
    summary: 'Handing shipments to the clearing agent (CHA), Customs duties and bills, and release of the goods.',
    functions: [
      {
        id: 'browse',
        title: 'Browse clearances and what needs attention',
        by: ['LOGISTICS'],
        steps: [
          'Click **Clearance** in the sidebar.',
          'The cards show shipments ready for handover, with an agent, the average clearing time and total clearance cost.',
          '**Needs attention** lists arrived shipments without an agent and shipments with an agent for more than 7 days. Click one to act.',
          'Filter by **With agent** / **Released** or by agent, or search. Click a row to open it.',
        ],
      },
      {
        id: 'handover',
        title: 'Hand a shipment over to the clearing agent',
        by: ['LOGISTICS'],
        steps: [
          'Click **Hand over shipment** (or the alert, or the shipment’s Clearance tab).',
          'Choose the **Shipment** — arrived shipments without a clearance are listed.',
          'Choose the **Clearing agent (CHA)** and the **Handed over on** date.',
          'Enter the **CusDec number** when the agent has filed the declaration.',
          'Enter the **Customs duties & taxes** total from the agent’s bill — or tick **Enter each levy separately** and fill in CID, PAL, VAT, SSCL, Cess and Excise / other.',
          'Fill in **Port & handling**, **Transport**, **Clearing agent fee** and **Other charges**. The total updates as you type.',
          'Click **Attach files** for the bills and CusDec copy.',
          'Click **Hand over**.',
        ],
        notes: [
          'The shipment moves to **With Clearing Agent**.',
          'If the bank documents have not been collected yet, a warning reminds you to pay the bank first — the agent needs the originals.',
          'Duties are copied from the bill, not calculated, because rates change by gazette.',
        ],
      },
      {
        id: 'release',
        title: 'Mark goods as released by Customs',
        by: ['LOGISTICS'],
        steps: [
          'Open the clearance record and click **Mark as released**.',
          'Check the **Released on** date and that the **CusDec number** is filled in, then click **Save changes**.',
        ],
        notes: [
          'The shipment moves to **Cleared & Released** and the warehouse sees it as ready to receive.',
          'A release date needs a CusDec number, and cannot be before the handover date.',
        ],
      },
      {
        id: 'edit',
        title: 'Update the agent’s bills',
        by: ['LOGISTICS', 'FINANCE'],
        steps: ['Open the clearance record and click **Edit**.', 'Change the amounts or dates and click **Save changes**.'],
        notes: ['Costing and profit update straight away.'],
      },
      {
        id: 'view',
        title: 'View bills, levies and timing',
        by: ['LOGISTICS', 'FINANCE'],
        steps: ['Open the clearance record.', 'See the bills, the levy breakdown (if entered), the CusDec number, dates and days taken.'],
        notes: ['A shipment with the agent for more than 7 days is shown as **Delayed**.'],
      },
      {
        id: 'delete',
        title: 'Delete a clearance record',
        by: ['LOGISTICS', 'OWNER'],
        steps: ['Open the record and click **Delete**, then **Delete record**.'],
        notes: ['The shipment’s status is not changed — use **Undo last** on the shipment if needed.'],
      },
    ],
  },

  // ---------------------------------------------------------------- Bank
  {
    id: 'bank',
    title: 'Bank & Payments',
    path: '/bank',
    summary: 'Payments to suppliers through the bank — TT, LC and DP — with exchange rates and bank charges.',
    functions: [
      {
        id: 'browse',
        title: 'Browse payments and alerts',
        by: ['FINANCE'],
        steps: [
          'Click **Bank & Payments** in the sidebar.',
          'The cards show pending payments, paid so far (LKR), bank charges paid and open LCs.',
          '**Needs attention** lists LCs about to expire and arrived shipments whose documents are not yet paid for. Click one to act.',
          'Filter by status, term (TT, LC, DP) or bank, or search by shipment, supplier, bank or LC number.',
        ],
      },
      {
        id: 'advance',
        title: 'Record an advance payment',
        by: ['FINANCE'],
        steps: [
          'Click **Record payment** (or **Record payment** on the shipment’s Bank tab).',
          'Choose the **Shipment** and set **Payment** to **Advance payment**. The amount fills in from the invoice’s agreed advance.',
          'Choose the **Payment term** (usually TT) and the **Bank**.',
          'Enter the **Exchange rate (LKR per USD)** the bank used. **Amount in LKR** is worked out for you.',
          'Enter **Document charges**, **Commission** and **Other bank charges** (LKR).',
          'Set **Status** to **Paid** and check **Paid on**.',
          'Click **Record payment**.',
        ],
        notes: ['A paid advance moves an unshipped shipment to **Advance Paid**.'],
      },
      {
        id: 'documents',
        title: 'Pay the bank and collect the shipping documents',
        by: ['FINANCE'],
        steps: [
          'When a shipment arrives, click its alert, or **Record payment** and choose the shipment.',
          'Set **Payment** to **Documents payment**. The amount fills in with what is left to pay.',
          'Choose the term (TT, LC or DP) and the bank, and enter the exchange rate and charges.',
          'Set **Status** to **Paid**, check **Paid on**, and enter **Documents collected on**.',
          'Click **Record payment**.',
        ],
        notes: [
          'The BL, invoice and packing list become **Original Received**, and an arrived shipment moves to **Bank Docs Collected** — ready for the clearing agent.',
          'If the payments would add up to more than the invoice, an amber warning shows the excess.',
        ],
      },
      {
        id: 'lc',
        title: 'Record a letter of credit (LC)',
        by: ['FINANCE'],
        steps: [
          'In the payment form, set **Payment term** to **LC**.',
          'Fill in the **LC number**, **Opened on** and **Expires on** dates.',
          'Save as **Pending** until the documents are retired, then mark it paid with the collection date.',
        ],
        notes: [
          'The LC column shows days left. Within 14 days of expiry (or after it) the LC appears in **Needs attention** and on the dashboard.',
          'Once documents are collected the LC shows as **Retired**.',
        ],
      },
      {
        id: 'mark-paid',
        title: 'Mark a pending payment as paid',
        by: ['FINANCE'],
        steps: [
          'Open the pending payment and click **Mark as paid** (or click its alert).',
          'The form opens with **Paid** and today’s dates. Enter the actual exchange rate and charges.',
          'Click **Save changes**.',
        ],
      },
      {
        id: 'view',
        title: 'See how the rupee amount is worked out',
        by: ['FINANCE'],
        steps: ['Open a payment from the list.', 'Read the breakdown: USD × rate = LKR, each bank charge, and the total cash out.'],
      },
      {
        id: 'edit',
        title: 'Edit a payment',
        by: ['FINANCE'],
        steps: ['Open the payment and click **Edit**.', 'Change the details and click **Save changes**.'],
        notes: ['If the rate is more than 10% away from the default rate, a hint warns you to check it.'],
      },
      {
        id: 'delete',
        title: 'Delete a payment',
        by: ['FINANCE', 'OWNER'],
        steps: ['Open the payment and click **Delete**, then **Delete payment**.'],
        notes: ['The shipment’s status is not changed — use **Undo last** on the shipment if needed.'],
      },
    ],
  },

  // ---------------------------------------------------------------- Costing
  {
    id: 'costing',
    title: 'Costing',
    path: '/costing',
    summary: 'What each shipment really cost in rupees (landed cost) and what it earned.',
    functions: [
      {
        id: 'overview',
        title: 'Compare the cost of all shipments',
        by: ['FINANCE', 'OWNER'],
        steps: [
          'Click **Costing** in the sidebar.',
          'Read the cards (total landed cost, sales, profit, estimates) and the **Where the money goes** chart.',
          'In the table, **Estimate** means a payment is pending, part of the order has no payment recorded, or the goods are not released yet; **Final** means all costs are in.',
          'Click a row to open that shipment’s costing.',
        ],
      },
      {
        id: 'breakdown',
        title: 'See a shipment’s landed cost breakdown',
        by: ['FINANCE'],
        steps: [
          'Open a shipment’s costing (from Costing, or **Open full costing →** on the shipment).',
          '**Cost breakdown** lists the goods (each payment as USD × rate), every bank charge and every clearance bill, with its share of the total.',
          '**Cost mix** shows the same as a chart.',
        ],
        notes: ['If it is an estimate, the amber note at the top says exactly why.'],
      },
      {
        id: 'allocate',
        title: 'Choose how cost is spread across products',
        by: ['FINANCE'],
        steps: [
          'On a shipment’s costing, use **Spread cost across products**.',
          'Choose **By value (USD price)** — expensive items carry more cost — or **By quantity** — every unit carries the same cost.',
        ],
        notes: ['This only matters when a shipment has more than one product.'],
      },
      {
        id: 'price',
        title: 'Get a suggested selling price',
        by: ['FINANCE', 'SALES'],
        steps: [
          'On a shipment’s costing, set **Mark-up on cost (%)** (it starts at the default from Settings).',
          'Read **Suggested price** for each product in **Cost and price per product**.',
        ],
        notes: [
          'Suggested price = landed cost per unit × (1 + mark-up). A 30% mark-up is about a 23% margin on the selling price.',
          'The mark-up you type here is not saved; change the default in Settings.',
        ],
      },
      {
        id: 'profit',
        title: 'See the profit made so far',
        by: ['FINANCE', 'OWNER'],
        steps: [
          'On a shipment’s costing, scroll to **Profit**.',
          'Read sales, cost of units sold, lost or damaged stock, profit, margin and unsold stock at cost.',
          'If stock is left, the note shows the extra profit if it sells at the suggested prices.',
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- Cheques
  {
    id: 'cheques',
    title: 'Cheques',
    path: '/cheques',
    summary: 'Customer cheques from the day they are received until the bank clears them.',
    functions: [
      {
        id: 'browse',
        title: 'See which cheques need action',
        by: ['FINANCE'],
        steps: [
          'Click **Cheques** in the sidebar.',
          'The cards show pending, due within 7 days, deposited and returned cheques.',
          '**Needs attention** lists cheques ready to deposit, deposited cheques not cleared after 3 days, and returned cheques.',
          'Filter by status or customer, or search by cheque number, customer or bank.',
        ],
        notes: ['Badges: `Due today`, `Ready to deposit`, `in 4d`, `Not cleared yet`.'],
      },
      {
        id: 'deposit',
        title: 'Deposit a cheque',
        by: ['FINANCE'],
        steps: ['Click **Deposit** on the cheque’s row (or its alert).', 'Check the **Deposited on** date and click **Deposit**.'],
        notes: ['A post-dated cheque cannot be deposited before the date written on it — the form tells you the date. Dates cannot be in the future.'],
      },
      {
        id: 'clear',
        title: 'Mark a cheque as cleared',
        by: ['FINANCE'],
        steps: ['On a deposited cheque, click **Cleared**.', 'Check the **Cleared on** date and click **Mark cleared**.'],
        notes: ['When everything from a shipment is sold, paid and cleared, the shipment becomes **Closed** automatically.'],
      },
      {
        id: 'return',
        title: 'Record a returned (bounced) cheque',
        by: ['FINANCE'],
        steps: [
          'On a deposited cheque, click **Returned**.',
          'Enter the **Returned on** date, choose the **Reason** (Insufficient funds, Signature differs, Account closed, Payment stopped, Cheque out of date, Other) and add a note.',
          'Click **Mark returned**.',
        ],
        notes: [
          'The amount goes back onto the customer’s balance and the sale shows **Cheque returned**.',
          'A closed shipment reopens until the money is collected.',
        ],
      },
      {
        id: 'redeposit',
        title: 'Deposit a returned cheque again',
        by: ['FINANCE'],
        steps: ['On a returned cheque, click **Deposit again**.', 'Enter the date and click **Deposit**, then clear it as usual.'],
      },
      {
        id: 'details',
        title: 'See a cheque’s details and history',
        by: ['FINANCE', 'SALES'],
        steps: [
          'Click the cheque’s row.',
          'See the amount, bank, cheque date, customer and sale (both clickable), and the full history of deposits, clearance and returns.',
          'Use the buttons at the bottom for the next step.',
        ],
      },
      {
        id: 'undo',
        title: 'Undo the last step on a cheque',
        by: ['FINANCE'],
        steps: ['Open the cheque’s details.', 'Click **Undo last step**.'],
        notes: ['Cleared or Returned goes back to Deposited; Deposited goes back to Pending.'],
      },
    ],
  },

  // ---------------------------------------------------------------- Warehouse
  {
    id: 'warehouse',
    title: 'Warehouse / Stock',
    path: '/warehouse',
    summary: 'Receiving released containers, what is in stock and what it cost, and recording damage or losses.',
    functions: [
      {
        id: 'stock',
        title: 'See what is in stock',
        by: ['WAREHOUSE', 'SALES'],
        steps: [
          'Click **Warehouse / Stock** in the sidebar.',
          'The **Stock** tab lists each product with its shipment, warehouse, quantities in / sold / adjusted, **In stock**, cost per unit and stock value.',
          'Filter by warehouse. Untick **Hide sold-out** to see finished lines too.',
        ],
        notes: ['In stock = received − sold + adjustments. Sales reduce stock automatically.'],
      },
      {
        id: 'receive',
        title: 'Receive a container into the warehouse',
        by: ['WAREHOUSE'],
        steps: [
          'Click **Receive container**, or the shipment under **Ready to receive**.',
          'Choose the released **Shipment**, the **Warehouse** and the **Received on** date.',
          'For each product, enter the quantity actually **Received**. It starts at the ordered quantity.',
          'Click **Receive stock**.',
        ],
        notes: [
          'If you received fewer or more than ordered, it is recorded as an adjustment (e.g. “Short-landed on arrival”) so the cost per unit stays right and the loss shows in profit.',
          'The shipment moves to **In Warehouse**. The date cannot be before the release date.',
        ],
      },
      {
        id: 'history',
        title: 'See the history of a stock line',
        by: ['WAREHOUSE'],
        steps: ['Click a row on the **Stock** tab.', 'Read the received, sold and adjusted entries under **History**.'],
      },
      {
        id: 'adjust',
        title: 'Record damaged, lost or found stock',
        by: ['WAREHOUSE'],
        steps: [
          'Click the stock row.',
          'Under **Adjust stock**, choose **Remove — damaged, lost, short** or **Add — found, returned**.',
          'Enter the **Quantity** and the **Reason**, then click **Apply**.',
        ],
        notes: ['You cannot remove more than is in stock. Removed stock is written off at cost and reduces the shipment’s profit.'],
      },
      {
        id: 'movements',
        title: 'Review all stock movements',
        by: ['WAREHOUSE', 'OWNER'],
        steps: ['Click the **Movements** tab.', 'Filter by warehouse or type (Received, Sold, Adjusted), or search.'],
      },
    ],
  },

  // ---------------------------------------------------------------- Customers
  {
    id: 'customers',
    title: 'Customers',
    path: '/customers',
    summary: 'Local buyers, what they bought and what they still owe.',
    functions: [
      {
        id: 'browse',
        title: 'Find a customer and see who owes money',
        by: ['SALES'],
        steps: [
          'Click **Customers** in the sidebar.',
          'Search by business, name, town, phone or email, or filter by **district**.',
          'Tick **Only customers who owe** to see outstanding balances.',
          'Click a row to open the customer.',
        ],
        notes: ['A red **Cheque returned** badge means one of their cheques bounced.'],
      },
      {
        id: 'add',
        title: 'Add a customer',
        by: ['SALES'],
        steps: [
          'Click **Add customer**.',
          'Enter the **Business name** (leave empty for an individual), **Contact person** and **Phone**.',
          'Choose the **District** (all 25 districts are listed) and add the **City / town**, **Email** and **Address**.',
          'Click **Add customer**.',
        ],
        notes: ['Phone numbers must be Sri Lankan: `+94 77 123 4567` or `077 123 4567`.'],
      },
      {
        id: 'detail',
        title: 'See a customer’s sales and cheques',
        by: ['SALES', 'FINANCE'],
        steps: [
          'Open the customer.',
          'The cards show total purchases and the outstanding balance.',
          'Use the **Sales** and **Cheques** tabs. Click a sale to open it.',
          'Click the phone number to call, or the email to write.',
        ],
      },
      {
        id: 'new-sale',
        title: 'Start a sale for this customer',
        by: ['SALES'],
        steps: ['Open the customer and click **New sale**. The sale form opens with the customer chosen.'],
      },
      {
        id: 'edit',
        title: 'Edit a customer',
        by: ['SALES'],
        steps: ['Open the customer and click **Edit**.', 'Change the details and click **Save changes**.'],
      },
      {
        id: 'delete',
        title: 'Delete a customer',
        by: ['SALES', 'OWNER'],
        steps: ['Open the customer and click **Delete**, then **Delete customer**.'],
        notes: ['A customer with any sale cannot be deleted.'],
      },
    ],
  },

  // ---------------------------------------------------------------- Sales
  {
    id: 'sales',
    title: 'Sales',
    path: '/sales',
    summary: 'Selling from the warehouse or as whole containers, with payments and printable invoices.',
    functions: [
      {
        id: 'browse',
        title: 'Browse sales and balances',
        by: ['SALES'],
        steps: [
          'Click **Sales** in the sidebar.',
          'The cards show sales, total, collected and still to collect.',
          'Filter by type, payment status (Paid, Part paid, Unpaid) or customer, or search. Click a row to open it.',
        ],
      },
      {
        id: 'warehouse-sale',
        title: 'Sell from the warehouse',
        by: ['SALES'],
        steps: [
          'Click **New sale** and keep **Warehouse sale** selected.',
          'Choose the **Customer** and check the **Sale date**.',
          'Under **Items**, pick a **Product in stock** (it shows how many are left), enter the **Qty** and the **Unit price (LKR)**. The price starts at the suggested price; the hint shows the cost.',
          'Click **Add item** for more products.',
          'Enter any **Discount (LKR)**. The total updates.',
          'Choose how the customer pays now — see “Take payment when selling”.',
          'Click **Save sale**.',
        ],
        notes: [
          'Stock goes down and the shipment becomes **Partly Sold**, or **Fully Sold** when the last unit is sold.',
          'You cannot sell more than is in stock. Selling below cost shows an amber warning (you can still save).',
        ],
      },
      {
        id: 'container-sale',
        title: 'Sell a whole container',
        by: ['SALES'],
        steps: [
          'Click **New sale** and choose **Full container**.',
          'Choose the **Customer** and the **Container (shipment)**. Only released containers not yet in the warehouse are listed.',
          'All goods load with their quantities. Enter the **Unit price (LKR)** for each.',
          'Choose the payment and click **Save sale**.',
        ],
        notes: ['The shipment becomes **Sold as Full Container**.'],
      },
      {
        id: 'payment',
        title: 'Take payment when selling',
        by: ['SALES'],
        steps: [
          'In the **Payment** section, choose **Cash**, **Cheque** or **Credit (pays later)**.',
          'For cash or cheque, check the **Amount (LKR)** (it starts at the total; enter less for a part payment) and **Received on**.',
          'For a cheque also enter the **Cheque number**, **Bank**, **Branch** and **Cheque date** (use the date written on it for post-dated cheques).',
          'For credit nothing is recorded now — the whole amount stays outstanding.',
        ],
        notes: ['Each cheque appears on the Cheques screen as Pending.'],
      },
      {
        id: 'new-customer',
        title: 'Add a new customer while selling',
        by: ['SALES'],
        steps: ['In the **Customer** list choose **+ New customer…**.', 'Fill in the form and click **Add customer**. They are selected for the sale.'],
      },
      {
        id: 'record-payment',
        title: 'Record a later payment',
        by: ['SALES', 'FINANCE'],
        steps: [
          'Open the sale and click **Record payment** (shown while money is due).',
          'Choose **Cash** or **Cheque**, check the amount (it starts at the balance due) and date, and the cheque details if needed.',
          'Click **Record payment**.',
        ],
        notes: ['You cannot record more than is due. A returned cheque does not count as paid.'],
      },
      {
        id: 'print',
        title: 'Print the sales invoice',
        by: ['SALES'],
        steps: ['Open the sale and click **Print invoice**.', 'Print it or choose **Save as PDF**.'],
        notes: ['The invoice shows your company TIN and VAT number, the customer, items, discount, total, paid and balance due.'],
      },
      {
        id: 'delete',
        title: 'Delete a sale',
        by: ['SALES', 'OWNER'],
        steps: ['Open the sale and click **Delete**, then **Delete sale**.'],
        notes: ['The units go back into stock and the sale’s cheques are removed. The shipment’s status is not changed — use **Undo last** on the shipment if needed.'],
      },
    ],
  },

  // ---------------------------------------------------------------- Reports
  {
    id: 'reports',
    title: 'Reports',
    path: '/reports',
    summary: 'Six reports with totals, CSV export for Excel, and printing.',
    functions: [
      {
        id: 'choose',
        title: 'Open a report',
        by: ['FINANCE', 'OWNER'],
        steps: ['Click **Reports** in the sidebar.', 'Click a tab: **Shipments**, **Purchases**, **Landed cost & profit**, **Sales**, **Receivables** or **Cheques**.'],
        notes: [
          '**Shipments**: by status, by supplier, all shipments with order value.',
          '**Purchases**: by month, by supplier with share, all orders (USD).',
          '**Landed cost & profit**: goods, bank, clearance, landed cost, per unit, sales, profit and margin per shipment.',
          '**Sales**: by customer (with district), by product, by month (LKR).',
          '**Receivables**: ageing (0–30, 31–60, over 60 days), by customer, unpaid sales.',
          '**Cheques**: by status and every cheque.',
        ],
      },
      {
        id: 'period',
        title: 'Choose a period',
        by: ['FINANCE'],
        steps: ['On Shipments, Purchases, Sales or Cheques, pick **From** and/or **To** dates.', 'Click **Clear** to show all dates again.'],
        notes: ['Landed cost & profit and Receivables always show the position as of today.'],
      },
      {
        id: 'csv',
        title: 'Export a table to Excel (CSV)',
        by: ['FINANCE'],
        steps: ['Click **Export CSV** above the table you want.', 'Open the downloaded file in Excel.'],
        notes: ['Numbers are exported as plain numbers and dates as YYYY-MM-DD, ready for formulas.'],
      },
      {
        id: 'print',
        title: 'Print a report',
        by: ['FINANCE', 'OWNER'],
        steps: ['Click **Print** at the top of the page.', 'Print it or choose **Save as PDF**.'],
      },
    ],
  },

  // ---------------------------------------------------------------- Settings
  {
    id: 'settings',
    title: 'Settings',
    path: '/settings',
    summary: 'Company details, default rates, the lists used in dropdowns, and the demo data.',
    functions: [
      {
        id: 'company',
        title: 'Update the company profile',
        by: ['OWNER'],
        steps: [
          'Click **Settings** in the sidebar.',
          'Under **Company profile**, edit the **Company name**, **Address**, **Phone**, **Email**, **TIN** and **VAT number**.',
          'Click **Save company details**. “Saved” appears.',
        ],
        notes: [
          'These appear on purchase orders and sales invoices.',
          'TIN is 9 digits (e.g. `134567890`); the VAT number is the TIN followed by `-7000`.',
        ],
      },
      {
        id: 'rates',
        title: 'Set the default exchange rate and mark-up',
        by: ['OWNER'],
        steps: [
          'Under **Rates & pricing**, enter the **Default exchange rate (LKR per 1 USD)** and the **Target mark-up on cost (%)**.',
          'Click **Save rates**.',
        ],
        notes: [
          'The rate is the starting value for new bank payments and for costing amounts not yet paid.',
          'The hint converts the mark-up to the margin on the selling price.',
        ],
      },
      {
        id: 'lists',
        title: 'Manage dropdown lists',
        by: ['OWNER'],
        steps: [
          'Under **Lists**, find the list: Banks, Ports, Shipping lines, Clearing agents (CHA), Warehouses, Units of measure.',
          'Type a new name and press **Enter** (or click **Add**).',
          'Click the **×** on a name to remove it.',
        ],
        notes: ['Changes apply immediately. Removing a name never changes records that already use it. Duplicates are refused.'],
      },
      {
        id: 'export',
        title: 'Export all data',
        by: ['OWNER'],
        steps: ['Under **Demo data**, click **Export all data (JSON)**.', 'Keep the downloaded file as a copy.'],
      },
      {
        id: 'reset',
        title: 'Reset the demo data',
        by: ['OWNER'],
        steps: ['Under **Demo data**, click **Reset demo data**.', 'Read the warning and click **Reset everything** (or **Cancel**).'],
        notes: ['Everything you added or changed is replaced by the original sample data. It cannot be undone — export first if you want a copy.'],
      },
    ],
  },
]
