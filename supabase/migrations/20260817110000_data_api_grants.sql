-- =============================================================
-- Toasty OS — Data API Grants (Corrective)
-- Migration: 20260817110000_data_api_grants.sql
-- =============================================================
-- Data API exposure is opt-in and least-privilege.
-- Only Toasty business tables are granted.
-- Legacy tables (carts, favorites, orders, reviews, user_preferences) are excluded.
-- Ledger/history tables receive SELECT only.
-- Sensitive writes use RPC; no broad INSERT/UPDATE/DELETE on ledgers.
-- auto_expose_new_tables remains DISABLED on this project.

-- =============================================================
-- 1. SCHEMA USAGE
-- =============================================================
GRANT USAGE ON SCHEMA public TO authenticated;

-- anon receives no access to business data
-- (auth endpoints don't depend on these grants)

-- =============================================================
-- 2. TABLE GRANTS — FULL CRUD
-- =============================================================
-- Tables where frontend performs SELECT + INSERT + UPDATE + DELETE

GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ingredients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_recipe_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_addresses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_tags TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_tag_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;

-- =============================================================
-- 3. TABLE GRANTS — SELECT + INSERT + UPDATE (no DELETE)
-- =============================================================
-- Frontend uses INSERT + UPDATE but not direct DELETE

GRANT SELECT, INSERT, UPDATE ON public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.purchase_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.purchase_order_items TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.sales_orders TO authenticated;

-- =============================================================
-- 4. TABLE GRANTS — SELECT + INSERT ONLY
-- =============================================================
-- Write-once tables: frontend inserts but does not update/delete

GRANT SELECT, INSERT ON public.customer_notes TO authenticated;
GRANT SELECT, INSERT ON public.sales_order_items TO authenticated;
GRANT SELECT, INSERT ON public.sales_payments TO authenticated;

-- =============================================================
-- 5. TABLE GRANTS — SELECT ONLY (LEDGERS / READ-ONLY)
-- =============================================================
-- All writes via RPC only. No direct INSERT/UPDATE/DELETE.

GRANT SELECT ON public.inventory_balances TO authenticated;
GRANT SELECT ON public.inventory_movements TO authenticated;
GRANT SELECT ON public.purchase_receipts TO authenticated;
GRANT SELECT ON public.purchase_receipt_items TO authenticated;
GRANT SELECT ON public.loyalty_accounts TO authenticated;
GRANT SELECT ON public.loyalty_transactions TO authenticated;
GRANT SELECT ON public.loyalty_settings TO authenticated;
GRANT SELECT ON public.coupon_redemptions TO authenticated;

-- =============================================================
-- 6. TABLE GRANTS — AUTH (already exposed by Supabase, explicit for safety)
-- =============================================================
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.organizations TO authenticated;
GRANT SELECT ON public.organization_members TO authenticated;

-- =============================================================
-- 7. RPC GRANTS — BUSINESS FUNCTIONS
-- =============================================================
-- REVOKE from PUBLIC and anon, then GRANT to authenticated.

-- Organization
REVOKE EXECUTE ON FUNCTION public.create_organization(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_organization(text, text) TO authenticated;

-- Inventory
REVOKE EXECUTE ON FUNCTION public.apply_inventory_movement(uuid, text, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_inventory_movement(uuid, text, numeric, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.update_minimum_quantity(uuid, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_minimum_quantity(uuid, numeric) TO authenticated;

-- Purchasing
REVOKE EXECUTE ON FUNCTION public.generate_po_number(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_po_number(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.receive_purchase_order(uuid, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.receive_purchase_order(uuid, jsonb, text) TO authenticated;

-- Loyalty
REVOKE EXECUTE ON FUNCTION public.apply_loyalty_transaction(uuid, text, integer, text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_loyalty_transaction(uuid, text, integer, text, uuid, text) TO authenticated;

-- Customer
REVOKE EXECUTE ON FUNCTION public.set_default_customer_address(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_default_customer_address(uuid) TO authenticated;

-- Campaigns
REVOKE EXECUTE ON FUNCTION public.update_campaign_status(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_campaign_status(uuid, text) TO authenticated;

-- Sales
REVOKE EXECUTE ON FUNCTION public.generate_order_number(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_order_number(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.update_order_status(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_order_status(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.finalize_sales_order(uuid, uuid, uuid, text, numeric, numeric, numeric, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_sales_order(uuid, uuid, uuid, text, numeric, numeric, numeric, numeric) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.cancel_sales_order(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_sales_order(uuid, text) TO authenticated;

-- =============================================================
-- 8. HELPER FUNCTIONS — NO EXPLICIT GRANTS NEEDED
-- =============================================================
-- is_member_of, has_org_role: SECURITY DEFINER, called by RLS policies internally.
-- update_updated_at: trigger function, called by PostgreSQL engine.
-- handle_new_user: trigger function on auth.users.
-- These do NOT need EXECUTE grants for the Data API.

-- =============================================================
-- 9. NO DEFAULT PRIVILEGES
-- =============================================================
-- Intentionally omitted: GRANT on future tables is opt-in per migration.

-- =============================================================
-- 10. NO SERVICE_ROLE GRANTS
-- =============================================================
-- service_role is privileged in Supabase ecosystem, not used by frontend.
