import { z } from 'zod'

export const paymentMethodSchema = z.enum(['cash', 'pix', 'debit_card', 'credit_card', 'other'])
export type PaymentMethodForm = z.infer<typeof paymentMethodSchema>

export const paymentEntrySchema = z.object({
  method: paymentMethodSchema,
  amount: z.number().positive('Valor deve ser maior que zero'),
  reference: z.string().optional().nullable(),
})

export type PaymentEntry = z.infer<typeof paymentEntrySchema>

export const cartItemSchema = z.object({
  product_id: z.string().uuid(),
  product_name: z.string(),
  unit_price: z.number().min(0),
  quantity: z.number().positive(),
  notes: z.string().optional().nullable(),
})

export type CartItem = z.infer<typeof cartItemSchema>

export const checkoutSchema = z.object({
  customer_id: z.string().uuid().optional().nullable(),
  customer_name: z.string().optional().nullable(),
  customer_phone: z.string().optional().nullable(),
  channel: z.enum(['pos', 'counter', 'takeaway', 'delivery']),
  discount: z.number().min(0).default(0),
  service_fee: z.number().min(0).default(0),
  delivery_fee: z.number().min(0).default(0),
  notes: z.string().optional().nullable(),
  coupon_id: z.string().uuid().optional().nullable(),
  coupon_code: z.string().optional().nullable(),
  coupon_discount: z.number().min(0).default(0),
  payments: z.array(paymentEntrySchema).min(1, 'Pelo menos um pagamento é necessário'),
})

export type CheckoutValues = z.infer<typeof checkoutSchema>

export const orderFilterSchema = z.enum([
  'all', 'open', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled',
])

export type OrderFilter = z.infer<typeof orderFilterSchema>
