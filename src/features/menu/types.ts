import { z } from 'zod'

export const categorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(120),
  description: z.string().nullable(),
  sort_order: z.number().int().min(0),
  is_active: z.boolean(),
})

export type CategoryFormData = z.infer<typeof categorySchema>

export const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(200),
  category_id: z.string().nullable(),
  description: z.string().nullable(),
  price: z.number().min(0, 'Preço deve ser positivo'),
  image_url: z.string().nullable(),
  sku: z.string().nullable(),
  is_active: z.boolean(),
  is_available: z.boolean(),
  sort_order: z.number().int().min(0),
})

export type ProductFormData = z.infer<typeof productSchema>
