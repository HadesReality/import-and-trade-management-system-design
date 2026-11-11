import { useState } from 'react'
import { Button, Field, Input, Modal, Select, Textarea } from '../../components/ui'
import { PAYMENT_TERM } from '../../config/statuses'
import { SOURCING_COUNTRIES } from '../../config/sriLanka'
import { useDataStore } from '../../store/dataStore'
import type { PaymentTerm, Supplier } from '../../types'

type FormState = Omit<Supplier, 'id' | 'notes'>

const EMPTY: FormState = {
  name: '',
  country: '',
  city: '',
  contactPerson: '',
  whatsapp: '',
  email: '',
  address: '',
  usualTerm: 'TT',
  productsSupplied: '',
}

interface Props {
  /** Pass a supplier to edit it; omit to add a new one. */
  supplier?: Supplier
  onClose: () => void
  onSaved?: (id: string) => void
}

/** Mount this only while it should be visible, so the form starts fresh each time. */
export function SupplierFormModal({ supplier, onClose, onSaved }: Props) {
  const add = useDataStore((s) => s.add)
  const update = useDataStore((s) => s.update)
  const [form, setForm] = useState<FormState>(() => {
    if (!supplier) return EMPTY
    const { id: _id, notes: _notes, ...rest } = supplier
    return rest
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))
  const dial = SOURCING_COUNTRIES.find((c) => c.name === form.country)?.dial

  const validate = () => {
    const e: Partial<Record<keyof FormState, string>> = {}
    if (!form.name.trim()) e.name = 'Supplier name is required'
    if (!form.country) e.country = 'Select the supplier’s country'
    if (!form.contactPerson.trim()) e.contactPerson = 'Contact person is required'
    if (form.whatsapp && !/^\+?[0-9 ()-]{7,20}$/.test(form.whatsapp.trim()))
      e.whatsapp = 'Use international format, e.g. +86 138 0013 8000'
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Enter a valid email address'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const save = () => {
    if (!validate()) return
    const clean: FormState = {
      ...form,
      name: form.name.trim(),
      city: form.city.trim(),
      contactPerson: form.contactPerson.trim(),
      whatsapp: form.whatsapp.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      productsSupplied: form.productsSupplied.trim(),
    }
    if (supplier) {
      update('suppliers', supplier.id, clean)
      onSaved?.(supplier.id)
    } else {
      const created = add('suppliers', { ...clean, notes: [] })
      onSaved?.(created.id)
    }
    onClose()
  }

  // Keep a country that is not in the quick list (e.g. imported data) selectable when editing.
  const countries = SOURCING_COUNTRIES.some((c) => c.name === form.country) || !form.country
    ? SOURCING_COUNTRIES.map((c) => c.name)
    : [form.country, ...SOURCING_COUNTRIES.map((c) => c.name)]

  return (
    <Modal
      open
      size="lg"
      title={supplier ? 'Edit supplier' : 'Add supplier'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>{supplier ? 'Save changes' : 'Add supplier'}</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Supplier name" required error={errors.name} className="sm:col-span-2">
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Guangdong Hengli Building Materials Co." />
        </Field>
        <Field label="Country" required error={errors.country}>
          <Select value={form.country} onChange={(e) => set('country', e.target.value)}>
            <option value="">Select country…</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="City">
          <Input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="e.g. Foshan" />
        </Field>
        <Field label="Contact person" required error={errors.contactPerson}>
          <Input value={form.contactPerson} onChange={(e) => set('contactPerson', e.target.value)} />
        </Field>
        <Field
          label="WhatsApp number"
          error={errors.whatsapp}
          hint={dial ? `Start with ${dial} for ${form.country}` : 'Include the country code'}
        >
          <Input value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder={dial ? `${dial} …` : '+'} />
        </Field>
        <Field label="Email" error={errors.email}>
          <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </Field>
        <Field label="Usual payment term" hint={PAYMENT_TERM[form.usualTerm].full}>
          <Select value={form.usualTerm} onChange={(e) => set('usualTerm', e.target.value as PaymentTerm)}>
            {Object.entries(PAYMENT_TERM).map(([id, m]) => (
              <option key={id} value={id}>
                {m.label} — {m.full}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Address" className="sm:col-span-2">
          <Textarea rows={2} value={form.address} onChange={(e) => set('address', e.target.value)} />
        </Field>
        <Field label="Products supplied" className="sm:col-span-2">
          <Textarea rows={2} value={form.productsSupplied} onChange={(e) => set('productsSupplied', e.target.value)} placeholder="e.g. Porcelain tiles, PVC pipes" />
        </Field>
      </div>
    </Modal>
  )
}
