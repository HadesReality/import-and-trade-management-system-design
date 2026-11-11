import { useState } from 'react'
import { Check, Download, RotateCcw } from 'lucide-react'
import { Button, Card, CardBody, CardHeader, Field, Input, Modal, PageHeader, Textarea } from '../../components/ui'
import { downloadFile } from '../../lib/reports'
import { useDataStore } from '../../store/dataStore'
import type { CompanyProfile, Settings } from '../../types'
import { ChipListEditor } from './ChipListEditor'

type ListKey = 'banks' | 'ports' | 'shippingLines' | 'clearingCompanies' | 'warehouses' | 'units'

/** Everything the app stores (the store's action functions are not data). */
const DATA_KEYS = ['suppliers', 'products', 'purchaseOrders', 'invoices', 'shipments', 'bankPayments', 'clearances', 'stockItems', 'stockMovements', 'customers', 'sales', 'cheques', 'settings'] as const

const LISTS: { key: ListKey; label: string; hint: string }[] = [
  { key: 'banks', label: 'Banks', hint: 'Used for bank payments and cheques.' },
  { key: 'ports', label: 'Ports', hint: 'Loading and discharge ports (Colombo is the usual discharge port).' },
  { key: 'shippingLines', label: 'Shipping lines', hint: 'Suggested when entering shipping info.' },
  { key: 'clearingCompanies', label: 'Clearing agents (CHA)', hint: 'Customs House Agents you hand shipments to.' },
  { key: 'warehouses', label: 'Warehouses', hint: 'Where received containers are stored.' },
  { key: 'units', label: 'Units of measure', hint: 'Used when adding products.' },
]

/** Shows "Saved" for a couple of seconds after a save. */
function useFlash() {
  const [on, setOn] = useState(false)
  return [on, () => (setOn(true), setTimeout(() => setOn(false), 2200))] as const
}

const Saved = ({ show }: { show: boolean }) =>
  show ? (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700" role="status">
      <Check size={15} /> Saved
    </span>
  ) : null

