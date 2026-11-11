import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import type { ISODate } from '../types'

const money = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** `USD 12,500.00` */
export const formatUsd = (n: number) => `USD ${money(n)}`

/** `LKR 3,812,500.00` */
export const formatLkr = (n: number) => `LKR ${money(n)}`

export const formatNumber = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 })

export const formatPercent = (n: number) => `${n.toLocaleString('en-US', { maximumFractionDigits: 1 })}%`

/** `14 Oct 2026`, or an em dash when there is no date. */
export const formatDate = (iso?: ISODate) => (iso ? format(parseISO(iso), 'dd MMM yyyy') : '—')

export const todayISO = (): ISODate => format(new Date(), 'yyyy-MM-dd')

/** Whole days from today to the date (negative when in the past). */
export const daysFromToday = (iso: ISODate) => differenceInCalendarDays(parseISO(iso), new Date())

/** Transit time in days between departure and arrival. */
export const transitDays = (etd?: ISODate, eta?: ISODate) =>
  etd && eta ? differenceInCalendarDays(parseISO(eta), parseISO(etd)) : undefined

export const formatBytes = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
