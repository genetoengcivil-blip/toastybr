import type { AnalyticsFilters, QuickRange } from '../types'

export const DEFAULT_TZ = 'America/Sao_Paulo'

function fmt(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export interface QuickRangeOption {
  value: QuickRange
  label: string
}

export const QUICK_RANGES: QuickRangeOption[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'last7', label: '7 dias' },
  { value: 'last30', label: '30 dias' },
  { value: 'thisMonth', label: 'Este mês' },
  { value: 'lastMonth', label: 'Mês anterior' },
  { value: 'custom', label: 'Personalizado' },
]

export function getQuickRange(range: QuickRange, ref: Date = new Date()): { startDate: string; endDate: string } {
  const today = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate())
  switch (range) {
    case 'today':
      return { startDate: fmt(today), endDate: fmt(today) }
    case 'yesterday': {
      const y = addDays(today, -1)
      return { startDate: fmt(y), endDate: fmt(y) }
    }
    case 'last7':
      return { startDate: fmt(addDays(today, -6)), endDate: fmt(today) }
    case 'last30':
      return { startDate: fmt(addDays(today, -29)), endDate: fmt(today) }
    case 'thisMonth': {
      const first = new Date(today.getFullYear(), today.getMonth(), 1)
      return { startDate: fmt(first), endDate: fmt(today) }
    }
    case 'lastMonth': {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const last = new Date(today.getFullYear(), today.getMonth(), 0)
      return { startDate: fmt(first), endDate: fmt(last) }
    }
    default:
      return { startDate: fmt(addDays(today, -29)), endDate: fmt(today) }
  }
}

export function getPreviousPeriod(startDate: string, endDate: string): { startDate: string; endDate: string } {
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  const durationDays = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
  const prevEnd = addDays(start, -1)
  const prevStart = addDays(prevEnd, -durationDays + 1)
  return { startDate: fmt(prevStart), endDate: fmt(prevEnd) }
}

export function buildFilters(
  range: QuickRange,
  timezone: string = DEFAULT_TZ,
  compare = true
): AnalyticsFilters {
  const { startDate, endDate } = getQuickRange(range)
  return { startDate, endDate, timezone, compare }
}
