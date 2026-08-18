import { z } from 'zod'

export const supplierSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  contact_name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().or(z.literal('')).optional().nullable(),
  cnpj: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  is_active: z.boolean(),
})

export type SupplierFormValues = z.infer<typeof supplierSchema>

export const purchaseOrderItemSchema = z.object({
  po_item_id: z.string().uuid(),
  quantity: z.number().min(0.0001, 'Quantidade deve ser maior que zero'),
})

export type PurchaseOrderItemFormValues = z.infer<typeof purchaseOrderItemSchema>

export const receiveFormSchema = z.object({
  items: z.array(purchaseOrderItemSchema).min(1, 'Adicione pelo menos um item'),
  notes: z.string().optional().nullable(),
})

export type ReceiveFormValues = z.infer<typeof receiveFormSchema>
