# Build Plan — Import Trade Management System (Frontend Prototype)

Built from `DOCUMENT.md`. Frontend only, React + Vite, mock data in the browser.
Each phase ends with a working app that can be opened in the browser and reviewed before the next phase starts.

## Technical decisions

| Area | Choice | Note |
|---|---|---|
| Build tool | Vite | `npm run dev` for development |
| UI library | React 18 + TypeScript | |
| Styling | Tailwind CSS v4 | Own small component set in shadcn style (no shadcn CLI, fewer moving parts) |
| Routing | React Router | One route per screen in DOCUMENT.md §6 |
| State | Zustand + localStorage | Mock data seeded on first run; "Reset demo data" restores it |
| Tables | Own `DataTable` component | Search, sort, pagination; replaces TanStack Table to keep it simple |
| Forms | Controlled React forms + small validation helper | Replaces React Hook Form + Zod to keep it simple |
| Charts | Recharts | Dashboard, costing, reports |
| Dates | date-fns | |
| Icons | lucide-react | |

## Phases

| # | Phase | Delivers | Status |
|---|---|---|---|
| 1 | **Project setup & app shell** | Vite + React + TS + Tailwind + Router; sidebar with all 14 menu items, top bar, role switcher (menu changes by role), placeholder page per screen | ✅ |
| 2 | **Data foundation** | Types for all 11 entities, realistic mock seed data, Zustand store with localStorage + reset, currency/date formatters, landed-cost calculator, shared UI (Button, Card, Badge, Input, Select, Modal, Tabs, DataTable, StatusBadge) | ✅ |
| 3 | **Suppliers** | Supplier list, detail (orders, negotiation notes), add/edit form; Sri Lankan details added (company TIN/VAT, customer districts, sourcing countries with dial codes) | ✅ |
| 4 | **Purchase Orders / LOI** | PO/LOI list, create/edit with line items and payment terms, detail with printable preview | ✅ |
| 5 | **Supplier Invoices & Contracts** | Invoice list and form linked to PO, advance payment, PO-amount mismatch warning, attachments (browser preview) | ✅ |
| 6 | **Shipments** | List (table + kanban by stage), shipment detail: shipping info, containers, document checklist, timeline, change status | ✅ |
| 7 | **Bank & Payments** | Advance and document-collection payments, LC details, exchange rate → LKR, charges, LC expiry alerts; updates shipment status | ✅ |
| 8 | **Clearance** | Handover to clearing agent, CusDec no., duties and bills, release date; updates shipment status | ✅ |
| 9 | **Costing** | Landed cost per shipment and per unit, cost breakdown chart, suggested selling price, profit | ✅ |
| 10 | **Warehouse / Stock** | Receive released shipment into warehouse, stock list, adjustments, movements | ✅ |
| 11 | **Customers & Sales** | Customer list/detail; full-container sale and warehouse sale; payments (cash/cheque/credit); printable sales invoice | ✅ |
| 12 | **Cheques** | Cheque list, status flow (pending → deposited → cleared / returned), due and returned highlights; shipments close automatically when everything is paid and cleared | ✅ |
| 13 | **Dashboard** | Summary cards, shipment pipeline, upcoming arrivals, alerts, charts; content adapts to the selected role | ✅ |
| 14 | **Reports & Settings** | Reports with CSV export/print; settings: company profile, master lists, exchange rate, reset demo data | ✅ |
| 15 | **Polish & demo check** | Responsive pass, empty states, run the 9-step demo scenario from DOCUMENT.md §10 end to end, README | ✅ |

Legend: ⬜ not started · ⏳ in progress · ✅ done
