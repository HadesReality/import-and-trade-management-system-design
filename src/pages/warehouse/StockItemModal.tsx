import { useState } from 'react'
import { Badge, Button, Field, Input, Modal, Select } from '../../components/ui'
import { stockRemaining } from '../../lib/calc'
import { formatDate, formatLkr, formatNumber, todayISO } from '../../lib/format'
import { useDataStore } from '../../store/dataStore'
import type { StockMoveType } from '../../types'

export const MOVE_TYPE: Record<StockMoveType, { label: string; tone: 'green' | 'blue' | 'amber' }> = {
  RECEIVED: { label: 'Received', tone: 'green' },
  SOLD: { label: 'Sold', tone: 'blue' },
  ADJUSTED: { label: 'Adjusted', tone: 'amber' },
}

interface Props {
  itemId: string
  unitCost: number
  onClose: () => void
}

/** History of one stock line plus a form to adjust it (damage, loss, found stock). */
export function StockItemModal({ itemId, unitCost, onClose }: Props) {
  const item = useDataStore((s) => s.stockItems.find((i) => i.id === itemId))
  const product = useDataStore((s) => s.products.find((p) => p.id === item?.productId))
  const shipment = useDataStore((s) => s.shipments.find((x) => x.id === item?.shipmentId))
  const movements = useDataStore((s) => s.stockMovements)
  const update = useDataStore((s) => s.update)
  const add = useDataStore((s) => s.add)

  const [direction, setDirection] = useState<'OUT' | 'IN'>('OUT')
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!item) return null
  const remaining = stockRemaining(item)
  const history = movements
    .filter((m) => m.stockItemId === item.id)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))

  const apply = () => {
    const e: Record<string, string> = {}
    const n = Number(qty)
    if (!(n > 0)) e.qty = 'Enter a quantity greater than zero'
    else if (direction === 'OUT' && n > remaining) e.qty = `Only ${formatNumber(remaining)} ${product?.unit ?? ''} left in stock`
    if (!note.trim()) e.note = 'Say why — e.g. “Damaged in handling”'
    setErrors(e)
    if (Object.keys(e).length) return
    const signed = direction === 'OUT' ? -n : n
    update('stockItems', item.id, { qtyAdjusted: item.qtyAdjusted + signed })
    add('stockMovements', { stockItemId: item.id, date: todayISO(), type: 'ADJUSTED', qty: signed, note: note.trim() })
    setQty('')
    setNote('')
  }

  return (
    <Modal open size="lg" title={`${product?.name ?? 'Stock'} — ${shipment?.ref ?? ''}`} onClose={onClose}>
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ['Received', formatNumber(item.qtyReceived)],
          ['Sold', formatNumber(item.qtySold)],
          ['Adjusted', formatNumber(item.qtyAdjusted)],
          ['In stock', `${formatNumber(remaining)} ${product?.unit ?? ''}`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">{k}</p>
            <p className="mt-0.5 text-lg font-semibold text-slate-900">{v}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {item.warehouse} · received {formatDate(item.receivedDate)} · landed cost {formatLkr(unitCost)} per {product?.unit} · stock value {formatLkr(remaining * unitCost)}
      </p>

      <h3 className="mb-2 mt-5 text-sm font-semibold text-slate-900">Adjust stock</h3>
      <div className="grid items-start gap-3 sm:grid-cols-12">
        <Field label="Type" className="sm:col-span-4">
          <Select value={direction} onChange={(e) => setDirection(e.target.value as 'OUT' | 'IN')}>
            <option value="OUT">Remove — damaged, lost, short</option>
            <option value="IN">Add — found, returned</option>
          </Select>
        </Field>
        <Field label={`Quantity (${product?.unit ?? ''})`} error={errors.qty} className="sm:col-span-2">
          <Input type="number" min={0} value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
        <Field label="Reason" error={errors.note} className="sm:col-span-4">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Damaged in handling" />
        </Field>
        <div className="sm:col-span-2 sm:pt-6">
          <Button onClick={apply} className="w-full">
            Apply
          </Button>
        </div>
      </div>
      {direction === 'OUT' && Number(qty) > 0 && Number(qty) <= remaining && (
        <p className="mt-1 text-xs text-slate-500">Written off at cost: {formatLkr(Number(qty) * unitCost)} (counted against this shipment's profit).</p>
      )}

      <h3 className="mb-2 mt-5 text-sm font-semibold text-slate-900">History</h3>
      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
        {history.length === 0 && <li className="px-3 py-3 text-sm text-slate-500">No movements recorded.</li>}
        {history.map((m) => (
          <li key={m.id} className="flex items-center gap-3 px-3 py-2 text-sm">
            <span className="w-24 shrink-0 text-xs text-slate-500">{formatDate(m.date)}</span>
            <Badge tone={MOVE_TYPE[m.type].tone}>{MOVE_TYPE[m.type].label}</Badge>
            <span className="min-w-0 flex-1 truncate text-slate-600">{m.note}</span>
            <span className={`shrink-0 font-medium ${m.qty < 0 ? 'text-red-600' : 'text-green-700'}`}>{m.qty > 0 ? `+${formatNumber(m.qty)}` : formatNumber(m.qty)}</span>
          </li>
        ))}
      </ul>
    </Modal>
  )
}
