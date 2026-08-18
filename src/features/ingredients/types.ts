import { z } from 'zod'

const UNIT_VALUES = ['g', 'kg', 'ml', 'l', 'un', 'cx', 'pct'] as const

export const ingredientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(120),
  description: z.string().nullable(),
  unit: z.enum(UNIT_VALUES, { message: 'Selecione uma unidade' }),
  cost_per_unit: z.number().min(0, 'Custo deve ser positivo'),
  is_active: z.boolean(),
})

export type IngredientFormData = z.infer<typeof ingredientSchema>

export const recipeItemSchema = z.object({
  ingredient_id: z.string().uuid('Selecione um ingrediente'),
  quantity: z.number().positive('Quantidade deve ser maior que zero'),
  waste_percent: z.number().min(0).max(100),
})

export type RecipeItemFormData = z.infer<typeof recipeItemSchema>
