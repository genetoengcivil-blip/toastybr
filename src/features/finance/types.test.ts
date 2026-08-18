import { describe, it, expect } from 'vitest'
import { z } from 'zod'

const accountsPayableSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().min(0.01, 'Valor deve ser > 0'),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  category_id: z.string().uuid('ID de categoria inválido').nullable().optional(),
  cost_center_id: z.string().uuid('ID de centro de custo inválido').nullable().optional(),
  notes: z.string().nullable().optional(),
})
const accountsReceivableSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().min(0.01, 'Valor deve ser > 0'),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  category_id: z.string().uuid('ID de categoria inválido').nullable().optional(),
  cost_center_id: z.string().uuid('ID de centro de custo inválido').nullable().optional(),
  notes: z.string().nullable().optional(),
})
const manualTransactionSchema = z.object({
  direction: z.enum(['in', 'out'], { message: 'Direção inválida' }),
  amount: z.number().min(0.01, 'Valor deve ser > 0'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  category_id: z.string().uuid('ID de categoria inválido').nullable().optional(),
  cost_center_id: z.string().uuid('ID de centro de custo inválido').nullable().optional(),
  occurred_at: z.string().datetime({ offset: true }).optional(),
})
const financialCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['income', 'expense', 'transfer'], { message: 'Tipo inválido' }),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser hexadecimal #RRGGBB').default('#3B82F6'),
  is_active: z.boolean().default(true),
})
const costCenterSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  code: z.string().min(1, 'Código é obrigatório'),
  is_active: z.boolean().default(true),
})

