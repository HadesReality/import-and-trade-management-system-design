import { lazy, Suspense, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, Anchor, Banknote, Calculator, CheckCircle2, ChevronRight, Clock, FileText, Landmark, Package, Plus, Receipt, Ship, ShoppingCart, Stamp, TrendingUp, Warehouse } from 'lucide-react'
import { ErrorBoundary } from '../../components/ErrorBoundary'
import { Badge, Button, Card, CardBody, CardHeader, StatCard, StatusBadge } from '../../components/ui'
import { roleLabel, ROLES, type Role } from '../../config/roles'
import { SHIPMENT_STAGES, SHIPMENT_STATUS } from '../../config/statuses'
import { computeDashboard, type Alert, type AlertLevel } from '../../lib/dashboard'
import { formatDate, formatLkr, formatUsd } from '../../lib/format'
import { etaInfo } from '../../lib/shipments'
import { useDataStore } from '../../store/dataStore'
import { useUiStore } from '../../store/uiStore'

const DashboardCharts = lazy(() => import('./DashboardCharts'))

const LEVEL_STYLE: Record<AlertLevel, string> = {
  high: 'border-red-200 bg-red-50 text-red-900 hover:bg-red-100',
  medium: 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100',
  info: 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
}

const QUICK_ACTIONS: { label: string; to: string; icon: typeof Plus; roles: Role[] }[] = [
  { label: 'New purchase order', to: '/purchase-orders/new', icon: FileText, roles: ['PURCHASING'] },
  { label: 'Record invoice', to: '/invoices/new', icon: Receipt, roles: ['PURCHASING'] },
  { label: 'Record bank payment', to: '/bank/new', icon: Landmark, roles: ['FINANCE'] },
  { label: 'Hand over to agent', to: '/clearance/new', icon: Stamp, roles: ['LOGISTICS'] },
  { label: 'New shipment', to: '/shipments', icon: Ship, roles: ['LOGISTICS', 'PURCHASING'] },
  { label: 'Receive container', to: '/warehouse', icon: Package, roles: ['WAREHOUSE'] },
  { label: 'New sale', to: '/sales/new', icon: ShoppingCart, roles: ['SALES'] },
  { label: 'Cheques', to: '/cheques', icon: Banknote, roles: ['FINANCE'] },
]

