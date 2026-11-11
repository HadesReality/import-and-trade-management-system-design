# Import Trade Management System — Frontend Prototype

> **Document type:** Product & UI specification
> **Scope:** Frontend only (no backend, no real database, no live integrations)
> **Date:** 11 November 2026
> **Source of requirements:** Client voice note (Sinhala, ~3 min) describing the current import workflow

---

## 1. Purpose

The client is a Sri Lankan importer who buys goods from overseas suppliers, clears them through Sri Lanka Customs with the help of a logistics/clearing company, and sells them locally — either as full containers or split from a warehouse.

Today the whole process runs on **WhatsApp, email and paper**. Purchase orders, invoices, Bills of Lading, bank payments and sales are scattered across chats and files, so nobody has one place to see where a shipment is, what it has cost, or who still owes money.

This project is a **clickable frontend prototype** that shows the client how a single system would organise their workflow end to end. It is used to:

1. Validate the idea and the screens with the client before any backend is built.
2. Agree on the data that must be captured at every step.
3. Serve as the base UI for a future full system (the backend can be added later without redesigning the screens).

---

## 2. Scope

### 2.1 In scope (frontend only)

- All screens, forms, tables, dashboards and navigation described in this document.
- **Mock data** (realistic sample suppliers, POs, shipments, sales) loaded on first run.
- Data entered by the user is kept **in the browser (localStorage)** so the demo feels real; a "Reset demo data" button restores the sample data.
- Calculations done in the browser: currency conversion, landed cost, profit, due dates, transit time.
- A **role switcher** (no login) to preview what each type of user sees.
- File "uploads" for documents are previewed in the browser only (not stored on a server).
- Responsive layout (desktop first, usable on tablet/mobile).

### 2.2 Out of scope

