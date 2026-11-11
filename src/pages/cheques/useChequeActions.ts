import { syncShipmentClosing } from '../../lib/settlement'
import { useDataStore } from '../../store/dataStore'
import type { Cheque, ChequeStatus, ISODate } from '../../types'

/** Allowed next steps for each cheque status. */
export const NEXT_STATUSES: Record<ChequeStatus, ChequeStatus[]> = {
  PENDING: ['DEPOSITED'],
  DEPOSITED: ['CLEARED', 'RETURNED'],
  CLEARED: [],
  RETURNED: ['DEPOSITED'],
}

/** The status a cheque returns to when its latest step is undone. */
export const PREVIOUS_STATUS: Partial<Record<ChequeStatus, ChequeStatus>> = {
  DEPOSITED: 'PENDING',
  CLEARED: 'DEPOSITED',
  RETURNED: 'DEPOSITED',
}

export const RETURN_REASONS = ['Insufficient funds', 'Signature differs', 'Account closed', 'Payment stopped', 'Cheque out of date', 'Other'] as const

/** Moves cheques through Pending → Deposited → Cleared / Returned, keeping shipments' closed state in step. */
export function useChequeActions() {
  const update = useDataStore((s) => s.update)

  return {
    move: (cheque: Cheque, status: ChequeStatus, date: ISODate, note?: string) => {
      update('cheques', cheque.id, {
        status,
        statusDate: date,
        history: [...(cheque.history ?? []), { status, date, note: note?.trim() || undefined }],
      })
      syncShipmentClosing()
    },

    undo: (cheque: Cheque) => {
      const previous = PREVIOUS_STATUS[cheque.status]
      if (!previous) return
      const history = (cheque.history ?? []).slice(0, -1)
      const last = history[history.length - 1]
      update('cheques', cheque.id, { status: previous, statusDate: last?.date, history })
      syncShipmentClosing()
    },
  }
}
