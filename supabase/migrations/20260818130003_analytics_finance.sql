-- =============================================================
-- Toasty OS — Analytics RPCs: Finance (Phase 15)
-- Migration: 20260819000003_analytics_finance.sql
-- =============================================================

-- 14. CASH FLOW (income / expense / net by interval)
create or replace function public.analytics_cash_flow(
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
      jsonb_build_object(
        'bucket', bucket,
        'income', coalesce(income,0),
        'expense', coalesce(expense,0),
        'net', coalesce(income,0) - coalesce(expense,0)
      )
      order by bucket
    ), '[]'::jsonb)
    from (
      select to_char(date_trunc(p_interval, timezone(p_tz, occurred_at)), 'YYYY-MM-DD') as bucket,
             sum(case when direction = 'in' then amount else 0 end) as income,
             sum(case when direction = 'out' then amount else 0 end) as expense
      from financial_transactions
      where organization_id = p_organization_id
        and occurred_at::date between p_start_date and p_end_date
      group by 1
    ) t
  );
end;
$$;

-- 15. AP AGING (open payables by bucket)
create or replace function public.analytics_ap_aging(
  p_organization_id uuid,
  p_asof date default current_date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current numeric(14,2);
  v_d1_7 numeric(14,2);
  v_d8_30 numeric(14,2);
  v_d31 numeric(14,2);
begin
  if not is_member_of(p_organization_id) then
    raise exception 'Não autorizado';
  end if;

  select
    coalesce(sum(case when due_date >= p_asof then amount - paid_amount else 0 end), 0),
    coalesce(sum(case when due_date < p_asof and due_date >= p_asof - 7 then amount - paid_amount else 0 end), 0),
    coalesce(sum(case when due_date < p_asof - 7 and due_date >= p_asof - 30 then amount - paid_amount else 0 end), 0),
    coalesce(sum(case when due_date < p_asof - 30 then amount - paid_amount else 0 end), 0)
  into v_current, v_d1_7, v_d8_30, v_d31
  from accounts_payable
  where organization_id = p_organization_id
    and status in ('pending', 'partially_paid');

  return jsonb_build_object(
    'current', v_current,
    'd1_7', v_d1_7,
    'd8_30', v_d8_30,
    'd31plus', v_d31
  );
end;
$$;

-- 16. AR AGING (open receivables by bucket)
create or replace function public.analytics_ar_aging(
  p_organization_id uuid,
  p_asof date default current_date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current numeric(14,2);
  v_d1_7 numeric(14,2);
  v_d8_30 numeric(14,2);
  v_d31 numeric(14,2);
begin
  if not is_member_of(p_organization_id) then
    raise exception 'Não autorizado';
  end if;

  select
    coalesce(sum(case when due_date >= p_asof then amount - received_amount else 0 end), 0),
    coalesce(sum(case when due_date < p_asof and due_date >= p_asof - 7 then amount - received_amount else 0 end), 0),
    coalesce(sum(case when due_date < p_asof - 7 and due_date >= p_asof - 30 then amount - received_amount else 0 end), 0),
    coalesce(sum(case when due_date < p_asof - 30 then amount - received_amount else 0 end), 0)
  into v_current, v_d1_7, v_d8_30, v_d31
  from accounts_receivable
  where organization_id = p_organization_id
    and status in ('pending', 'partially_received');

  return jsonb_build_object(
    'current', v_current,
    'd1_7', v_d1_7,
    'd8_30', v_d8_30,
    'd31plus', v_d31
  );
end;
$$;
