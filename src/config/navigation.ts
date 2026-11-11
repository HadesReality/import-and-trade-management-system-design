import {
  Banknote,
  BookOpen,
  Calculator,
  ChartColumn,
  Factory,
  FileText,
  Landmark,
  LayoutDashboard,
  Receipt,
  Settings,
  Ship,
  ShoppingCart,
  Stamp,
  Users,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'
import type { Role } from './roles'

export interface NavItem {
  path: string
  label: string
  icon: LucideIcon
  group: string
  roles: Role[]
  /** One-line explanation of the screen (used in the documentation). */
  description: string
}

const ALL: Role[] = ['OWNER', 'PURCHASING', 'LOGISTICS', 'FINANCE', 'WAREHOUSE', 'SALES']

export const NAV_ITEMS: NavItem[] = [
  {
    path: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    group: 'Overview',
    roles: ALL,
    description: 'Summary of shipments, arrivals, stock, receivables and alerts.',
  },
  {
    path: '/suppliers',
    label: 'Suppliers',
    icon: Factory,
    group: 'Purchasing',
    roles: ['OWNER', 'PURCHASING'],
    description: 'Overseas suppliers, contacts, products and negotiation notes.',
  },
  {
    path: '/purchase-orders',
    label: 'Purchase Orders / LOI',
    icon: FileText,
    group: 'Purchasing',
    roles: ['OWNER', 'PURCHASING'],
    description: 'Issue LOIs and purchase orders with items, prices and payment terms.',
  },
  {
    path: '/invoices',
    label: 'Invoices & Contracts',
    icon: Receipt,
    group: 'Purchasing',
    roles: ['OWNER', 'PURCHASING', 'FINANCE'],
    description: 'Supplier invoices, sales contracts, payment terms and advance payments.',
  },
  {
    path: '/shipments',
    label: 'Shipments',
    icon: Ship,
    group: 'Shipping & Clearance',
    roles: ['OWNER', 'PURCHASING', 'LOGISTICS', 'FINANCE'],
    description: 'Vessel, BL, ETD/ETA, containers, documents and status of every shipment.',
  },
  {
    path: '/clearance',
    label: 'Clearance',
    icon: Stamp,
    group: 'Shipping & Clearance',
    roles: ['OWNER', 'LOGISTICS', 'FINANCE'],
    description: 'Handover to the clearing agent, CusDec number, duties, bills and release.',
  },
  {
    path: '/bank',
    label: 'Bank & Payments',
    icon: Landmark,
    group: 'Finance',
    roles: ['OWNER', 'FINANCE'],
    description: 'TT, LC and DP payments, exchange rates, bank charges and document collection.',
  },
  {
    path: '/costing',
    label: 'Costing',
    icon: Calculator,
    group: 'Finance',
    roles: ['OWNER', 'FINANCE'],
    description: 'Landed cost per shipment and per unit, suggested selling price and profit.',
  },
  {
    path: '/cheques',
    label: 'Cheques',
    icon: Banknote,
    group: 'Finance',
    roles: ['OWNER', 'FINANCE', 'SALES'],
    description: 'Customer cheques: pending, deposited, cleared or returned.',
  },
  {
    path: '/warehouse',
    label: 'Warehouse / Stock',
    icon: Warehouse,
    group: 'Sales & Stock',
    roles: ['OWNER', 'WAREHOUSE', 'SALES'],
    description: 'Receive released containers, track stock, adjustments and movements.',
  },
  {
    path: '/customers',
    label: 'Customers',
    icon: Users,
    group: 'Sales & Stock',
    roles: ['OWNER', 'SALES', 'FINANCE'],
    description: 'Local buyers, purchase history and outstanding balances.',
  },
  {
    path: '/sales',
    label: 'Sales',
    icon: ShoppingCart,
    group: 'Sales & Stock',
    roles: ['OWNER', 'SALES'],
    description: 'Full-container and warehouse sales, payments and sales invoices.',
  },
  {
    path: '/reports',
    label: 'Reports',
    icon: ChartColumn,
    group: 'Admin',
    roles: ['OWNER', 'FINANCE'],
    description: 'Shipments, purchases, landed cost, profit, sales and receivables reports.',
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: Settings,
    group: 'Admin',
    roles: ['OWNER'],
    description: 'Company profile, master lists, exchange rate and demo data reset.',
  },
  {
    path: '/docs',
    label: 'Help & Documentation',
    icon: BookOpen,
    group: 'Help',
    roles: ALL,
    description: 'How to use every function, role by role.',
  },
]

export const NAV_GROUPS = Array.from(new Set(NAV_ITEMS.map((i) => i.group)))

export const navItemsForRole = (role: Role) => NAV_ITEMS.filter((i) => i.roles.includes(role))
