# ImportFlow — Import Trade Management (frontend prototype)

A clickable prototype of a system for a Sri Lankan importer: buy from overseas suppliers, pay through the bank (TT / LC / DP), clear goods through a clearing agent, keep stock in the warehouse, and sell as full containers or from the warehouse — with landed cost, profit and cheque tracking.

> **This is a frontend-only prototype.** There is no server and no database. Everything you enter is kept in your browser (localStorage) and starts from realistic sample data. See [DOCUMENT.md](DOCUMENT.md) for the full specification and [PLAN.md](PLAN.md) for the build plan.

## Live demo

**https://hadesreality.github.io/import-and-trade-management-system-design/**

It is rebuilt and published automatically by GitHub Actions ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) every time `main` is updated. The user guide is at `/docs` on the same site.

## Run it

Requires Node.js 20.19 or newer (22 recommended).

```bash
npm install
npm run dev
```

Then open the address shown (normally `http://localhost:5173`).

Other commands:

| Command | What it does |
|---|---|
| `npm run build` | Type-checks and builds the production files into `dist/` |
| `npm run preview` | Serves the production build locally |
| `npm run typecheck` | Type-checks only |

The built `dist/` folder is plain static files, so it can be hosted anywhere (Netlify, Vercel, GitHub Pages, any web server).

**Hosting under a sub-path** (as GitHub Pages does for project sites) — set `BASE_PATH` when building, and serve `index.html` for unknown paths so direct links like `/docs` open:

```bash
BASE_PATH=/my-repo-name/ npm run build   # then copy dist/index.html to dist/404.html on GitHub Pages
```

Without `BASE_PATH` the app is built for the site root, which is what `npm run dev` and `npm run build` use locally.

## What's in it

14 working screens plus the built-in user guide, all reachable from the sidebar. The guide is at `http://localhost:5173/docs` while `npm run dev` is running; its content lives in `src/docs/` (update it there when a screen changes).

| Screen | What you can do |
|---|---|
| **Dashboard** | Role-aware summary cards, shipment pipeline, upcoming arrivals, alerts from across the system, charts |
| **Suppliers** | Supplier list, contacts, negotiation notes, orders and shipments per supplier |
| **Purchase Orders / LOI** | Create and issue POs or LOIs, convert an LOI to a PO, print the order |
| **Invoices & Contracts** | Record supplier invoices, advance payments, attach scans, warning when the invoice differs from the order |
| **Shipments** | Table and board views; vessel, BL, ETD/ETA, containers, document checklist, status timeline |
| **Clearance** | Hand over to a clearing agent, CusDec number, duties (optionally split into CID, PAL, VAT, SSCL, Cess) and bills, release |
| **Bank & Payments** | Advance and documents payments, exchange rate to LKR, bank charges, LC details and expiry alerts |
| **Costing** | Landed cost per shipment and per unit, cost mix chart, suggested prices, realised profit |
| **Warehouse / Stock** | Receive a released container, stock list, adjustments (damage, loss), movement history |
| **Customers** | Sri Lankan customers by district, purchase history, outstanding balance |
| **Sales** | Full-container and warehouse sales, cash / cheque / credit, printable invoice |
| **Cheques** | Pending → Deposited → Cleared / Returned, post-dated cheque rules, due and returned highlights |
| **Reports** | Six reports with date range, CSV export and print |
| **Settings** | Company details (TIN / VAT), default exchange rate and mark-up, dropdown lists, demo data tools |
| **Help & Documentation** (`/docs`) | Step-by-step instructions for every function, filtered by role, with search, the full process, automatic updates, a glossary and FAQ |

### Roles

There is no login. Use the **role switcher** in the top bar to see what each person would see: Owner / Admin, Purchasing, Logistics Coordinator, Finance, Warehouse, Sales. The menu, dashboard and alerts change with the role.

### Things that happen automatically

The system keeps related records in step so nobody has to update the same fact twice:

- Recording an invoice marks the order *Invoiced* and moves its shipment to *Invoice Received*.
- A paid advance moves the shipment to *Advance Paid*; paying the bank and collecting the documents moves an arrived shipment to *Bank Docs Collected* and turns the bank's documents into originals.
- Handing over to the clearing agent and releasing the goods move the shipment through *With Clearing Agent* to *Cleared & Released*.
- Receiving a container creates stock; a short delivery is saved as a visible adjustment.
- A sale reduces stock, adds a stock movement, and moves the shipment to *Partly Sold*, *Fully Sold* or *Sold as Full Container*.
- A shipment becomes *Closed* once everything is sold, every sale is paid and every cheque has cleared — and reopens if a cheque is returned.

### Sri Lanka specifics

LKR and USD amounts, Colombo as the default discharge port, Sri Lankan banks, clearing agents (CHA), the 25 districts, phone number checks (`+94 …` / `0…`), company TIN and VAT numbers, CusDec numbers, post-dated cheques, and customs levies (CID, PAL, VAT, SSCL, Cess).

## Important limits of a prototype

- **Data lives in your browser only.** Clearing the browser's site data, or using a different browser, starts again from the sample data. Use **Settings → Export all data** for a copy, and **Reset demo data** to start over.
- **Attached files are not stored.** Only file names are kept; a file can be previewed in the session where it was added.
- **No real integrations.** Nothing connects to Sri Lanka Customs (ASYCUDA), banks, shipping lines, WhatsApp or email.
- **Customs duties are entered, not calculated.** They come from the clearing agent's bill; rates change by gazette, so the prototype does not guess them.
- **Exchange rates are typed in** (default in Settings); there is no live rate feed.
- **Dates in the sample data move with today's date**, so arrivals, LC expiries and cheque due dates always look current.

## How it is built

React 18 + TypeScript + Vite, Tailwind CSS v4, React Router, Zustand (with localStorage), Recharts (loaded only on the screens that draw charts), date-fns, lucide icons. No other runtime dependencies.

```
src/
  components/   shared UI (buttons, tables, modals, badges…), layout, charts helpers
  config/       roles, navigation, status labels and colours, Sri Lankan reference data
  data/         the sample data (seed.ts)
  lib/          pure logic: costing, calc, stock, bank, clearance, reports, dashboard, settlement
  pages/        one folder per screen (list, form, detail pages)
  store/        data store (all records) and UI store (selected role)
  types.ts      the record types
```

All reads and writes go through `src/store/dataStore.ts` (`add`, `update`, `remove`). To turn the prototype into a real system, replace that one file with calls to an API and keep the screens as they are.

## Suggested next steps for a real system

1. Backend API and database, user accounts and permissions (the role switcher already shows the intended access).
2. Real document storage and an audit history of who changed what.
3. WhatsApp / email notifications for ETA, LC expiry and cheque due dates.
4. Exchange-rate feed, and a customs duty estimator maintained against the published tariff.
5. Accounting export or integration, and optional local delivery and branch pricing if the client needs it.
