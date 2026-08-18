-- =============================================================
-- Toasty OS — Finance Core: Data API Grants
-- Migration: 20260817130001_finance_grants.sql
-- =============================================================
-- Grants for financial tables and RPCs.
-- Follows least-privilege pattern from 20260817110000.

-- =============================================================
-- 1. TABLE GRANTS — FINANCIAL CATEGORIES & COST CENTERS
-- =============================================================
-- Frontend performs full CRUD (owner/admin/manager via RLS)

GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cost_centers TO authenticated;

-- =============================================================
-- 2. TABLE GRANTS — ACCOUNTS PAYABLE / RECEIVABLE
-- =============================================================
-- Frontend inserts/updates; payments via RPC handle final state

GRANT SELECT, INSERT, UPDATE ON public.accounts_payable TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.accounts_receivable TO authenticated;

-- =============================================================
-- 3. TABLE GRANTS — FINANCIAL TRANSACTIONS (LEDGER)
-- =============================================================
-- SELECT only. INSERT via RPC only. No UPDATE, No DELETE.

GRANT SELECT ON public.financial_transactions TO authenticated;

-- =============================================================
-- 4. RPC GRANTS — FINANCIAL FUNCTIONS
-- =============================================================

REVOKE EXECUTE ON FUNCTION public.pay_account_payable(uuid, numeric, uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pay_account_payable(uuid, numeric, uuid, uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.receive_account_receivable(uuid, numeric, uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.receive_account_receivable(uuid, numeric, uuid, uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_manual_financial_transaction(uuid, text, numeric, text, uuid, uuid, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_manual_financial_transaction(uuid, text, numeric, text, uuid, uuid, timestamptz) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.reverse_financial_transaction(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reverse_financial_transaction(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.finance_overview(uuid, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finance_overview(uuid, date, date) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.finance_cashflow_chart(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finance_cashflow_chart(uuid, integer) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.finance_dre(uuid, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finance_dre(uuid, date, date) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.finance_category_summary(uuid, date, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finance_category_summary(uuid, date, date, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.finance_payment_method_summary(uuid, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finance_payment_method_summary(uuid, date, date) TO authenticated;
