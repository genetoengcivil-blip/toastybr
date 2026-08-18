-- =============================================================
-- Toasty OS — Finance Integration: Purchase Orders
-- Migration: 20260817130004_finance_purchase_integration.sql (v2)
-- =============================================================
-- Replaces receive_purchase_order to also create accounts_payable
-- entries. Idempotent: one PO = one AP entry.
-- Preserves ALL original logic from 20260817090004.

create or replace function public.receive_purchase_order(
  p_po_id uuid,
  p_items jsonb,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_user_role public.org_role;
  v_po record;
  v_item jsonb;
  v_po_item record;
  v_receipt_id uuid;
  v_total_received numeric;
  v_new_status text;
  v_received_now numeric := 0;
  v_ap_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  select * into v_po
  from public.purchase_orders
  where id = p_po_id
  for update;

  if v_po is null then
    raise exception 'Pedido de compra não encontrado';
  end if;

  v_org_id := v_po.organization_id;

  select om.role into v_user_role
  from public.organization_members om
  where om.organization_id = v_org_id
    and om.user_id = auth.uid();

  if v_user_role is null then
    raise exception 'Sem acesso a esta organização';
  end if;

  if v_user_role not in ('owner', 'admin', 'manager') then
    raise exception 'Sem permissão para receber pedidos';
  end if;

  if v_po.status not in ('draft', 'sent', 'partially_received') then
    raise exception 'Não é possível receber pedido com status: %', v_po.status;
  end if;

  insert into public.purchase_receipts (organization_id, po_id, notes, created_by)
  values (v_org_id, p_po_id, p_notes, auth.uid())
  returning id into v_receipt_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_po_item := null;

    select * into v_po_item
    from public.purchase_order_items
    where id = (v_item->>'po_item_id')::uuid
      and organization_id = v_org_id
    for update;

    if v_po_item is null then
      raise exception 'Item do pedido não encontrado: %', v_item->>'po_item_id';
    end if;

    if (v_item->>'quantity')::numeric <= 0 then
      raise exception 'Quantidade recebida deve ser maior que zero';
    end if;

    v_total_received := v_po_item.quantity_received + (v_item->>'quantity')::numeric;

    if v_total_received > v_po_item.quantity_ordered then
      raise exception 'Quantidade recebida (%) excede a solicitada (%) para ingrediente %',
        v_total_received, v_po_item.quantity_ordered, v_po_item.ingredient_id;
    end if;

    insert into public.purchase_receipt_items (organization_id, receipt_id, po_item_id, quantity)
    values (v_org_id, v_receipt_id, v_po_item.id, (v_item->>'quantity')::numeric);

    update public.purchase_order_items
    set quantity_received = v_total_received,
        updated_at = now()
    where id = v_po_item.id;

    insert into public.inventory_balances (organization_id, ingredient_id, quantity)
    values (v_org_id, v_po_item.ingredient_id, 0)
    on conflict (organization_id, ingredient_id) do nothing;

    declare
      v_balance_id uuid;
      v_current_qty numeric;
      v_new_qty numeric;
      v_prev_qty numeric;
    begin
      select ib.id, ib.quantity into v_balance_id, v_current_qty
      from public.inventory_balances ib
      where ib.organization_id = v_org_id
        and ib.ingredient_id = v_po_item.ingredient_id
      for update;

      v_prev_qty := v_current_qty;
      v_new_qty := v_current_qty + (v_item->>'quantity')::numeric;

      update public.inventory_balances
      set quantity = v_new_qty,
          updated_at = now()
      where id = v_balance_id;

      insert into public.inventory_movements (
        organization_id, ingredient_id, type, quantity,
        previous_quantity, new_quantity, reason, reference_type, reference_id, created_by
      ) values (
        v_org_id, v_po_item.ingredient_id, 'entry', (v_item->>'quantity')::numeric,
        v_prev_qty, v_new_qty, 'Recebimento de compra ' || v_po.po_number,
        'purchase_order', p_po_id, auth.uid()
      );
    end;

    update public.ingredients
    set cost_per_unit = v_po_item.unit_cost,
        updated_at = now()
    where id = v_po_item.ingredient_id
      and organization_id = v_org_id;

    v_received_now := v_received_now + (v_item->>'quantity')::numeric * v_po_item.unit_cost;
  end loop;

  declare
    v_subtotal numeric;
  begin
    select coalesce(sum(quantity_ordered * unit_cost), 0) into v_subtotal
    from public.purchase_order_items
    where po_id = p_po_id;

    update public.purchase_orders
    set total = v_subtotal - coalesce(v_po.discount, 0) + coalesce(v_po.shipping, 0),
        updated_at = now()
    where id = p_po_id;
  end;

  declare
    v_any_ordered boolean;
    v_all_received boolean;
  begin
    select exists(select 1 from public.purchase_order_items where po_id = p_po_id)
      and (select count(*) from public.purchase_order_items where po_id = p_po_id) > 0
    into v_any_ordered;

    select coalesce(
      (select bool_and(quantity_received >= quantity_ordered)
       from public.purchase_order_items where po_id = p_po_id), false
    ) into v_all_received;

    if v_all_received then
      v_new_status := 'received';
    elsif v_any_ordered then
      v_new_status := 'partially_received';
    else
      v_new_status := v_po.status;
    end if;

    update public.purchase_orders
    set status = v_new_status,
        updated_at = now()
    where id = p_po_id;
  end;

  -- ====== FINANCE INTEGRATION ======
  -- Calculate TOTAL value received across ALL receipts for this PO
  declare
    v_total_po_value numeric;
    v_total_received_value numeric;
  begin
    select coalesce(sum(pri.quantity * poi.unit_cost), 0)
    into v_total_received_value
    from public.purchase_receipt_items pri
    join public.purchase_order_items poi on poi.id = pri.po_item_id
    where poi.po_id = p_po_id
      and poi.organization_id = v_org_id;

    select coalesce(sum(quantity_ordered * unit_cost), 0)
    into v_total_po_value
    from public.purchase_order_items
    where po_id = p_po_id
      and organization_id = v_org_id;

    -- Check if AP already exists for this PO (idempotent)
    select id into v_ap_id
    from public.accounts_payable
    where purchase_order_id = p_po_id
      and organization_id = v_org_id
    limit 1;

    if v_ap_id is not null then
      -- Update existing AP
      update public.accounts_payable
      set paid_amount = v_total_received_value,
          status = case
            when v_total_received_value >= v_total_po_value then 'paid'
            when v_total_received_value > 0 then 'partially_paid'
            else status
          end,
          paid_at = case
            when v_total_received_value >= v_total_po_value then now()
            else paid_at
          end,
          updated_at = now()
      where id = v_ap_id;
    else
      -- Create new AP
      insert into public.accounts_payable (
        organization_id, description, amount, paid_amount,
        due_date, supplier_id, status,
        purchase_order_id, created_by
      ) values (
        v_org_id,
        'Compra #' || v_po.po_number,
        v_total_received_value,
        0,
        (current_date + interval '30 days')::date,
        v_po.supplier_id,
        'pending',
        p_po_id,
        auth.uid()
      )
      returning id into v_ap_id;
    end if;
  end;

  return v_receipt_id;
end;
$$;