- Backend server, API, real database, user accounts and authentication.
- Real integration with Sri Lanka Customs (ASYCUDA World), banks, shipping lines, WhatsApp or email.
- Real document storage, real notifications (SMS/email/WhatsApp).
- Automatic customs duty calculation (duties are entered from the clearing agent's bill).
- District/branch delivery pricing and courier integration (not part of the client's request).

---

## 3. The Client's Workflow (as described)

| Step | What happens | What the system must capture |
|---|---|---|
| 1. Negotiation | Price and payment terms are agreed with the supplier, usually over WhatsApp. | Supplier, products, agreed price, payment terms, notes / chat screenshots. |
| 2. Order | The client issues an **LOI (Letter of Intent)** or a **Purchase Order (PO)**. | PO/LOI number, date, supplier, items, quantities, unit prices (USD), special conditions. |
| 3. Invoice & contract | Supplier sends an **invoice**, sometimes a **sales contract**. Payment term is **DP**, **LC** or **TT**; sometimes an **advance** is paid. | Invoice number, contract number, amount (USD), payment term, advance amount and date. |
| 4. Shipping | Supplier prepares goods, arranges the vessel, loads, and sends scanned **BL, invoice, packing list**. | Vessel name, voyage, BL number, loading port, ETD, ETA to Sri Lanka, transit time, containers, USD value, document scans. |
| 5. Bank | When goods arrive, original documents go to the bank. Client pays the bank at the **daily exchange rate** plus **document charges** and **commission** to collect the documents. | Bank, LC number (if LC), exchange rate, USD amount, LKR amount, document charges, commission, payment date. |
| 6. Customs & logistics | Documents are handed to a **logistics/clearing company**, which works with Customs to pay duties and release the goods. | Clearing company, handover date, CusDec number, duty & tax amount, logistics bills, release date. |
| 7. Sales | Goods go to marketing, then sales: sold as a **full container** to one buyer, or sent to the **warehouse**, split, and sold to **multiple buyers**. | Sale type, buyer, items/quantities, selling price, warehouse stock movements. |
| 8. Payment | Buyer pays by **cash** or **cheque**. | Payment method, cheque number, bank, cheque date, status (pending / deposited / cleared / returned). |

---

## 4. Users and Roles

There is no login in the prototype. A **role switcher** in the top bar changes the menu and dashboard to show what each role would see.

| Role | Main screens | Typical actions |
|---|---|---|
| **Owner / Admin** | Everything | View dashboard, profit, all shipments; manage settings. |
| **Purchasing** | Suppliers, Purchase Orders, Invoices | Create LOI/PO, record supplier invoices and contracts. |
| **Logistics Coordinator** | Shipments, Clearance | Update vessel/ETA, upload BL & documents, hand over to clearing agent. |
| **Finance** | Bank & Payments, Costing, Cheques | Record LC/TT/DP payments, exchange rates, bank charges, duties, cheque status. |
| **Warehouse** | Warehouse / Stock | Receive containers, split stock, issue goods for sales. |
| **Sales** | Customers, Sales | Create full-container or warehouse sales, record payments. |

---

## 5. Shipment Lifecycle (status flow)

Every purchase is tracked as one **Shipment File** that moves through these statuses:

```
Negotiation
   → PO / LOI Issued
   → Invoice Received
   → Advance Paid (optional)
   → Loaded / Shipped (ETD)
   → In Transit
   → Arrived in Sri Lanka (ETA)
   → Bank Documents Collected
   → With Clearing Agent
   → Cleared & Released
   → Sold as Full Container  ─┐
   → In Warehouse → Partly Sold → Fully Sold ─┤
                                              → Closed (all payments received)
```

Each status shows as a coloured badge and on a **timeline** inside the shipment detail page, with the date and the user role that changed it.

---

## 6. Screens

### 6.1 Navigation (sidebar)

1. Dashboard
2. Suppliers
3. Purchase Orders / LOI
4. Supplier Invoices & Contracts
5. Shipments
6. Bank & Payments
7. Clearance
8. Costing
9. Warehouse / Stock
10. Customers
11. Sales
12. Cheques
13. Reports
14. Settings

### 6.2 Dashboard

- **Summary cards:** shipments in transit, arriving this week, awaiting bank documents, with clearing agent, stock value in warehouse, receivables outstanding, cheques due this week.
- **Shipment pipeline:** a board showing how many shipments are at each status (click to filter).
- **Upcoming arrivals:** table of vessel, ETA, days remaining.
- **Alerts:** LC expiring soon, ETA passed but not cleared, cheques due, returned cheques, missing documents.
- **Charts:** monthly purchases (USD/LKR), monthly sales, profit by shipment.

### 6.3 Suppliers

- **List:** name, country, contact person, WhatsApp number, email, number of orders, total purchased (USD).
- **Detail:** contact info, products supplied, past POs and shipments, **negotiation notes** (date, note, attached screenshots/quotes), usual payment terms.
- **Form:** add / edit supplier.

### 6.4 Purchase Orders / LOI

- **List:** document type (PO / LOI), number, date, supplier, total (USD), payment term, status.
- **Create / edit form:**
  - Type: PO or LOI
  - Number (auto-suggested), date, supplier
  - Line items: product, description, HS code (optional), quantity, unit, unit price (USD), line total
  - Incoterm (FOB, CFR, CIF, etc.)
  - Payment term: **TT**, **LC**, **DP**, **Advance %**
  - Special conditions (free text)
  - Expected shipment date
- **Detail:** printable PO/LOI preview, linked invoice and shipment, status.

### 6.5 Supplier Invoices & Contracts

- **List:** invoice number, linked PO, supplier, amount (USD), payment term, advance paid, status.
- **Form:** invoice number, date, linked PO, amount (USD), sales contract number (optional), payment term, advance amount & date, special conditions, attach scanned invoice/contract.
- Warning if the invoice amount differs from the PO total.

### 6.6 Shipments

- **List:** shipment ID, supplier, vessel, BL number, loading port, ETD, ETA, days to arrival, status.
  Filters by status, supplier, ETA range. Toggle between **table** and **kanban board** by status.
- **Shipment detail (main screen of the system):**
  - Header: shipment ID, supplier, status badge, quick "Change status" action.
  - **Shipping info:** vessel name, voyage number, shipping line, BL number, loading port, discharge port (default Colombo), ETD, ETA, transit time (calculated), container numbers and sizes (20ft / 40ft), FCL/LCL.
  - **Value:** invoice amount (USD), linked PO and invoice.
  - **Documents checklist:** BL, commercial invoice, packing list, certificate of origin, insurance, other — each shows *received copy / original at bank / missing*, with file preview.
  - **Timeline:** every status change with date and role.
  - **Tabs:** Bank, Clearance, Costing, Sales — summaries linking to those modules.

### 6.7 Bank & Payments

- **List:** shipment, bank, payment term, LC number, USD amount, exchange rate, LKR amount, status (pending / paid).
- **Form:**
  - Payment term: TT / LC / DP / Advance
  - Bank name, LC number, LC opening date, LC expiry date (LC only)
  - USD amount, **exchange rate on the payment date**, LKR amount (calculated)
  - Document charges (LKR), commission (LKR), other bank charges
  - Payment date, documents collected date
- Alerts for LCs close to expiry.

### 6.8 Clearance

- **List:** shipment, clearing company, handover date, CusDec number, duty amount, release date, status.
- **Form:** clearing/logistics company, handover date, CusDec number, customs duties & taxes (LKR, entered from the agent's bill), port & handling charges, transport charges, clearing agent fee, other charges, release date, attach bills.

### 6.9 Costing (Landed Cost)

Calculated per shipment in the browser:

```
Goods cost (LKR)       = Invoice amount (USD) × Exchange rate
Bank charges (LKR)     = Document charges + Commission + Other bank charges
Clearance cost (LKR)   = Duties & taxes + Port/handling + Transport + Agent fee + Other
Total landed cost      = Goods cost + Bank charges + Clearance cost
Landed cost per unit   = Total landed cost ÷ Total quantity
Suggested price        = Landed cost per unit × (1 + Target margin %)
Profit                 = Total sales value − Total landed cost
```

- Cost breakdown table and a pie/bar chart.
- Per-item landed cost (cost spread by value or by quantity — user choice).
- Margin and profit once sales are recorded.

### 6.10 Warehouse / Stock

- **Stock list:** product, shipment, warehouse location, quantity received, sold, remaining, landed cost per unit, stock value.
- **Receive container:** select a cleared shipment → confirm quantities received → stock is created.
- **Stock movements:** received, sold, adjusted (damaged / shortage) with dates.

### 6.11 Customers (Buyers)

- **List:** name, business, contact, phone, total purchases, outstanding balance.
- **Detail:** purchase history, payments, cheques, outstanding amount.

### 6.12 Sales

- **Sale type:**
  - **Full container** — select a shipment/container, one buyer, total price.
  - **Warehouse sale** — select items from stock, quantities, unit prices; many buyers over time.
- **Form:** sale number, date, customer, items, quantities, prices, discount, total, payment method (**cash / cheque / credit**), amount paid, balance.
- **Invoice preview** (printable).

### 6.13 Cheques

- **List:** cheque number, customer, bank, branch, amount, cheque date, status (**pending → deposited → cleared / returned**).
- Highlight cheques due today/this week and returned cheques.

### 6.14 Reports

- Shipments by status and by supplier.
- Purchases by month (USD and LKR).
- Landed cost and profit per shipment.
- Sales by customer and by product.
- Outstanding receivables and cheque summary.
- Export table to CSV/print (browser only).

### 6.15 Settings

- Company profile (name, logo, address) for printed documents.
- Master lists: banks, ports, shipping lines, clearing companies, warehouses, product units, payment terms.
- Default exchange rate (manual entry; today's rate used in forms).
- Role switcher and **Reset demo data**.

---

## 7. Mock Data Model

The prototype uses these entities (stored in localStorage, seeded from JSON):

| Entity | Key fields |
|---|---|
| Supplier | id, name, country, contactPerson, whatsapp, email, notes[] |
| Product | id, name, description, hsCode, unit |
| PurchaseOrder | id, type (PO/LOI), number, date, supplierId, items[], incoterm, paymentTerm, advancePercent, conditions, status |
| SupplierInvoice | id, number, date, poId, amountUsd, contractNumber, paymentTerm, advanceAmount, advanceDate, attachments[] |
| Shipment | id, poId, invoiceId, vessel, voyage, shippingLine, blNumber, loadingPort, dischargePort, etd, eta, containers[], documents[], status, timeline[] |
| BankPayment | id, shipmentId, term, bank, lcNumber, lcOpenDate, lcExpiry, amountUsd, exchangeRate, amountLkr, docCharges, commission, otherCharges, paidDate, docsCollectedDate |
| Clearance | id, shipmentId, clearingCompany, handoverDate, cusdecNumber, duties, portCharges, transport, agentFee, otherCharges, releaseDate, attachments[] |
| StockItem | id, shipmentId, productId, warehouse, qtyReceived, qtySold, unitCost |
| Customer | id, name, business, phone, address |
| Sale | id, number, date, type (FULL_CONTAINER/WAREHOUSE), customerId, shipmentId?, items[], total, paymentMethod, paid, balance |
| Cheque | id, saleId, customerId, number, bank, branch, amount, chequeDate, status |

All data access goes through a small **service layer** (e.g. `shipmentService.getAll()`), so a real API can replace localStorage later without changing the screens.

---

## 8. Recommended Frontend Technology

| Need | Choice |
|---|---|
| Framework | React 18 + TypeScript, built with Vite |
| Styling & components | Tailwind CSS + shadcn/ui |
| Routing | React Router |
| State & persistence | Zustand with localStorage persistence |
| Forms & validation | React Hook Form + Zod |
| Tables | TanStack Table (sorting, filtering, pagination) |
| Charts | Recharts |
| Dates | date-fns |
| Icons | Lucide |
| Hosting (demo) | Static hosting such as Vercel or Netlify |

---

## 9. Non-Functional Requirements

- **Usability:** clear status colours, minimal typing, sensible defaults (e.g. Colombo as discharge port), forms split into sections.
- **Responsive:** works on laptop, tablet and phone.
- **Performance:** pages load instantly with mock data (hundreds of records).
- **Currency & dates:** USD and LKR formatting (`USD 12,500.00`, `LKR 3,812,500.00`); dates as `DD MMM YYYY`.
- **Language:** English UI first; layout ready for Sinhala labels later.
- **Accessibility:** keyboard navigation, readable contrast, labels on all form fields.
- **Print:** PO/LOI, sales invoice and shipment summary printable from the browser.

---

## 10. Demo Scenario (for client presentation)

1. Open the dashboard → see 6 shipments at different stages.
2. Add a new supplier → create a PO with a TT 30% advance.
3. Record the supplier invoice and advance payment.
4. Create the shipment: vessel, BL, ETD, ETA; upload BL and packing list.
5. Move status to **Arrived** → record bank payment with exchange rate and charges.
6. Hand over to the clearing agent → enter duties and bills → mark **Released**.
7. Open **Costing** → see landed cost per unit and suggested selling price.
8. Sell half as a warehouse sale (paid by cheque) and see stock reduce.
9. Mark the cheque as cleared → see profit on the shipment and the dashboard update.

---

## 11. Future Phases (after the prototype is approved)

1. Backend API and database, user login and permissions.
2. Real document storage and audit history.
3. WhatsApp / email notifications for ETA, LC expiry and cheque due dates.
4. Exchange rate feed and customs duty estimator.
5. Accounting integration or export.
6. Optional: local delivery, branch distribution and delivery pricing, if the client needs it.

---

## 12. Open Questions for the Client

1. Does the company always act as the **importer** (paying the bank and Customs), or do some buyers clear goods themselves?
2. Which payment terms are used most (TT, LC, DP)? How many banks are involved?
3. Do you **deliver** goods to buyers, or do buyers collect from the warehouse/port? Do you have branches?
4. How many shipments per month, and are they mostly full containers (FCL)?
5. Which documents must always be tracked (BL, invoice, packing list, certificate of origin, insurance, others)?
6. How many people will use the system, and in which roles?
7. Which accounting software do you use today?
8. Which reports matter most to you (profit per container, outstanding cheques, etc.)?
