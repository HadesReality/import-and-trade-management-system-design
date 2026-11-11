import type { Tone } from '../config/statuses'
import type { BankPayment } from '../types'
import { daysFromToday } from './format'

export const paymentLkr = (p: BankPayment) => p.amountUsd * p.exchangeRate
export const paymentCharges = (p: BankPayment) => p.docCharges + p.commission + p.otherCharges
/** Everything the bank takes from the company for this payment, in LKR. */
export const paymentCashOut = (p: BankPayment) => paymentLkr(p) + paymentCharges(p)

/** An LC is "open" until the shipping documents have been collected against it. */
export const isOpenLc = (p: BankPayment) => p.term === 'LC' && !p.docsCollectedDate

export const LC_WARNING_DAYS = 14

/** Expiry status for a letter of credit, or undefined when the payment isn't an LC with an expiry date. */
export function lcStatus(p: BankPayment): { label: string; tone: Tone; urgent: boolean } | undefined {
  if (p.term !== 'LC' || !p.lcExpiry) return undefined
  if (p.docsCollectedDate) return { label: 'Retired', tone: 'green', urgent: false }
  const d = daysFromToday(p.lcExpiry)
  if (d < 0) return { label: `Expired ${-d}d ago`, tone: 'red', urgent: true }
  if (d === 0) return { label: 'Expires today', tone: 'red', urgent: true }
  if (d <= LC_WARNING_DAYS) return { label: `Expires in ${d}d`, tone: 'amber', urgent: true }
  return { label: `${d}d left`, tone: 'blue', urgent: false }
}
