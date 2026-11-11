import { useMemo, useState } from 'react'
import { Download, Printer } from 'lucide-react'
import { Button, Card, CardHeader, Input, PageHeader, StatCard, Tabs } from '../../components/ui'
import { formatDate, formatLkr, formatNumber, formatPercent, formatUsd } from '../../lib/format'
import { buildReport, downloadFile, REPORTS, toCsv, type Cell, type Fmt, type ReportId, type ReportTable } from '../../lib/reports'
import { useDataStore } from '../../store/dataStore'

const FORMAT: Record<Fmt, (v: number | string) => string> = {
  text: (v) => String(v),
  int: (v) => formatNumber(Number(v)),
  lkr: (v) => formatLkr(Number(v)),
  usd: (v) => formatUsd(Number(v)),
  pct: (v) => formatPercent(Number(v)),
  date: (v) => formatDate(String(v)),
}

const show = (v: Cell, fmt: Fmt = 'text') => (v === undefined || v === '' ? '—' : FORMAT[fmt](v))
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function ReportsPage() {
  const data = useDataStore()
  const [id, setId] = useState<ReportId>('shipments')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const meta = REPORTS.find((r) => r.id === id)!
  const report = useMemo(() => buildReport(id, data, { from: meta.usesRange ? from : '', to: meta.usesRange ? to : '' }), [id, data, from, to, meta.usesRange])
  const today = new Date().toISOString().slice(0, 10)

  const exportCsv = (table: ReportTable) => downloadFile(`${slug(meta.label)}-${slug(table.title)}-${today}.csv`, toCsv(table))

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Pick a report, set the period if it has one, then export the tables to CSV (opens in Excel) or print the page."
        actions={
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer size={15} /> Print
          </Button>
        }
      />

      <div className="print:hidden">
        <Tabs tabs={REPORTS.map((r) => ({ id: r.id, label: r.label }))} value={id} onChange={setId} />
      </div>

      <div className="mt-5 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{meta.label} report</h2>
            <p className="text-sm text-slate-500">
              {meta.description}
              {meta.usesRange && (from || to) ? ` Period: ${from ? formatDate(from) : 'start'} – ${to ? formatDate(to) : 'today'}.` : ''}
            </p>
          </div>
          {meta.usesRange && (
            <div className="flex flex-wrap items-end gap-2 print:hidden">
              <label className="text-xs text-slate-500">
                From
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 w-auto py-1.5" aria-label="From date" />
              </label>
              <label className="text-xs text-slate-500">
                To
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 w-auto py-1.5" aria-label="To date" />
              </label>
              {(from || to) && (
                <Button size="sm" variant="ghost" onClick={() => (setFrom(''), setTo(''))}>
                  Clear
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {report.summary.map((s) => (
            <StatCard key={s.label} label={s.label} value={FORMAT[s.fmt](s.value)} />
          ))}
        </div>

        {report.tables.map((table) => (
          <Card key={table.title} className="print:break-inside-avoid">
            <CardHeader
              title={table.title}
              description={`${table.rows.length} row(s)`}
              actions={
                <Button size="sm" variant="secondary" className="print:hidden" onClick={() => exportCsv(table)} disabled={table.rows.length === 0}>
                  <Download size={14} /> Export CSV
                </Button>
              }
            />
            {table.rows.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">No data for this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      {table.columns.map((c) => (
                        <th key={c.header} className={`whitespace-nowrap px-4 py-2.5 font-medium ${isNumeric(c.fmt) ? 'text-right' : ''}`}>
                          {c.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {table.rows.map((row, i) => (
                      <tr key={i}>
                        {row.map((v, j) => (
                          <td key={j} className={`px-4 py-2.5 ${isNumeric(table.columns[j].fmt) ? 'whitespace-nowrap text-right' : ''} ${v === undefined ? 'text-slate-400' : 'text-slate-700'}`}>
                            {show(v, table.columns[j].fmt)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  {table.totals && (
                    <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-900">
                      <tr>
                        {table.totals.map((v, j) => (
                          <td key={j} className={`px-4 py-2.5 ${isNumeric(table.columns[j].fmt) ? 'whitespace-nowrap text-right' : ''}`}>
                            {v === undefined ? '' : show(v, table.columns[j].fmt)}
                          </td>
                        ))}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

const isNumeric = (fmt?: Fmt) => fmt === 'int' || fmt === 'lkr' || fmt === 'usd' || fmt === 'pct'
