import { getCachedFile } from '../lib/fileCache'
import { Modal } from './ui'

/** Shows a file added in this session (image, PDF, or a download link). Renders nothing when the file is gone. */
export function FilePreviewModal({ id, name, onClose }: { id: string; name: string; onClose: () => void }) {
  const cached = getCachedFile(id)
  return (
    <Modal open={!!cached} title={name} size="lg" onClose={onClose}>
      {cached && (
        <div className="flex justify-center">
          {cached.type.startsWith('image/') ? (
            <img src={cached.url} alt={name} className="max-h-[60vh] max-w-full rounded" />
          ) : cached.type === 'application/pdf' ? (
            <iframe src={cached.url} title={name} className="h-[60vh] w-full rounded border border-slate-200" />
          ) : (
            <a href={cached.url} download={name} className="text-sm font-medium text-brand-600 hover:underline">
              Download {name}
            </a>
          )}
        </div>
      )}
    </Modal>
  )
}
