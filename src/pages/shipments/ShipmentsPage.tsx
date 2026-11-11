import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { LayoutGrid, Plus, Table2, X } from 'lucide-react'
import { Badge, Button, DataTable, EmptyState, Input, PageHeader, Select, StatCard, StatusBadge, type Column } from '../../components/ui'
import { SHIPMENT_STAGES, SHIPMENT_STATUS, SHIPMENT_STATUS_ORDER } from '../../config/statuses'
import { cn } from '../../lib/cn'
import { formatDate } from '../../lib/format'
import { etaInfo, hasArrived, hasShipped } from '../../lib/shipments'
import { useDataStore } from '../../store/dataStore'
import type { Shipment, ShipmentStatus } from '../../types'
import { NewShipmentModal } from './NewShipmentModal'

type View = 'table' | 'board'

export function ShipmentsPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const stage = SHIPMENT_STAGES.find((s) => s.id === params.get('stage'))
  const shipments = useDataStore((s) => s.shipments)
  const suppliers = useDataStore((s) => s.suppliers)
  const [view, setView] = useState<View>('table')
  const [status, setStatus] = useState<ShipmentStatus | ''>('')
  const [supplierId, setSupplierId] = useState('')
  const [etaFrom, setEtaFrom] = useState('')
  const [etaTo, setEtaTo] = useState('')
  const [boardQuery, setBoardQuery] = useState('')
  const [adding, setAdding] = useState(false)

  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.name ?? '—'

  const filtered = useMemo(
    () =>
      shipments
        .filter((s) => (!status || s.status === status) && (!supplierId || s.supplierId === supplierId))
        .filter((s) => !stage || stage.statuses.includes(s.status))
        .filter((s) => (!etaFrom || (s.eta ?? '') >= etaFrom) && (!etaTo || (!!s.eta && s.eta <= etaTo)))
        .sort((a, b) => (b.eta ?? '9999').localeCompare(a.eta ?? '9999')),
    [shipments, status, supplierId, etaFrom, etaTo, stage],
  )

  const inTransit = shipments.filter((s) => hasShipped(s.status) && !hasArrived(s.status))
  const arrivingSoon = inTransit.filter((s) => etaInfo(s).tone === 'amber' || etaInfo(s).tone === 'red')
  const awaitingBank = shipments.filter((s) => s.status === 'ARRIVED')
  const missingDocs = shipments.filter((s) => hasShipped(s.status) && s.documents.some((d) => d.state === 'MISSING'))

  const matchesQuery = (s: Shipment, q: string) =>
    `${s.ref} ${supplierName(s.supplierId)} ${s.vessel} ${s.blNumber} ${s.containers.map((c) => c.number).join(' ')}`.toLowerCase().includes(q.toLowerCase())

  const columns: Column<Shipment>[] = [
    { key: 'ref', header: 'Shipment', sortValue: (s) => s.ref, render: (s) => <span className="font-medium text-slate-900">{s.ref}</span> },
    { key: 'supplier', header: 'Supplier', sortValue: (s) => supplierName(s.supplierId), render: (s) => supplierName(s.supplierId) },
    {
      key: 'vessel',
      header: 'Vessel / BL',
      render: (s) =>
        s.vessel ? (
          <div>
            <p>{s.vessel}</p>
            <p className="text-xs text-slate-500">{s.blNumber || 'No BL yet'}</p>
          </div>
        ) : (
          <span className="text-slate-400">Not booked yet</span>
        ),
    },
    { key: 'port', header: 'Loading port', render: (s) => s.loadingPort || '—' },
    { key: 'etd', header: 'ETD', sortValue: (s) => s.etd ?? '', render: (s) => formatDate(s.etd) },
    { key: 'eta', header: 'ETA', sortValue: (s) => s.eta ?? '', render: (s) => formatDate(s.eta) },
    {
      key: 'days',
      header: 'Arrival',
      render: (s) => {
        const info = etaInfo(s)
        return <Badge tone={info.tone}>{info.label}</Badge>
      },
    },
    { key: 'status', header: 'Status', sortValue: (s) => SHIPMENT_STATUS_ORDER.indexOf(s.status), render: (s) => <StatusBadge meta={SHIPMENT_STATUS[s.status]} /> },
  ]

  const filters = (
    <>
      <Select value={status} onChange={(e) => setStatus(e.target.value as ShipmentStatus | '')} className="w-auto" aria-label="Filter by status">
        <option value="">All statuses</option>
        {SHIPMENT_STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {SHIPMENT_STATUS[s].label}
          </option>
        ))}
      </Select>
      <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-auto max-w-[11rem]" aria-label="Filter by supplier">
        <option value="">All suppliers</option>
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>
      <label className="flex items-center gap-1.5 text-xs text-slate-500">
        ETA
        <Input type="date" value={etaFrom} onChange={(e) => setEtaFrom(e.target.value)} className="w-auto py-1.5" aria-label="ETA from" />
        –
        <Input type="date" value={etaTo} onChange={(e) => setEtaTo(e.target.value)} className="w-auto py-1.5" aria-label="ETA to" />
      </label>
    </>
  )

  return (
    <div>
      <PageHeader
        title="Shipments"
        description="Every shipment from order to sale — vessel, documents and status in one place."
        actions={
          <>
            <div className="flex rounded-md border border-slate-300 bg-white p-0.5" role="group" aria-label="View">
              {([['table', Table2, 'Table'], ['board', LayoutGrid, 'Board']] as const).map(([id, Icon, label]) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  aria-pressed={view === id}
                  className={cn(
                    'flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium',
                    view === id ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100',
                  )}
                >
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>
            <Button onClick={() => setAdding(true)}>
              <Plus size={16} /> New shipment
            </Button>
          </>
        }
      />

      {stage && (
        <div className="mb-4 flex items-center gap-2 text-sm text-slate-600">
          Showing stage
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 font-medium text-brand-700">
            {stage.label}
            <button onClick={() => setParams({}, { replace: true })} aria-label="Clear stage filter" className="rounded-full p-0.5 hover:bg-brand-100">
              <X size={13} />
            </button>
          </span>
        </div>
      )}

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="On the water" value={inTransit.length} hint={`${shipments.length} shipments in total`} />
        <StatCard label="Arriving within 7 days" value={arrivingSoon.length} tone="amber" />
        <StatCard label="Arrived, awaiting bank" value={awaitingBank.length} tone="purple" />
        <StatCard label="Missing documents" value={missingDocs.length} hint="Shipped, but a document is missing" tone="red" />
      </div>

      {view === 'table' ? (
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(s) => s.id}
          searchText={(s) => `${s.ref} ${supplierName(s.supplierId)} ${s.vessel} ${s.blNumber} ${s.containers.map((c) => c.number).join(' ')}`}
          searchPlaceholder="Search ref, supplier, vessel, BL, container…"
          onRowClick={(s) => navigate(`/shipments/${s.id}`)}
          toolbar={filters}
          emptyTitle="No shipments found"
          emptyHint="Create a shipment for an issued purchase order."
        />
      ) : (
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Input value={boardQuery} onChange={(e) => setBoardQuery(e.target.value)} placeholder="Search…" className="w-56" aria-label="Search board" />
            {filters}
          </div>
          <div className="flex gap-4 overflow-x-auto pb-3">
            {SHIPMENT_STAGES.map((stage) => {
              const cards = filtered.filter((s) => stage.statuses.includes(s.status) && (!boardQuery || matchesQuery(s, boardQuery)))
              return (
                <section key={stage.id} className="w-64 shrink-0 rounded-xl bg-slate-100 p-2.5" aria-label={stage.label}>
                  <h3 className="mb-2 flex items-center justify-between px-1 text-sm font-semibold text-slate-700">
                    {stage.label}
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">{cards.length}</span>
                  </h3>
                  <div className="space-y-2">
                    {cards.length === 0 && <p className="px-1 py-4 text-center text-xs text-slate-400">Nothing here</p>}
                    {cards.map((s) => {
                      const info = etaInfo(s)
                      return (
                        <Link
                          key={s.id}
                          to={`/shipments/${s.id}`}
                          className="block rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-brand-500"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-slate-900">{s.ref}</p>
                            <Badge tone={info.tone}>{info.label}</Badge>
                          </div>
                          <p className="mt-1 truncate text-xs text-slate-500">{supplierName(s.supplierId)}</p>
                          <p className="mt-1 truncate text-xs text-slate-600">{s.vessel || 'Vessel not booked'}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <StatusBadge meta={SHIPMENT_STATUS[s.status]} />
                            {s.eta && <span className="text-xs text-slate-500">{formatDate(s.eta)}</span>}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
          {filtered.length === 0 && <EmptyState title="No shipments match the filters" />}
        </div>
      )}

      {adding && <NewShipmentModal onClose={() => setAdding(false)} onCreated={(id) => navigate(`/shipments/${id}`)} />}
    </div>
  )
}
