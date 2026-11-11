import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART_COLORS, compactLkr } from '../../components/charts'
import { Card, CardBody, CardHeader } from '../../components/ui'
import type { Role } from '../../config/roles'
import type { Dashboard } from '../../lib/dashboard'
import { formatLkr, formatUsd } from '../../lib/format'

const AXIS = { fontSize: 12, fill: '#64748b' }

/** Which roles see which chart. The owner sees all of them. */
const WHO = {
  purchases: ['PURCHASING', 'FINANCE'] as Role[],
  sales: ['SALES', 'FINANCE'] as Role[],
  profit: ['FINANCE'] as Role[],
}

export default function DashboardCharts({ data, role }: { data: Dashboard; role: Role }) {
  const show = (roles: Role[]) => role === 'OWNER' || roles.includes(role)
  const charts = [
    show(WHO.purchases) && (
      <Card key="purchases">
        <CardHeader title="Purchases by month" description="Value of orders placed, in USD" />
        <CardBody>
          <div className="h-64 w-full" role="img" aria-label="Bar chart of purchases per month in USD">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.months} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}K`} tick={AXIS} axisLine={false} tickLine={false} width={44} />
                <Tooltip formatter={(v) => formatUsd(Number(v))} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="purchasesUsd" name="Purchases" fill={CHART_COLORS.goods} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>
    ),
    show(WHO.sales) && (
      <Card key="sales">
        <CardHeader title="Sales by month" description="Invoiced sales, in LKR" />
        <CardBody>
          <div className="h-64 w-full" role="img" aria-label="Bar chart of sales per month in LKR">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.months} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={compactLkr} tick={AXIS} axisLine={false} tickLine={false} width={44} />
                <Tooltip formatter={(v) => formatLkr(Number(v))} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="salesLkr" name="Sales" fill={CHART_COLORS.bank} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>
    ),
    show(WHO.profit) && (
      <Card key="profit" className="lg:col-span-2">
        <CardHeader title="Profit by shipment" description="Realised profit on what has been sold so far, in LKR" />
        <CardBody>
          {data.profitByShipment.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No sales yet.</p>
          ) : (
            <div className="h-64 w-full" role="img" aria-label="Bar chart of profit per shipment in LKR">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.profitByShipment} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="shipment" tick={AXIS} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={compactLkr} tick={AXIS} axisLine={false} tickLine={false} width={44} />
                  <Tooltip formatter={(v) => formatLkr(Number(v))} cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="profit" name="Profit" radius={[4, 4, 0, 0]}>
                    {data.profitByShipment.map((p) => (
                      <Cell key={p.shipment} fill={p.profit >= 0 ? '#16a34a' : '#dc2626'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardBody>
      </Card>
    ),
  ].filter(Boolean)

  if (charts.length === 0) return null
  return <div className="grid gap-5 lg:grid-cols-2">{charts}</div>
}
