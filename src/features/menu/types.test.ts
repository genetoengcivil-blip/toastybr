import { describe, it, expect } from 'vitest'
import { z } from 'zod'

const categorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional().nullable(),
  sort_order: z.number().int().min(0, 'Ordem deve ser >= 0').default(0),
  is_active: z.boolean().default(true),
})
const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional().nullable(),
  price: z.number().min(0, 'Preço deve ser >= 0'),
  category_id: z.string().uuid('ID de categoria inválido').nullable().optional(),
  sku: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  is_available: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
})

describe('Menu Zod Schemas', () => {
  describe('categorySchema', () => {
    it('accepts valid category', () => {
      const result = categorySchema.safeParse({
        name: 'Lanches',
        description: 'Hambúrgueres e sanduíches',
        sort_order: 1,
        is_active: true,
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty name', () => {
      const result = categorySchema.safeParse({
        name: '',
        description: '',
        sort_order: 0,
        is_active: true,
      })
      expect(result.success).toBe(false)
    })

    it('rejects negative sort_order', () => {
      const result = categorySchema.safeParse({
        name: 'Test',
        sort_order: -1,
        is_active: true,
      })
      expect(result.success).toBe(false)
    })

    it('accepts optional description', () => {
      const result = categorySchema.safeParse({
        name: 'Test',
        sort_order: 0,
        is_active: true,
      })
      expect(result.success).toBe(true)
    })

    it('defaults is_active to true', () => {
      const result = categorySchema.safeParse({
        name: 'Test',
        sort_order: 0,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_active).toBe(true)
      }
    })

    it('defaults sort_order to 0', () => {
      const result = categorySchema.safeParse({ name: 'Test' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sort_order).toBe(0)
      }
    })
  })

  describe('productSchema', () => {
    const validProduct = {
      name: 'X-Burger',
      description: 'Hambúrguer artesanal',
      price: 2500,
      category_id: '550e8400-e29b-41d4-a716-446655440000',
      sku: 'XB-001',
      is_active: true,
      is_available: true,
      sort_order: 1,
    }

    it('accepts valid product', () => {
      const result = productSchema.safeParse(validProduct)
      expect(result.success).toBe(true)
    })

    it('rejects empty name', () => {
      const result = productSchema.safeParse({ ...validProduct, name: '' })
      expect(result.success).toBe(false)
    })

    it('rejects negative price', () => {
      const result = productSchema.safeParse({ ...validProduct, price: -100 })
      expect(result.success).toBe(false)
    })

    it('accepts price = 0', () => {
      const result = productSchema.safeParse({ ...validProduct, price: 0 })
      expect(result.success).toBe(true)
    })

    it('rejects invalid UUID for category_id', () => {
      const result = productSchema.safeParse({ ...validProduct, category_id: 'invalid' })
      expect(result.success).toBe(false)
    })

    it('accepts null category_id', () => {
      const result = productSchema.safeParse({ ...validProduct, category_id: null })
      expect(result.success).toBe(true)
    })

    it('accepts undefined category_id', () => {
      const result = productSchema.safeParse({ ...validProduct, category_id: undefined })
      expect(result.success).toBe(true)
    })

    it('accepts optional sku as null', () => {
      const result = productSchema.safeParse({ ...validProduct, sku: null })
      expect(result.success).toBe(true)
    })

    it('accepts optional sku as undefined', () => {
      const result = productSchema.safeParse({ ...validProduct, sku: undefined })
      expect(result.success).toBe(true)
    })

    it('rejects negative sort_order', () => {
      const result = productSchema.safeParse({ ...validProduct, sort_order: -1 })
      expect(result.success).toBe(false)
    })

    it('defaults is_active to true', () => {
      const result = productSchema.safeParse({ ...validProduct, is_active: undefined })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.is_active).toBe(true)
    })

    it('defaults is_available to true', () => {
      const result = productSchema.safeParse({ ...validProduct, is_available: undefined })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.is_available).toBe(true)
    })

    it('defaults sort_order to 0', () => {
      const result = productSchema.safeParse({ ...validProduct, sort_order: undefined })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.sort_order).toBe(0)
    })
  })
})
