import { describe, it, expect, beforeEach } from 'vitest'
import {
  calculateItemCost,
  calculateProductCost,
  calculateGrossProfit,
  calculateGrossMargin,
  getMarginLevel,
  MARGIN_LEVEL_CONFIG,
  type MarginLevel,
} from '@/features/recipes/lib/cost-engine'
import type { ProductRecipeItemWithIngredient } from '@//lib/supabase/types'

function makeItem(costPerUnit: number, quantity: number, wastePercent = 0): ProductRecipeItemWithIngredient {
  return {
    ingredient: {
      id: 'ing1',
      name: 'Test Ingredient',
      unit: 'g',
      cost_per_unit: costPerUnit,
    },
    ingredients: {
      id: 'ing1',
      name: 'Test Ingredient',
      unit: 'g',
      cost_per_unit: costPerUnit,
    },
    quantity,
    waste_percent: wastePercent,
    sort_order: 0,
  } as unknown as ProductRecipeItemWithIngredient
}

describe('Cost Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('calculateItemCost', () => {
    it('calculates basic cost without waste', () => {
      expect(calculateItemCost(1, 10, 0)).toBe(10)
    })

    it('applies waste percentage correctly', () => {
      expect(calculateItemCost(1, 10, 10)).toBe(11)
      expect(calculateItemCost(2, 5, 20)).toBe(12)
    })

    it('handles zero quantity', () => {
      expect(calculateItemCost(0, 10, 0)).toBe(0)
    })

    it('handles zero waste', () => {
      expect(calculateItemCost(5, 2, 0)).toBe(10)
    })

    it('handles decimal quantities', () => {
      expect(calculateItemCost(1.5, 10, 0)).toBe(15)
      expect(calculateItemCost(0.5, 10, 50)).toBe(7.5)
    })

    it('handles decimal waste percent', () => {
      expect(calculateItemCost(1, 10, 12.5)).toBe(11.25)
    })
  })

  describe('calculateProductCost', () => {
    it('sums multiple recipe items', () => {
      const items = [
        makeItem(1, 1, 0),
        makeItem(5, 1, 0),
        makeItem(2, 2, 0),
      ]
      expect(calculateProductCost(items)).toBe(10)
    })

    it('handles empty recipe', () => {
      expect(calculateProductCost([])).toBe(0)
    })

    it('applies waste per item', () => {
      const items = [makeItem(10, 1, 20)]
      expect(calculateProductCost(items)).toBe(12)
    })

    it('handles multiple items with different waste', () => {
      const items = [
        makeItem(1, 1, 10),
        makeItem(2, 2, 5),
      ]
      expect(calculateProductCost(items)).toBeCloseTo(5.3, 1)
    })
  })

  describe('calculateGrossProfit', () => {
    it('calculates profit', () => {
      expect(calculateGrossProfit(20, 10)).toBe(10)
    })

    it('handles zero cost', () => {
      expect(calculateGrossProfit(20, 0)).toBe(20)
    })

    it('handles zero price', () => {
      expect(calculateGrossProfit(0, 10)).toBe(-10)
    })

    it('handles cost > price (negative profit)', () => {
      expect(calculateGrossProfit(10, 20)).toBe(-10)
    })

    it('handles equal price and cost', () => {
      expect(calculateGrossProfit(15, 15)).toBe(0)
    })
  })

  describe('calculateGrossMargin', () => {
    it('calculates 50% margin', () => {
      expect(calculateGrossMargin(20, 10)).toBe(50)
    })

    it('handles zero price (returns 0, not NaN)', () => {
      expect(calculateGrossMargin(0, 10)).toBe(0)
      expect(calculateGrossMargin(0, 0)).toBe(0)
    })

    it('handles zero cost (100% margin)', () => {
      expect(calculateGrossMargin(20, 0)).toBe(100)
    })

    it('handles cost > price (negative margin)', () => {
      expect(calculateGrossMargin(10, 20)).toBe(-100)
    })

    it('handles small margins', () => {
      expect(calculateGrossMargin(11, 10)).toBeCloseTo(9.09, 1)
    })
  })

  describe('getMarginLevel', () => {
    it('returns healthy for >=60%', () => {
      expect(getMarginLevel(60)).toBe('healthy')
      expect(getMarginLevel(80)).toBe('healthy')
      expect(getMarginLevel(100)).toBe('healthy')
    })

    it('returns warning for 40-59.99%', () => {
      expect(getMarginLevel(40)).toBe('warning')
      expect(getMarginLevel(50)).toBe('warning')
      expect(getMarginLevel(59.99)).toBe('warning')
    })

    it('returns low for 0-39.99%', () => {
      expect(getMarginLevel(0)).toBe('low')
      expect(getMarginLevel(20)).toBe('low')
      expect(getMarginLevel(39.99)).toBe('low')
    })

    it('returns negative for <0%', () => {
      expect(getMarginLevel(-1)).toBe('negative')
      expect(getMarginLevel(-50)).toBe('negative')
    })

    it('handles boundary values exactly', () => {
      expect(getMarginLevel(60)).toBe('healthy')
      expect(getMarginLevel(39.99)).toBe('low')
      expect(getMarginLevel(-0.01)).toBe('negative')
    })
  })

  describe('MARGIN_LEVEL_CONFIG', () => {
    it('has all margin levels', () => {
      const levels: MarginLevel[] = ['healthy', 'warning', 'low', 'negative']
      for (const level of levels) {
        expect(MARGIN_LEVEL_CONFIG[level]).toBeDefined()
        expect(MARGIN_LEVEL_CONFIG[level].label).toBeTruthy()
        expect(MARGIN_LEVEL_CONFIG[level].color).toBeTruthy()
        expect(MARGIN_LEVEL_CONFIG[level].variant).toBeTruthy()
      }
    })
  })
})
