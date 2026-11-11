import { useState } from 'react'
import { Button, Field, Input, Modal, Select } from '../../components/ui'
import { useDataStore } from '../../store/dataStore'

/** Quick add of a product from inside the order form. Mount only while visible. */
export function NewProductModal({ onClose, onCreated }: { onClose: () => void; onCreated: (productId: string) => void }) {
  const add = useDataStore((s) => s.add)
  const units = useDataStore((s) => s.settings.units)
  const [name, setName] = useState('')
  const [hsCode, setHsCode] = useState('')
  const [unit, setUnit] = useState(units[0] ?? 'Piece')
  const [error, setError] = useState('')

  const save = () => {
    if (!name.trim()) return setError('Product name is required')
    const created = add('products', { name: name.trim(), hsCode: hsCode.trim(), unit })
    onCreated(created.id)
    onClose()
  }

  return (
    <Modal
      open
      title="New product"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Add product</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Product name" required error={error}>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>
        <Field label="HS code" hint="Used by the clearing agent for the customs declaration (optional)">
          <Input value={hsCode} onChange={(e) => setHsCode(e.target.value)} placeholder="e.g. 6907.21" />
        </Field>
        <Field label="Unit">
          <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Modal>
  )
}
