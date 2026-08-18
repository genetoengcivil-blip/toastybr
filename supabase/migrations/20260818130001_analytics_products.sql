-- =============================================================
-- Toasty OS — Analytics RPCs: Products / Customers (Phase 15)
-- Migration: 20260819000001_analytics_products.sql
-- =============================================================

-- 6. TOP PRODUCTS (by revenue, with share %)
create or replace function public.analytics_top_products(
  p_organization_id uuid,
  p_start_date date,
  p_end_date date,
  p_tz text default 'America/Sao_Paulo',
  p_limit integer default 10
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
      jsonb_build_object(
        'product_id', product_id,
        'product_name', product_name,
        'quantity', quantity,
        'revenue', revenue,
        'share_pct', share_pct
      )
      order by revenue desc
    ), '[]'::jsonb)
    from (
      select soi.product_id,
             soi.product_name,
             sum(soi.quantity) as quantity,
             sum(soi.subtotal) as revenue,
             round(100.0 * sum(soi.subtotal) / sum(sum(soi.subtotal)) over (), 2) as share_pct
      from sales_order_items soi
      join sales_orders so on so.id = soi.sales_order_id
      where so.organization_id = p_organization_id
        and so.status = 'completed'
        and timezone(p_tz, so.completed_at)::date between p_start_date and p_end_date
      group by soi.product_id, soi.product_name
      order by revenue desc
      limit p_limit
    ) t
  );
end;
$$;

-- 7. CATEGORY SALES (revenue + orders + share %)
create or replace function public.analytics_category_sales(
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
begin
  if not is_member_of(p_organization_id) then
    raise exception 'Não autorizado';
  end if;

  return (
    select coalesce(jsonb_agg(
      jsonb_build_object(
        'category_id', category_id,
        'category_name', category_name,
        'revenue', revenue,
        'orders', orders,
        'share_pct', share_pct
      )
      order by revenue desc
    ), '[]'::jsonb)
    from (
      select p.category_id,
             coalesce(mc.name, 'Sem categoria') as category_name,
             sum(soi.subtotal) as revenue,
             count(distinct so.id) as orders,
             round(100.0 * sum(soi.subtotal) / sum(sum(soi.subtotal)) over (), 2) as share_pct
      from sales_order_items soi
      join sales_orders so on so.id = soi.sales_order_id
      left join products p on p.id = soi.product_id
      left join menu_categories mc on mc.id = p.category_id
      where so.organization_id = p_organization_id
        and so.status = 'completed'
        and timezone(p_tz, so.completed_at)::date between p_start_date and p_end_date
      group by p.category_id, mc.name
    ) t
  );
end;
$$;

-- 8. PAYMENT METHODS (split-payment safe: per sales_payments row)
create or replace function public.analytics_payment_methods(
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
begin
  if not is_member_of(p_organization_id) then
    raise exception 'Não autorizado';
  end if;

  return (
    select coalesce(jsonb_agg(
      jsonb_build_object(
        'method', method,
        'count', count,
        'total', total,
        'share_pct', share_pct
      )
      order by total desc
    ), '[]'::jsonb)
    from (
      select sp.method,
             count(*) as count,
             sum(sp.amount) as total,
             round(100.0 * sum(sp.amount) / sum(sum(sp.amount)) over (), 2) as share_pct
      from sales_payments sp
      join sales_orders so on so.id = sp.sales_order_id
      where so.organization_id = p_organization_id
        and so.status = 'completed'
        and sp.status = 'confirmed'
        and timezone(p_tz, so.completed_at)::date between p_start_date and p_end_date
      group by sp.method
    ) t
  );
end;
$$;

-- 9. CUSTOMERS (new vs returning, active, avg ticket, top)
create or replace function public.analytics_customers(
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
  v_new integer;
  v_returning integer;
  v_active integer;
  v_net numeric(14,2);
  v_avg numeric(14,2);
  v_top jsonb;
begin
  if not is_member_of(p_organization_id) then
    raise exception 'Não autorizado';
  end if;

  with period_orders as (
    select customer_id, total
    from sales_orders
    where organization_id = p_organization_id
      and status = 'completed'
      and customer_id is not null
      and timezone(p_tz, completed_at)::date between p_start_date and p_end_date
  ),
  first_order as (
    select customer_id, min(timezone(p_tz, completed_at)::date) as first_day
    from sales_orders
    where organization_id = p_organization_id
      and status = 'completed'
      and customer_id is not null
    group by customer_id
  )
  select
    count(distinct case when fo.first_day between p_start_date and p_end_date then po.customer_id end),
    count(distinct case when fo.first_day < p_start_date then po.customer_id end),
    count(distinct po.customer_id),
    coalesce(sum(po.total), 0)
  into v_new, v_returning, v_active, v_net
  from period_orders po
  join first_order fo on fo.customer_id = po.customer_id;

  v_avg := case when v_active > 0 then v_net / v_active else 0 end;

  select coalesce(jsonb_agg(
    jsonb_build_object('customer_id', customer_id, 'name', name, 'revenue', revenue, 'orders', orders)
    order by revenue desc
  ), '[]'::jsonb)
  into v_top
  from (
    select c.id as customer_id, c.name,
           sum(so.total) as revenue,
           count(*) as orders
    from sales_orders so
    join customers c on c.id = so.customer_id
    where so.organization_id = p_organization_id
      and so.status = 'completed'
      and so.customer_id is not null
      and timezone(p_tz, so.completed_at)::date between p_start_date and p_end_date
    group by c.id, c.name
    order by revenue desc
    limit 10
  ) t;

  return jsonb_build_object(
    'new_customers', v_new,
    'returning_customers', v_returning,
    'active_customers', v_active,
    'avg_ticket_per_customer', v_avg,
    'top_customers', v_top
  );
end;
$$;
