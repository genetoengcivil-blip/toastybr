import { z } from 'zod'

export const customerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(200),
  email: z.string().email('Email inválido').optional().or(z.literal('')).nullable(),
  phone: z.string().optional().nullable(),
  document: z.string().optional().nullable(),
})

export type CustomerFormValues = z.infer<typeof customerSchema>

export const customerAddressSchema = z.object({
  label: z.string().min(1, 'Label é obrigatório'),
  street: z.string().min(1, 'Rua é obrigatória'),
  number: z.string().optional().nullable(),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(1, 'Estado é obrigatório'),
  zip_code: z.string().optional().nullable(),
  is_default: z.boolean(),
})

export type CustomerAddressFormValues = z.infer<typeof customerAddressSchema>

export const customerNoteSchema = z.object({
  content: z.string().min(1, 'Conteúdo é obrigatório'),
})

export type CustomerNoteFormValues = z.infer<typeof customerNoteSchema>

export const tagSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(50),
})

export type TagFormValues = z.infer<typeof tagSchema>

export const loyaltyAdjustmentSchema = z.object({
  type: z.enum(['adjustment_in', 'adjustment_out']),
  points: z.number().int().positive('Pontos devem ser maior que zero'),
  description: z.string().optional().nullable(),
})

export type LoyaltyAdjustmentFormValues = z.infer<typeof loyaltyAdjustmentSchema>

export const couponSchema = z.object({
  code: z.string().min(1, 'Código é obrigatório').max(50),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().positive('Valor deve ser maior que zero'),
  min_order: z.number().min(0, 'Valor mínimo não pode ser negativo'),
  max_uses: z.number().int().positive().optional().nullable(),
  starts_at: z.string().optional().nullable(),
  expires_at: z.string().optional().nullable(),
  is_active: z.boolean(),
})

export type CouponFormValues = z.infer<typeof couponSchema>

export const campaignSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(200),
  description: z.string().optional().nullable(),
  type: z.enum(['whatsapp', 'email', 'sms', 'in_store']),
  starts_at: z.string().optional().nullable(),
  ends_at: z.string().optional().nullable(),
})

export type CampaignFormValues = z.infer<typeof campaignSchema>
