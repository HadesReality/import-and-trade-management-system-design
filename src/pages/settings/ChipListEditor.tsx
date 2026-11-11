import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button, Input } from '../../components/ui'

interface Props {
  label: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
  hint?: string
}

/** An editable list of short names (banks, ports…). Changes are applied straight away. */
export function ChipListEditor({ label, items, onChange, placeholder, hint }: Props) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  const add = () => {
    const v = value.trim()
    if (!v) return setError('Type a name first')
    if (items.some((i) => i.toLowerCase() === v.toLowerCase())) return setError(`“${v}” is already in the list`)
    onChange([...items, v])
    setValue('')
    setError('')
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-700">
        {label} <span className="font-normal text-slate-400">({items.length})</span>
      </p>
      <ul className="mb-2 flex flex-wrap gap-1.5" aria-label={label}>
        {items.map((item) => (
          <li key={item} className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 text-sm text-slate-700">
            {item}
            <button onClick={() => onChange(items.filter((i) => i !== item))} className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-red-600" aria-label={`Remove ${item}`}>
              <X size={13} />
            </button>
          </li>
        ))}
        {items.length === 0 && <li className="text-sm text-slate-400">Nothing added yet.</li>}
      </ul>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => (setValue(e.target.value), setError(''))}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder ?? 'Add new…'}
          className="max-w-xs"
          aria-label={`Add to ${label}`}
        />
        <Button variant="secondary" onClick={add}>
          <Plus size={14} /> Add
        </Button>
      </div>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}
