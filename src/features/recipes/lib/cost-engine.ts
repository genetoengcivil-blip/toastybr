import type { ProductRecipeItemWithIngredient } from '../../../lib/supabase/types'

export function calculateItemCost(
  quantity: number,
  costPerUnit: number,
  wastePercent: number
): number {
  const effectiveQuantity = quantity * (1 + wastePercent / 100)
  return effectiveQuantity * costPerUnit
}

export function calculateProductCost(
  recipeItems: ProductRecipeItemWithIngredient[]
): number {
  return recipeItems.reduce((total, item) => {
    return total + calculateItemCost(item.quantity, item.ingredients.cost_per_unit, item.waste_percent)
  }, 0)
}

export function calculateGrossProfit(price: number, productCost: number): number {
  return price - productCost
}

export function calculateGrossMargin(price: number, productCost: number): number {
  if (price <= 0) return 0
  return ((price - productCost) / price) * 100
}

export type MarginLevel = 'healthy' | 'warning' | 'low' | 'negative'

export function getMarginLevel(margin: number): MarginLevel {
  if (margin < 0) return 'negative'
  if (margin < 40) return 'low'
  if (margin < 60) return 'warning'
  return 'healthy'
}

export const MARGIN_LEVEL_CONFIG: Record<MarginLevel, { label: string; color: string; variant: 'success' | 'warning' | 'destructive' }> = {
  healthy: { label: 'Saudável', color: 'text-emerald-600', variant: 'success' },
  warning: { label: 'Atenção', color: 'text-amber-600', variant: 'warning' },
  low: { label: 'Baixa', color: 'text-orange-600', variant: 'warning' },
  negative: { label: 'Negativa', color: 'text-red-600', variant: 'destructive' },
}
