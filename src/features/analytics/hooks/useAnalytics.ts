import { useQuery } from '@tanstack/react-query'
import { useCurrentOrganization } from '../../auth/context'
import { DEFAULT_TZ } from '../utils/dateRanges'
import type { AnalyticsFilters, TrendInterval } from '../types'
import * as svc from '../services/analytics'

const STALE = 5 * 60 * 1000

function useOrgId(): string | undefined {
  const { organization } = useCurrentOrganization()
  return organization?.id
}

export function useAnalyticsDashboard(tz: string = DEFAULT_TZ) {
  const orgId = useOrgId()
  return useQuery({
    queryKey: ['analytics', orgId, 'dashboard', tz],
    queryFn: () => svc.getDashboard(orgId!, tz),
    enabled: !!orgId,
    staleTime: STALE,
  })
}

export function useAnalyticsSalesSummary(filters: AnalyticsFilters) {
  const orgId = useOrgId()
  return useQuery({
    queryKey: ['analytics', orgId, 'sales-summary', filters.startDate, filters.endDate, filters.timezone],
    queryFn: () => svc.getSalesSummary(orgId!, filters.startDate, filters.endDate, filters.timezone),
    enabled: !!orgId,
    staleTime: STALE,
  })
}

export function useAnalyticsSalesTrend(filters: AnalyticsFilters, interval: TrendInterval = 'day') {
  const orgId = useOrgId()
  return useQuery({
    queryKey: ['analytics', orgId, 'sales-trend', filters.startDate, filters.endDate, filters.timezone, interval],
    queryFn: () => svc.getSalesTrend(orgId!, filters.startDate, filters.endDate, filters.timezone, interval),
    enabled: !!orgId,
    staleTime: STALE,
  })
}

export function useAnalyticsSalesHourly(filters: AnalyticsFilters) {
  const orgId = useOrgId()
  return useQuery({
    queryKey: ['analytics', orgId, 'sales-hourly', filters.startDate, filters.endDate, filters.timezone],
    queryFn: () => svc.getSalesHourly(orgId!, filters.startDate, filters.endDate, filters.timezone),
    enabled: !!orgId,
    staleTime: STALE,
  })
}

export function useAnalyticsSalesWeekday(filters: AnalyticsFilters) {
  const orgId = useOrgId()
  return useQuery({
    queryKey: ['analytics', orgId, 'sales-weekday', filters.startDate, filters.endDate, filters.timezone],
    queryFn: () => svc.getSalesWeekday(orgId!, filters.startDate, filters.endDate, filters.timezone),
    enabled: !!orgId,
    staleTime: STALE,
  })
}

export function useAnalyticsTopProducts(filters: AnalyticsFilters, limit = 10) {
  const orgId = useOrgId()
  return useQuery({
    queryKey: ['analytics', orgId, 'top-products', filters.startDate, filters.endDate, filters.timezone, limit],
    queryFn: () => svc.getTopProducts(orgId!, filters.startDate, filters.endDate, filters.timezone, limit),
    enabled: !!orgId,
    staleTime: STALE,
  })
}

export function useAnalyticsCategorySales(filters: AnalyticsFilters) {
  const orgId = useOrgId()
  return useQuery({
    queryKey: ['analytics', orgId, 'category-sales', filters.startDate, filters.endDate, filters.timezone],
    queryFn: () => svc.getCategorySales(orgId!, filters.startDate, filters.endDate, filters.timezone),
    enabled: !!orgId,
    staleTime: STALE,
  })
}

export function useAnalyticsPaymentMethods(filters: AnalyticsFilters) {
  const orgId = useOrgId()
  return useQuery({
    queryKey: ['analytics', orgId, 'payment-methods', filters.startDate, filters.endDate, filters.timezone],
    queryFn: () => svc.getPaymentMethods(orgId!, filters.startDate, filters.endDate, filters.timezone),
    enabled: !!orgId,
    staleTime: STALE,
  })
}

export function useAnalyticsCustomers(filters: AnalyticsFilters) {
  const orgId = useOrgId()
  return useQuery({
    queryKey: ['analytics', orgId, 'customers', filters.startDate, filters.endDate, filters.timezone],
    queryFn: () => svc.getCustomers(orgId!, filters.startDate, filters.endDate, filters.timezone),
    enabled: !!orgId,
    staleTime: STALE,
  })
}

export function useAnalyticsInventory(startDate?: string, endDate?: string) {
  const orgId = useOrgId()
  return useQuery({
    queryKey: ['analytics', orgId, 'inventory', startDate, endDate],
    queryFn: () => svc.getInventory(orgId!, startDate, endDate),
    enabled: !!orgId,
    staleTime: STALE,
  })
}

export function useAnalyticsPurchasing(filters: AnalyticsFilters) {
  const orgId = useOrgId()
  return useQuery({
    queryKey: ['analytics', orgId, 'purchasing', filters.startDate, filters.endDate],
    queryFn: () => svc.getPurchasing(orgId!, filters.startDate, filters.endDate),
    enabled: !!orgId,
    staleTime: STALE,
  })
}

export function useAnalyticsCashFlow(filters: AnalyticsFilters, interval: TrendInterval = 'day') {
  const orgId = useOrgId()
  return useQuery({
    queryKey: ['analytics', orgId, 'cash-flow', filters.startDate, filters.endDate, filters.timezone, interval],
    queryFn: () => svc.getCashFlow(orgId!, filters.startDate, filters.endDate, filters.timezone, interval),
    enabled: !!orgId,
    staleTime: STALE,
  })
}

export function useAnalyticsAPAging(asof?: string) {
  const orgId = useOrgId()
  return useQuery({
    queryKey: ['analytics', orgId, 'ap-aging', asof],
    queryFn: () => svc.getAPAging(orgId!, asof),
    enabled: !!orgId,
    staleTime: STALE,
  })
}

export function useAnalyticsARAging(asof?: string) {
  const orgId = useOrgId()
  return useQuery({
    queryKey: ['analytics', orgId, 'ar-aging', asof],
    queryFn: () => svc.getARAging(orgId!, asof),
    enabled: !!orgId,
    staleTime: STALE,
  })
}

export function useAnalyticsOrderStatus(filters: AnalyticsFilters) {
  const orgId = useOrgId()
  return useQuery({
    queryKey: ['analytics', orgId, 'order-status', filters.startDate, filters.endDate],
    queryFn: () => svc.getOrderStatus(orgId!, filters.startDate, filters.endDate),
    enabled: !!orgId,
    staleTime: STALE,
  })
}

export function useAnalyticsKitchen(filters: AnalyticsFilters) {
  const orgId = useOrgId()
  return useQuery({
    queryKey: ['analytics', orgId, 'kitchen', filters.startDate, filters.endDate, filters.timezone],
    queryFn: () => svc.getKitchen(orgId!, filters.startDate, filters.endDate, filters.timezone),
    enabled: !!orgId,
    staleTime: STALE,
  })
}
