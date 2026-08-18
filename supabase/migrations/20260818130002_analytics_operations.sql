-- =============================================================
-- Toasty OS — Analytics RPCs: Operations (Phase 15)
-- Migration: 20260819000002_analytics_operations.sql
-- =============================================================

-- 10. INVENTORY (current low/out stock, estimated value, period consumption)
create or replace function public.analytics_inventory(
  p_organization_id uuid,
  p_start_date date default null,
  p_end_date date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_low jsonb;
  v_out jsonb;
  v_value numeric(14,2);
  v_consumption jsonb;
begin
  if not is_member_of(p_organization_id) then
    raise exception 'Não autorizado';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'ingredient_id', i.id, 'name', i.name,
    'quantity', b.quantity, 'minimum_quantity', b.minimum_quantity
  ) order by (b.quantity / nullif(b.minimum_quantity,0)) asc), '[]'::jsonb)
  into v_low
  from inventory_balances b
  join ingredients i on i.id = b.ingredient_id
  where b.organization_id = p_organization_id
    and b.quantity <= b.minimum_quantity and b.quantity > 0;

  select coalesce(jsonb_agg(jsonb_build_object(
    'ingredient_id', i.id, 'name', i.name, 'quantity', b.quantity
  )), '[]'::jsonb)
  into v_out
  from inventory_balances b
  join ingredients i on i.id = b.ingredient_id
  where b.organization_id = p_organization_id and b.quantity <= 0;

  select coalesce(sum(b.quantity * i.cost_per_unit), 0)
  into v_value
  from inventory_balances b
  join ingredients i on i.id = b.ingredient_id
  where b.organization_id = p_organization_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'reference_type', reference_type, 'total', total
  ) order by total desc), '[]'::jsonb)
  into v_consumption
  from (
    select coalesce(reference_type, 'manual') as reference_type,
           sum(quantity) as total
    from inventory_movements
    where organization_id = p_organization_id
      and type = 'exit'
      and (p_start_date is null or created_at::date between p_start_date and p_end_date)
    group by 1
  ) t;

  return jsonb_build_object(
    'low_stock', v_low,
    'out_of_stock', v_out,
    'estimated_value', v_value,
    'value_label', 'ESTIMADO',
    'consumption', v_consumption
  );
end;
$$;

-- 11. PURCHASING (purchases, top supplier, top items)
create or replace function public.analytics_purchasing(
  p_organization_id uuid,
  p_start_date date,
  p_end_date date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total numeric(14,2);
  v_count integer;
  v_supplier jsonb;
  v_items jsonb;
begin
  if not is_member_of(p_organization_id) then
    raise exception 'Não autorizado';
  end if;

  select coalesce(sum(total), 0), count(*)
  into v_total, v_count
  from purchase_orders
  where organization_id = p_organization_id
    and status in ('received', 'partially_received')
    and created_at::date between p_start_date and p_end_date;

  select coalesce(jsonb_agg(jsonb_build_object(
    'supplier_id', supplier_id, 'name', name, 'total', total, 'count', count
  ) order by total desc), '[]'::jsonb)
  into v_supplier
  from (
    select po.supplier_id, s.name,
           sum(po.total) as total, count(*) as count
    from purchase_orders po
    left join suppliers s on s.id = po.supplier_id
    where po.organization_id = p_organization_id
      and po.status in ('received', 'partially_received')
      and po.created_at::date between p_start_date and p_end_date
    group by po.supplier_id, s.name
    order by total desc
    limit 1
  ) t;

  select coalesce(jsonb_agg(jsonb_build_object(
    'ingredient_name', ingredient_name, 'quantity', quantity, 'total', total
  ) order by total desc), '[]'::jsonb)
  into v_items
  from (
    select i.name as ingredient_name,
           sum(poi.quantity_ordered) as quantity,
           sum(poi.quantity_ordered * poi.unit_cost) as total
    from purchase_order_items poi
    join purchase_orders po on po.id = poi.po_id
    join ingredients i on i.id = poi.ingredient_id
    where po.organization_id = p_organization_id
      and po.status in ('received', 'partially_received')
      and po.created_at::date between p_start_date and p_end_date
    group by i.name
    order by total desc
    limit 10
  ) t;

  return jsonb_build_object(
    'total_purchased', v_total,
    'po_count', v_count,
    'top_supplier', v_supplier,
    'top_items', v_items
  );
end;
$$;

-- 12. ORDER STATUS COUNTS
create or replace function public.analytics_order_status(
  p_organization_id uuid,
  p_start_date date,
  p_end_date date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_member_of(p_organization_id) then
    raise exception 'Não autorizado';
  end if;

  return (
    select coalesce(jsonb_agg(
      jsonb_build_object('status', status, 'count', count)
      order by count desc
    ), '[]'::jsonb)
    from (
      select status, count(*) as count
      from sales_orders
      where organization_id = p_organization_id
        and created_at::date between p_start_date and p_end_date
      group by status
    ) t
  );
end;
$$;

-- 13. KITCHEN PREP TIMES (seconds; null when timestamps unavailable)
create or replace function public.analytics_kitchen(
  p_organization_id uuid,
  p_start_date date,
  p_end_date date,
  p_tz text default 'America/Sao_Paulo'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_confirm_ready numeric;
  v_ready_complete numeric;
  v_confirm_complete numeric;
begin
  if not is_member_of(p_organization_id) then
    raise exception 'Não autorizado';
  end if;

  select
    avg(extract(epoch from (ready_at - confirmed_at))),
    avg(extract(epoch from (completed_at - ready_at))),
    avg(extract(epoch from (completed_at - confirmed_at)))
  into v_confirm_ready, v_ready_complete, v_confirm_complete
  from sales_orders
  where organization_id = p_organization_id
    and status = 'completed'
    and confirmed_at is not null and ready_at is not null and completed_at is not null
    and timezone(p_tz, completed_at)::date between p_start_date and p_end_date;

  return jsonb_build_object(
    'avg_confirm_to_ready_sec', v_confirm_ready,
    'avg_ready_to_complete_sec', v_ready_complete,
    'avg_confirm_to_complete_sec', v_confirm_complete,
    'available', v_confirm_complete is not null
  );
end;
$$;
