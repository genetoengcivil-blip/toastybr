import { describe, it, expect } from 'vitest'
import { z } from 'zod'

const supplierSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  contact_name: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email('E-mail inválido').nullable().optional(),
  cnpj: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
})
const purchaseOrderSchema = z.object({
  supplier_id: z.string().uuid('ID de fornecedor inválido').nullable().optional(),
  status: z.enum(['draft', 'sent', 'partially_received', 'received', 'cancelled'], {
    message: 'Status inválido',
  }),
  discount: z.number().min(0, 'Desconto deve ser >= 0').default(0),
  shipping: z.number().min(0, 'Frete deve ser >= 0').default(0),
  notes: z.string().nullable().optional().default(''),
})
const purchaseOrderItemSchema = z.object({
  ingredient_id: z.string().uuid('ID de ingrediente inválido'),
  quantity_ordered: z.number().min(0.001, 'Quantidade deve ser > 0'),
  unit_cost: z.number().min(0, 'Custo unitário deve ser >= 0'),
})

describe('Purchasing Zod Schemas', () => {
  describe('supplierSchema', () => {
    const validSupplier = {
      name: 'Fornecedor A',
      contact_name: 'João Silva',
      phone: '11999999999',
      email: 'fornecedor@email.com',
      cnpj: '12.345.678/0001-90',
      notes: 'Observações',
      is_active: true,
    }

    it('accepts valid supplier', () => {
      const result = supplierSchema.safeParse(validSupplier)
      expect(result.success).toBe(true)
    })

    it('rejects empty name', () => {
      const result = supplierSchema.safeParse({ ...validSupplier, name: '' })
      expect(result.success).toBe(false)
    })

    it('accepts optional fields as null', () => {
      const result = supplierSchema.safeParse({
        name: 'Test',
        contact_name: null,
        phone: null,
        email: null,
        cnpj: null,
        notes: null,
        is_active: true,
      })
      expect(result.success).toBe(true)
    })

    it('accepts optional fields as undefined', () => {
      const result = supplierSchema.safeParse({
        name: 'Test',
        contact_name: undefined,
        phone: undefined,
        email: undefined,
        cnpj: undefined,
        notes: undefined,
        is_active: true,
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid email', () => {
      const result = supplierSchema.safeParse({ ...validSupplier, email: 'invalid' })
      expect(result.success).toBe(false)
    })

    it('defaults is_active to true', () => {
      const result = supplierSchema.safeParse({ name: 'Test', is_active: undefined })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.is_active).toBe(true)
    })
  })

  describe('purchaseOrderSchema', () => {
    const validPO = {
      supplier_id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'draft',
      discount: 0,
      shipping: 0,
      notes: '',
    }

    it('accepts valid PO', () => {
      const result = purchaseOrderSchema.safeParse(validPO)
      expect(result.success).toBe(true)
    })

    it('rejects invalid status', () => {
      const result = purchaseOrderSchema.safeParse({ ...validPO, status: 'invalid' })
      expect(result.success).toBe(false)
    })

    it('accepts all valid statuses', () => {
      const statuses = ['draft', 'sent', 'partially_received', 'received', 'cancelled']
      for (const status of statuses) {
        const result = purchaseOrderSchema.safeParse({ ...validPO, status })
        expect(result.success).toBe(true)
      }
    })

    it('rejects negative discount', () => {
      const result = purchaseOrderSchema.safeParse({ ...validPO, discount: -10 })
      expect(result.success).toBe(false)
    })

    it('rejects negative shipping', () => {
      const result = purchaseOrderSchema.safeParse({ ...validPO, shipping: -5 })
      expect(result.success).toBe(false)
    })

    it('accepts decimal discount', () => {
      const result = purchaseOrderSchema.safeParse({ ...validPO, discount: 12.50 })
      expect(result.success).toBe(true)
    })

    it('accepts decimal shipping', () => {
      const result = purchaseOrderSchema.safeParse({ ...validPO, shipping: 7.50 })
      expect(result.success).toBe(true)
    })

    it('defaults discount to 0', () => {
      const result = purchaseOrderSchema.safeParse({ ...validPO, discount: undefined })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.discount).toBe(0)
    })

    it('defaults shipping to 0', () => {
      const result = purchaseOrderSchema.safeParse({ ...validPO, shipping: undefined })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.shipping).toBe(0)
    })

    it('defaults notes to empty string', () => {
      const result = purchaseOrderSchema.safeParse({ ...validPO, notes: undefined })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.notes).toBe('')
    })
  })

  describe('purchaseOrderItemSchema', () => {
    const validItem = {
      ingredient_id: '550e8400-e29b-41d4-a716-446655440000',
      quantity_ordered: 100,
      unit_cost: 5.50,
    }

    it('accepts valid item', () => {
      const result = purchaseOrderItemSchema.safeParse(validItem)
      expect(result.success).toBe(true)
    })

    it('rejects zero quantity', () => {
      const result = purchaseOrderItemSchema.safeParse({ ...validItem, quantity_ordered: 0 })
      expect(result.success).toBe(false)
    })

    it('rejects negative quantity', () => {
      const result = purchaseOrderItemSchema.safeParse({ ...validItem, quantity_ordered: -1 })
      expect(result.success).toBe(false)
    })

    it('rejects negative unit_cost', () => {
      const result = purchaseOrderItemSchema.safeParse({ ...validItem, unit_cost: -1 })
      expect(result.success).toBe(false)
    })

    it('accepts decimal values', () => {
      const result = purchaseOrderItemSchema.safeParse({
        ...validItem,
        quantity_ordered: 10.5,
        unit_cost: 3.75,
      })
      expect(result.success).toBe(true)
    })

    it('accepts zero unit_cost', () => {
      const result = purchaseOrderItemSchema.safeParse({ ...validItem, unit_cost: 0 })
      expect(result.success).toBe(true)
    })

    it('rejects invalid ingredient_id', () => {
      const result = purchaseOrderItemSchema.safeParse({ ...validItem, ingredient_id: 'invalid' })
      expect(result.success).toBe(false)
    })
  })
})