export function DashboardPage() {
  const navigate = useNavigate()
  const data = useDataStore()
  const role = useUiStore((s) => s.role)
  const [allAlerts, setAllAlerts] = useState(false)
  const d = useMemo(() => computeDashboard(data), [data])

  const can = (roles: Role[]) => role === 'OWNER' || roles.includes(role)
  // Pipeline and arrivals link into Shipments, so only show them to roles that can open it.
  const seesShipments = can(['PURCHASING', 'LOGISTICS', 'FINANCE'])
  const supplierName = (id: string) => data.suppliers.find((s) => s.id === id)?.name ?? '—'

  const cards: { id: string; roles: Role[]; node: ReactNode }[] = [
    { id: 'orders', roles: ['PURCHASING'], node: <StatCard label="Orders awaiting invoice" value={d.ordersAwaitingInvoice} icon={FileText} tone="amber" /> },
    { id: 'water', roles: ['PURCHASING', 'LOGISTICS'], node: <StatCard label="On the water" value={d.inTransit.length} hint={d.upcoming[0]?.eta ? `Next arrival ${formatDate(d.upcoming[0].eta)}` : undefined} icon={Ship} /> },
    { id: 'soon', roles: ['PURCHASING', 'LOGISTICS'], node: <StatCard label="Arriving within 7 days" value={d.arrivingSoon.length} icon={Clock} tone="amber" /> },
    { id: 'bank', roles: ['FINANCE', 'LOGISTICS'], node: <StatCard label="Awaiting bank documents" value={d.awaitingBank.length} hint="Arrived, not yet paid for" icon={Anchor} tone="purple" /> },
    { id: 'agent', roles: ['LOGISTICS', 'FINANCE'], node: <StatCard label="With clearing agent" value={d.withAgent} hint={d.readyToHandOver.length ? `${d.readyToHandOver.length} more ready to hand over` : undefined} icon={Stamp} tone="purple" /> },
    { id: 'receive', roles: ['WAREHOUSE'], node: <StatCard label="Ready to receive" value={d.readyToReceive.length} hint="Released by Customs" icon={Package} tone="amber" /> },
    { id: 'stock', roles: ['WAREHOUSE', 'SALES', 'FINANCE'], node: <StatCard label="Stock value (at cost)" value={formatLkr(d.stockValue)} hint={`${d.stockLines} product line(s) in stock`} icon={Warehouse} tone="green" /> },
    { id: 'pay', roles: ['FINANCE'], node: <StatCard label="Pending bank payments" value={formatUsd(d.pendingPayments.usd)} hint={`${d.pendingPayments.count} payment(s)`} icon={Landmark} tone="amber" /> },
    { id: 'recv', roles: ['FINANCE', 'SALES'], node: <StatCard label="Receivables outstanding" value={formatLkr(d.receivables)} hint={`${d.owingCustomers} customer(s) owe money`} icon={Receipt} tone="red" /> },
    { id: 'chq', roles: ['FINANCE', 'SALES'], node: <StatCard label="Cheques due within 7 days" value={d.chequesDue.count} hint={formatLkr(d.chequesDue.total)} icon={Banknote} tone="amber" /> },
    { id: 'month', roles: ['SALES', 'FINANCE'], node: <StatCard label="Sales this month" value={formatLkr(d.salesThisMonth)} icon={ShoppingCart} tone="green" /> },
    { id: 'profit', roles: ['FINANCE'], node: <StatCard label="Profit so far" value={formatLkr(d.profit)} hint={d.revenue > 0 ? `${((d.profit / d.revenue) * 100).toFixed(1)}% of sales` : undefined} icon={TrendingUp} tone={d.profit >= 0 ? 'green' : 'red'} /> },
  ]

  const myAlerts: Alert[] = d.alerts.filter((a) => can(a.roles))
  const shownAlerts = allAlerts ? myAlerts : myAlerts.slice(0, 6)
  const myActions = QUICK_ACTIONS.filter((a) => can(a.roles))
  const roleInfo = ROLES.find((r) => r.id === role)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Dashboard</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Viewing as <strong>{roleLabel(role)}</strong> — {roleInfo?.description.toLowerCase()}.
          </p>
        </div>
        {role !== 'OWNER' && myActions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {myActions.map((a) => (
              <Button key={a.label} variant="secondary" onClick={() => navigate(a.to)}>
                <a.icon size={14} /> {a.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.filter((c) => can(c.roles)).map((c) => (
          <div key={c.id} className="h-full">
            {c.node}
          </div>
        ))}
      </div>

      {seesShipments && (
        <Card>
          <CardHeader title="Shipment pipeline" description="Where every shipment is right now — click a stage to see them" />
          <CardBody>
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
              {SHIPMENT_STAGES.map((stage, i) => (
                <Link key={stage.id} to={`/shipments?stage=${stage.id}`} className="group relative rounded-lg border border-slate-200 p-3 transition hover:border-brand-500 hover:bg-brand-50/40">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{stage.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{d.stageCounts[stage.id] ?? 0}</p>
                  {i < SHIPMENT_STAGES.length - 1 && <ChevronRight size={16} className="absolute -right-2.5 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white text-slate-400 xl:block" />}
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className={seesShipments ? 'lg:col-span-3' : 'lg:col-span-5'}>
          <CardHeader title="Needs attention" description={myAlerts.length === 0 ? 'All clear — nothing needs action right now.' : `${myAlerts.length} item(s) for you`} />
          <CardBody className="space-y-2">
            {myAlerts.length === 0 && (
              <p className="flex items-center gap-2 py-4 text-sm text-green-700">
                <CheckCircle2 size={18} /> Nothing is overdue, late or waiting on you.
              </p>
            )}
            {shownAlerts.map((a) => (
              <Link key={a.id} to={a.to} className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${LEVEL_STYLE[a.level]}`}>
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span className="flex-1">{a.text}</span>
                <ChevronRight size={16} className="mt-0.5 shrink-0 opacity-60" />
              </Link>
            ))}
            {myAlerts.length > 6 && (
              <button onClick={() => setAllAlerts((v) => !v)} className="text-sm font-medium text-brand-600 hover:underline">
                {allAlerts ? 'Show fewer' : `Show all ${myAlerts.length}`}
              </button>
            )}
          </CardBody>
        </Card>

        {seesShipments && (
        <Card className="lg:col-span-2">
          <CardHeader title="Upcoming arrivals" description="Shipments on the water, earliest first" />
          <CardBody className="space-y-2">
            {d.upcoming.length === 0 && <p className="py-4 text-sm text-slate-500">No shipments are on the water.</p>}
            {d.upcoming.map((s) => {
              const eta = etaInfo(s)
              return (
                <Link key={s.id} to={`/shipments/${s.id}`} className="block rounded-lg border border-slate-200 p-3 hover:border-brand-500">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-slate-900">{s.ref}</p>
                    <Badge tone={eta.tone}>{eta.label}</Badge>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {supplierName(s.supplierId)} · {s.vessel || 'vessel not booked'}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <StatusBadge meta={SHIPMENT_STATUS[s.status]} />
                    <span className="text-xs text-slate-500">ETA {formatDate(s.eta)}</span>
                  </div>
                </Link>
              )
            })}
          </CardBody>
        </Card>
        )}
      </div>

      <ErrorBoundary fallback={<p className="rounded-lg border border-slate-200 bg-white py-8 text-center text-sm text-slate-500">The charts could not be shown. The rest of the dashboard is unaffected.</p>}>
        <Suspense fallback={<p className="py-8 text-center text-sm text-slate-500">Loading charts…</p>}>
          <DashboardCharts data={d} role={role} />
        </Suspense>
      </ErrorBoundary>

      <p className="flex items-center gap-1.5 text-xs text-slate-500">
        <Calculator size={13} /> Figures are calculated from the demo data in this browser; costs marked “estimate” on the Costing screen are included as estimates.
      </p>
    </div>
  )
}
