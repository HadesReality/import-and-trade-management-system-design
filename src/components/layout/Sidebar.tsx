import { NavLink } from 'react-router-dom'
import { Container, X } from 'lucide-react'
import { NAV_GROUPS, navItemsForRole } from '../../config/navigation'
import { useUiStore } from '../../store/uiStore'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const role = useUiStore((s) => s.role)
  const items = navItemsForRole(role)

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-30 bg-slate-900/50 lg:hidden print:hidden ${open ? 'block' : 'hidden'}`}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col print:hidden bg-sidebar text-slate-300 transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
              <Container size={20} />
            </span>
            <div className="leading-tight">
              <p className="font-semibold text-white">ImportFlow</p>
              <p className="text-xs text-slate-400">Import Trade Management</p>
            </div>
          </div>
          <button className="rounded p-1 hover:bg-white/10 lg:hidden" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => {
            const groupItems = items.filter((i) => i.group === group)
            if (groupItems.length === 0) return null
            return (
              <div key={group} className="mb-5">
                <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{group}</p>
                <ul className="space-y-0.5">
                  {groupItems.map((item) => (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end={item.path === '/'}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                            isActive ? 'bg-brand-500 text-white' : 'hover:bg-white/5 hover:text-white'
                          }`
                        }
                      >
                        <item.icon size={17} />
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </nav>

        <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-xs text-slate-500">
          <span>Prototype · mock data only</span>
          {import.meta.env.DEV && (
            <NavLink to="/ui-kit" onClick={onClose} className="hover:text-slate-300">
              UI kit
            </NavLink>
          )}
        </div>
      </aside>
    </>
  )
}
