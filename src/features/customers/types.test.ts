import { describe, it, expect } from 'vitest'
import { z } from 'zod'

const customerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido').nullable().optional(),
  phone: z.string().nullable().optional(),
  document: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
})
const customerAddressSchema = z.object({
  label: z.string().min(1, 'Rótulo é obrigatório'),
  street: z.string().min(1, 'Rua é obrigatória'),
  number: z.string().nullable().optional(),
  complement: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(1, 'Estado é obrigatório'),
  zip_code: z.string().nullable().optional(),
  is_default: z.boolean().default(false),
})
const customerNoteSchema = z.object({
  content: z.string().min(1, 'Conteúdo é obrigatório').refine(v => v.trim().length > 0, 'Conteúdo não pode ser apenas espaços'),
})
const customerTagSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
})
const campaignSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().nullable().optional(),
  type: z.enum(['whatsapp', 'email', 'sms', 'in_store'], {
    message: 'Tipo de campanha inválido',
  }),
  status: z.enum(['draft', 'scheduled', 'active', 'completed', 'cancelled'], {
    message: 'Status inválido',
  }),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
})
const couponSchema = z.object({
  code: z.string().min(1, 'Código é obrigatório').toUpperCase(),
  type: z.enum(['percentage', 'fixed'], {
    message: 'Tipo de cupom inválido',
  }),
  value: z.number().min(0, 'Valor deve ser >= 0'),
  min_order: z.number().min(0, 'Valor mínimo do pedido deve ser >= 0').default(0),
  max_uses: z.number().int().min(0, 'Máximo de usos deve ser >= 0').nullable().optional().default(null),
  starts_at: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
}).refine(data => {
  if (data.type === 'percentage' && data.value > 100) {
    return false
  }
  return true
}, {
  message: 'Porcentagem não pode ser maior que 100%',
  path: ['value'],
})

