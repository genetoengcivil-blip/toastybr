-- =============================================================
-- Toasty OS — Analytics supporting indexes (Phase 15)
-- Migration: 20260819000004_analytics_indexes.sql
-- =============================================================
-- These accelerate the analytical aggregations. Created IF NOT EXISTS so the
-- migration is idempotent and safe to re-run.

create index if not exists idx_sales_orders_org_status_completed
  on public.sales_orders (organization_id, status, completed_at);

create index if not exists idx_sales_order_items_order_product
  on public.sales_order_items (sales_order_id, product_id);

create index if not exists idx_sales_payments_org_created
  on public.sales_payments (organization_id, created_at);

create index if not exists idx_financial_transactions_org_occurred
  on public.financial_transactions (organization_id, occurred_at);

create index if not exists idx_inventory_movements_org_created
  on public.inventory_movements (organization_id, created_at);

create index if not exists idx_purchase_orders_org_created
  on public.purchase_orders (organization_id, created_at);
