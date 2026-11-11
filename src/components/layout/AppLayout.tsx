import { Suspense, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { NAV_ITEMS } from '../../config/navigation'
import { roleLabel } from '../../config/roles'
import { useUiStore } from '../../store/uiStore'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const role = useUiStore((s) => s.role)

  // Match the most specific nav item so detail pages (e.g. /shipments/123) keep their section title.
  const current = [...NAV_ITEMS]
    .sort((a, b) => b.path.length - a.path.length)
    .find((i) => (i.path === '/' ? pathname === '/' : pathname.startsWith(i.path)))
  const allowed = !current || current.roles.includes(role)

  return (
    <div className="flex h-full print:block print:h-auto">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col print:block">
        <Topbar title={current?.label ?? (pathname.startsWith('/ui-kit') ? 'UI Kit' : 'Not found')} onMenuClick={() => setMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 print:overflow-visible print:p-0">
          {allowed ? (
            <Suspense fallback={<p className="py-16 text-center text-sm text-slate-500">Loading…</p>}>
              <Outlet />
            </Suspense>
          ) : (
            <div className="mx-auto mt-16 max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center">
              <ShieldAlert className="mx-auto mb-3 text-amber-500" size={36} />
              <h2 className="text-lg font-semibold text-slate-900">Not available for this role</h2>
              <p className="mt-1 text-sm text-slate-600">
                <strong>{roleLabel(role)}</strong> users don't have access to {current?.label}. Switch role in the
                top bar to preview it.
              </p>
              <Link to="/" className="mt-5 inline-block text-sm font-medium text-brand-500 hover:underline">
                Go to dashboard
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
