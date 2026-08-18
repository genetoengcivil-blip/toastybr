export interface DashboardData {
  sales_today: number
  orders_today: number
  avg_ticket_today: number
  customers_served_today: number
  sales_yesterday: number
  orders_yesterday: number
  avg_ticket_yesterday: number
}

export interface SalesSummary {
  gross_revenue: number
  discounts: number
  net_revenue: number
  orders: number
  avg_ticket: number
  items_sold: number
  prev_gross_revenue: number
  prev_discounts: number
  prev_net_revenue: number
  prev_orders: number
  prev_avg_ticket: number
  prev_items_sold: number
}

export interface TrendPoint {
  bucket: string
  revenue: number
  orders: number
}

export interface HourPoint {
  hour: number
  revenue: number
  orders: number
}

export interface WeekdayPoint {
  dow: number
  revenue: number
  orders: number
}

export interface ProductRow {
  product_id: string | null
  product_name: string
  quantity: number
  revenue: number
  share_pct: number
}

export interface CategoryRow {
  category_id: string | null
  category_name: string
  revenue: number
  orders: number
  share_pct: number
}

export interface PaymentMethodRow {
  method: string
  count: number
  total: number
  share_pct: number
}

export interface TopCustomer {
  customer_id: string
  name: string | null
  revenue: number
  orders: number
}

export interface CustomerAnalytics {
  new_customers: number
  returning_customers: number
  active_customers: number
  avg_ticket_per_customer: number
  top_customers: TopCustomer[]
}

export interface StockItem {
  ingredient_id: string
  name: string
  quantity: number
  minimum_quantity?: number
}

export interface InventoryAnalytics {
  low_stock: StockItem[]
  out_of_stock: StockItem[]
  estimated_value: number
  value_label: string
  consumption: { reference_type: string | null; total: number }[]
}

export interface SupplierAgg {
  supplier_id: string | null
  name: string | null
  total: number
  count: number
}

export interface ItemAgg {
  ingredient_name: string
  quantity: number
  total: number
}

export interface PurchasingAnalytics {
  total_purchased: number
  po_count: number
  top_supplier: SupplierAgg[]
  top_items: ItemAgg[]
}

export interface CashFlowPoint {
  bucket: string
  income: number
  expense: number
  net: number
}

export interface AgingBuckets {
  current: number
  d1_7: number
  d8_30: number
  d31plus: number
}

export interface OrderStatusRow {
  status: string
  count: number
}

export interface KitchenAnalytics {
  avg_confirm_to_ready_sec: number | null
  avg_ready_to_complete_sec: number | null
  avg_confirm_to_complete_sec: number | null
  available: boolean
}

export type TrendInterval = 'day' | 'week' | 'month'
export type QuickRange = 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'custom'

export interface AnalyticsFilters {
  startDate: string
  endDate: string
  timezone: string
  compare?: boolean
}
