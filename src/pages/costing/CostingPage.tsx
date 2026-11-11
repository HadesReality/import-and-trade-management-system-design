import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART_COLORS, compactLkr } from '../../components/charts'
import { Badge, Card, CardBody, CardHeader, DataTable, PageHeader, StatCard, StatusBadge, type Column } from '../../components/ui'
import { SHIPMENT_STATUS } from '../../config/statuses'
import { computeShipmentResult, type ShipmentResult } from '../../lib/costing'
import { formatLkr, formatPercent } from '../../lib/format'
import { useDataStore } from '../../store/dataStore'
import type { Shipment } from '../../types'

interface Row {
  shipment: Shipment
  supplierName: string
  result: ShipmentResult
}

export function CostingPage() {
  const navigate = useNavigate()
  const data = useDataStore()

  const rows: Row[] = useMemo(
    () =>
      data.shipments.flatMap((shipment) => {
        const result = computeShipmentResult(data, shipment.id, 'VALUE')
        return result ? [{ shipment, supplierName: data.suppliers.find((s) => s.id === shipment.supplierId)?.name ?? '—', result }] : []
      }),
    [data],
  )

  const totalLanded = rows.reduce((s, r) => s + r.result.cost.totalLanded, 0)
  const withSales = rows.filter((r) => r.result.hasSales)
  const revenue = withSales.reduce((s, r) => s + r.result.revenue, 0)
  const profit = withSales.reduce((s, r) => s + r.result.profit, 0)
  const estimates = rows.filter((r) => r.result.cost.isEstimate).length

  const chartData = rows.map((r) => ({
    name: `#${r.shipment.ref.split('-').pop()}`,
    Goods: Math.round(r.result.cost.goodsLkr),
    'Bank charges': Math.round(r.result.cost.bankCharges),
    Clearance: Math.round(r.result.cost.clearanceTotal),
  }))

  const columns: Column<Row>[] = [
    {
      key: 'ship',
      header: 'Shipment',
      sortValue: (r) => r.shipment.ref,
      render: (r) => (
        <div>
          <p className="font-medium text-slate-900">{r.shipment.ref}</p>
          <p className="text-xs text-slate-500">{r.supplierName}</p>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge meta={SHIPMENT_STATUS[r.shipment.status]} /> },
    { key: 'goods', header: 'Goods', align: 'right', sortValue: (r) => r.result.cost.goodsLkr, render: (r) => formatLkr(r.result.cost.goodsLkr) },
    { key: 'bank', header: 'Bank charges', align: 'right', render: (r) => formatLkr(r.result.cost.bankCharges) },
    { key: 'clr', header: 'Clearance', align: 'right', render: (r) => formatLkr(r.result.cost.clearanceTotal) },
    { key: 'total', header: 'Landed cost', align: 'right', sortValue: (r) => r.result.cost.totalLanded, render: (r) => <span className="font-semibold text-slate-900">{formatLkr(r.result.cost.totalLanded)}</span> },
    { key: 'unit', header: 'Per unit', align: 'right', sortValue: (r) => r.result.cost.perUnit, render: (r) => formatLkr(r.result.cost.perUnit) },
    {
      key: 'basis',
      header: 'Basis',
      render: (r) => (r.result.cost.isEstimate ? <Badge tone="amber">Estimate</Badge> : <Badge tone="green">Final</Badge>),
    },
    {
      key: 'profit',
      header: 'Profit so far',
      align: 'right',
      sortValue: (r) => r.result.profit,
      render: (r) =>
        r.result.hasSales ? (
          <div>
            <p className={r.result.profit >= 0 ? 'font-medium text-green-700' : 'font-medium text-red-600'}>{formatLkr(r.result.profit)}</p>
            <p className="text-xs text-slate-500">{formatPercent(r.result.marginPercent)} of sales</p>
          </div>
        ) : (
          <span className="text-slate-400">No sales yet</span>
        ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Costing"
        description="What each shipment really cost in rupees — goods, bank charges and clearance — and what it earned."
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total landed cost" value={formatLkr(totalLanded)} hint={`${rows.length} shipments`} />
        <StatCard label="Sales so far" value={formatLkr(revenue)} hint={`${withSales.length} shipment(s) with sales`} tone="purple" />
        <StatCard label="Profit so far" value={formatLkr(profit)} hint={revenue > 0 ? `${formatPercent((profit / revenue) * 100)} of sales` : undefined} tone={profit >= 0 ? 'green' : 'red'} />
        <StatCard label="Still estimates" value={estimates} hint="Pending payments or not yet released" tone="amber" />
      </div>

      <Card className="mb-5">
        <CardHeader title="Where the money goes" description="Landed cost per shipment, in LKR" />
        <CardBody>
          <div className="h-72 w-full" role="img" aria-label="Stacked bar chart of landed cost per shipment: goods, bank charges and clearance">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={compactLkr} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={48} />
                <Tooltip formatter={(v) => formatLkr(Number(v))} cursor={{ fill: '#f1f5f9' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Goods" stackId="a" fill={CHART_COLORS.goods} />
                <Bar dataKey="Bank charges" stackId="a" fill={CHART_COLORS.bank} />
                <Bar dataKey="Clearance" stackId="a" fill={CHART_COLORS.clearance} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.shipment.id}
        searchText={(r) => `${r.shipment.ref} ${r.supplierName}`}
        searchPlaceholder="Search shipment or supplier…"
        onRowClick={(r) => navigate(`/costing/${r.shipment.id}`)}
        emptyTitle="No shipments yet"
      />
      <p className="mt-2 text-xs text-slate-500">
        “Estimate” means a bank payment is still pending, part of the order has no payment recorded (costed at the default exchange rate), or the goods are not released yet.
      </p>
    </div>
  )
}