describe('Finance Zod Schemas', () => {
  describe('accountsPayableSchema', () => {
    const validAP = {
      description: 'Conta de energia',
      amount: 500.00,
      due_date: '2026-09-15',
      category_id: '550e8400-e29b-41d4-a716-446655440000',
      cost_center_id: '550e8400-e29b-41d4-a716-446655440001',
      notes: 'Vencimento dia 15',
    }

    it('accepts valid AP', () => {
      const result = accountsPayableSchema.safeParse(validAP)
      expect(result.success).toBe(true)
    })

    it('rejects empty description', () => {
      const result = accountsPayableSchema.safeParse({ ...validAP, description: '' })
      expect(result.success).toBe(false)
    })

    it('rejects zero amount', () => {
      const result = accountsPayableSchema.safeParse({ ...validAP, amount: 0 })
      expect(result.success).toBe(false)
    })

    it('rejects negative amount', () => {
      const result = accountsPayableSchema.safeParse({ ...validAP, amount: -100 })
      expect(result.success).toBe(false)
    })

    it('accepts decimal amount', () => {
      const result = accountsPayableSchema.safeParse({ ...validAP, amount: 123.45 })
      expect(result.success).toBe(true)
    })

    it('rejects invalid due_date format', () => {
      const result = accountsPayableSchema.safeParse({ ...validAP, due_date: '15/09/2026' })
      expect(result.success).toBe(false)
    })

    it('accepts valid due_date format', () => {
      const result = accountsPayableSchema.safeParse({ ...validAP, due_date: '2026-12-31' })
      expect(result.success).toBe(true)
    })

    it('accepts optional category_id as null', () => {
      const result = accountsPayableSchema.safeParse({ ...validAP, category_id: null })
      expect(result.success).toBe(true)
    })

    it('accepts optional category_id as undefined', () => {
      const result = accountsPayableSchema.safeParse({ ...validAP, category_id: undefined })
      expect(result.success).toBe(true)
    })

    it('accepts optional cost_center_id as null', () => {
      const result = accountsPayableSchema.safeParse({ ...validAP, cost_center_id: null })
      expect(result.success).toBe(true)
    })

    it('rejects invalid category_id UUID', () => {
      const result = accountsPayableSchema.safeParse({ ...validAP, category_id: 'invalid' })
      expect(result.success).toBe(false)
    })
  })

  describe('accountsReceivableSchema', () => {
    const validAR = {
      description: 'Venda para cliente',
      amount: 1000.00,
      due_date: '2026-09-30',
      category_id: '550e8400-e29b-41d4-a716-446655440000',
      cost_center_id: '550e8400-e29b-41d4-a716-446655440001',
      notes: 'Recebimento previsto',
    }

    it('accepts valid AR', () => {
      const result = accountsReceivableSchema.safeParse(validAR)
      expect(result.success).toBe(true)
    })

    it('rejects zero amount', () => {
      const result = accountsReceivableSchema.safeParse({ ...validAR, amount: 0 })
      expect(result.success).toBe(false)
    })

    it('rejects negative amount', () => {
      const result = accountsReceivableSchema.safeParse({ ...validAR, amount: -50 })
      expect(result.success).toBe(false)
    })

    it('accepts decimal amount', () => {
      const result = accountsReceivableSchema.safeParse({ ...validAR, amount: 123.45 })
      expect(result.success).toBe(true)
    })

    it('rejects invalid due_date format', () => {
      const result = accountsReceivableSchema.safeParse({ ...validAR, due_date: '30/09/2026' })
      expect(result.success).toBe(false)
    })
  })

  describe('manualTransactionSchema', () => {
    const validTx = {
      direction: 'in',
      amount: 200.00,
      description: 'Entrada manual',
      category_id: '550e8400-e29b-41d4-a716-446655440000',
      cost_center_id: '550e8400-e29b-41d4-a716-446655440001',
      occurred_at: '2026-08-17T10:00:00Z',
    }

    it('accepts valid manual transaction', () => {
      const result = manualTransactionSchema.safeParse(validTx)
      expect(result.success).toBe(true)
    })

    it('rejects invalid direction', () => {
      const result = manualTransactionSchema.safeParse({ ...validTx, direction: 'invalid' })
      expect(result.success).toBe(false)
    })

    it('accepts both directions', () => {
      const inResult = manualTransactionSchema.safeParse({ ...validTx, direction: 'in' })
      const outResult = manualTransactionSchema.safeParse({ ...validTx, direction: 'out' })
      expect(inResult.success).toBe(true)
      expect(outResult.success).toBe(true)
    })

    it('rejects zero amount', () => {
      const result = manualTransactionSchema.safeParse({ ...validTx, amount: 0 })
      expect(result.success).toBe(false)
    })

    it('rejects negative amount', () => {
      const result = manualTransactionSchema.safeParse({ ...validTx, amount: -10 })
      expect(result.success).toBe(false)
    })

    it('accepts decimal amount', () => {
      const result = manualTransactionSchema.safeParse({ ...validTx, amount: 123.45 })
      expect(result.success).toBe(true)
    })

    it('accepts optional occurred_at', () => {
      const result = manualTransactionSchema.safeParse({ ...validTx, occurred_at: undefined })
      expect(result.success).toBe(true)
    })

    it('accepts valid ISO datetime', () => {
      const result = manualTransactionSchema.safeParse({ ...validTx, occurred_at: '2026-08-17T10:00:00.000Z' })
      expect(result.success).toBe(true)
    })
  })

  describe('financialCategorySchema', () => {
    it('accepts valid category', () => {
      const result = financialCategorySchema.safeParse({
        name: 'Despesas Operacionais',
        type: 'expense',
        color: '#ef4444',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid type', () => {
      const result = financialCategorySchema.safeParse({
        name: 'Test',
        type: 'invalid',
        color: '#000000',
      })
      expect(result.success).toBe(false)
    })

    it('accepts valid types', () => {
      const types = ['income', 'expense', 'transfer']
      for (const type of types) {
        const result = financialCategorySchema.safeParse({
          name: 'Test',
          type: type as 'income' | 'expense' | 'transfer',
          color: '#000000',
        })
        expect(result.success).toBe(true)
      }
    })

    it('rejects invalid color format', () => {
      const result = financialCategorySchema.safeParse({
        name: 'Test',
        type: 'income',
        color: 'red',
      })
      expect(result.success).toBe(false)
    })

    it('accepts valid hex color', () => {
      const result = financialCategorySchema.safeParse({
        name: 'Test',
        type: 'income',
        color: '#3B82F6',
      })
      expect(result.success).toBe(true)
    })

    it('defaults color to #3B82F6', () => {
      const result = financialCategorySchema.safeParse({
        name: 'Test',
        type: 'income',
        color: undefined,
      })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.color).toBe('#3B82F6')
    })

    it('defaults is_active to true', () => {
      const result = financialCategorySchema.safeParse({ name: 'Test', type: 'income', is_active: undefined })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.is_active).toBe(true)
    })
  })

  describe('costCenterSchema', () => {
    it('accepts valid cost center', () => {
      const result = costCenterSchema.safeParse({
        name: 'Cozinha',
        code: 'COZ01',
        is_active: true,
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty name', () => {
      const result = costCenterSchema.safeParse({ name: '', code: 'C01', is_active: true })
      expect(result.success).toBe(false)
    })

    it('rejects empty code', () => {
      const result = costCenterSchema.safeParse({ name: 'Test', code: '', is_active: true })
      expect(result.success).toBe(false)
    })

    it('defaults is_active to true', () => {
      const result = costCenterSchema.safeParse({ name: 'Test', code: 'T01', is_active: undefined })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.is_active).toBe(true)
    })
  })
})
