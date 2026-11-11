import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, BookOpen, Container } from 'lucide-react'
import { Badge } from '../../components/ui'

/**
 * Standalone page frame for the documentation: no app sidebar or top bar,
 * just a slim header with a way back into the app.
 */
export function DocsShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white print:hidden">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/docs" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
              <Container size={18} />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold text-slate-900">ImportFlow</span>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <BookOpen size={11} /> Documentation
              </span>
            </span>
          </Link>
          <Badge tone="amber" className="hidden sm:inline-flex">
            Demo
          </Badge>
          <Link
            to="/"
            className="ml-auto inline-flex h-[38px] items-center gap-2 whitespace-nowrap rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={15} /> Back to the app
          </Link>
        </div>
      </header>
      <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
