import { useEffect, useState, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { Badge } from '../../components/ui'
import { roleLabel, type Role } from '../../config/roles'
import type { DocFunction } from '../../docs/types'
import { cn } from '../../lib/cn'

/** Renders **bold** and `code` inside documentation text. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') ? (
          <strong key={i} className="font-semibold text-slate-900">
            {p.slice(2, -2)}
          </strong>
        ) : p.startsWith('`') ? (
          <code key={i} className="rounded bg-slate-100 px-1 py-0.5 text-[0.85em] text-slate-800">
            {p.slice(1, -1)}
          </code>
        ) : (
          p
        ),
      )}
    </>
  )
}

export function RoleChips({ roles, highlight }: { roles: Role[]; highlight?: Role | 'ALL' }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      {roles.map((r) => (
        <Badge key={r} tone={highlight === r ? 'blue' : 'gray'}>
          {roleLabel(r)}
        </Badge>
      ))}
    </span>
  )
}

interface FunctionCardProps {
  anchor: string
  fn: DocFunction
  /** Expand / collapse all: the card follows `open` whenever `version` changes. */
  expand: { open: boolean; version: number }
  highlight?: Role | 'ALL'
}

/** One function: title, who usually does it, numbered steps and notes. */
export function FunctionCard({ anchor, fn, expand, highlight }: FunctionCardProps) {
  const [open, setOpen] = useState(expand.open)
  useEffect(() => setOpen(expand.open), [expand.version, expand.open])

  return (
    <details
      id={anchor}
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      className="group scroll-mt-20 rounded-lg border border-slate-200 bg-white print:break-inside-avoid"
    >
      <summary className="flex cursor-pointer list-none items-start gap-2 px-4 py-3 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
        <ChevronRight size={16} className="mt-0.5 shrink-0 text-slate-400 transition-transform group-open:rotate-90" />
        <span className="flex-1 font-medium text-slate-900">{fn.title}</span>
        {fn.by && (
          <span className="hidden sm:inline-flex">
            <RoleChips roles={fn.by} highlight={highlight} />
          </span>
        )}
      </summary>
      <div className="border-t border-slate-100 px-4 pb-4 pt-3 sm:pl-10">
        {fn.by && (
          <p className="mb-2 text-xs text-slate-500 sm:hidden">
            Usually done by: {fn.by.map(roleLabel).join(', ')}
          </p>
        )}
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">How to do it</p>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
          {fn.steps.map((s, i) => (
            <li key={i}>
              <Rich text={s} />
            </li>
          ))}
        </ol>
        {fn.notes && fn.notes.length > 0 && (
          <>
            <p className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Good to know</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
              {fn.notes.map((n, i) => (
                <li key={i}>
                  <Rich text={n} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </details>
  )
}

export function DocSection({ id, title, intro, children, className }: { id: string; title: string; intro?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={cn('scroll-mt-20', className)}>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {intro && <div className="mt-1 text-sm text-slate-600">{intro}</div>}
      <div className="mt-3">{children}</div>
    </section>
  )
}
