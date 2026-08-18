export interface FinancialCategory {
  id: string
  organization_id: string
  name: string
  type: 'income' | 'expense'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CostCenter {
  id: string
  organization_id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AccountPayable {
  id: string
  organization_id: string
  supplier_id: string | null
  purchase_order_id: string | null
  category_id: string | null
  cost_center_id: string | null
  description: string
  amount: number
  due_date: string
  status: 'pending' | 'partially_paid' | 'paid' | 'cancelled'
  paid_amount: number
  paid_at: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // joined
  suppliers?: { name: string } | null
  financial_categories?: { name: string } | null
  cost_centers?: { name: string } | null
}

export interface AccountReceivable {
  id: string
  organization_id: string
  customer_id: string | null
  sales_order_id: string | null
  category_id: string | null
  cost_center_id: string | null
  description: string
  amount: number
  due_date: string
  status: 'pending' | 'partially_received' | 'received' | 'cancelled'
  received_amount: number
  received_at: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // joined
  customers?: { name: string } | null
  financial_categories?: { name: string } | null
  cost_centers?: { name: string } | null
}

export interface FinancialTransaction {
  id: string
  organization_id: string
  type: 'sale' | 'purchase' | 'payment' | 'receipt' | 'manual' | 'adjustment' | 'reversal'
  direction: 'in' | 'out'
  amount: number
  category_id: string | null
  cost_center_id: string | null
  reference_type: string | null
  reference_id: string | null
  description: string
  occurred_at: string
  created_by: string | null
  created_at: string
  // joined
  financial_categories?: { name: string } | null
  cost_centers?: { name: string } | null
}

export interface FinanceOverview {
  today_in: number
  today_out: number
  month_in: number
  month_out: number
  open_payables: number
  open_receivables: number
  overdue_payables: number
  overdue_receivables: number
}

export interface CashflowDay {
  date: string
  in: number
  out: number
}

export interface DREData {
  revenue_gross: number
  revenue_reversals: number
  revenue_net: number
  cogs_estimated: number
  operating_expenses_manual: number
  operating_result: number
}

export interface CategorySummaryItem {
  category_id: string | null
  category_name: string
  direction: 'in' | 'out'
  total: number
}

export interface PaymentMethodSummary {
  method: string
  total: number
  count: number
}
