import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentOrganization } from '../../auth/context'
import type { AccountPayable, AccountReceivable } from '../types'
import {
  getFinancialCategories,
  createFinancialCategory,
  updateFinancialCategory,
  deleteFinancialCategory,
  getCostCenters,
  createCostCenter,
  updateCostCenter,
  deleteCostCenter,
  getAccountsPayable,
  createAccountPayable,
  updateAccountPayable,
  payAccountPayable,
  getAccountsReceivable,
  createAccountReceivable,
  updateAccountReceivable,
  receiveAccountReceivable,
  getFinancialTransactions,
  createManualTransaction,
  getFinanceOverview,
  getCashflowChart,
  getDRE,
  getCategorySummary,
  getPaymentMethodSummary,
} from '../services'

// ============================================================
// Categories
// ============================================================

export function useFinancialCategories(type?: string) {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id
  return useQuery({
    queryKey: ['finance', 'categories', orgId, type ?? 'all'],
    queryFn: () => getFinancialCategories(orgId!, type),
    enabled: !!orgId,
  })
}

export function useCreateFinancialCategory() {
  const qc = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id
  return useMutation({
    mutationFn: ({ name, type }: { name: string; type: string }) =>
      createFinancialCategory(orgId!, name, type),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'categories', orgId] })
    },
  })
}

export function useUpdateFinancialCategory() {
  const qc = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string; name?: string; is_active?: boolean }) =>
      updateFinancialCategory(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'categories', orgId] })
    },
  })
}

export function useDeleteFinancialCategory() {
  const qc = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id
  return useMutation({
    mutationFn: (id: string) => deleteFinancialCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'categories', orgId] })
    },
  })
}

// ============================================================
// Cost Centers
// ============================================================

export function useCostCenters() {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id
  return useQuery({
    queryKey: ['finance', 'cost-centers', orgId],
    queryFn: () => getCostCenters(orgId!),
    enabled: !!orgId,
  })
}

export function useCreateCostCenter() {
  const qc = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id
  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      createCostCenter(orgId!, name, description),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'cost-centers', orgId] })
    },
  })
}

export function useUpdateCostCenter() {
  const qc = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string; name?: string; description?: string; is_active?: boolean }) =>
      updateCostCenter(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'cost-centers', orgId] })
    },
  })
}

export function useDeleteCostCenter() {
  const qc = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id
  return useMutation({
    mutationFn: (id: string) => deleteCostCenter(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'cost-centers', orgId] })
    },
  })
}

// ============================================================
// Accounts Payable
// ============================================================

export function useAccountsPayable(status?: string) {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id
  return useQuery({
    queryKey: ['finance', 'payables', orgId, status ?? 'all'],
    queryFn: () => getAccountsPayable(orgId!, status),
    enabled: !!orgId,
  })
}

export function useCreateAccountPayable() {
  const qc = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id
  return useMutation({
    mutationFn: (params: {
      description: string
      amount: number
      due_date: string
      supplier_id?: string | null
      purchase_order_id?: string | null
      category_id?: string | null
      cost_center_id?: string | null
      notes?: string | null
    }) => createAccountPayable(orgId!, params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'payables', orgId] })
      qc.invalidateQueries({ queryKey: ['finance', 'overview', orgId] })
    },
  })
}

export function useUpdateAccountPayable() {
  const qc = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id
  return useMutation({
    mutationFn: ({ id, ...updates }: {
      id: string
      description?: string
      amount?: number
      due_date?: string
      status?: AccountPayable['status']
      notes?: string
      category_id?: string | null
      cost_center_id?: string | null
    }) => updateAccountPayable(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'payables', orgId] })
      qc.invalidateQueries({ queryKey: ['finance', 'overview', orgId] })
    },
  })
}

export function usePayAccountPayable() {
  const qc = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id
  return useMutation({
    mutationFn: ({ apId, amount, categoryId, costCenterId, notes }: {
      apId: string
      amount: number
      categoryId?: string | null
      costCenterId?: string | null
      notes?: string | null
    }) => payAccountPayable(apId, amount, categoryId, costCenterId, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'payables', orgId] })
      qc.invalidateQueries({ queryKey: ['finance', 'overview', orgId] })
      qc.invalidateQueries({ queryKey: ['finance', 'transactions', orgId] })
    },
  })
}

