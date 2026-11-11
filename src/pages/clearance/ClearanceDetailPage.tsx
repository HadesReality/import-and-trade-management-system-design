import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Pencil, Trash2 } from 'lucide-react'
import { AttachmentList } from '../../components/AttachmentList'
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Modal, StatusBadge } from '../../components/ui'
import { SHIPMENT_STATUS } from '../../config/statuses'
import { clearanceStatus, clearanceTotal, DUTY_FIELDS } from '../../lib/clearance'
import { dropCachedFile } from '../../lib/fileCache'
import { formatDate, formatLkr } from '../../lib/format'
import { useDataStore } from '../../store/dataStore'

export function ClearanceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const clearance = useDataStore((s) => s.clearances.find((c) => c.id === id))
  const shipment = useDataStore((s) => s.shipments.find((x) => x.id === clearance?.shipmentId))
  const supplier = useDataStore((s) => s.suppliers.find((x) => x.id === shipment?.supplierId))
  const remove = useDataStore((s) => s.remove)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!clearance) {
    return (
      <Card>
        <EmptyState title="Clearance record not found" hint="It may have been deleted." action={<Button onClick={() => navigate('/clearance')}>Back to clearance</Button>} />
      </Card>
    )
  }

  const status = clearanceStatus(clearance)
  const total = clearanceTotal(clearance)
  const bills: [string, number][] = [
    ['Customs duties & taxes', clearance.duties],
    ['Port & handling', clearance.portCharges],
    ['Transport', clearance.transport],
    ['Clearing agent fee', clearance.agentFee],
    ['Other charges', clearance.otherCharges],
  ]

  return (
    <div>
      <Link to="/clearance" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Clearance
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-slate-900">{shipment?.ref ?? 'Clearance'}</h2>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {shipment && (
              <Link to={`/shipments/${shipment.id}`} className="hover:underline">
                View shipment
              </Link>
            )}{' '}
            · {supplier?.name} · {clearance.clearingCompany}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!clearance.releaseDate && (
            <Button onClick={() => navigate(`/clearance/${clearance.id}/edit?release=1`)}>
              <CheckCircle2 size={15} /> Mark as released
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate(`/clearance/${clearance.id}/edit`)}>
            <Pencil size={15} /> Edit
          </Button>
          <Button variant="secondary" className="text-red-600 hover:bg-red-50" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={15} /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader title="Clearance bills" description="As billed by the clearing agent (LKR)" />
            <CardBody className="space-y-2 text-sm">
              {bills.map(([label, amount]) => (
                <Row key={label} label={label}>
                  {formatLkr(amount)}
                </Row>
              ))}
              <hr className="border-slate-100" />
              <Row label="Total clearance cost">
                <strong className="text-base">{formatLkr(total)}</strong>
              </Row>
            </CardBody>
          </Card>

          {clearance.dutyBreakdown && (
            <Card>
              <CardHeader title="Duties & taxes breakdown" />
              <CardBody className="space-y-2 text-sm">
                {DUTY_FIELDS.map((f) => (
                  <Row key={f.key} label={f.label}>
                    {formatLkr(clearance.dutyBreakdown![f.key])}
                  </Row>
                ))}
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Bills & CusDec copy" />
            <CardBody>
              <AttachmentList attachments={clearance.attachments} emptyText="No files attached. Use Edit to attach the agent's bill." />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Customs & timing" />
            <CardBody className="space-y-2 text-sm">
              <Row label="CusDec number">{clearance.cusdecNumber || <span className="text-slate-400">Not filed</span>}</Row>
              <Row label="Handed over">{formatDate(clearance.handoverDate)}</Row>
              <Row label="Released">{formatDate(clearance.releaseDate)}</Row>
              <Row label={clearance.releaseDate ? 'Time to clear' : 'Time with agent'}>{status.days} day(s)</Row>
              {shipment && (
                <Row label="Shipment status">
                  <StatusBadge meta={SHIPMENT_STATUS[shipment.status]} />
                </Row>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        open={confirmDelete}
        title="Delete this clearance record?"
        onClose={() => setConfirmDelete(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                clearance.attachments.forEach((a) => dropCachedFile(a.id))
                remove('clearances', clearance.id)
                navigate('/clearance')
              }}
            >
              Delete record
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-700">
          Removes the clearance bills for {shipment?.ref}. The shipment's status is not changed — use <em>Undo last</em> on the shipment if needed.
        </p>
      </Modal>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900">{children}</span>
    </div>
  )
}
