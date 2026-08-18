import { z } from 'zod'

export const movementSchema = z.object({
  ingredient_id: z.string().uuid('Selecione um ingrediente'),
  type: z.enum(['entry', 'exit', 'adjustment_in', 'adjustment_out'], {
    message: 'Selecione o tipo',
  }),
  quantity: z.number().positive('Quantidade deve ser maior que zero'),
  reason: z.string().optional(),
})

export type MovementFormData = z.infer<typeof movementSchema>

export const minimumQuantitySchema = z.object({
  minimum_quantity: z.number().min(0, 'Valor não pode ser negativo'),
})

export type MinimumQuantityFormData = z.infer<typeof minimumQuantitySchema>