// ============================================================
// Accounts Receivable
// ============================================================

export function useAccountsReceivable(status?: string) {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id
  return useQuery({
    queryKey: ['finance', 'receivables', orgId, status ?? 'all'],
    queryFn: () => getAccountsReceivable(orgId!, status),
    enabled: !!orgId,
  })
}

export function useCreateAccountReceivable() {
  const qc = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id
  return useMutation({
    mutationFn: (params: {
      description: string
      amount: number
      due_date: string
      customer_id?: string | null
      sales_order_id?: string | null
      category_id?: string | null
      cost_center_id?: string | null
      notes?: string | null
    }) => createAccountReceivable(orgId!, params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'receivables', orgId] })
      qc.invalidateQueries({ queryKey: ['finance', 'overview', orgId] })
    },
  })
}

export function useUpdateAccountReceivable() {
  const qc = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id
  return useMutation({
    mutationFn: ({ id, ...updates }: {
      id: string
      description?: string
      amount?: number
      due_date?: string
      status?: AccountReceivable['status']
      notes?: string
      category_id?: string | null
      cost_center_id?: string | null
    }) => updateAccountReceivable(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'receivables', orgId] })
      qc.invalidateQueries({ queryKey: ['finance', 'overview', orgId] })
    },
  })
}

export function useReceiveAccountReceivable() {
  const qc = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id
  return useMutation({
    mutationFn: ({ arId, amount, categoryId, costCenterId, notes }: {
      arId: string
      amount: number
      categoryId?: string | null
      costCenterId?: string | null
      notes?: string | null
    }) => receiveAccountReceivable(arId, amount, categoryId, costCenterId, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'receivables', orgId] })
      qc.invalidateQueries({ queryKey: ['finance', 'overview', orgId] })
      qc.invalidateQueries({ queryKey: ['finance', 'transactions', orgId] })
    },
  })
}

// ============================================================
// Financial Transactions
// ============================================================

export function useFinancialTransactions() {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id
  return useQuery({
    queryKey: ['finance', 'transactions', orgId],
    queryFn: () => getFinancialTransactions(orgId!),
    enabled: !!orgId,
  })
}

export function useCreateManualTransaction() {
  const qc = useQueryClient()
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id
  return useMutation({
    mutationFn: (params: {
      direction: 'in' | 'out'
      amount: number
      category_id?: string | null
      cost_center_id?: string | null
      description: string
      occurred_at?: string
    }) => createManualTransaction(orgId!, params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'transactions', orgId] })
      qc.invalidateQueries({ queryKey: ['finance', 'overview', orgId] })
    },
  })
}

// ============================================================
// Finance Overview & Reports
// ============================================================

export function useFinanceOverview() {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id
  return useQuery({
    queryKey: ['finance', 'overview', orgId],
    queryFn: () => getFinanceOverview(orgId!),
    enabled: !!orgId,
  })
}

export function useCashflowChart(days = 30) {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id
  return useQuery({
    queryKey: ['finance', 'cashflow', orgId, days],
    queryFn: () => getCashflowChart(orgId!, days),
    enabled: !!orgId,
  })
}

export function useDRE(startDate: string, endDate: string) {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id
  return useQuery({
    queryKey: ['finance', 'dre', orgId, startDate, endDate],
    queryFn: () => getDRE(orgId!, startDate, endDate),
    enabled: !!orgId && !!startDate && !!endDate,
  })
}

export function useCategorySummary(startDate: string, endDate: string, type?: string) {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id
  return useQuery({
    queryKey: ['finance', 'category-summary', orgId, startDate, endDate, type],
    queryFn: () => getCategorySummary(orgId!, startDate, endDate, type),
    enabled: !!orgId && !!startDate && !!endDate,
  })
}

export function usePaymentMethodSummary(startDate: string, endDate: string) {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id
  return useQuery({
    queryKey: ['finance', 'payment-methods', orgId, startDate, endDate],
    queryFn: () => getPaymentMethodSummary(orgId!, startDate, endDate),
    enabled: !!orgId && !!startDate && !!endDate,
  })
}
