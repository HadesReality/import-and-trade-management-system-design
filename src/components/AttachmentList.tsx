import { useState } from 'react'
import { Eye, FileText, Image as ImageIcon, Trash2 } from 'lucide-react'
import { dropCachedFile, getCachedFile } from '../lib/fileCache'
import { formatBytes, formatDate } from '../lib/format'
import type { Attachment } from '../types'
import { FilePreviewModal } from './FilePreviewModal'
import { Button } from './ui'

interface Props {
  attachments: Attachment[]
  /** When given, each file shows a remove button. */
  onRemove?: (id: string) => void
  emptyText?: string
}

const isImage = (name: string) => /\.(png|jpe?g|gif|webp)$/i.test(name)

export function AttachmentList({ attachments, onRemove, emptyText = 'No files attached.' }: Props) {
  const [previewId, setPreviewId] = useState<string | null>(null)
  const preview = attachments.find((a) => a.id === previewId)

  if (attachments.length === 0) return <p className="text-sm text-slate-500">{emptyText}</p>

  return (
    <>
      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
        {attachments.map((a) => {
          const available = !!getCachedFile(a.id)
          return (
            <li key={a.id} className="flex items-center gap-3 px-3 py-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                {isImage(a.name) ? <ImageIcon size={17} /> : <FileText size={17} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{a.name}</p>
                <p className="text-xs text-slate-500">
                  {formatBytes(a.size)} · added {formatDate(a.addedAt)}
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                disabled={!available}
                title={available ? 'Preview' : 'Preview is only available in the session where the file was added (prototype)'}
                onClick={() => setPreviewId(a.id)}
              >
                <Eye size={14} /> Preview
              </Button>
              {onRemove && (
                <button
                  onClick={() => {
                    dropCachedFile(a.id)
                    onRemove(a.id)
                  }}
                  className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Remove ${a.name}`}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </li>
          )
        })}
      </ul>
      {attachments.some((a) => !getCachedFile(a.id)) && (
        <p className="mt-2 text-xs text-slate-500">
          Prototype note: only file names are saved. A file can be previewed in the session where it was added.
        </p>
      )}

      {preview && <FilePreviewModal id={preview.id} name={preview.name} onClose={() => setPreviewId(null)} />}
    </>
  )
}
