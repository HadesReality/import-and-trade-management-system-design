import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART_COLORS, compactLkr } from '../../components/charts'
import { Badge, Button, Card, CardBody, CardHeader, DataTable, EmptyState, Field, Input, Select, StatCard, StatusBadge, type Column } from '../../components/ui'
import { PAYMENT_TERM, SHIPMENT_STATUS } from '../../config/statuses'
import { suggestedPrice } from '../../lib/calc'
import { computeShipmentResult, type AllocateBy, type ProductResult } from '../../lib/costing'
import { formatLkr, formatNumber, formatPercent, formatUsd } from '../../lib/format'
import { useDataStore } from '../../store/dataStore'

export function ShipmentCostingPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const data = useDataStore()
  const defaultMarkup = useDataStore((s) => s.settings.targetMarginPercent)
  const [by, setBy] = useState<AllocateBy>('VALUE')
  const [markup, setMarkup] = useState<string>(String(defaultMarkup))

  const shipment = data.shipments.find((s) => s.id === id)
  const result = useMemo(() => (id ? computeShipmentResult(data, id, by) : undefined), [data, id, by])

  if (!shipment || !result) {
    return (
      <Card>
        <EmptyState title="Shipment not found" action={<Button onClick={() => navigate('/costing')}>Back to costing</Button>} />
      </Card>
    )
  }

  const { cost } = result
  const supplier = data.suppliers.find((s) => s.id === shipment.supplierId)
  const payments = data.bankPayments.filter((p) => p.shipmentId === shipment.id)
  const markupNum = Math.max(0, Number(markup) || 0)
  const product = (pid: string) => data.products.find((p) => p.id === pid)

  const components = [
    { name: 'Goods', amount: cost.goodsLkr, color: CHART_COLORS.goods },
    { name: 'Bank charges', amount: cost.bankCharges, color: CHART_COLORS.bank },
    { name: 'Customs duties & taxes', amount: cost.duties, color: CHART_COLORS.duties },
    { name: 'Port & handling', amount: cost.portCharges, color: CHART_COLORS.port },
    { name: 'Transport', amount: cost.transport, color: CHART_COLORS.transport },
    { name: 'Clearing agent fee', amount: cost.agentFee, color: CHART_COLORS.agent },
    { name: 'Other clearance', amount: cost.otherClearance, color: CHART_COLORS.other },
  ].filter((c) => c.amount > 0)

  const projectedExtra = result.products.reduce((s, p) => s + p.remainingQty * (suggestedPrice(p.unitCost, markupNum) - p.unitCost), 0)

  const productColumns: Column<ProductResult>[] = [
    {
      key: 'product',
      header: 'Product',
      render: (p) => (
        <div>
          <p className="font-medium text-slate-900">{product(p.productId)?.name}</p>
          <p className="text-xs text-slate-500">{formatNumber(p.qty)} {product(p.productId)?.unit}</p>
        </div>
      ),
    },
    { key: 'alloc', header: 'Share of cost', align: 'right', render: (p) => formatLkr(p.allocated) },
    { key: 'unit', header: 'Landed cost / unit', align: 'right', render: (p) => <span className="font-semibold text-slate-900">{formatLkr(p.unitCost)}</span> },
    { key: 'sugg', header: `Suggested price (+${formatPercent(markupNum)})`, align: 'right', render: (p) => formatLkr(suggestedPrice(p.unitCost, markupNum)) },
    { key: 'sold', header: 'Sold', align: 'right', render: (p) => formatNumber(p.soldQty) },
    { key: 'avg', header: 'Avg selling price', align: 'right', render: (p) => (p.soldQty > 0 ? formatLkr(p.avgSellingPrice) : '—') },
    { key: 'rev', header: 'Sales', align: 'right', render: (p) => (p.soldQty > 0 ? formatLkr(p.revenue) : '—') },
    {
      key: 'profit',
      header: 'Profit',
      align: 'right',
      render: (p) => {
        if (p.soldQty === 0 && p.writtenOffQty === 0) return '—'
        const profit = p.revenue - p.cogs - p.writeOffCost
        return <span className={profit >= 0 ? 'text-green-700' : 'text-red-600'}>{formatLkr(profit)}</span>
      },
    },
    { key: 'left', header: 'Unsold', align: 'right', render: (p) => `${formatNumber(p.remainingQty)}${p.writtenOffQty ? ` (${formatNumber(p.writtenOffQty)} lost)` : ''}` },
  ]

  return (
    <div>
      <Link to="/costing" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Costing
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-slate-900">{shipment.ref}</h2>
            <StatusBadge meta={SHIPMENT_STATUS[shipment.status]} />
            {cost.isEstimate ? <Badge tone="amber">Estimate</Badge> : <Badge tone="green">Final</Badge>}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {supplier?.name} ·{' '}
            <Link to={`/shipments/${shipment.id}`} className="hover:underline">
              View shipment
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Spread cost across products">
            <Select value={by} onChange={(e) => setBy(e.target.value as AllocateBy)} className="w-auto">
              <option value="VALUE">By value (USD price)</option>
              <option value="QTY">By quantity</option>
            </Select>
          </Field>
          <Field label="Mark-up on cost (%)">
            <Input type="number" min={0} step="1" value={markup} onChange={(e) => setMarkup(e.target.value)} className="w-28" />
          </Field>
        </div>
      </div>

      {cost.isEstimate && (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="status">
          <strong>This is an estimate.</strong>{' '}
          {[
            payments.some((p) => p.status === 'PENDING') && 'A bank payment is still pending (its exchange rate and charges may change).',
            cost.unrecordedUsd > 0 && `${formatUsd(cost.unrecordedUsd)} has no payment recorded yet and is costed at the default rate (${data.settings.exchangeRate.toFixed(2)}).`,
            !data.clearances.find((c) => c.shipmentId === shipment.id)?.releaseDate && 'The goods are not released by Customs yet, so clearance bills may be incomplete.',
          ]
            .filter(Boolean)
            .join(' ')}
        </div>
      )}

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total landed cost" value={formatLkr(cost.totalLanded)} hint={`${formatNumber(cost.totalQty)} units`} />
        <StatCard label="Average cost per unit" value={formatLkr(cost.perUnit)} tone="purple" />
        <StatCard label="Sales so far" value={result.hasSales ? formatLkr(result.revenue) : '—'} hint={result.hasSales ? `${formatNumber(result.soldQty)} units sold` : 'Nothing sold yet'} tone="green" />
        <StatCard
          label="Profit so far"
          value={result.hasSales ? formatLkr(result.profit) : '—'}
          hint={result.hasSales ? `${formatPercent(result.marginPercent)} of sales` : undefined}
          tone={result.profit >= 0 ? 'green' : 'red'}
        />
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Cost breakdown" description="All amounts in LKR" />
          <CardBody>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 align-top">
                    <p className="font-medium text-slate-900">Goods</p>
                    <ul className="mt-0.5 space-y-0.5 text-xs text-slate-500">
                      {payments.map((p) => (
                        <li key={p.id}>
                          {p.kind === 'ADVANCE' ? 'Advance' : 'Documents'} {formatUsd(p.amountUsd)} × {p.exchangeRate.toFixed(2)}{' '}
                          <Badge tone={PAYMENT_TERM[p.term].tone}>{p.term}</Badge> {p.status === 'PENDING' && <span className="text-amber-700">(pending)</span>}
                        </li>
                      ))}
                      {cost.unrecordedUsd > 0 && <li>{formatUsd(cost.unrecordedUsd)} not yet recorded × {data.settings.exchangeRate.toFixed(2)} (default)</li>}
                    </ul>
                  </td>
                  <td className="py-2 text-right align-top font-medium">{formatLkr(cost.goodsLkr)}</td>
                  <td className="w-14 py-2 text-right align-top text-xs text-slate-500">{share(cost.goodsLkr, cost.totalLanded)}</td>
                </tr>
                {[
                  ['Document charges', cost.docCharges],
                  ['Bank commission', cost.commission],
                  ['Other bank charges', cost.otherBankCharges],
                  ['Customs duties & taxes', cost.duties],
                  ['Port & handling', cost.portCharges],
                  ['Transport', cost.transport],
                  ['Clearing agent fee', cost.agentFee],
                  ['Other clearance charges', cost.otherClearance],
                ].map(([label, amount]) => (
                  <tr key={label as string}>
                    <td className="py-2 text-slate-700">{label}</td>
                    <td className="py-2 text-right">{formatLkr(amount as number)}</td>
                    <td className="w-14 py-2 text-right text-xs text-slate-500">{share(amount as number, cost.totalLanded)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-slate-200">
                  <td className="py-2.5 font-semibold text-slate-900">Total landed cost</td>
                  <td className="py-2.5 text-right text-base font-bold text-slate-900">{formatLkr(cost.totalLanded)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Cost mix" description="Where each rupee went" />
          <CardBody>
            <div className="h-80 w-full" role="img" aria-label="Bar chart of the cost components of this shipment">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={components} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" tickFormatter={compactLkr} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => formatLkr(Number(v))} cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                    {components.map((c) => (
                      <Cell key={c.name} fill={c.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      <h3 className="mb-2 font-semibold text-slate-900">Cost and price per product</h3>
      <DataTable columns={productColumns} rows={result.products} rowKey={(p) => p.productId} pageSize={20} />

      <Card className="mt-5">
        <CardHeader title="Profit" description="Realised profit on what has been sold so far" />
        <CardBody>
          <div className="grid gap-x-10 gap-y-2 text-sm sm:grid-cols-2">
            {[
              ['Sales', formatLkr(result.revenue)],
              ['Cost of units sold', formatLkr(result.cogs)],
              ['Lost / damaged stock', formatLkr(result.writeOff)],
              ['Profit so far', formatLkr(result.profit)],
              ['Margin (profit ÷ sales)', result.hasSales ? formatPercent(result.marginPercent) : '—'],
              ['Unsold stock at cost', formatLkr(result.remainingValue)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-slate-100 py-1.5">
                <span className="text-slate-500">{k}</span>
                <span className="font-medium text-slate-900">{v}</span>
              </div>
            ))}
          </div>
          {result.remainingValue > 0 && (
            <p className="mt-3 text-sm text-slate-600">
              If the unsold stock sells at the suggested prices, profit rises by about <strong>{formatLkr(projectedExtra)}</strong> to{' '}
              <strong>{formatLkr(result.profit + projectedExtra)}</strong>.
            </p>
          )}
          <p className="mt-3 text-xs text-slate-500">
            Suggested price = landed cost per unit × (1 + mark-up). Mark-up is a percentage of cost; margin is a percentage of the selling price, so a 30% mark-up gives
            about a 23% margin.
          </p>
        </CardBody>
      </Card>
    </div>
  )
}

const share = (amount: number, total: number) => (total > 0 && amount > 0 ? `${((amount / total) * 100).toFixed(1)}%` : '')
