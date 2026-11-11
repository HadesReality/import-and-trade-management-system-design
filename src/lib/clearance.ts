import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { Tone } from '../config/statuses'
import type { Clearance, DutyBreakdown } from '../types'
import { daysFromToday } from './format'

export const DUTY_FIELDS: { key: keyof DutyBreakdown; label: string; hint: string }[] = [
  { key: 'cid', label: 'Customs Import Duty (CID)', hint: 'Duty on the CIF value' },
  { key: 'pal', label: 'Port & Airport Development Levy (PAL)', hint: '' },
  { key: 'vat', label: 'VAT', hint: '' },
  { key: 'sscl', label: 'Social Security Contribution Levy (SSCL)', hint: '' },
  { key: 'cess', label: 'Cess', hint: '' },
  { key: 'other', label: 'Excise / surcharge / other', hint: '' },
]

export const sumBreakdown = (b: DutyBreakdown) => b.cid + b.pal + b.vat + b.sscl + b.cess + b.other

export const EMPTY_BREAKDOWN: DutyBreakdown = { cid: 0, pal: 0, vat: 0, sscl: 0, cess: 0, other: 0 }

/** Everything the clearing agent bills, in LKR. */
export const clearanceTotal = (c: Clearance) => c.duties + c.portCharges + c.transport + c.agentFee + c.otherCharges

/** Days after which an unreleased shipment is flagged as delayed. */
export const CLEARANCE_DELAY_DAYS = 7

export function clearanceStatus(c: Clearance): { label: string; tone: Tone; delayed: boolean; days: number } {
  if (c.releaseDate) {
    const days = differenceInCalendarDays(parseISO(c.releaseDate), parseISO(c.handoverDate))
    return { label: 'Released', tone: 'green', delayed: false, days }
  }
  const days = -daysFromToday(c.handoverDate)
  return days > CLEARANCE_DELAY_DAYS
    ? { label: `Delayed ${days}d`, tone: 'red', delayed: true, days }
    : { label: 'With agent', tone: 'purple', delayed: false, days }
}
