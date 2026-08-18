import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, getDueDateStatus } from '../../features/finance/utils'

const NBSP = '\u00A0'

describe('Finance Utils', () => {
  describe('formatCurrency', () => {
    it('formats zero', () => {
      expect(formatCurrency(0)).toBe(`R$${NBSP}0,00`)
    })

    it('formats cents', () => {
      expect(formatCurrency(0.01)).toBe(`R$${NBSP}0,01`)
    })

    it('formats standard value', () => {
      expect(formatCurrency(10.1)).toBe(`R$${NBSP}10,10`)
    })

    it('formats thousands', () => {
      expect(formatCurrency(1000)).toBe(`R$${NBSP}1.000,00`)
    })

    it('formats large value', () => {
      expect(formatCurrency(999999.99)).toBe(`R$${NBSP}999.999,99`)
    })

    it('formats negative', () => {
      expect(formatCurrency(-10)).toBe(`-R$${NBSP}10,00`)
    })

    it('handles integer', () => {
      expect(formatCurrency(100)).toBe(`R$${NBSP}100,00`)
    })

    it('rounds correctly', () => {
      expect(formatCurrency(10.555)).toBe(`R$${NBSP}10,56`)
      expect(formatCurrency(10.554)).toBe(`R$${NBSP}10,55`)
    })
  })

  describe('formatDate', () => {
    it('formats date string', () => {
      const result = formatDate('2026-08-17')
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    })

    it('formats ISO string', () => {
      const result = formatDate('2026-08-17T10:30:00Z')
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    })

    it('returns empty for null', () => {
      expect(formatDate(null as any)).toBe('')
    })

    it('returns empty for undefined', () => {
      expect(formatDate(undefined as any)).toBe('')
    })
  })

  describe('getDueDateStatus', () => {
    it('returns overdue for past date', () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const past = new Date(today)
      past.setDate(past.getDate() - 5)
      const pastStr = past.toISOString().split('T')[0]
      expect(getDueDateStatus(pastStr)).toBe('overdue')
    })

    it('returns today for today', () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString().split('T')[0]
      expect(getDueDateStatus(todayStr)).toBe('today')
    })

    it('returns upcoming for within 7 days', () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const soon = new Date(today)
      soon.setDate(soon.getDate() + 2)
      const soonStr = soon.toISOString().split('T')[0]
      expect(getDueDateStatus(soonStr)).toBe('upcoming')
    })

    it('returns future for beyond 7 days', () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const future = new Date(today)
      future.setDate(future.getDate() + 10)
      const futureStr = future.toISOString().split('T')[0]
      expect(getDueDateStatus(futureStr)).toBe('future')
    })
  })
})