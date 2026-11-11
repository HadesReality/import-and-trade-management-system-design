import { useState } from 'react'
import { Button, Field, Input, Modal, Select, Textarea } from '../../components/ui'
import { SL_DISTRICTS } from '../../config/sriLanka'
import { isValidSriLankanPhone } from '../../lib/sales'
import { useDataStore } from '../../store/dataStore'
import type { Customer } from '../../types'

type FormState = Omit<Customer, 'id'>

const EMPTY: FormState = { name: '', business: '', phone: '', email: '', address: '', city: '', district: '' }

interface Props {
  customer?: Customer
  onClose: () => void
  onSaved?: (id: string) => void
}

/** Add or edit a customer. Mount only while visible. */
export function CustomerFormModal({ customer, onClose, onSaved }: Props) {
  const add = useDataStore((s) => s.add)
  const update = useDataStore((s) => s.update)
  const [form, setForm] = useState<FormState>(() => {
    if (!customer) return EMPTY
    const { id: _id, ...rest } = customer
    return rest
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))

  const save = () => {
    const e: Partial<Record<keyof FormState, string>> = {}
    if (!form.name.trim()) e.name = 'Contact person is required'
    if (!form.phone.trim()) e.phone = 'Phone number is required'
    else if (!isValidSriLankanPhone(form.phone)) e.phone = 'Use a Sri Lankan number, e.g. +94 77 123 4567 or 077 123 4567'
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Enter a valid email address'
    if (!form.district) e.district = 'Select the district'
    setErrors(e)
    if (Object.keys(e).length) return
    const clean: FormState = { ...form, name: form.name.trim(), business: form.business.trim(), phone: form.phone.trim(), email: form.email.trim(), address: form.address.trim(), city: form.city.trim() }
    if (customer) {
      update('customers', customer.id, clean)
      onSaved?.(customer.id)
    } else {
      onSaved?.(add('customers', clean).id)
    }
    onClose()
  }

  return (
    <Modal
      open
      size="lg"
      title={customer ? 'Edit customer' : 'Add customer'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>{customer ? 'Save changes' : 'Add customer'}</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Business name" className="sm:col-span-2" hint="Leave empty for an individual buyer">
          <Input value={form.business} onChange={(e) => set('business', e.target.value)} placeholder="e.g. Kandy City Hardware" />
        </Field>
        <Field label="Contact person" required error={errors.name}>
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="Phone" required error={errors.phone}>
          <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+94 77 123 4567" />
        </Field>
        <Field label="Email" error={errors.email}>
          <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </Field>
        <Field label="District" required error={errors.district}>
          <Select value={form.district} onChange={(e) => set('district', e.target.value)}>
            <option value="">Select district…</option>
            {SL_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="City / town">
          <Input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="e.g. Colombo 07" />
        </Field>
        <Field label="Address" className="sm:col-span-2">
          <Textarea rows={2} value={form.address} onChange={(e) => set('address', e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}
