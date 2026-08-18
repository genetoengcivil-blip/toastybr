import { describe, it, expect } from 'vitest'
import { getStockStatus, STOCK_STATUS_CONFIG } from '@/features/inventory/lib/stock-status'

describe('Inventory Status', () => {
  describe('getStockStatus', () => {
    it('returns out for quantity <= 0', () => {
      expect(getStockStatus(0, 10)).toBe('out')
      expect(getStockStatus(-5, 10)).toBe('out')
    })

    it('returns critical for <= minimum * 0.5', () => {
      expect(getStockStatus(5, 10)).toBe('critical')
      expect(getStockStatus(1, 10)).toBe('critical')
      expect(getStockStatus(0.5, 1)).toBe('critical')
    })

    it('returns low for > minimum * 0.5 and <= minimum', () => {
      expect(getStockStatus(6, 10)).toBe('low')
      expect(getStockStatus(10, 10)).toBe('low')
      expect(getStockStatus(1.5, 2)).toBe('low')
    })

    it('returns normal for > minimum', () => {
      expect(getStockStatus(11, 10)).toBe('normal')
      expect(getStockStatus(100, 10)).toBe('normal')
    })

    it('handles minimum = 0', () => {
      expect(getStockStatus(0, 0)).toBe('out')
      expect(getStockStatus(1, 0)).toBe('normal')
    })

    it('handles quantity = minimum * 0.5 exactly', () => {
      expect(getStockStatus(5, 10)).toBe('critical')
      expect(getStockStatus(2.5, 5)).toBe('critical')
    })

    it('handles quantity = minimum exactly', () => {
      expect(getStockStatus(10, 10)).toBe('low')
    })

    it('handles decimal quantities', () => {
      expect(getStockStatus(3.5, 5)).toBe('low')
      expect(getStockStatus(2.4, 5)).toBe('critical')
    })
  })

  describe('STOCK_STATUS_CONFIG', () => {
    it('has all statuses', () => {
      expect(STOCK_STATUS_CONFIG.normal).toBeDefined()
      expect(STOCK_STATUS_CONFIG.low).toBeDefined()
      expect(STOCK_STATUS_CONFIG.critical).toBeDefined()
      expect(STOCK_STATUS_CONFIG.out).toBeDefined()
    })

    it('has labels and variants', () => {
      for (const key of ['normal', 'low', 'critical', 'out'] as const) {
        expect(STOCK_STATUS_CONFIG[key].label).toBeTruthy()
        expect(STOCK_STATUS_CONFIG[key].variant).toBeTruthy()
      }
    })
  })
})
