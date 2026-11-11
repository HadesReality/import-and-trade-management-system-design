import { useRef, useState } from 'react'
import { Eye, Paperclip } from 'lucide-react'
import { FilePreviewModal } from '../../components/FilePreviewModal'
import { Badge, Button, Card, CardBody, CardHeader, Select } from '../../components/ui'
import { DOC_STATE, DOC_TYPE } from '../../config/statuses'
import { cacheFile, getCachedFile } from '../../lib/fileCache'
import { hasShipped } from '../../lib/shipments'
import { useDataStore } from '../../store/dataStore'
import type { DocState, DocType, Shipment } from '../../types'

const cacheId = (shipmentId: string, type: DocType) => `shipdoc-${shipmentId}-${type}`

export function DocumentsCard({ shipment }: { shipment: Shipment }) {
  const update = useDataStore((s) => s.update)
  const [preview, setPreview] = useState<DocType | null>(null)
  const inputs = useRef<Partial<Record<DocType, HTMLInputElement | null>>>({})

  const received = shipment.documents.filter((d) => d.state !== 'MISSING').length
  const missing = shipment.documents.filter((d) => d.state === 'MISSING').length

  const setDoc = (type: DocType, patch: { state?: DocState; fileName?: string }) =>
    update('shipments', shipment.id, {
      documents: shipment.documents.map((d) => (d.type === type ? { ...d, ...patch } : d)),
    })

  const attach = (type: DocType, file?: File) => {
    if (!file) return
    cacheFile(cacheId(shipment.id, type), file)
    const doc = shipment.documents.find((d) => d.type === type)
    setDoc(type, { fileName: file.name, ...(doc?.state === 'MISSING' && { state: 'COPY_RECEIVED' as const }) })
  }

  const previewDoc = shipment.documents.find((d) => d.type === preview)

  return (
    <Card>
      <CardHeader
        title="Documents checklist"
        description={`${received} of ${shipment.documents.length} received`}
        actions={hasShipped(shipment.status) && missing > 0 ? <Badge tone="red">{missing} missing</Badge> : undefined}
      />
      <CardBody className="p-0">
        <ul className="divide-y divide-slate-100">
          {shipment.documents.map((d) => (
            <li key={d.type} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">{DOC_TYPE[d.type]}</p>
                <p className="truncate text-xs text-slate-500">{d.fileName ?? 'No file attached'}</p>
              </div>
              <Badge tone={DOC_STATE[d.state].tone}>{DOC_STATE[d.state].label}</Badge>
              <Select
                value={d.state}
                onChange={(e) => setDoc(d.type, { state: e.target.value as DocState })}
                className="w-auto py-1.5 text-xs"
                aria-label={`${DOC_TYPE[d.type]} status`}
              >
                {Object.entries(DOC_STATE).map(([id, m]) => (
                  <option key={id} value={id}>
                    {m.label}
                  </option>
                ))}
              </Select>
              <input
                ref={(el) => {
                  inputs.current[d.type] = el
                }}
                type="file"
                accept=".pdf,image/*"
                className="hidden"
                onChange={(e) => {
                  attach(d.type, e.target.files?.[0])
                  e.target.value = ''
                }}
              />
              <Button size="sm" variant="secondary" onClick={() => inputs.current[d.type]?.click()}>
                <Paperclip size={13} /> {d.fileName ? 'Replace' : 'Attach'}
              </Button>
              {d.fileName && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!getCachedFile(cacheId(shipment.id, d.type))}
                  title="Previews are only available in the session where the file was added (prototype)"
                  onClick={() => setPreview(d.type)}
                >
                  <Eye size={13} /> Preview
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardBody>
      {preview && previewDoc?.fileName && (
        <FilePreviewModal id={cacheId(shipment.id, preview)} name={previewDoc.fileName} onClose={() => setPreview(null)} />
      )}
    </Card>
  )
}
