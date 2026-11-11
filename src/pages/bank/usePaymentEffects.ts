import { useDataStore } from '../../store/dataStore'
import { useUiStore } from '../../store/uiStore'
import type { BankPayment, DocType, ShipmentDocument, TimelineEntry } from '../../types'

/** Documents the bank hands over as originals once the buyer pays. */
const BANK_DOCS: DocType[] = ['BL', 'INVOICE', 'PACKING_LIST']

/**
 * When a payment is saved as paid, move its shipment forward:
 * - a paid advance moves an unshipped order to "Advance Paid";
 * - a paid documents payment with a collection date turns the bank's documents into originals, and
 *   moves an arrived shipment to "Bank Docs Collected".
 * Saving never moves a shipment backwards — use "Undo last" on the shipment for that.
 */
export function usePaymentEffects() {
  const role = useUiStore((s) => s.role)
  const shipments = useDataStore((s) => s.shipments)
  const update = useDataStore((s) => s.update)

  return (payment: BankPayment) => {
    const shipment = shipments.find((s) => s.id === payment.shipmentId)
    if (!shipment || payment.status !== 'PAID') return

    const lastDate = shipment.timeline[shipment.timeline.length - 1]?.date ?? ''
    const entry = (status: TimelineEntry['status'], date: string, note: string): TimelineEntry => ({
      date: date < lastDate ? lastDate : date,
      status,
      role,
      note,
    })

    let status = shipment.status
    let documents: ShipmentDocument[] = shipment.documents
    const timeline = [...shipment.timeline]

    if (payment.kind === 'ADVANCE' && (status === 'PO_ISSUED' || status === 'INVOICE_RECEIVED') && payment.paidDate) {
      status = 'ADVANCE_PAID'
      timeline.push(entry(status, payment.paidDate, `Advance paid via ${payment.bank}`))
    }

    if (payment.kind === 'DOCUMENTS' && payment.docsCollectedDate) {
      documents = documents.map((d) =>
        BANK_DOCS.includes(d.type) && (d.state === 'ORIGINAL_AT_BANK' || d.state === 'COPY_RECEIVED') ? { ...d, state: 'ORIGINAL_RECEIVED' as const } : d,
      )
      if (status === 'ARRIVED') {
        status = 'BANK_DOCS_COLLECTED'
        timeline.push(entry(status, payment.docsCollectedDate, `Documents collected from ${payment.bank}`))
      }
    }

    if (status !== shipment.status || documents !== shipment.documents) {
      update('shipments', shipment.id, { status, documents, timeline })
    }
  }
}
