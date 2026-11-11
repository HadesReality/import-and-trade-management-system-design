import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, Plus } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, DataTable, PageHeader, Select, StatCard, StatusBadge, type Column } from '../../components/ui'
import { BANK_PAYMENT_STATUS, PAYMENT_TERM } from '../../config/statuses'
import { isOpenLc, lcStatus, paymentCashOut, paymentCharges, paymentLkr } from '../../lib/bank'
import { formatDate, formatLkr, formatUsd } from '../../lib/format'
import { etaInfo } from '../../lib/shipments'
import { useDataStore } from '../../store/dataStore'
import type { BankPayment, PaymentTerm } from '../../types'

interface Row extends BankPayment {
  shipmentRef: string
  supplierName: string
}

export function BankPage() {
  const navigate = useNavigate()
  const payments = useDataStore((s) => s.bankPayments)
  const shipments = useDataStore((s) => s.shipments)
  const suppliers = useDataStore((s) => s.suppliers)
  const banks = useDataStore((s) => s.settings.banks)
  const [status, setStatus] = useState('')
  const [term, setTerm] = useState<PaymentTerm | ''>('')
  const [bank, setBank] = useState('')

  const all: Row[] = useMemo(
    () =>
      payments.map((p) => {
        const ship = shipments.find((s) => s.id === p.shipmentId)
        return { ...p, shipmentRef: ship?.ref ?? '—', supplierName: suppliers.find((s) => s.id === ship?.supplierId)?.name ?? '—' }
      }),
    [payments, shipments, suppliers],
  )

  const rows = all
    .filter((p) => (!status || p.status === status) && (!term || p.term === term) && (!bank || p.bank === bank))
    .sort((a, b) => (b.paidDate ?? '9999').localeCompare(a.paidDate ?? '9999'))

  const pending = all.filter((p) => p.status === 'PENDING')
  const paid = all.filter((p) => p.status === 'PAID')
  const openLcs = all.filter(isOpenLc)

  // Things that need attention today.
  const lcAlerts = all.filter((p) => lcStatus(p)?.urgent)
  const dueAtBank = shipments
    .filter((s) => s.status === 'ARRIVED')
    .map((s) => ({ shipment: s, payment: all.find((p) => p.shipmentId === s.id && p.kind === 'DOCUMENTS' && p.status === 'PENDING') }))
  const alertCount = lcAlerts.length + dueAtBank.length

  const columns: Column<Row>[] = [
    { key: 'ship', header: 'Shipment', sortValue: (p) => p.shipmentRef, render: (p) => <div><p className="font-medium text-slate-900">{p.shipmentRef}</p><p className="text-xs text-slate-500">{p.supplierName}</p></div> },
    { key: 'kind', header: 'Payment', render: (p) => (p.kind === 'ADVANCE' ? 'Advance' : 'Documents') },
    { key: 'term', header: 'Term', render: (p) => <Badge tone={PAYMENT_TERM[p.term].tone}>{PAYMENT_TERM[p.term].label}</Badge> },
    {
      key: 'bank',
      header: 'Bank',
      sortValue: (p) => p.bank,
      render: (p) => (
        <div>
          <p>{p.bank}</p>
          {p.lcNumber && <p className="text-xs text-slate-500">{p.lcNumber}</p>}
        </div>
      ),
    },
    { key: 'usd', header: 'Amount', align: 'right', sortValue: (p) => p.amountUsd, render: (p) => formatUsd(p.amountUsd) },
    { key: 'rate', header: 'Rate', align: 'right', render: (p) => p.exchangeRate.toFixed(2) },
    { key: 'lkr', header: 'In LKR', align: 'right', sortValue: (p) => paymentLkr(p), render: (p) => formatLkr(paymentLkr(p)) },
    { key: 'charges', header: 'Bank charges', align: 'right', render: (p) => formatLkr(paymentCharges(p)) },
    {
      key: 'lc',
      header: 'LC',
      render: (p) => {
        const lc = lcStatus(p)
        return lc ? <Badge tone={lc.tone}>{lc.label}</Badge> : <span className="text-slate-400">—</span>
      },
    },
    { key: 'paid', header: 'Paid on', sortValue: (p) => p.paidDate ?? '', render: (p) => formatDate(p.paidDate) },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge meta={BANK_PAYMENT_STATUS[p.status]} /> },
  ]

  return (
    <div>
      <PageHeader
        title="Bank & Payments"
        description="Advance and document payments to suppliers' banks, with the exchange rate and bank charges."
        actions={
          <Button onClick={() => navigate('/bank/new')}>
            <Plus size={16} /> Record payment
          </Button>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending payments" value={pending.length} hint={formatUsd(pending.reduce((s, p) => s + p.amountUsd, 0))} tone="amber" />
        <StatCard label="Paid so far" value={formatLkr(paid.reduce((s, p) => s + paymentLkr(p), 0))} hint={`${paid.length} payments`} tone="green" />
        <StatCard label="Bank charges paid" value={formatLkr(paid.reduce((s, p) => s + paymentCharges(p), 0))} tone="purple" />
        <StatCard label="Open LCs" value={openLcs.length} hint="Documents not collected yet" />
      </div>

      <Card className="mb-5">
        <CardHeader title="Needs attention" description={alertCount === 0 ? 'Nothing urgent right now.' : `${alertCount} item(s)`} />
        {alertCount > 0 && (
          <CardBody className="space-y-2">
            {lcAlerts.map((p) => {
              const lc = lcStatus(p)!
              return (
                <Link key={p.id} to={`/bank/${p.id}`} className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 hover:bg-amber-100">
                  <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                  <span>
                    <strong>LC {p.lcNumber}</strong> ({p.shipmentRef}, {p.bank}) — {lc.label.toLowerCase()} on {formatDate(p.lcExpiry)}. Collect the documents before it lapses.
                  </span>
                </Link>
              )
            })}
            {dueAtBank.map(({ shipment, payment }) => (
              <Link
                key={shipment.id}
                to={payment ? `/bank/${payment.id}/edit?pay=1` : `/bank/new?shipment=${shipment.id}`}
                className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 hover:bg-blue-100"
              >
                <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                <span>
                  <strong>{shipment.ref}</strong> has arrived ({etaInfo(shipment).label}) — pay the bank to collect the original documents
                  {payment ? ` (${formatUsd(payment.amountUsd)} at ${payment.bank}).` : '.'}
                </span>
              </Link>
            ))}
          </CardBody>
        )}
      </Card>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(p) => p.id}
        searchText={(p) => `${p.shipmentRef} ${p.supplierName} ${p.bank} ${p.lcNumber}`}
        searchPlaceholder="Search shipment, supplier, bank, LC no…"
        onRowClick={(p) => navigate(`/bank/${p.id}`)}
        emptyTitle="No payments found"
        toolbar={
          <>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto" aria-label="Filter by status">
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
            </Select>
            <Select value={term} onChange={(e) => setTerm(e.target.value as PaymentTerm | '')} className="w-auto" aria-label="Filter by term">
              <option value="">All terms</option>
              {(['TT', 'LC', 'DP'] as const).map((t) => (
                <option key={t} value={t}>
                  {PAYMENT_TERM[t].label} — {PAYMENT_TERM[t].full}
                </option>
              ))}
            </Select>
            <Select value={bank} onChange={(e) => setBank(e.target.value)} className="w-auto max-w-[11rem]" aria-label="Filter by bank">
              <option value="">All banks</option>
              {banks.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
          </>
        }
      />
      <p className="mt-2 text-xs text-slate-500">
        Cash out so far (goods + charges): {formatLkr(paid.reduce((s, p) => s + paymentCashOut(p), 0))}
      </p>
    </div>
  )
}
