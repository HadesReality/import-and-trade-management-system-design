import { useState } from 'react'
import { Anchor, RotateCcw, Ship, Warehouse } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  DataTable,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  StatCard,
  StatusBadge,
  Tabs,
  Textarea,
  type Column,
} from '../components/ui'
import { SHIPMENT_STATUS, PAYMENT_TERM, CHEQUE_STATUS, DOC_STATE } from '../config/statuses'
import { allocateCost, computeShipmentCost, poTotalUsd, stockRemaining, suggestedPrice } from '../lib/calc'
import { daysFromToday, formatDate, formatLkr, formatUsd, transitDays } from '../lib/format'
import { useDataStore } from '../store/dataStore'
import type { Shipment } from '../types'

type KitTab = 'components' | 'data' | 'costing'

export function UiKitPage() {
  const data = useDataStore()
  const [tab, setTab] = useState<KitTab>('components')
  const [modalOpen, setModalOpen] = useState(false)

  const supplierName = (id: string) => data.suppliers.find((s) => s.id === id)?.name ?? '—'

  const columns: Column<Shipment>[] = [
    { key: 'ref', header: 'Shipment', render: (s) => <span className="font-medium text-slate-900">{s.ref}</span>, sortValue: (s) => s.ref },
    { key: 'supplier', header: 'Supplier', render: (s) => supplierName(s.supplierId), sortValue: (s) => supplierName(s.supplierId) },
    { key: 'vessel', header: 'Vessel', render: (s) => s.vessel || <span className="text-slate-400">Not booked</span> },
    { key: 'eta', header: 'ETA', render: (s) => formatDate(s.eta), sortValue: (s) => s.eta ?? '' },
    {
      key: 'days',
      header: 'Days to arrival',
      align: 'right',
      render: (s) => (s.eta ? daysFromToday(s.eta) : '—'),
      sortValue: (s) => (s.eta ? daysFromToday(s.eta) : 9999),
    },
    { key: 'status', header: 'Status', render: (s) => <StatusBadge meta={SHIPMENT_STATUS[s.status]} /> },
  ]

  const demoShipment = data.shipments.find((s) => s.id === 'shp-1')!
  const demoPo = data.purchaseOrders.find((p) => p.id === demoShipment.poId)!
  const cost = computeShipmentCost(data, demoShipment.id)
  const lines = cost ? allocateCost(demoPo, cost.totalLanded, 'VALUE') : []

  const counts: [string, number][] = [
    ['Suppliers', data.suppliers.length],
    ['Products', data.products.length],
    ['Purchase orders / LOI', data.purchaseOrders.length],
    ['Supplier invoices', data.invoices.length],
    ['Shipments', data.shipments.length],
    ['Bank payments', data.bankPayments.length],
    ['Clearances', data.clearances.length],
    ['Stock items', data.stockItems.length],
    ['Stock movements', data.stockMovements.length],
    ['Customers', data.customers.length],
    ['Sales', data.sales.length],
    ['Cheques', data.cheques.length],
  ]

  return (
    <div>
      <PageHeader
        title="UI Kit & Data Check"
        description="Phase 2 review page — shared components, demo data and the landed-cost calculator. Not part of the final menu."
        actions={
          <Button variant="secondary" onClick={() => data.resetData()}>
            <RotateCcw size={15} /> Reset demo data
          </Button>
        }
      />

      <Tabs
        tabs={[
          { id: 'components', label: 'Components' },
          { id: 'data', label: 'Demo data' },
          { id: 'costing', label: 'Landed cost check' },
        ]}
        value={tab}
        onChange={setTab}
      />

      <div className="mt-5 space-y-5">
        {tab === 'components' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="In transit" value={data.shipments.filter((s) => s.status === 'IN_TRANSIT').length} hint="Next ETA in 11 days" icon={Ship} />
              <StatCard label="Arrived, awaiting bank" value={data.shipments.filter((s) => s.status === 'ARRIVED').length} icon={Anchor} tone="amber" />
              <StatCard label="Stock value" value="LKR 2.2M" icon={Warehouse} tone="green" />
              <StatCard label="Returned cheques" value={data.cheques.filter((c) => c.status === 'RETURNED').length} tone="red" />
            </div>

            <Card>
              <CardHeader title="Buttons & badges" />
              <CardBody className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="danger">Danger</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button size="sm">Small</Button>
                  <Button disabled>Disabled</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.values(SHIPMENT_STATUS).map((m) => (
                    <StatusBadge key={m.label} meta={m} />
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.values(PAYMENT_TERM).map((m) => (
                    <Badge key={m.label} tone={m.tone}>
                      {m.label} — {m.full}
                    </Badge>
                  ))}
                  {Object.values(CHEQUE_STATUS).map((m) => (
                    <StatusBadge key={m.label} meta={m} />
                  ))}
                  {Object.values(DOC_STATE).map((m) => (
                    <StatusBadge key={m.label} meta={m} />
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Form fields & modal"
                actions={<Button size="sm" onClick={() => setModalOpen(true)}>Open modal</Button>}
              />
              <CardBody>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="PO number" required hint="Auto-suggested">
                    <Input defaultValue="PO-2026-008" />
                  </Field>
                  <Field label="Payment term" required>
                    <Select defaultValue="TT">
                      {Object.entries(PAYMENT_TERM).map(([id, m]) => (
                        <option key={id} value={id}>
                          {m.label} — {m.full}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Unit price (USD)" error="Must be greater than zero">
                    <Input type="number" defaultValue={0} />
                  </Field>
                  <Field label="Special conditions" className="sm:col-span-2 lg:col-span-3">
                    <Textarea placeholder="Packing, warranty, loading date…" />
                  </Field>
                </div>
              </CardBody>
            </Card>

            <DataTable
              columns={columns}
              rows={data.shipments}
              rowKey={(s) => s.id}
              searchText={(s) => `${s.ref} ${supplierName(s.supplierId)} ${s.vessel} ${s.blNumber}`}
              searchPlaceholder="Search shipments…"
              pageSize={4}
              onRowClick={(s) => alert(`Row clicked: ${s.ref}`)}
            />
          </>
        )}

        {tab === 'data' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {counts.map(([label, n]) => (
                <StatCard key={label} label={label} value={n} />
              ))}
            </div>
            <Card>
              <CardHeader title="Stock" description="Remaining = received − sold + adjustments" />
              <CardBody>
                {data.stockItems.map((s) => (
                  <p key={s.id} className="text-sm">
                    {data.products.find((p) => p.id === s.productId)?.name}: received {s.qtyReceived}, sold {s.qtySold},
                    adjusted {s.qtyAdjusted} → <strong>{stockRemaining(s)} remaining</strong>
                  </p>
                ))}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Purchase order totals" />
              <CardBody className="space-y-1 text-sm">
                {data.purchaseOrders.map((p) => (
                  <p key={p.id}>
                    {p.number} — {formatUsd(poTotalUsd(p))} · {p.paymentTerm} · ships in{' '}
                    {transitDays(data.shipments.find((s) => s.poId === p.id)?.etd, data.shipments.find((s) => s.poId === p.id)?.eta) ?? '—'} days
                  </p>
                ))}
              </CardBody>
            </Card>
          </>
        )}

        {tab === 'costing' && cost && (
          <Card>
            <CardHeader
              title={`Landed cost — ${demoShipment.ref} (${demoPo.number})`}
              description={cost.isEstimate ? 'Estimate: some amounts are still pending' : 'Final: all payments and clearance are complete'}
            />
            <CardBody className="space-y-4 text-sm">
              <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                {[
                  ['Goods cost (USD × rate paid)', formatLkr(cost.goodsLkr)],
                  ['Bank charges (docs + commission + other)', formatLkr(cost.bankCharges)],
                  ['Clearance (duties, port, transport, agent, other)', formatLkr(cost.clearanceTotal)],
                  ['Total landed cost', formatLkr(cost.totalLanded)],
                  ['Total quantity', `${cost.totalQty.toLocaleString()} boxes`],
                  ['Landed cost per unit', formatLkr(cost.perUnit)],
                  [`Suggested price (+${data.settings.targetMarginPercent}% mark-up)`, formatLkr(suggestedPrice(cost.perUnit, data.settings.targetMarginPercent))],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-slate-100 py-1.5">
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="font-medium text-slate-900">{v}</dd>
                  </div>
                ))}
              </dl>
              {lines.map((l) => (
                <p key={l.productId} className="text-slate-600">
                  {data.products.find((p) => p.id === l.productId)?.name}: {formatLkr(l.unitCost)} per unit
                </p>
              ))}
            </CardBody>
          </Card>
        )}
      </div>

      <Modal
        open={modalOpen}
        title="Example modal"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setModalOpen(false)}>Save</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Modals are used for quick add/edit forms. Press Esc or click outside to close.</p>
      </Modal>
    </div>
  )
}
