import { supabase } from '../../../lib/supabase/client'
import type {
  FinancialCategory,
  CostCenter,
  AccountPayable,
  AccountReceivable,
  FinancialTransaction,
  FinanceOverview,
  CashflowDay,
  DREData,
  CategorySummaryItem,
  PaymentMethodSummary,
} from '../types'

// ============================================================
// Financial Categories
// ============================================================

export async function getFinancialCategories(
  orgId: string,
  type?: string
): Promise<FinancialCategory[]> {
  let query = supabase
    .from('financial_categories')
    .select('*')
    .eq('organization_id', orgId)
    .order('name')

  if (type) {
    query = query.eq('type', type)
  }

  const { data, error } = await query
  if (error) throw error
  return data as FinancialCategory[]
}

export async function createFinancialCategory(
  orgId: string,
  name: string,
  type: string
): Promise<FinancialCategory> {
  const { data, error } = await supabase
    .from('financial_categories')
    .insert({ organization_id: orgId, name, type })
    .select()
    .single()
  if (error) throw error
  return data as FinancialCategory
}

export async function updateFinancialCategory(
  id: string,
  updates: Partial<Pick<FinancialCategory, 'name' | 'is_active'>>
): Promise<FinancialCategory> {
  const { data, error } = await supabase
    .from('financial_categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as FinancialCategory
}

export async function deleteFinancialCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('financial_categories')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ============================================================
// Cost Centers
// ============================================================

export async function getCostCenters(orgId: string): Promise<CostCenter[]> {
  const { data, error } = await supabase
    .from('cost_centers')
    .select('*')
    .eq('organization_id', orgId)
    .order('name')
  if (error) throw error
  return data as CostCenter[]
}

export async function createCostCenter(
  orgId: string,
  name: string,
  description?: string
): Promise<CostCenter> {
  const { data, error } = await supabase
    .from('cost_centers')
    .insert({ organization_id: orgId, name, description: description || null })
    .select()
    .single()
  if (error) throw error
  return data as CostCenter
}

export async function updateCostCenter(
  id: string,
  updates: Partial<Pick<CostCenter, 'name' | 'description' | 'is_active'>>
): Promise<CostCenter> {
  const { data, error } = await supabase
    .from('cost_centers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as CostCenter
}

export async function deleteCostCenter(id: string): Promise<void> {
  const { error } = await supabase
    .from('cost_centers')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ============================================================
// Accounts Payable
// ============================================================

export async function getAccountsPayable(
  orgId: string,
  status?: string
): Promise<AccountPayable[]> {
  let query = supabase
    .from('accounts_payable')
    .select('*, suppliers(name), financial_categories(name), cost_centers(name)')
    .eq('organization_id', orgId)
    .order('due_date')

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw error
  return data as AccountPayable[]
}

export async function createAccountPayable(
  orgId: string,
  params: {
    description: string
    amount: number
    due_date: string
    supplier_id?: string | null
    purchase_order_id?: string | null
    category_id?: string | null
    cost_center_id?: string | null
    notes?: string | null
  }
): Promise<AccountPayable> {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('accounts_payable')
    .insert({
      organization_id: orgId,
      ...params,
      created_by: user?.id || null,
    })
    .select('*, suppliers(name), financial_categories(name), cost_centers(name)')
    .single()
  if (error) throw error
  return data as AccountPayable
}

export async function updateAccountPayable(
  id: string,
  updates: Partial<Pick<AccountPayable, 'description' | 'amount' | 'due_date' | 'status' | 'notes' | 'category_id' | 'cost_center_id'>>
): Promise<AccountPayable> {
  const { data, error } = await supabase
    .from('accounts_payable')
    .update(updates)
    .eq('id', id)
    .select('*, suppliers(name), financial_categories(name), cost_centers(name)')
    .single()
  if (error) throw error
  return data as AccountPayable
}

export async function payAccountPayable(
  apId: string,
  amount: number,
  categoryId?: string | null,
  costCenterId?: string | null,
  notes?: string | null
): Promise<{ success: boolean; paid_amount: number; status: string }> {
  const { data, error } = await supabase.rpc('pay_account_payable', {
    p_ap_id: apId,
    p_amount: amount,
    p_category_id: categoryId || null,
    p_cost_center_id: costCenterId || null,
    p_notes: notes || null,
  })
  if (error) throw error
  return data as { success: boolean; paid_amount: number; status: string }
}

// ============================================================
// Accounts Receivable
// ============================================================

export async function getAccountsReceivable(
  orgId: string,
  status?: string
): Promise<AccountReceivable[]> {
  let query = supabase
    .from('accounts_receivable')
    .select('*, customers(name), financial_categories(name), cost_centers(name)')
    .eq('organization_id', orgId)
    .order('due_date')

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw error
  return data as AccountReceivable[]
}

export async function createAccountReceivable(
  orgId: string,
  params: {
    description: string
    amount: number
    due_date: string
    customer_id?: string | null
    sales_order_id?: string | null
    category_id?: string | null
    cost_center_id?: string | null
    notes?: string | null
  }
): Promise<AccountReceivable> {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('accounts_receivable')
    .insert({
      organization_id: orgId,
      ...params,
      created_by: user?.id || null,
    })
    .select('*, customers(name), financial_categories(name), cost_centers(name)')
    .single()
  if (error) throw error
  return data as AccountReceivable
}

export async function updateAccountReceivable(
  id: string,
  updates: Partial<Pick<AccountReceivable, 'description' | 'amount' | 'due_date' | 'status' | 'notes' | 'category_id' | 'cost_center_id'>>
): Promise<AccountReceivable> {
  const { data, error } = await supabase
    .from('accounts_receivable')
    .update(updates)
    .eq('id', id)
    .select('*, customers(name), financial_categories(name), cost_centers(name)')
    .single()
  if (error) throw error
  return data as AccountReceivable
}

export async function receiveAccountReceivable(
  arId: string,
  amount: number,
  categoryId?: string | null,
  costCenterId?: string | null,
  notes?: string | null
): Promise<{ success: boolean; received_amount: number; status: string }> {
  const { data, error } = await supabase.rpc('receive_account_receivable', {
    p_ar_id: arId,
    p_amount: amount,
    p_category_id: categoryId || null,
    p_cost_center_id: costCenterId || null,
    p_notes: notes || null,
  })
  if (error) throw error
  return data as { success: boolean; received_amount: number; status: string }
}

// ============================================================
// Cancel AR/AP
// ============================================================

export async function cancelAccountPayable(
  _orgId: string,
  apId: string,
  reason: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('cancel_account_payable', {
    p_ap_id: apId,
    p_reason: reason,
  })
  if (error) throw error
  return data as boolean
}

export async function cancelAccountReceivable(
  _orgId: string,
  arId: string,
  reason: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('cancel_account_receivable', {
    p_ar_id: arId,
    p_reason: reason,
  })
  if (error) throw error
  return data as boolean
}

// ============================================================
// Financial Transactions (Ledger)
// ============================================================

export async function getFinancialTransactions(
  orgId: string,
  limit = 100
): Promise<FinancialTransaction[]> {
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*, financial_categories(name), cost_centers(name)')
    .eq('organization_id', orgId)
    .order('occurred_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data as FinancialTransaction[]
}

export async function createManualTransaction(
  orgId: string,
  params: {
    direction: 'in' | 'out'
    amount: number
    category_id?: string | null
    cost_center_id?: string | null
    description: string
    occurred_at?: string
  }
): Promise<{ success: boolean; id: string }> {
  const { data, error } = await supabase.rpc('create_manual_financial_transaction', {
    p_org_id: orgId,
    p_direction: params.direction,
    p_amount: params.amount,
    p_description: params.description,
    p_category_id: params.category_id || null,
    p_cost_center_id: params.cost_center_id || null,
    p_occurred_at: params.occurred_at || new Date().toISOString(),
  })
  if (error) throw error
  return data as { success: boolean; id: string }
}

export async function reverseFinancialTransaction(
  originalId: string,
  description: string
): Promise<string> {
  const { data, error } = await supabase.rpc('reverse_financial_transaction', {
    p_original_id: originalId,
    p_description: description,
  })
  if (error) throw error
  return data as string
}

// ============================================================
// Finance Overview & Reports
// ============================================================

export async function getFinanceOverview(orgId: string): Promise<FinanceOverview> {
  const { data, error } = await supabase.rpc('finance_overview', { p_org_id: orgId })
  if (error) throw error
  return data as FinanceOverview
}

export async function getCashflowChart(
  orgId: string,
  days = 30
): Promise<CashflowDay[]> {
  const { data, error } = await supabase.rpc('finance_cashflow_chart', {
    p_org_id: orgId,
    p_days: days,
  })
  if (error) throw error
  return (data || []) as CashflowDay[]
}

export async function getDRE(
  orgId: string,
  startDate: string,
  endDate: string
): Promise<DREData> {
  const { data, error } = await supabase.rpc('finance_dre', {
    p_org_id: orgId,
    p_start_date: startDate,
    p_end_date: endDate,
  })
  if (error) throw error
  return data as DREData
}

export async function getCategorySummary(
  orgId: string,
  startDate: string,
  endDate: string,
  type?: string
): Promise<CategorySummaryItem[]> {
  const { data, error } = await supabase.rpc('finance_category_summary', {
    p_org_id: orgId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_type: type || null,
  })
  if (error) throw error
  return (data || []) as CategorySummaryItem[]
}

export async function getPaymentMethodSummary(
  orgId: string,
  startDate: string,
  endDate: string
): Promise<PaymentMethodSummary[]> {
  const { data, error } = await supabase.rpc('finance_payment_method_summary', {
    p_org_id: orgId,
    p_start_date: startDate,
    p_end_date: endDate,
  })
  if (error) throw error
  return (data || []) as PaymentMethodSummary[]
}
