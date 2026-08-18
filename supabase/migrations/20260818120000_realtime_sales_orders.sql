-- Phase 14: enable Realtime Postgres Changes for sales_orders.
-- Realtime delivery is automatically scoped by the table's RLS policies
-- (organization_id), so a client only receives rows it is authorized to
-- SELECT. No new policy or elevated-privilege usage is introduced. This is
-- the single table required for Orders/Kitchen synchronization; order items
-- are not added because a sales_orders UPDATE already invalidates the kitchen
-- and order-detail caches.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'sales_orders'
  ) then
    alter publication supabase_realtime add table public.sales_orders;
  end if;
end $$;
