import { z } from 'zod'
import type { AnalyticsFilters, QuickRange, TrendInterval } from './types'

export const quickRangeSchema = z.enum([
  'today',
  'yesterday',
  'last7',
  'last30',
  'thisMonth',
  'lastMonth',
  'custom',
])

export const trendIntervalSchema = z.enum(['day', 'week', 'month'])

export const dateRangeSchema = z
  .object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inicial inválida'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data final inválida'),
    timezone: z.string().min(1, 'Timezone obrigatório'),
    compare: z.boolean().optional(),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: 'Data final deve ser maior ou igual à inicial',
    path: ['endDate'],
  })

export function validateFilters(input: unknown): AnalyticsFilters {
  return dateRangeSchema.parse(input) as AnalyticsFilters
}

export type { AnalyticsFilters, QuickRange, TrendInterval }