describe('CRM Zod Schemas', () => {
  describe('customerSchema', () => {
    const validCustomer = {
      name: 'João Silva',
      email: 'joao@email.com',
      phone: '11999999999',
      document: '123.456.789-00',
      is_active: true,
    }

    it('accepts valid customer', () => {
      const result = customerSchema.safeParse(validCustomer)
      expect(result.success).toBe(true)
    })

    it('rejects empty name', () => {
      const result = customerSchema.safeParse({ ...validCustomer, name: '' })
      expect(result.success).toBe(false)
    })

    it('accepts optional email as null', () => {
      const result = customerSchema.safeParse({ ...validCustomer, email: null })
      expect(result.success).toBe(true)
    })

    it('rejects invalid email format', () => {
      const result = customerSchema.safeParse({ ...validCustomer, email: 'invalid' })
      expect(result.success).toBe(false)
    })

    it('accepts optional phone as null', () => {
      const result = customerSchema.safeParse({ ...validCustomer, phone: null })
      expect(result.success).toBe(true)
    })

    it('defaults is_active to true', () => {
      const result = customerSchema.safeParse({ ...validCustomer, is_active: undefined })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.is_active).toBe(true)
    })
  })

  describe('customerAddressSchema', () => {
    const validAddress = {
      label: 'Casa',
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01234-567',
      is_default: false,
    }

    it('accepts valid address', () => {
      const result = customerAddressSchema.safeParse(validAddress)
      expect(result.success).toBe(true)
    })

    it('rejects empty street', () => {
      const result = customerAddressSchema.safeParse({ ...validAddress, street: '' })
      expect(result.success).toBe(false)
    })

    it('rejects empty city', () => {
      const result = customerAddressSchema.safeParse({ ...validAddress, city: '' })
      expect(result.success).toBe(false)
    })

    it('rejects empty state', () => {
      const result = customerAddressSchema.safeParse({ ...validAddress, state: '' })
      expect(result.success).toBe(false)
    })

    it('accepts optional fields as null', () => {
      const result = customerAddressSchema.safeParse({
        ...validAddress,
        number: null,
        complement: null,
        neighborhood: null,
      })
      expect(result.success).toBe(true)
    })

    it('defaults is_default to false', () => {
      const result = customerAddressSchema.safeParse({ ...validAddress, is_default: undefined })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.is_default).toBe(false)
    })
  })

  describe('customerNoteSchema', () => {
    it('accepts valid note', () => {
      const result = customerNoteSchema.safeParse({ content: 'Nota de teste' })
      expect(result.success).toBe(true)
    })

    it('rejects empty content', () => {
      const result = customerNoteSchema.safeParse({ content: '' })
      expect(result.success).toBe(false)
    })

    it('rejects whitespace only', () => {
      const result = customerNoteSchema.safeParse({ content: '   ' })
      expect(result.success).toBe(false)
    })
  })

  describe('customerTagSchema', () => {
    it('accepts valid tag', () => {
      const result = customerTagSchema.safeParse({ name: 'VIP' })
      expect(result.success).toBe(true)
    })

    it('rejects empty name', () => {
      const result = customerTagSchema.safeParse({ name: '' })
      expect(result.success).toBe(false)
    })
  })

  describe('campaignSchema', () => {
    const validCampaign = {
      name: 'Campanha Verão',
      description: 'Promoção de verão',
      type: 'whatsapp',
      status: 'draft',
      starts_at: '2026-01-01T00:00:00Z',
      ends_at: '2026-01-31T23:59:59Z',
    }

    it('accepts valid campaign', () => {
      const result = campaignSchema.safeParse(validCampaign)
      expect(result.success).toBe(true)
    })

    it('rejects invalid type', () => {
      const result = campaignSchema.safeParse({ ...validCampaign, type: 'invalid' })
      expect(result.success).toBe(false)
    })

    it('accepts all valid types', () => {
      const types = ['whatsapp', 'email', 'sms', 'in_store']
      for (const type of types) {
        const result = campaignSchema.safeParse({ ...validCampaign, type })
        expect(result.success).toBe(true)
      }
    })

    it('rejects invalid status', () => {
      const result = campaignSchema.safeParse({ ...validCampaign, status: 'invalid' })
      expect(result.success).toBe(false)
    })

    it('accepts all valid statuses', () => {
      const statuses = ['draft', 'scheduled', 'active', 'completed', 'cancelled']
      for (const status of statuses) {
        const result = campaignSchema.safeParse({ ...validCampaign, status })
        expect(result.success).toBe(true)
      }
    })

    it('accepts optional dates', () => {
      const result = campaignSchema.safeParse({
        ...validCampaign,
        starts_at: null,
        ends_at: null,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('couponSchema', () => {
    const validCoupon = {
      code: 'DESC10',
      type: 'percentage',
      value: 10,
      min_order: 50,
      max_uses: 100,
      starts_at: '2026-01-01T00:00:00Z',
      expires_at: '2026-12-31T23:59:59Z',
      is_active: true,
    }

    it('accepts valid coupon', () => {
      const result = couponSchema.safeParse(validCoupon)
      expect(result.success).toBe(true)
    })

    it('rejects empty code', () => {
      const result = couponSchema.safeParse({ ...validCoupon, code: '' })
      expect(result.success).toBe(false)
    })

    it('converts code to uppercase', () => {
      const result = couponSchema.safeParse({ ...validCoupon, code: 'desc10' })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.code).toBe('DESC10')
    })

    it('rejects invalid type', () => {
      const result = couponSchema.safeParse({ ...validCoupon, type: 'invalid' })
      expect(result.success).toBe(false)
    })

    it('accepts both types', () => {
      const result1 = couponSchema.safeParse({ ...validCoupon, type: 'percentage' })
      const result2 = couponSchema.safeParse({ ...validCoupon, type: 'fixed' })
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
    })

    it('rejects negative value', () => {
      const result = couponSchema.safeParse({ ...validCoupon, value: -5 })
      expect(result.success).toBe(false)
    })

    it('accepts percentage value up to 100', () => {
      const result = couponSchema.safeParse({ ...validCoupon, type: 'percentage', value: 100 })
      expect(result.success).toBe(true)
    })

    it('rejects percentage > 100', () => {
      const result = couponSchema.safeParse({ ...validCoupon, type: 'percentage', value: 150 })
      expect(result.success).toBe(false)
    })

    it('accepts fixed value', () => {
      const result = couponSchema.safeParse({ ...validCoupon, type: 'fixed', value: 50 })
      expect(result.success).toBe(true)
    })

    it('accepts optional max_uses as null', () => {
      const result = couponSchema.safeParse({ ...validCoupon, max_uses: null })
      expect(result.success).toBe(true)
    })

    it('rejects negative max_uses', () => {
      const result = couponSchema.safeParse({ ...validCoupon, max_uses: -1 })
      expect(result.success).toBe(false)
    })

    it('accepts optional max_uses as undefined', () => {
      const result = couponSchema.safeParse({ ...validCoupon, max_uses: undefined })
      expect(result.success).toBe(true)
    })

    it('defaults min_order to 0', () => {
      const result = couponSchema.safeParse({ ...validCoupon, min_order: undefined })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.min_order).toBe(0)
    })

    it('defaults is_active to true', () => {
      const result = couponSchema.safeParse({ ...validCoupon, is_active: undefined })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.is_active).toBe(true)
    })

    it('defaults max_uses to null', () => {
      const result = couponSchema.safeParse({ ...validCoupon, max_uses: undefined })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.max_uses).toBeNull()
    })
  })
})
