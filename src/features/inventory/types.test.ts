import { describe, it, expect } from 'vitest'
import { z } from 'zod'

const inventoryMovementSchema = z.object({
  ingredient_id: z.string().uuid('ID de ingrediente inválido'),
  type: z.enum(['entry', 'exit', 'adjustment_in', 'adjustment_out'], {
    message: 'Tipo de movimentação inválido',
  }),
  quantity: z.number().min(0.001, 'Quantidade deve ser > 0'),
  reason: z.string().nullable().optional(),
})
const minimumQuantitySchema = z.object({
  minimum_quantity: z.number().min(0, 'Quantidade mínima deve ser >= 0'),
})

describe('Inventory Zod Schemas', () => {
  describe('inventoryMovementSchema', () => {
    const validMovement = {
      ingredient_id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'entry',
      quantity: 10,
      reason: 'Compra de fornecedor',
    }

    it('accepts valid entry movement', () => {
      const result = inventoryMovementSchema.safeParse(validMovement)
      expect(result.success).toBe(true)
    })

    it('accepts all movement types', () => {
      const types = ['entry', 'exit', 'adjustment_in', 'adjustment_out']
      for (const type of types) {
        const result = inventoryMovementSchema.safeParse({ ...validMovement, type })
        expect(result.success).toBe(true)
      }
    })

    it('rejects invalid type', () => {
      const result = inventoryMovementSchema.safeParse({ ...validMovement, type: 'invalid' })
      expect(result.success).toBe(false)
    })

    it('rejects zero quantity', () => {
      const result = inventoryMovementSchema.safeParse({ ...validMovement, quantity: 0 })
      expect(result.success).toBe(false)
    })

    it('rejects negative quantity', () => {
      const result = inventoryMovementSchema.safeParse({ ...validMovement, quantity: -5 })
      expect(result.success).toBe(false)
    })

    it('accepts decimal quantity', () => {
      const result = inventoryMovementSchema.safeParse({ ...validMovement, quantity: 1.5 })
      expect(result.success).toBe(true)
    })

    it('accepts very small decimal quantity', () => {
      const result = inventoryMovementSchema.safeParse({ ...validMovement, quantity: 0.001 })
      expect(result.success).toBe(true)
    })

    it('rejects quantity below minimum', () => {
      const result = inventoryMovementSchema.safeParse({ ...validMovement, quantity: 0.0001 })
      expect(result.success).toBe(false)
    })

    it('accepts optional reason as null', () => {
      const result = inventoryMovementSchema.safeParse({ ...validMovement, reason: null })
      expect(result.success).toBe(true)
    })

    it('accepts missing reason', () => {
      const result = inventoryMovementSchema.safeParse({ ...validMovement, reason: undefined })
      expect(result.success).toBe(true)
    })

    it('rejects invalid ingredient_id', () => {
      const result = inventoryMovementSchema.safeParse({ ...validMovement, ingredient_id: 'invalid' })
      expect(result.success).toBe(false)
    })
  })

  describe('minimumQuantitySchema', () => {
    it('accepts valid minimum', () => {
      const result = minimumQuantitySchema.safeParse({ minimum_quantity: 10 })
      expect(result.success).toBe(true)
    })

    it('accepts zero minimum', () => {
      const result = minimumQuantitySchema.safeParse({ minimum_quantity: 0 })
      expect(result.success).toBe(true)
    })

    it('rejects negative minimum', () => {
      const result = minimumQuantitySchema.safeParse({ minimum_quantity: -1 })
      expect(result.success).toBe(false)
    })

    it('accepts decimal minimum', () => {
      const result = minimumQuantitySchema.safeParse({ minimum_quantity: 5.5 })
      expect(result.success).toBe(true)
    })

    it('accepts zero as valid', () => {
      const result = minimumQuantitySchema.safeParse({ minimum_quantity: 0 })
      expect(result.success).toBe(true)
    })
  })
})
