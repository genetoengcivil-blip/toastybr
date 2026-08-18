-- =============================================================
-- Toasty OS — Analytics RPCs: Sales (Phase 15)
-- Migration: 20260819000000_analytics_sales.sql
-- =============================================================
-- Server-side aggregation. Each RPC is SECURITY DEFINER, SET search_path
-- = public, and validates tenant membership via is_member_of. The
-- organization_id is validated, never trusted blindly. Bucketing is
-- timezone-aware using the organization timezone (p_tz).

-- 1. DASHBOARD (today vs yesterday KPIs)
create or replace function public.analytics_dashboard(
  p_organization_id uuid,
  p_tz text default 'America/Sao_Paulo'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := timezone(p_tz, now())::date;
  v_yesterday date := v_today - 1;
  v_sales_today numeric(14,2);
  v_orders_today integer;
  v_cust_today integer;
  v_sales_yesterday numeric(14,2);
  v_orders_yesterday integer;
begin
  if not is_member_of(p_organization_id) then
    raise exception 'Não autorizado';
  end if;

  select coalesce(sum(total), 0), count(*)
    into v_sales_today, v_orders_today
  from sales_orders
  where organization_id = p_organization_id
    and status = 'completed'
    and timezone(p_tz, completed_at)::date = v_today;

  select count(distinct customer_id)
    into v_cust_today
  from sales_orders
  where organization_id = p_organization_id
    and status = 'completed'
    and customer_id is not null
    and timezone(p_tz, completed_at)::date = v_today;

  select coalesce(sum(total), 0), count(*)
    into v_sales_yesterday, v_orders_yesterday
  from sales_orders
  where organization_id = p_organization_id
    and status = 'completed'
    and timezone(p_tz, completed_at)::date = v_yesterday;

  return jsonb_build_object(
    'sales_today', v_sales_today,
    'orders_today', v_orders_today,
    'avg_ticket_today', case when v_orders_today > 0 then v_sales_today / v_orders_today else 0 end,
    'customers_served_today', v_cust_today,
    'sales_yesterday', v_sales_yesterday,
    'orders_yesterday', v_orders_yesterday,
    'avg_ticket_yesterday', case when v_orders_yesterday > 0 then v_sales_yesterday / v_orders_yesterday else 0 end
  );
end;
$$;

-- 2. SALES SUMMARY (current vs previous period of equal duration)
create or replace function public.analytics_sales_summary(
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
  v_duration integer := p_end_date - p_start_date;
  v_prev_end date := p_start_date - 1;
  v_prev_start date := v_prev_end - v_duration;
  v_cur_gross numeric(14,2); v_cur_disc numeric(14,2); v_cur_net numeric(14,2); v_cur_orders integer; v_cur_items numeric; v_cur_avg numeric(14,2);
  v_prev_gross numeric(14,2); v_prev_disc numeric(14,2); v_prev_net numeric(14,2); v_prev_orders integer; v_prev_items numeric; v_prev_avg numeric(14,2);
begin
  if not is_member_of(p_organization_id) then
    raise exception 'Não autorizado';
  end if;

  select coalesce(sum(subtotal),0), coalesce(sum(discount),0), coalesce(sum(total),0), count(*)
    into v_cur_gross, v_cur_disc, v_cur_net, v_cur_orders
  from sales_orders
  where organization_id = p_organization_id and status = 'completed'
    and timezone(p_tz, completed_at)::date between p_start_date and p_end_date;

  select coalesce(sum(soi.quantity),0)
    into v_cur_items
  from sales_order_items soi
  join sales_orders so on so.id = soi.sales_order_id
  where so.organization_id = p_organization_id and so.status = 'completed'
    and timezone(p_tz, so.completed_at)::date between p_start_date and p_end_date;

  select coalesce(sum(subtotal),0), coalesce(sum(discount),0), coalesce(sum(total),0), count(*)
    into v_prev_gross, v_prev_disc, v_prev_net, v_prev_orders
  from sales_orders
  where organization_id = p_organization_id and status = 'completed'
    and timezone(p_tz, completed_at)::date between v_prev_start and v_prev_end;

  select coalesce(sum(soi.quantity),0)
    into v_prev_items
  from sales_order_items soi
  join sales_orders so on so.id = soi.sales_order_id
  where so.organization_id = p_organization_id and so.status = 'completed'
    and timezone(p_tz, so.completed_at)::date between v_prev_start and v_prev_end;

  v_cur_avg := case when v_cur_orders > 0 then v_cur_net / v_cur_orders else 0 end;
  v_prev_avg := case when v_prev_orders > 0 then v_prev_net / v_prev_orders else 0 end;

  return jsonb_build_object(
    'gross_revenue', v_cur_gross, 'discounts', v_cur_disc, 'net_revenue', v_cur_net,
    'orders', v_cur_orders, 'avg_ticket', v_cur_avg, 'items_sold', v_cur_items,
    'prev_gross_revenue', v_prev_gross, 'prev_discounts', v_prev_disc, 'prev_net_revenue', v_prev_net,
    'prev_orders', v_prev_orders, 'prev_avg_ticket', v_prev_avg, 'prev_items_sold', v_prev_items
  );
end;
$$;

-- 3. SALES TREND (revenue + orders by day/week/month)
create or replace function public.analytics_sales_trend(
  p_organization_id uuid,
  p_start_date date,
  p_end_date date,
  p_tz text default 'America/Sao_Paulo',
  p_interval text default 'day'
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
      jsonb_build_object('bucket', bucket, 'revenue', coalesce(revenue,0), 'orders', coalesce(orders,0))
      order by bucket
    ), '[]'::jsonb)
    from (
      select to_char(date_trunc(p_interval, timezone(p_tz, completed_at)), 'YYYY-MM-DD') as bucket,
             sum(total) as revenue,
             count(*) as orders
      from sales_orders
      where organization_id = p_organization_id and status = 'completed'
        and timezone(p_tz, completed_at)::date between p_start_date and p_end_date
      group by 1
    ) t
  );
end;
$$;

-- 4. SALES HOURLY
create or replace function public.analytics_sales_hourly(
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
      jsonb_build_object('hour', hour, 'revenue', coalesce(revenue,0), 'orders', coalesce(orders,0))
      order by hour
    ), '[]'::jsonb)
    from (
      select extract(hour from timezone(p_tz, completed_at))::int as hour,
             sum(total) as revenue,
             count(*) as orders
      from sales_orders
      where organization_id = p_organization_id and status = 'completed'
        and timezone(p_tz, completed_at)::date between p_start_date and p_end_date
      group by 1
    ) t
  );
end;
$$;

-- 5. SALES WEEKDAY (0=Sunday..6=Saturday)
create or replace function public.analytics_sales_weekday(
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
      jsonb_build_object('dow', dow, 'revenue', coalesce(revenue,0), 'orders', coalesce(orders,0))
      order by dow
    ), '[]'::jsonb)
    from (
      select extract(dow from timezone(p_tz, completed_at))::int as dow,
             sum(total) as revenue,
             count(*) as orders
      from sales_orders
      where organization_id = p_organization_id and status = 'completed'
        and timezone(p_tz, completed_at)::date between p_start_date and p_end_date
      group by 1
    ) t
  );
end;
$$;
