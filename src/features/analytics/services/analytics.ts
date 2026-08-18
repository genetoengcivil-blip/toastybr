import { supabase } from '../../../lib/supabase/client'
import type {
  AgingBuckets,
  CashFlowPoint,
  CategoryRow,
  CustomerAnalytics,
  DashboardData,
  HourPoint,
  InventoryAnalytics,
  KitchenAnalytics,
  OrderStatusRow,
  PaymentMethodRow,
  ProductRow,
  PurchasingAnalytics,
  SalesSummary,
  TrendInterval,
  TrendPoint,
  WeekdayPoint,
} from '../types'

async function rpcJson<T>(fn: string, params: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn as never, params as never)
  if (error) throw error
  return (data ?? null) as T
}

export function getDashboard(orgId: string, tz: string): Promise<DashboardData> {
  return rpcJson<DashboardData>('analytics_dashboard', { p_organization_id: orgId, p_tz: tz })
}

export function getSalesSummary(
  orgId: string,
  startDate: string,
  endDate: string,
  tz: string
): Promise<SalesSummary> {
  return rpcJson<SalesSummary>('analytics_sales_summary', {
    p_organization_id: orgId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_tz: tz,
  })
}

export function getSalesTrend(
  orgId: string,
  startDate: string,
  endDate: string,
  tz: string,
  interval: TrendInterval = 'day'
): Promise<TrendPoint[]> {
  return rpcJson<TrendPoint[]>('analytics_sales_trend', {
    p_organization_id: orgId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_tz: tz,
    p_interval: interval,
  })
}

export function getSalesHourly(
  orgId: string,
  startDate: string,
  endDate: string,
  tz: string
): Promise<HourPoint[]> {
  return rpcJson<HourPoint[]>('analytics_sales_hourly', {
    p_organization_id: orgId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_tz: tz,
  })
}

export function getSalesWeekday(
  orgId: string,
  startDate: string,
  endDate: string,
  tz: string
): Promise<WeekdayPoint[]> {
  return rpcJson<WeekdayPoint[]>('analytics_sales_weekday', {
    p_organization_id: orgId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_tz: tz,
  })
}

export function getTopProducts(
  orgId: string,
  startDate: string,
  endDate: string,
  tz: string,
  limit = 10
): Promise<ProductRow[]> {
  return rpcJson<ProductRow[]>('analytics_top_products', {
    p_organization_id: orgId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_tz: tz,
    p_limit: limit,
  })
}

export function getCategorySales(
  orgId: string,
  startDate: string,
  endDate: string,
  tz: string
): Promise<CategoryRow[]> {
  return rpcJson<CategoryRow[]>('analytics_category_sales', {
    p_organization_id: orgId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_tz: tz,
  })
}

export function getPaymentMethods(
  orgId: string,
  startDate: string,
  endDate: string,
  tz: string
): Promise<PaymentMethodRow[]> {
  return rpcJson<PaymentMethodRow[]>('analytics_payment_methods', {
    p_organization_id: orgId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_tz: tz,
  })
}

export function getCustomers(
  orgId: string,
  startDate: string,
  endDate: string,
  tz: string
): Promise<CustomerAnalytics> {
  return rpcJson<CustomerAnalytics>('analytics_customers', {
    p_organization_id: orgId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_tz: tz,
  })
}

export function getInventory(
  orgId: string,
  startDate?: string,
  endDate?: string
): Promise<InventoryAnalytics> {
  return rpcJson<InventoryAnalytics>('analytics_inventory', {
    p_organization_id: orgId,
    p_start_date: startDate ?? null,
    p_end_date: endDate ?? null,
  })
}

export function getPurchasing(
  orgId: string,
  startDate: string,
  endDate: string
): Promise<PurchasingAnalytics> {
  return rpcJson<PurchasingAnalytics>('analytics_purchasing', {
    p_organization_id: orgId,
    p_start_date: startDate,
    p_end_date: endDate,
  })
}

export function getCashFlow(
  orgId: string,
  startDate: string,
  endDate: string,
  tz: string,
  interval: TrendInterval = 'day'
): Promise<CashFlowPoint[]> {
  return rpcJson<CashFlowPoint[]>('analytics_cash_flow', {
    p_organization_id: orgId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_tz: tz,
    p_interval: interval,
  })
}

export function getAPAging(orgId: string, asof?: string): Promise<AgingBuckets> {
  return rpcJson<AgingBuckets>('analytics_ap_aging', {
    p_organization_id: orgId,
    p_asof: asof ?? null,
  })
}

export function getARAging(orgId: string, asof?: string): Promise<AgingBuckets> {
  return rpcJson<AgingBuckets>('analytics_ar_aging', {
    p_organization_id: orgId,
    p_asof: asof ?? null,
  })
}

export function getOrderStatus(
  orgId: string,
  startDate: string,
  endDate: string
): Promise<OrderStatusRow[]> {
  return rpcJson<OrderStatusRow[]>('analytics_order_status', {
    p_organization_id: orgId,
    p_start_date: startDate,
    p_end_date: endDate,
  })
}

export function getKitchen(
  orgId: string,
  startDate: string,
  endDate: string,
  tz: string
): Promise<KitchenAnalytics> {
  return rpcJson<KitchenAnalytics>('analytics_kitchen', {
    p_organization_id: orgId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_tz: tz,
  })
}
