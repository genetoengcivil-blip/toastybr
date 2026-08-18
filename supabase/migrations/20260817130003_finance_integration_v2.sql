-- =============================================================
-- Toasty OS — Finance Integration: Sales + Purchases
-- Migration: 20260817130002_finance_integration.sql
-- =============================================================
-- Replaces finalize_sales_order and cancel_sales_order
-- to integrate with financial_transactions ledger.
-- Preserves ALL original logic from 20260817090006.

-- =============================================================
-- 1. REPLACE finalize_sales_order — add financial transaction
-- =============================================================

create or replace function public.finalize_sales_order(
  p_order_id uuid,
  p_customer_id uuid default null,
  p_coupon_id uuid default null,
  p_coupon_code text default null,
  p_coupon_discount numeric default 0,
  p_discount numeric default 0,
  p_service_fee numeric default 0,
  p_delivery_fee numeric default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_user_role public.org_role;
  v_order record;
  v_item record;
  v_official_price numeric;
  v_item_calculated_subtotal numeric;
  v_new_subtotal numeric := 0;
  v_new_total numeric;
  v_coupon record;
  v_effective_discount numeric := 0;
  v_payments_total numeric := 0;
  v_payment record;
  v_recipe_item record;
  v_ingredient_agg numeric;
  v_balance record;
  v_new_qty numeric;
  v_movement_id uuid;
  v_loyalty_settings record;
  v_points_to_earn integer := 0;
  v_loyalty_account record;
  v_new_points_balance integer;
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  select so.* into v_order
  from public.sales_orders so
  where so.id = p_order_id;

  if v_order is null then
    raise exception 'Pedido não encontrado';
  end if;

  v_org_id := v_order.organization_id;

  select om.role into v_user_role
  from public.organization_members om
  where om.organization_id = v_org_id
    and om.user_id = auth.uid();

  if v_user_role is null then
    raise exception 'Sem acesso a esta organização';
  end if;

  if v_user_role not in ('owner', 'admin', 'manager', 'staff') then
    raise exception 'Sem permissão para finalizar pedido';
  end if;

  if v_order.status <> 'open' then
    raise exception 'Pedido não está aberto. Status atual: %', v_order.status;
  end if;

  for v_item in
    select soi.*, p.price as official_price
    from public.sales_order_items soi
    left join public.products p on p.id = soi.product_id
    where soi.sales_order_id = p_order_id
      and soi.organization_id = v_org_id
  loop
    v_official_price := coalesce(v_item.official_price, v_item.unit_price);
    v_item_calculated_subtotal := v_item.quantity * v_official_price;
    v_new_subtotal := v_new_subtotal + v_item_calculated_subtotal;
  end loop;

  if v_new_subtotal = 0 then
    raise exception 'Pedido sem itens';
  end if;

  if p_coupon_id is not null then
    select c.* into v_coupon
    from public.coupons c
    where c.id = p_coupon_id
      and c.organization_id = v_org_id
    for update;

    if v_coupon is null then
      raise exception 'Cupom não encontrado';
    end if;

    if not v_coupon.is_active then
      raise exception 'Cupom inativo';
    end if;

    if v_coupon.starts_at is not null and v_coupon.starts_at > now() then
      raise exception 'Cupom ainda não está ativo';
    end if;

    if v_coupon.expires_at is not null and v_coupon.expires_at < now() then
      raise exception 'Cupom expirado';
    end if;

    if v_coupon.max_uses is not null and v_coupon.current_uses >= v_coupon.max_uses then
      raise exception 'Cupom atingiu limite de uso';
    end if;

    if v_new_subtotal < v_coupon.min_order then
      raise exception 'Pedido abaixo do valor mínimo. Mínimo: R$ %', v_coupon.min_order;
    end if;

    if v_coupon.type = 'percentage' then
      v_effective_discount := round(v_new_subtotal * v_coupon.value / 100, 2);
    else
      v_effective_discount := v_coupon.value;
    end if;

    if v_effective_discount > v_new_subtotal then
      v_effective_discount := v_new_subtotal;
    end if;

    update public.coupons
    set current_uses = current_uses + 1,
        updated_at = now()
    where id = p_coupon_id;
  end if;

  select coalesce(sum(sp.amount), 0) into v_payments_total
  from public.sales_payments sp
  where sp.sales_order_id = p_order_id
    and sp.status = 'confirmed';

  v_new_total := v_new_subtotal - v_effective_discount + p_service_fee + p_delivery_fee;

  if v_new_total < 0 then
    v_new_total := 0;
  end if;

  if v_payments_total < v_new_total then
    raise exception 'Pagamento insuficiente. Total: R$ %, Pago: R$ %', v_new_total, v_payments_total;
  end if;

  create temp table if not exists tmp_ingredient_consumption (
    ingredient_id uuid primary key,
    total_consumption numeric not null
  ) on commit drop;

  truncate tmp_ingredient_consumption;

  for v_item in
    select soi.product_id, soi.quantity as sold_qty
    from public.sales_order_items soi
    where soi.sales_order_id = p_order_id
      and soi.organization_id = v_org_id
      and soi.product_id is not null
  loop
    for v_recipe_item in
      select pri.ingredient_id, pri.quantity as recipe_qty
      from public.product_recipe_items pri
      where pri.product_id = v_item.product_id
        and pri.organization_id = v_org_id
    loop
      v_ingredient_agg := v_item.sold_qty * v_recipe_item.recipe_qty;

      insert into tmp_ingredient_consumption (ingredient_id, total_consumption)
      values (v_recipe_item.ingredient_id, v_ingredient_agg)
      on conflict (ingredient_id)
      do update set total_consumption = tmp_ingredient_consumption.total_consumption + excluded.total_consumption;
    end loop;
  end loop;

  for v_balance in
    select ib.id, ib.ingredient_id, ib.quantity,
           tc.total_consumption
    from tmp_ingredient_consumption tc
    join public.inventory_balances ib
      on ib.ingredient_id = tc.ingredient_id
      and ib.organization_id = v_org_id
    order by tc.ingredient_id
  loop
    if v_balance.quantity < v_balance.total_consumption then
      raise exception 'Estoque insuficiente para ingrediente. Disponível: %, Necessário: %',
        v_balance.quantity, v_balance.total_consumption;
    end if;

    v_new_qty := v_balance.quantity - v_balance.total_consumption;

    update public.inventory_balances
    set quantity = v_new_qty,
        updated_at = now()
    where id = v_balance.id;

    insert into public.inventory_movements (
      organization_id, ingredient_id, type, quantity,
      previous_quantity, new_quantity,
      reason, reference_type, reference_id, created_by
    ) values (
      v_org_id, v_balance.ingredient_id, 'exit', v_balance.total_consumption,
      v_balance.quantity, v_new_qty,
      'Venda ' || v_order.order_number,
      'sales_order', p_order_id, auth.uid()
    )
    returning id into v_movement_id;
  end loop;

  if p_coupon_id is not null then
    insert into public.coupon_redemptions (
      organization_id, coupon_id, customer_id, sales_order_id, discount_amount
    ) values (
      v_org_id, p_coupon_id, p_customer_id, p_order_id, v_effective_discount
    );
  end if;

  if p_customer_id is not null then
    update public.customers
    set total_orders = total_orders + 1,
        total_spent = total_spent + v_new_total,
        last_order_at = now(),
        updated_at = now()
    where id = p_customer_id
      and organization_id = v_org_id;
  end if;

  if p_customer_id is not null then
    select ls.* into v_loyalty_settings
    from public.loyalty_settings ls
    where ls.organization_id = v_org_id
      and ls.is_active = true;

    if v_loyalty_settings is not null and v_loyalty_settings.points_per_real > 0 then
      if not exists (
        select 1 from public.loyalty_transactions lt
        where lt.organization_id = v_org_id
          and lt.customer_id = p_customer_id
          and lt.reference_type = 'sales_order'
          and lt.reference_id = p_order_id
          and lt.type = 'earn'
      ) then
        v_points_to_earn := floor(v_new_total * v_loyalty_settings.points_per_real)::integer;

        if v_points_to_earn > 0 then
          select la.id, la.points_balance into v_loyalty_account
          from public.loyalty_accounts la
          where la.organization_id = v_org_id
            and la.customer_id = p_customer_id
          for update;

          if v_loyalty_account is null then
            insert into public.loyalty_accounts (organization_id, customer_id, points_balance, lifetime_points)
            values (v_org_id, p_customer_id, 0, 0)
            returning id, points_balance into v_loyalty_account;
          end if;

          v_new_points_balance := v_loyalty_account.points_balance + v_points_to_earn;

          update public.loyalty_accounts
          set points_balance = v_new_points_balance,
              lifetime_points = lifetime_points + v_points_to_earn,
              updated_at = now()
          where id = v_loyalty_account.id;

          insert into public.loyalty_transactions (
            organization_id, customer_id, loyalty_account_id,
            type, points, balance_before, balance_after,
            reference_type, reference_id, description, created_by
          ) values (
            v_org_id, p_customer_id, v_loyalty_account.id,
            'earn', v_points_to_earn, v_loyalty_account.points_balance, v_new_points_balance,
            'sales_order', p_order_id, 'Pontos da venda ' || v_order.order_number, auth.uid()
          );
        end if;
      end if;
    end if;
  end if;

  update public.sales_orders
  set status = 'completed',
      subtotal = v_new_subtotal,
      discount = p_discount,
      service_fee = p_service_fee,
      delivery_fee = p_delivery_fee,
      total = v_new_total,
      coupon_id = p_coupon_id,
      coupon_code = p_coupon_code,
      coupon_discount = v_effective_discount,
      customer_id = p_customer_id,
      confirmed_at = coalesce(confirmed_at, now()),
      completed_at = now(),
      closed_by = auth.uid(),
      updated_at = now()
  where id = p_order_id
    and organization_id = v_org_id;

  -- ====== FINANCE INTEGRATION ======
  insert into public.financial_transactions (
    organization_id, type, direction, amount, category_id, cost_center_id,
    reference_type, reference_id, description, occurred_at, created_by
  ) values (
    v_org_id, 'sale', 'in', v_new_total,
    null, null,
    'sales_order', p_order_id,
    'Venda #' || v_order.order_number,
    now(), auth.uid()
  );

  v_result := jsonb_build_object(
    'order_id', p_order_id,
    'order_number', v_order.order_number,
    'subtotal', v_new_subtotal,
    'discount', v_effective_discount,
    'total', v_new_total,
    'payments_total', v_payments_total,
    'change', v_payments_total - v_new_total,
    'points_earned', v_points_to_earn
  );

  return v_result;
end;
$$;

-- =============================================================
-- 2. REPLACE cancel_sales_order — add reversal if finalized
-- =============================================================

create or replace function public.cancel_sales_order(
  p_order_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_user_role public.org_role;
  v_order record;
  v_movement record;
  v_reversal_movement_id uuid;
  v_redemption record;
  v_loyalty_tx record;
  v_ft record;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  select so.* into v_order
  from public.sales_orders so
  where so.id = p_order_id;

  if v_order is null then
    raise exception 'Pedido não encontrado';
  end if;

  v_org_id := v_order.organization_id;

  select om.role into v_user_role
  from public.organization_members om
  where om.organization_id = v_org_id
    and om.user_id = auth.uid();

  if v_user_role is null then
    raise exception 'Sem acesso a esta organização';
  end if;

  if v_user_role not in ('owner', 'admin', 'manager', 'staff') then
    raise exception 'Sem permissão para cancelar pedido';
  end if;

  if v_order.status in ('completed', 'cancelled') then
    raise exception 'Pedido já % — não pode cancelar', v_order.status;
  end if;

  if v_order.status in ('confirmed', 'preparing', 'ready') then
    for v_movement in
      select im.*
      from public.inventory_movements im
      where im.reference_type = 'sales_order'
        and im.reference_id = p_order_id
        and im.organization_id = v_org_id
        and im.type = 'exit'
    loop
      insert into public.inventory_movements (
        organization_id, ingredient_id, type, quantity,
        previous_quantity, new_quantity,
        reason, reference_type, reference_id, created_by
      ) values (
        v_org_id, v_movement.ingredient_id, 'entry', v_movement.quantity,
        v_movement.new_quantity,
        v_movement.previous_quantity,
        'Cancelamento ' || v_order.order_number || coalesce(' - ' || p_reason, ''),
        'sales_order_cancellation', p_order_id, auth.uid()
      )
      returning id into v_reversal_movement_id;

      update public.inventory_balances
      set quantity = quantity + v_movement.quantity,
          updated_at = now()
      where organization_id = v_org_id
        and ingredient_id = v_movement.ingredient_id;
    end loop;
  end if;

  for v_loyalty_tx in
    select lt.*
    from public.loyalty_transactions lt
    where lt.organization_id = v_org_id
      and lt.customer_id = v_order.customer_id
      and lt.reference_type = 'sales_order'
      and lt.reference_id = p_order_id
      and lt.type = 'earn'
  loop
    perform public.apply_loyalty_transaction(
      v_loyalty_tx.customer_id,
      'reversal',
      v_loyalty_tx.points,
      'sales_order_cancellation',
      p_order_id,
      'Reversão do cancelamento ' || v_order.order_number
    );
  end loop;

  for v_redemption in
    select cr.*
    from public.coupon_redemptions cr
    where cr.sales_order_id = p_order_id
      and cr.organization_id = v_org_id
      and cr.reversed_at is null
  loop
    update public.coupon_redemptions
    set reversed_at = now()
    where id = v_redemption.id;

    update public.coupons
    set current_uses = greatest(current_uses - 1, 0),
        updated_at = now()
    where id = v_redemption.coupon_id
      and organization_id = v_org_id;
  end loop;

  if v_order.customer_id is not null then
    update public.customers
    set total_orders = greatest(total_orders - 1, 0),
        total_spent = greatest(total_spent - v_order.total, 0),
        last_order_at = (
          select max(so.completed_at)
          from public.sales_orders so
          where so.customer_id = v_order.customer_id
            and so.organization_id = v_org_id
            and so.status = 'completed'
            and so.id <> p_order_id
        ),
        updated_at = now()
    where id = v_order.customer_id
      and organization_id = v_org_id;
  end if;

  update public.sales_orders
  set status = 'cancelled',
      cancelled_at = now(),
      closed_by = auth.uid(),
      notes = case when p_reason is not null
        then coalesce(notes || E'\n', '') || 'Cancelamento: ' || p_reason
        else notes
      end,
      updated_at = now()
  where id = p_order_id
    and organization_id = v_org_id;

  -- ====== FINANCE INTEGRATION ======
  -- Create reversal for any financial transactions tied to this order
  for v_ft in
    select id, amount, description
    from public.financial_transactions
    where reference_type = 'sales_order'
      and reference_id = p_order_id
      and type = 'sale'
  loop
    insert into public.financial_transactions (
      organization_id, type, direction, amount, category_id, cost_center_id,
      reference_type, reference_id, description, occurred_at, created_by
    ) values (
      v_org_id, 'reversal', 'out', v_ft.amount,
      v_ft.category_id, v_ft.cost_center_id,
      'sales_order', p_order_id,
      'Estorno: ' || v_ft.description,
      now(), auth.uid()
    );
  end loop;
end;
$$;
