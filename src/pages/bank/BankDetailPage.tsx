import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Pencil, Trash2 } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Modal, StatusBadge } from '../../components/ui'
import { BANK_PAYMENT_STATUS, PAYMENT_TERM, SHIPMENT_STATUS } from '../../config/statuses'
import { lcStatus, paymentCashOut, paymentCharges, paymentLkr } from '../../lib/bank'
import { formatDate, formatLkr, formatUsd } from '../../lib/format'
import { useDataStore } from '../../store/dataStore'

export function BankDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const payment = useDataStore((s) => s.bankPayments.find((p) => p.id === id))
  const shipment = useDataStore((s) => s.shipments.find((x) => x.id === payment?.shipmentId))
  const supplier = useDataStore((s) => s.suppliers.find((x) => x.id === shipment?.supplierId))
  const remove = useDataStore((s) => s.remove)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!payment) {
    return (
      <Card>
        <EmptyState title="Payment not found" hint="It may have been deleted." action={<Button onClick={() => navigate('/bank')}>Back to payments</Button>} />
      </Card>
    )
  }

  const lc = lcStatus(payment)
  const kindLabel = payment.kind === 'ADVANCE' ? 'Advance payment' : 'Documents payment'

  return (
    <div>
      <Link to="/bank" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Bank & payments
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-slate-900">{kindLabel}</h2>
            <Badge tone={PAYMENT_TERM[payment.term].tone}>{PAYMENT_TERM[payment.term].label}</Badge>
            <StatusBadge meta={BANK_PAYMENT_STATUS[payment.status]} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {shipment ? (
              <Link to={`/shipments/${shipment.id}`} className="hover:underline">
                {shipment.ref}
              </Link>
            ) : (
              '—'
            )}{' '}
            · {supplier?.name} · {payment.bank}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {payment.status === 'PENDING' && (
            <Button onClick={() => navigate(`/bank/${payment.id}/edit?pay=1`)}>
              <CheckCircle2 size={15} /> Mark as paid
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate(`/bank/${payment.id}/edit`)}>
            <Pencil size={15} /> Edit
          </Button>
          <Button variant="secondary" className="text-red-600 hover:bg-red-50" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={15} /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="How the rupee amount is worked out" />
          <CardBody>
            <div className="space-y-2 text-sm">
              <Line label="Amount">{formatUsd(payment.amountUsd)}</Line>
              <Line label="Exchange rate (LKR per USD)">{payment.exchangeRate.toFixed(2)}</Line>
              <Line label="Amount in LKR">
                <strong>{formatLkr(paymentLkr(payment))}</strong>
              </Line>
              <hr className="border-slate-100" />
              <Line label="Document charges">{formatLkr(payment.docCharges)}</Line>
              <Line label="Commission">{formatLkr(payment.commission)}</Line>
              <Line label="Other bank charges">{formatLkr(payment.otherCharges)}</Line>
              <Line label="Total bank charges">{formatLkr(paymentCharges(payment))}</Line>
              <hr className="border-slate-100" />
              <Line label="Total cash out">
                <strong className="text-base">{formatLkr(paymentCashOut(payment))}</strong>
              </Line>
            </div>
            {payment.status === 'PENDING' && (
              <p className="mt-3 text-xs text-slate-500">Pending: the exchange rate and charges are estimates until the payment is marked as paid.</p>
            )}
          </CardBody>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Payment details" />
            <CardBody className="space-y-2 text-sm">
              <Line label="Paid on">{formatDate(payment.paidDate)}</Line>
              {payment.kind === 'DOCUMENTS' && <Line label="Documents collected">{formatDate(payment.docsCollectedDate)}</Line>}
              {shipment && (
                <Line label="Shipment status">
                  <StatusBadge meta={SHIPMENT_STATUS[shipment.status]} />
                </Line>
              )}
            </CardBody>
          </Card>

          {payment.term === 'LC' && (
            <Card>
              <CardHeader title="Letter of credit" actions={lc && <Badge tone={lc.tone}>{lc.label}</Badge>} />
              <CardBody className="space-y-2 text-sm">
                <Line label="LC number">{payment.lcNumber || '—'}</Line>
                <Line label="Opened">{formatDate(payment.lcOpenDate)}</Line>
                <Line label="Expires">{formatDate(payment.lcExpiry)}</Line>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={confirmDelete}
        title="Delete this payment?"
        onClose={() => setConfirmDelete(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                remove('bankPayments', payment.id)
                navigate('/bank')
              }}
            >
              Delete payment
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-700">
          Removes this {formatUsd(payment.amountUsd)} payment from the records. The shipment's status is not changed — use <em>Undo last</em> on the shipment if needed.
        </p>
      </Modal>
    </div>
  )
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900">{children}</span>
    </div>
  )
}
