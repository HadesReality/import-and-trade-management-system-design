import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PackagePlus } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, DataTable, PageHeader, Select, StatCard, Tabs, type Column } from '../../components/ui'
import { stockRemaining } from '../../lib/calc'
import { formatDate, formatLkr, formatNumber } from '../../lib/format'
import { stockUnitCosts } from '../../lib/stock'
import { useDataStore } from '../../store/dataStore'
import type { StockItem, StockMovement } from '../../types'
import { ReceiveModal } from './ReceiveModal'
import { MOVE_TYPE, StockItemModal } from './StockItemModal'

type Tab = 'stock' | 'movements'

interface StockRow extends StockItem {
  productName: string
  unit: string
  shipmentRef: string
  remaining: number
  unitCost: number
  value: number
}

interface MoveRow extends StockMovement {
  productName: string
  unit: string
  shipmentRef: string
  warehouse: string
}

export function WarehousePage() {
  const data = useDataStore()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>('stock')
  const [warehouse, setWarehouse] = useState('')
  const [hideEmpty, setHideEmpty] = useState(true)
  const [moveType, setMoveType] = useState('')
  const [openItem, setOpenItem] = useState<string | null>(null)
  const [receiving, setReceiving] = useState<string | null>(params.get('receive'))

  const unitCosts = useMemo(() => stockUnitCosts(data), [data])

  const stockRows: StockRow[] = data.stockItems.map((i) => {
    const product = data.products.find((p) => p.id === i.productId)
    const remaining = stockRemaining(i)
    const unitCost = unitCosts.get(i.id) ?? 0
    return {
      ...i,
      productName: product?.name ?? '—',
      unit: product?.unit ?? '',
      shipmentRef: data.shipments.find((s) => s.id === i.shipmentId)?.ref ?? '—',
      remaining,
      unitCost,
      value: remaining * unitCost,
    }
  })

  const moveRows: MoveRow[] = data.stockMovements.flatMap((m) => {
    const row = stockRows.find((r) => r.id === m.stockItemId)
    return row ? [{ ...m, productName: row.productName, unit: row.unit, shipmentRef: row.shipmentRef, warehouse: row.warehouse }] : []
  })

  const shownStock = stockRows
    .filter((r) => (!warehouse || r.warehouse === warehouse) && (!hideEmpty || r.remaining > 0))
    .sort((a, b) => b.receivedDate.localeCompare(a.receivedDate))
  const shownMoves = moveRows
    .filter((m) => (!warehouse || m.warehouse === warehouse) && (!moveType || m.type === moveType))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))

  const waiting = data.shipments.filter((s) => s.status === 'RELEASED' && !data.stockItems.some((i) => i.shipmentId === s.id))
  const inStock = stockRows.filter((r) => r.remaining > 0)
  const writtenOff = stockRows.reduce((sum, r) => sum + Math.max(0, -r.qtyAdjusted) * r.unitCost, 0)

  const stockColumns: Column<StockRow>[] = [
    { key: 'product', header: 'Product', sortValue: (r) => r.productName, render: (r) => <div><p className="font-medium text-slate-900">{r.productName}</p><p className="text-xs text-slate-500">{r.shipmentRef}</p></div> },
    { key: 'wh', header: 'Warehouse', sortValue: (r) => r.warehouse, render: (r) => r.warehouse },
    { key: 'date', header: 'Received', sortValue: (r) => r.receivedDate, render: (r) => formatDate(r.receivedDate) },
    { key: 'rec', header: 'In', align: 'right', render: (r) => formatNumber(r.qtyReceived) },
    { key: 'sold', header: 'Sold', align: 'right', render: (r) => formatNumber(r.qtySold) },
    { key: 'adj', header: 'Adjusted', align: 'right', render: (r) => (r.qtyAdjusted === 0 ? '—' : <span className={r.qtyAdjusted < 0 ? 'text-red-600' : 'text-green-700'}>{formatNumber(r.qtyAdjusted)}</span>) },
    {
      key: 'rem',
      header: 'In stock',
      align: 'right',
      sortValue: (r) => r.remaining,
      render: (r) => (
        <span className={r.remaining === 0 ? 'text-slate-400' : 'font-semibold text-slate-900'}>
          {formatNumber(r.remaining)} {r.unit}
        </span>
      ),
    },
    { key: 'cost', header: 'Cost / unit', align: 'right', render: (r) => formatLkr(r.unitCost) },
    { key: 'val', header: 'Stock value', align: 'right', sortValue: (r) => r.value, render: (r) => formatLkr(r.value) },
  ]

  const moveColumns: Column<MoveRow>[] = [
    { key: 'date', header: 'Date', sortValue: (m) => m.date, render: (m) => formatDate(m.date) },
    { key: 'type', header: 'Type', render: (m) => <Badge tone={MOVE_TYPE[m.type].tone}>{MOVE_TYPE[m.type].label}</Badge> },
    { key: 'product', header: 'Product', render: (m) => <div><p className="text-slate-900">{m.productName}</p><p className="text-xs text-slate-500">{m.shipmentRef} · {m.warehouse}</p></div> },
    { key: 'qty', header: 'Quantity', align: 'right', sortValue: (m) => m.qty, render: (m) => <span className={m.qty < 0 ? 'font-medium text-red-600' : 'font-medium text-green-700'}>{m.qty > 0 ? '+' : ''}{formatNumber(m.qty)} {m.unit}</span> },
    { key: 'note', header: 'Note', render: (m) => m.note },
  ]

  return (
    <div>
      <PageHeader
        title="Warehouse / Stock"
        description="Receive released containers, see what is in stock and what it cost, and record damage or losses."
        actions={
          <Button onClick={() => setReceiving('')}>
            <PackagePlus size={16} /> Receive container
          </Button>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Stock lines in stock" value={inStock.length} hint={`${stockRows.length} lines in total`} />
        <StatCard label="Stock value (at cost)" value={formatLkr(stockRows.reduce((s, r) => s + r.value, 0))} tone="green" />
        <StatCard label="Waiting to be received" value={waiting.length} hint="Released by Customs" tone="amber" />
        <StatCard label="Lost / damaged" value={formatLkr(writtenOff)} hint="Written off at cost" tone="red" />
      </div>

      {waiting.length > 0 && (
        <Card className="mb-5">
          <CardHeader title="Ready to receive" description={`${waiting.length} released shipment(s)`} />
          <CardBody className="space-y-2">
            {waiting.map((s) => (
              <button
                key={s.id}
                onClick={() => setReceiving(s.id)}
                className="flex w-full items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-left text-sm text-blue-900 hover:bg-blue-100"
              >
                <PackagePlus size={17} className="mt-0.5 shrink-0" />
                <span>
                  <strong>{s.ref}</strong> was released by Customs — receive it into a warehouse.
                </span>
              </button>
            ))}
          </CardBody>
        </Card>
      )}

      <Tabs
        tabs={[
          { id: 'stock', label: 'Stock' },
          { id: 'movements', label: `Movements (${data.stockMovements.length})` },
        ]}
        value={tab}
        onChange={setTab}
      />

      <div className="mt-4">
        {tab === 'stock' ? (
          <DataTable
            columns={stockColumns}
            rows={shownStock}
            rowKey={(r) => r.id}
            searchText={(r) => `${r.productName} ${r.shipmentRef} ${r.warehouse}`}
            searchPlaceholder="Search product, shipment…"
            onRowClick={(r) => setOpenItem(r.id)}
            emptyTitle="No stock to show"
            emptyHint="Receive a released container to create stock."
            toolbar={
              <>
                <Select value={warehouse} onChange={(e) => setWarehouse(e.target.value)} className="w-auto" aria-label="Filter by warehouse">
                  <option value="">All warehouses</option>
                  {data.settings.warehouses.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </Select>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={hideEmpty} onChange={(e) => setHideEmpty(e.target.checked)} />
                  Hide sold-out
                </label>
              </>
            }
          />
        ) : (
          <DataTable
            columns={moveColumns}
            rows={shownMoves}
            rowKey={(m) => m.id}
            searchText={(m) => `${m.productName} ${m.shipmentRef} ${m.note}`}
            searchPlaceholder="Search movements…"
            emptyTitle="No movements yet"
            toolbar={
              <>
                <Select value={warehouse} onChange={(e) => setWarehouse(e.target.value)} className="w-auto" aria-label="Filter by warehouse">
                  <option value="">All warehouses</option>
                  {data.settings.warehouses.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </Select>
                <Select value={moveType} onChange={(e) => setMoveType(e.target.value)} className="w-auto" aria-label="Filter by type">
                  <option value="">All types</option>
                  {Object.entries(MOVE_TYPE).map(([id, m]) => (
                    <option key={id} value={id}>
                      {m.label}
                    </option>
                  ))}
                </Select>
              </>
            }
          />
        )}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        In stock = received − sold + adjustments. Cost per unit is the landed cost from <Link to="/costing" className="text-brand-600 hover:underline">Costing</Link>. Sales will reduce stock automatically.
      </p>

      {receiving !== null && (
        <ReceiveModal
          presetShipmentId={receiving}
          onClose={() => {
            setReceiving(null)
            if (params.has('receive')) setParams({}, { replace: true })
          }}
        />
      )}
      {openItem && <StockItemModal itemId={openItem} unitCost={unitCosts.get(openItem) ?? 0} onClose={() => setOpenItem(null)} />}
    </div>
  )
}
