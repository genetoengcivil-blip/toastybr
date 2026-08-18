const currencyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const numberFmt = new Intl.NumberFormat('pt-BR')
const percentFmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export function formatCurrencyBRL(value: number): string {
  return currencyFmt.format(Number.isFinite(value) ? value : 0)
}

export function formatNumberPtbr(value: number): string {
  return numberFmt.format(Number.isFinite(value) ? value : 0)
}

// Returns null when previous is zero (avoids Infinity / NaN). Caller decides UX.
export function variationPct(current: number, previous: number): number | null {
  if (!previous) return null
  return ((current - previous) / previous) * 100
}

export function formatVariation(variation: number | null): string {
  if (variation === null || !Number.isFinite(variation)) return '—'
  const sign = variation > 0 ? '+' : ''
  return `${sign}${percentFmt.format(variation)}%`
}

export function formatMinutes(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return '—'
  const total = Math.round(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  if (h > 0) return `${h}h ${m}min`
  return `${m}min`
}

export function formatDatePtbr(iso: string): string {
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

// Prevent spreadsheet formula injection: strings starting with = + - @ are neutralized.
export function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  let s: string
  if (typeof value === 'number') s = String(value)
  else if (value instanceof Date) s = value.toISOString()
  else s = String(value)
  if (/^[=+\-@]/.test(s)) s = `'${s}`
  if (/[",\n;]/.test(s)) s = `"${s.replace(/"/g, '""')}"`
  return s
}

export interface CsvColumn<T> {
  key: keyof T | string
  header: string
}

export function buildCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: CsvColumn<T>[]
): string {
  const header = columns.map((c) => escapeCsvValue(c.header)).join(';')
  const lines = rows.map((row) =>
    columns.map((c) => escapeCsvValue((row as Record<string, unknown>)[c.key as string])).join(';')
  )
  return '﻿' + [header, ...lines].join('\r\n')
}

export function downloadCsv(filename: string, csv: string): void {
  if (typeof document === 'undefined') return
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
