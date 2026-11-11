import { useMemo, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { cn } from '../../lib/cn'
import { EmptyState } from './EmptyState'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  /** Provide to make the column sortable. */
  sortValue?: (row: T) => string | number
  align?: 'left' | 'right'
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  /** Text used by the search box; omit to hide the search box. */
  searchText?: (row: T) => string
  searchPlaceholder?: string
  pageSize?: number
  onRowClick?: (row: T) => void
  /** Extra controls (filters, buttons) shown next to the search box. */
  toolbar?: ReactNode
  emptyTitle?: string
  emptyHint?: string
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  searchText,
  searchPlaceholder = 'Search…',
  pageSize = 10,
  onRowClick,
  toolbar,
  emptyTitle = 'Nothing to show',
  emptyHint,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null)
  const [page, setPage] = useState(0)

  const processed = useMemo(() => {
    let out = rows
    const q = query.trim().toLowerCase()
    if (q && searchText) out = out.filter((r) => searchText(r).toLowerCase().includes(q))
    const col = sort && columns.find((c) => c.key === sort.key)
    if (sort && col?.sortValue) {
      const get = col.sortValue
      const dir = sort.dir === 'asc' ? 1 : -1
      out = [...out].sort((a, b) => {
        const x = get(a)
        const y = get(b)
        return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * dir
      })
    }
    return out
  }, [rows, query, sort, columns, searchText])

  const pageCount = Math.max(1, Math.ceil(processed.length / pageSize))
  const current = Math.min(page, pageCount - 1)
  const visible = processed.slice(current * pageSize, current * pageSize + pageSize)

  const toggleSort = (key: string) => {
    setPage(0)
    setSort((s) => (s?.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : null))
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {(searchText || toolbar) && (
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3">
          {searchText && (
            <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(0)
                }}
                placeholder={searchPlaceholder}
                className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          )}
          {toolbar && <div className="ml-auto flex flex-wrap items-center gap-2">{toolbar}</div>}
        </div>
      )}

      {processed.length === 0 ? (
        <EmptyState title={emptyTitle} hint={emptyHint ?? (query ? 'Try a different search.' : undefined)} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {columns.map((c) => {
                  const active = sort?.key === c.key
                  return (
                    <th
                      key={c.key}
                      className={cn('whitespace-nowrap px-4 py-2.5 font-medium', c.align === 'right' && 'text-right')}
                      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                    >
                      {c.sortValue ? (
                        <button
                          onClick={() => toggleSort(c.key)}
                          className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-slate-800"
                        >
                          {c.header}
                          {active && (sort.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                        </button>
                      ) : (
                        c.header
                      )}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(onRowClick && 'cursor-pointer hover:bg-slate-50')}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn('px-4 py-3 align-middle text-slate-700', c.align === 'right' && 'text-right', c.className)}
                    >
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {processed.length > pageSize && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 text-sm text-slate-500">
          <span>
            {current * pageSize + 1}–{Math.min(processed.length, (current + 1) * pageSize)} of {processed.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(current - 1)}
              disabled={current === 0}
              className="rounded p-1.5 hover:bg-slate-100 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(current + 1)}
              disabled={current >= pageCount - 1}
              className="rounded p-1.5 hover:bg-slate-100 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
