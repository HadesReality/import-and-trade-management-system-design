import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, Plus } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, DataTable, PageHeader, Select, StatCard, type Column } from '../../components/ui'
import { clearanceStatus, clearanceTotal } from '../../lib/clearance'
import { formatDate, formatLkr } from '../../lib/format'
import { useDataStore } from '../../store/dataStore'
import type { Clearance } from '../../types'

interface Row extends Clearance {
  shipmentRef: string
  supplierName: string
}

export function ClearancePage() {
  const navigate = useNavigate()
  const clearances = useDataStore((s) => s.clearances)
  const shipments = useDataStore((s) => s.shipments)
  const suppliers = useDataStore((s) => s.suppliers)
  const companies = useDataStore((s) => s.settings.clearingCompanies)
  const [company, setCompany] = useState('')
  const [state, setState] = useState('')

  const all: Row[] = useMemo(
    () =>
      clearances.map((c) => {
        const ship = shipments.find((s) => s.id === c.shipmentId)
        return { ...c, shipmentRef: ship?.ref ?? '—', supplierName: suppliers.find((s) => s.id === ship?.supplierId)?.name ?? '—' }
      }),
    [clearances, shipments, suppliers],
  )

  const rows = all
    .filter((c) => !company || c.clearingCompany === company)
    .filter((c) => !state || (state === 'RELEASED' ? !!c.releaseDate : !c.releaseDate))
    .sort((a, b) => b.handoverDate.localeCompare(a.handoverDate))

  const withAgent = all.filter((c) => !c.releaseDate)
  const delayed = withAgent.filter((c) => clearanceStatus(c).delayed)
  const released = all.filter((c) => c.releaseDate)
  const avgDays = released.length ? Math.round(released.reduce((s, c) => s + clearanceStatus(c).days, 0) / released.length) : 0
  const ready = shipments.filter((s) => (s.status === 'BANK_DOCS_COLLECTED' || s.status === 'ARRIVED') && !clearances.some((c) => c.shipmentId === s.id))

  const columns: Column<Row>[] = [
    { key: 'ship', header: 'Shipment', sortValue: (c) => c.shipmentRef, render: (c) => <div><p className="font-medium text-slate-900">{c.shipmentRef}</p><p className="text-xs text-slate-500">{c.supplierName}</p></div> },
    { key: 'company', header: 'Clearing agent', sortValue: (c) => c.clearingCompany, render: (c) => c.clearingCompany },
    { key: 'cusdec', header: 'CusDec no.', render: (c) => c.cusdecNumber || <span className="text-slate-400">Not filed</span> },
    { key: 'handover', header: 'Handed over', sortValue: (c) => c.handoverDate, render: (c) => formatDate(c.handoverDate) },
    { key: 'duties', header: 'Duties & taxes', align: 'right', sortValue: (c) => c.duties, render: (c) => formatLkr(c.duties) },
    { key: 'total', header: 'Total cost', align: 'right', sortValue: (c) => clearanceTotal(c), render: (c) => formatLkr(clearanceTotal(c)) },
    { key: 'release', header: 'Released', sortValue: (c) => c.releaseDate ?? '', render: (c) => formatDate(c.releaseDate) },
    {
      key: 'status',
      header: 'Status',
      render: (c) => {
        const s = clearanceStatus(c)
        return (
          <div>
            <Badge tone={s.tone}>{s.label}</Badge>
            <p className="mt-0.5 text-xs text-slate-500">{c.releaseDate ? `${s.days} day(s) to clear` : `${s.days} day(s) with agent`}</p>
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Clearance"
        description="Handover to the clearing agent, Customs duties and bills, and release of the goods."
        actions={
          <Button onClick={() => navigate('/clearance/new')}>
            <Plus size={16} /> Hand over shipment
          </Button>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ready for handover" value={ready.length} hint="Arrived, no agent yet" tone="amber" />
        <StatCard label="With clearing agent" value={withAgent.length} hint={delayed.length ? `${delayed.length} delayed` : 'None delayed'} tone="purple" />
        <StatCard label="Average clearing time" value={released.length ? `${avgDays} days` : '—'} hint={`${released.length} released`} tone="green" />
        <StatCard label="Clearance costs" value={formatLkr(all.reduce((s, c) => s + clearanceTotal(c), 0))} hint="Duties + all bills" />
      </div>

      {(ready.length > 0 || delayed.length > 0) && (
        <Card className="mb-5">
          <CardHeader title="Needs attention" description={`${ready.length + delayed.length} item(s)`} />
          <CardBody className="space-y-2">
            {ready.map((s) => (
              <Link
                key={s.id}
                to={`/clearance/new?shipment=${s.id}`}
                className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 hover:bg-blue-100"
              >
                <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                <span>
                  <strong>{s.ref}</strong> is {s.status === 'ARRIVED' ? 'in Sri Lanka but the bank documents are not collected yet' : 'ready for handover — the bank documents are collected'}. Hand it to a clearing agent.
                </span>
              </Link>
            ))}
            {delayed.map((c) => (
              <Link key={c.id} to={`/clearance/${c.id}`} className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900 hover:bg-red-100">
                <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                <span>
                  <strong>{(all.find((r) => r.id === c.id) as Row).shipmentRef}</strong> has been with {c.clearingCompany} for {clearanceStatus(c).days} days and is not released yet.
                </span>
              </Link>
            ))}
          </CardBody>
        </Card>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(c) => c.id}
        searchText={(c) => `${c.shipmentRef} ${c.supplierName} ${c.clearingCompany} ${c.cusdecNumber}`}
        searchPlaceholder="Search shipment, agent, CusDec no…"
        onRowClick={(c) => navigate(`/clearance/${c.id}`)}
        emptyTitle="No clearances found"
        emptyHint="Hand a shipment to a clearing agent once the bank documents are collected."
        toolbar={
          <>
            <Select value={state} onChange={(e) => setState(e.target.value)} className="w-auto" aria-label="Filter by status">
              <option value="">All</option>
              <option value="OPEN">With agent</option>
              <option value="RELEASED">Released</option>
            </Select>
            <Select value={company} onChange={(e) => setCompany(e.target.value)} className="w-auto max-w-[12rem]" aria-label="Filter by agent">
              <option value="">All agents</option>
              {companies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </>
        }
      />
    </div>
  )
}
