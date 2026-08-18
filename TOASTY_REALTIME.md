# TOASTY_REALTIME (Phase 14)

Realtime Orders & Kitchen synchronization for Toasty OS.

## Goal
Keep POS, Orders, and Kitchen views in sync within ~1s across devices, without duplicate
orders, with tenant isolation, low load, and zero regression in validated finance/inventory/sales rules.

## Architecture
- **Notification-only.** Supabase Realtime Postgres Changes on `sales_orders` (filtered by
  `organization_id=eq.<org>`) triggers TanStack Query cache invalidation. Realtime never mutates
  business data; `update_order_status` / `finalize_sales_order` RPCs remain authoritative.
- **Hook:** `src/features/sales/realtime/useOrdersRealtime.ts`.
  - Subscribes to `postgres_changes` on `sales_orders` with filter `organization_id=eq.<org>`.
  - Channel name is deterministic: `orders:<orgId>` (OrdersPage) / `kitchen:<orgId>` (KitchenPage).
  - On any event → `invalidateQueries` for `['sales-orders', org]`, `['sales-order']`, `['kitchen-orders', org]`.
  - Returns connection status: `pending | subscribed | error`.
- **Wiring:**
  - `KitchenPage` uses `useOrdersRealtime(orgId, { channelPrefix: 'kitchen' })` and shows a live/reconnecting dot.
  - `OrdersPage` uses `useOrdersRealtime(orgId, { channelPrefix: 'orders' })`.
  - `POSPage` is intentionally NOT subscribed (it builds a cart, not an order list).
  - Kitchen's prior 15s polling (`refetchInterval`) was removed; window-focus refetch covers
    events missed while a tablet is suspended.

## Tenant isolation / security
- Realtime delivery is scoped by the table's existing RLS (organization_id); a client only
  receives rows it is authorized to SELECT.
- Migration `supabase/migrations/20260820000000_realtime_sales_orders.sql` adds **only**
  `sales_orders` to `supabase_realtime` via an idempotent `DO` block. Never `for all tables`,
  never finance/inventory tables, never `service_role`. Enforced by the `REALTIME_PUBLICATION`
  static check in `src/test/scripts/migration-tests.mjs`.

## Why sales_orders only (not sales_order_items)
A `sales_orders` status UPDATE already invalidates `['sales-order']` (detail) and
`['kitchen-orders', org]` (kitchen), which refetch items server-side. Subscribing to
`sales_order_items` would duplicate updates and add no coverage.

## Testing
- Unit/hook: `src/features/sales/realtime/useOrdersRealtime.test.tsx` (subscribe, INSERT/UPDATE
  invalidation, cleanup-once, org-switch, error status, no-duplicate, kitchen integration).
- E2E (optional, env-gated, NOT in CI): `tests/phase14-realtime.mjs` — two clients, one
  subscribes, the other toggles an order status via `update_order_status`; expects the event
  within 15s. Requires `TEST_SUPABASE_URL / TEST_SUPABASE_ANON_KEY / TEST_ORG_ID / TEST_USER_EMAIL / TEST_USER_PASSWORD`.

## Do NOT
- Do not perform mutations in response to realtime events.
- Do not add finance/inventory tables to the realtime publication.
- Do not change validated finance/inventory/sales rules unless a proven bug exists.