export function SettingsPage() {
  const data = useDataStore()
  const settings = data.settings
  const updateSettings = useDataStore((s) => s.updateSettings)
  const resetData = useDataStore((s) => s.resetData)

  const [company, setCompany] = useState<CompanyProfile>(settings.company)
  const [companyErrors, setCompanyErrors] = useState<Partial<Record<keyof CompanyProfile, string>>>({})
  const [companySaved, flashCompany] = useFlash()

  const [rate, setRate] = useState(String(settings.exchangeRate))
  const [markup, setMarkup] = useState(String(settings.targetMarginPercent))
  const [rateErrors, setRateErrors] = useState<{ rate?: string; markup?: string }>({})
  const [rateSaved, flashRate] = useFlash()

  const [confirmReset, setConfirmReset] = useState(false)

  const saveCompany = () => {
    const e: Partial<Record<keyof CompanyProfile, string>> = {}
    if (!company.name.trim()) e.name = 'Company name is required'
    if (company.email && !/^\S+@\S+\.\S+$/.test(company.email.trim())) e.email = 'Enter a valid email address'
    if (company.tin && !/^\d{9}$/.test(company.tin.trim())) e.tin = 'A TIN has 9 digits, e.g. 134567890'
    if (company.vatNo && !/^\d{9}-7000$/.test(company.vatNo.trim())) e.vatNo = 'Format: 9-digit TIN followed by -7000, e.g. 134567890-7000'
    setCompanyErrors(e)
    if (Object.keys(e).length) return
    updateSettings({ company: Object.fromEntries(Object.entries(company).map(([k, v]) => [k, v.trim()])) as unknown as CompanyProfile })
    flashCompany()
  }

  const saveRates = () => {
    const e: { rate?: string; markup?: string } = {}
    if (!(Number(rate) > 0)) e.rate = 'Enter the rate in LKR per 1 USD'
    if (!(Number(markup) >= 0) || Number(markup) > 500) e.markup = 'Enter a percentage between 0 and 500'
    setRateErrors(e)
    if (Object.keys(e).length) return
    updateSettings({ exchangeRate: Number(rate), targetMarginPercent: Number(markup) })
    flashRate()
  }

  const counts: [string, number][] = [
    ['Suppliers', data.suppliers.length],
    ['Orders', data.purchaseOrders.length],
    ['Invoices', data.invoices.length],
    ['Shipments', data.shipments.length],
    ['Bank payments', data.bankPayments.length],
    ['Clearances', data.clearances.length],
    ['Stock lines', data.stockItems.length],
    ['Customers', data.customers.length],
    ['Sales', data.sales.length],
    ['Cheques', data.cheques.length],
  ]

  const exportJson = () => {
    const state = useDataStore.getState()
    const dump = Object.fromEntries(DATA_KEYS.map((k) => [k, state[k]]))
    downloadFile(`importflow-data-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(dump, null, 2), 'application/json')
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" description="Company details, default rates, the lists used in dropdowns, and the demo data." />

      <Card>
        <CardHeader title="Company profile" description="Printed on purchase orders and sales invoices." actions={<Saved show={companySaved} />} />
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company name" required error={companyErrors.name} className="sm:col-span-2">
              <Input value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <Textarea rows={2} value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} placeholder="+94 11 234 5678" />
            </Field>
            <Field label="Email" error={companyErrors.email}>
              <Input value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} />
            </Field>
            <Field label="TIN" error={companyErrors.tin} hint="Taxpayer Identification Number (Inland Revenue)">
              <Input value={company.tin} onChange={(e) => setCompany({ ...company, tin: e.target.value })} />
            </Field>
            <Field label="VAT number" error={companyErrors.vatNo}>
              <Input value={company.vatNo} onChange={(e) => setCompany({ ...company, vatNo: e.target.value })} />
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={saveCompany}>Save company details</Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Rates & pricing" description="Defaults used when you have no better figure." actions={<Saved show={rateSaved} />} />
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Default exchange rate (LKR per 1 USD)" required error={rateErrors.rate} hint="Costs for unpaid amounts and new bank payments start from this rate.">
              <Input type="number" min={0} step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} />
            </Field>
            <Field
              label="Target mark-up on cost (%)"
              required
              error={rateErrors.markup}
              hint={Number(markup) >= 0 ? `A ${markup || 0}% mark-up is about a ${((Number(markup) / (100 + Number(markup))) * 100).toFixed(1)}% margin on the selling price.` : undefined}
            >
              <Input type="number" min={0} step="1" value={markup} onChange={(e) => setMarkup(e.target.value)} />
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={saveRates}>Save rates</Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Lists" description="Changes apply immediately. Removing a name never changes records that already use it." />
        <CardBody className="space-y-6">
          {LISTS.map((l) => (
            <ChipListEditor key={l.key} label={l.label} hint={l.hint} items={settings[l.key]} onChange={(items) => updateSettings({ [l.key]: items } as Partial<Settings>)} />
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Demo data" description="This prototype keeps everything in your browser — nothing is sent anywhere." />
        <CardBody className="space-y-4">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
            {counts.map(([k, n]) => (
              <span key={k}>
                {k}: <strong className="text-slate-900">{n}</strong>
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={exportJson}>
              <Download size={15} /> Export all data (JSON)
            </Button>
            <Button variant="secondary" className="text-red-600 hover:bg-red-50" onClick={() => setConfirmReset(true)}>
              <RotateCcw size={15} /> Reset demo data
            </Button>
          </div>
        </CardBody>
      </Card>

      <Modal
        open={confirmReset}
        title="Reset all demo data?"
        onClose={() => setConfirmReset(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                resetData()
                setCompany(useDataStore.getState().settings.company)
                setRate(String(useDataStore.getState().settings.exchangeRate))
                setMarkup(String(useDataStore.getState().settings.targetMarginPercent))
                setConfirmReset(false)
              }}
            >
              Reset everything
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-700">
          Everything you added or changed — suppliers, orders, shipments, sales, settings — is replaced by the original sample data. This can't be undone. Export the data first if you want a copy.
        </p>
      </Modal>
    </div>
  )
}
