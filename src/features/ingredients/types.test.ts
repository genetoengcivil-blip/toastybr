import { describe, it, expect } from 'vitest'
import { z } from 'zod'

const ingredientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional().nullable(),
  unit: z.enum(['g', 'kg', 'ml', 'l', 'un', 'cx', 'pct'], {
    message: 'Unidade inválida',
  }),
  cost_per_unit: z.number().min(0, 'Custo deve ser >= 0'),
  is_active: z.boolean().default(true),
})

describe('Ingredients Zod Schema', () => {
  const validIngredient = {
    name: 'Pão de hambúrguer',
    description: 'Pão brioche',
    unit: 'un',
    cost_per_unit: 1.50,
    is_active: true,
  }

  it('accepts valid ingredient', () => {
    const result = ingredientSchema.safeParse(validIngredient)
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = ingredientSchema.safeParse({ ...validIngredient, name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid unit', () => {
    const result = ingredientSchema.safeParse({ ...validIngredient, unit: 'kgx' })
    expect(result.success).toBe(false)
  })

  it('accepts all valid units', () => {
    const units = ['g', 'kg', 'ml', 'l', 'un', 'cx', 'pct']
    for (const unit of units) {
      const result = ingredientSchema.safeParse({ ...validIngredient, unit })
      expect(result.success).toBe(true)
    }
  })

  it('rejects negative cost_per_unit', () => {
    const result = ingredientSchema.safeParse({ ...validIngredient, cost_per_unit: -1 })
    expect(result.success).toBe(false)
  })

  it('accepts zero cost_per_unit', () => {
    const result = ingredientSchema.safeParse({ ...validIngredient, cost_per_unit: 0 })
    expect(result.success).toBe(true)
  })

  it('accepts decimal cost_per_unit', () => {
    const result = ingredientSchema.safeParse({ ...validIngredient, cost_per_unit: 1.234 })
    expect(result.success).toBe(true)
  })

  it('accepts decimal cost_per_unit with many decimals', () => {
    const result = ingredientSchema.safeParse({ ...validIngredient, cost_per_unit: 1.234567 })
    expect(result.success).toBe(true)
  })

  it('defaults is_active to true', () => {
    const result = ingredientSchema.safeParse({ ...validIngredient, is_active: undefined })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.is_active).toBe(true)
  })
})
