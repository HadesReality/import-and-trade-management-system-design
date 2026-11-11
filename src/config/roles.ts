export type Role = 'OWNER' | 'PURCHASING' | 'LOGISTICS' | 'FINANCE' | 'WAREHOUSE' | 'SALES'

export const ROLES: { id: Role; label: string; description: string }[] = [
  { id: 'OWNER', label: 'Owner / Admin', description: 'Sees everything, including profit and settings' },
  { id: 'PURCHASING', label: 'Purchasing', description: 'Suppliers, purchase orders, supplier invoices' },
  { id: 'LOGISTICS', label: 'Logistics Coordinator', description: 'Shipments, documents, clearance' },
  { id: 'FINANCE', label: 'Finance', description: 'Bank payments, costing, cheques, reports' },
  { id: 'WAREHOUSE', label: 'Warehouse', description: 'Receiving containers and stock' },
  { id: 'SALES', label: 'Sales', description: 'Customers, sales and payments' },
]

export const roleLabel = (role: Role) => ROLES.find((r) => r.id === role)?.label ?? role
