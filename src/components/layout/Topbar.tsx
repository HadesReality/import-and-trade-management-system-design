import { Menu, UserCircle } from 'lucide-react'
import { ROLES, type Role } from '../../config/roles'
import { useUiStore } from '../../store/uiStore'

interface TopbarProps {
  title: string
  onMenuClick: () => void
}

export function Topbar({ title, onMenuClick }: TopbarProps) {
  const role = useUiStore((s) => s.role)
  const setRole = useUiStore((s) => s.setRole)

  return (
    <header className="sticky top-0 z-20 flex h-16 print:hidden items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
      <button
        className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <h1 className="truncate text-lg font-semibold text-slate-900">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <span className="hidden rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 sm:inline">
          Demo
        </span>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 py-1 pl-2 pr-1 text-sm">
          <UserCircle size={18} className="text-slate-500" />
          <span className="sr-only">Viewing as role</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="max-w-[7.5rem] cursor-pointer sm:max-w-[11rem] bg-transparent py-1 pr-1 text-sm font-medium text-slate-700 outline-none"
            title="Switch role to preview what each user sees"
          >
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  )
}
