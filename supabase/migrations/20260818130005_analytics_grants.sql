-- =============================================================
-- Toasty OS — Analytics RPC grants (Phase 15)
-- Migration: 20260819000005_analytics_grants.sql
-- =============================================================
-- Least-privilege: analytics RPCs are callable only by authenticated members.
-- REVOKE from PUBLIC/anon, GRANT to authenticated.

-- Sales
REVOKE EXECUTE ON FUNCTION public.analytics_dashboard(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.analytics_dashboard(uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.analytics_sales_summary(uuid, date, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.analytics_sales_summary(uuid, date, date, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.analytics_sales_trend(uuid, date, date, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.analytics_sales_trend(uuid, date, date, text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.analytics_sales_hourly(uuid, date, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.analytics_sales_hourly(uuid, date, date, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.analytics_sales_weekday(uuid, date, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.analytics_sales_weekday(uuid, date, date, text) TO authenticated;

-- Products / Customers
REVOKE EXECUTE ON FUNCTION public.analytics_top_products(uuid, date, date, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.analytics_top_products(uuid, date, date, text, integer) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.analytics_category_sales(uuid, date, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.analytics_category_sales(uuid, date, date, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.analytics_payment_methods(uuid, date, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.analytics_payment_methods(uuid, date, date, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.analytics_customers(uuid, date, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.analytics_customers(uuid, date, date, text) TO authenticated;

-- Operations
REVOKE EXECUTE ON FUNCTION public.analytics_inventory(uuid, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.analytics_inventory(uuid, date, date) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.analytics_purchasing(uuid, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.analytics_purchasing(uuid, date, date) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.analytics_order_status(uuid, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.analytics_order_status(uuid, date, date) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.analytics_kitchen(uuid, date, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.analytics_kitchen(uuid, date, date, text) TO authenticated;

-- Finance
REVOKE EXECUTE ON FUNCTION public.analytics_cash_flow(uuid, date, date, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.analytics_cash_flow(uuid, date, date, text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.analytics_ap_aging(uuid, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.analytics_ap_aging(uuid, date) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.analytics_ar_aging(uuid, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.analytics_ar_aging(uuid, date) TO authenticated;
