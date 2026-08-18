import { describe, it, expect } from 'vitest'
import {
  buildCsv,
  escapeCsvValue,
  formatCurrencyBRL,
  formatDatePtbr,
  formatVariation,
  variationPct,
} from './format'
import { DEFAULT_TZ, getPreviousPeriod, getQuickRange as qr } from './dateRanges'

describe('period comparison', () => {
  it('computes equal-duration previous window', () => {
    const prev = getPreviousPeriod('2026-08-10', '2026-08-16')
    expect(prev.endDate).toBe('2026-08-09')
    expect(prev.startDate).toBe('2026-08-03')
  })

  it('handles single-day range', () => {
    const prev = getPreviousPeriod('2026-08-10', '2026-08-10')
    expect(prev).toEqual({ startDate: '2026-08-09', endDate: '2026-08-09' })
  })
})

describe('variation', () => {
  it('returns percentage or null on zero previous (no Infinity/NaN)', () => {
    expect(variationPct(120, 100)).toBe(20)
    expect(variationPct(100, 0)).toBeNull()
    expect(variationPct(0, 0)).toBeNull()
  })

  it('formats with pt-BR sign and dash for null', () => {
    expect(formatVariation(20)).toBe('+20,0%')
    expect(formatVariation(-5)).toBe('-5,0%')
    expect(formatVariation(null)).toBe('—')
  })
})

describe('CSV safety (formula injection + BOM)', () => {
  it('escapes values starting with = + - @', () => {
    expect(escapeCsvValue('=cmd')).toBe("'=cmd")
    expect(escapeCsvValue('+1')).toBe("'+1")
    expect(escapeCsvValue('-1')).toBe("'-1")
    expect(escapeCsvValue('@evil')).toBe("'@evil")
  })

  it('quotes values containing separators', () => {
    expect(escapeCsvValue('a,b')).toBe('"a,b"')
    expect(escapeCsvValue('a"b')).toBe('"a""b"')
  })

  it('builds CSV with BOM, headers and escaping', () => {
    const csv = buildCsv(
      [
        { name: 'Normal', total: 10 },
        { name: '=injected', total: 5 },
      ],
      [
        { key: 'name', header: 'Nome' },
        { key: 'total', header: 'Total' },
      ]
    )
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    expect(csv).toContain('Nome;Total')
    expect(csv).toContain("'=injected")
    expect(csv).toContain('Normal;10')
  })
})

describe('formatting', () => {
  it('formats BRL with pt-BR', () => {
    const s = formatCurrencyBRL(1234.5)
    expect(s).toContain('R$')
    expect(s).toContain('1.234,50')
  })

  it('formats ISO date to dd/mm/yyyy', () => {
    expect(formatDatePtbr('2026-08-10')).toBe('10/08/2026')
  })
})

describe('quick ranges', () => {
  it('last7 spans 7 days ending today', () => {
    const { startDate, endDate } = qr('last7', new Date('2026-08-16T12:00:00'))
    expect(endDate).toBe('2026-08-16')
    expect(startDate).toBe('2026-08-10')
  })

  it('thisMonth starts on day 1', () => {
    const { startDate } = qr('thisMonth', new Date('2026-08-16T12:00:00'))
    expect(startDate).toBe('2026-08-01')
  })

  it('exposes default tz', () => {
    expect(DEFAULT_TZ).toBe('America/Sao_Paulo')
  })
})
