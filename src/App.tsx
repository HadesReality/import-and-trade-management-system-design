import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { NotFoundPage } from './pages/NotFoundPage'
import { BankDetailPage } from './pages/bank/BankDetailPage'
import { BankFormPage } from './pages/bank/BankFormPage'
import { BankPage } from './pages/bank/BankPage'
import { ChequesPage } from './pages/cheques/ChequesPage'
import { ClearanceDetailPage } from './pages/clearance/ClearanceDetailPage'
import { ClearanceFormPage } from './pages/clearance/ClearanceFormPage'
import { ClearancePage } from './pages/clearance/ClearancePage'
import { CustomerDetailPage } from './pages/customers/CustomerDetailPage'
import { CustomersPage } from './pages/customers/CustomersPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { DocsPage } from './pages/docs/DocsPage'
import { DocsShell } from './pages/docs/DocsShell'
import { InvoiceDetailPage } from './pages/invoices/InvoiceDetailPage'
import { InvoiceFormPage } from './pages/invoices/InvoiceFormPage'
import { InvoicesPage } from './pages/invoices/InvoicesPage'
import { PODetailPage } from './pages/purchaseOrders/PODetailPage'
import { POFormPage } from './pages/purchaseOrders/POFormPage'
import { PurchaseOrdersPage } from './pages/purchaseOrders/PurchaseOrdersPage'
import { ReportsPage } from './pages/reports/ReportsPage'
import { SaleDetailPage } from './pages/sales/SaleDetailPage'
import { SaleFormPage } from './pages/sales/SaleFormPage'
import { SalesPage } from './pages/sales/SalesPage'
import { SettingsPage } from './pages/settings/SettingsPage'
import { ShipmentDetailPage } from './pages/shipments/ShipmentDetailPage'
import { ShipmentsPage } from './pages/shipments/ShipmentsPage'
import { SupplierDetailPage } from './pages/suppliers/SupplierDetailPage'
import { SuppliersPage } from './pages/suppliers/SuppliersPage'
import { WarehousePage } from './pages/warehouse/WarehousePage'

// Screens that draw charts load on demand, so the charting library isn't part of the first page load.
const CostingPage = lazy(() => import('./pages/costing/CostingPage').then((m) => ({ default: m.CostingPage })))
const ShipmentCostingPage = lazy(() => import('./pages/costing/ShipmentCostingPage').then((m) => ({ default: m.ShipmentCostingPage })))
// Developer-only component gallery; not part of the app the client sees.
const UiKitPage = lazy(() => import('./pages/UiKitPage').then((m) => ({ default: m.UiKitPage })))

export default function App() {
  return (
    <Routes>
      {/* The documentation is a separate section with its own frame — no app sidebar. */}
      <Route
        path="docs"
        element={
          <DocsShell>
            <DocsPage />
          </DocsShell>
        }
      />

      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />

        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="suppliers/:id" element={<SupplierDetailPage />} />

        <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
        <Route path="purchase-orders/new" element={<POFormPage />} />
        <Route path="purchase-orders/:id" element={<PODetailPage />} />
        <Route path="purchase-orders/:id/edit" element={<POFormPage />} />

        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="invoices/new" element={<InvoiceFormPage />} />
        <Route path="invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="invoices/:id/edit" element={<InvoiceFormPage />} />

        <Route path="shipments" element={<ShipmentsPage />} />
        <Route path="shipments/:id" element={<ShipmentDetailPage />} />

        <Route path="clearance" element={<ClearancePage />} />
        <Route path="clearance/new" element={<ClearanceFormPage />} />
        <Route path="clearance/:id" element={<ClearanceDetailPage />} />
        <Route path="clearance/:id/edit" element={<ClearanceFormPage />} />

        <Route path="bank" element={<BankPage />} />
        <Route path="bank/new" element={<BankFormPage />} />
        <Route path="bank/:id" element={<BankDetailPage />} />
        <Route path="bank/:id/edit" element={<BankFormPage />} />

        <Route path="costing" element={<CostingPage />} />
        <Route path="costing/:id" element={<ShipmentCostingPage />} />

        <Route path="cheques" element={<ChequesPage />} />
        <Route path="warehouse" element={<WarehousePage />} />

        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />

        <Route path="sales" element={<SalesPage />} />
        <Route path="sales/new" element={<SaleFormPage />} />
        <Route path="sales/:id" element={<SaleDetailPage />} />

        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />

        {import.meta.env.DEV && <Route path="ui-kit" element={<UiKitPage />} />}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
