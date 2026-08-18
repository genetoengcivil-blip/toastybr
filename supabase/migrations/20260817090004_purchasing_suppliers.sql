-- =============================================================
-- Toasty OS — Purchasing + Suppliers + Auto Stock Entry
-- Migration: 20260817090004_purchasing_suppliers.sql
-- =============================================================

-- =============================================================
-- 1. SUPPLIERS
-- =============================================================
create table if not exists public.suppliers (
  id           uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name         text not null,
  contact_name text,
  phone        text,
  email        text,
  cnpj         text,
  notes        text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint uq_suppliers_org_id unique (organization_id, id)
);

create unique index idx_suppliers_org_name
  on public.suppliers (organization_id, name);

alter table public.suppliers enable row level security;

create policy "suppliers_select_member"
  on public.suppliers for select
  using (public.is_member_of(organization_id));

create policy "suppliers_insert_owner_admin_manager"
  on public.suppliers for insert
  with check (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create policy "suppliers_update_owner_admin_manager"
  on public.suppliers for update
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create policy "suppliers_delete_owner_admin_manager"
  on public.suppliers for delete
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create trigger suppliers_updated_at
  before update on public.suppliers
  for each row
  execute function public.update_updated_at();

-- =============================================================
-- 2. PURCHASE ORDERS
-- =============================================================
create table if not exists public.purchase_orders (
  id             uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  supplier_id    uuid,
  po_number      text not null,
  status         text not null default 'draft'
                   check (status in ('draft','sent','partially_received','received','cancelled')),
  discount       numeric(12,2) not null default 0,
  shipping       numeric(12,2) not null default 0,
  notes          text,
  total          numeric(12,2) not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint uq_purchase_orders_org_id unique (organization_id, id)
);

-- Cross-tenant composite FK: supplier must belong to same org
alter table public.purchase_orders
  add constraint fk_po_supplier_tenant
  foreign key (supplier_id, organization_id)
  references public.suppliers(id, organization_id)
  on delete set null;

create unique index idx_purchase_orders_org_number
  on public.purchase_orders (organization_id, po_number);

alter table public.purchase_orders enable row level security;

create policy "purchase_orders_select_member"
  on public.purchase_orders for select
  using (public.is_member_of(organization_id));

create policy "purchase_orders_insert_owner_admin_manager"
  on public.purchase_orders for insert
  with check (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create policy "purchase_orders_update_owner_admin_manager"
  on public.purchase_orders for update
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create policy "purchase_orders_delete_owner_admin_manager"
  on public.purchase_orders for delete
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create trigger purchase_orders_updated_at
  before update on public.purchase_orders
  for each row
  execute function public.update_updated_at();

-- =============================================================
-- 3. PURCHASE ORDER ITEMS
-- =============================================================
create table if not exists public.purchase_order_items (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  po_id             uuid not null,
  ingredient_id     uuid not null,
  quantity_ordered  numeric(14,4) not null check (quantity_ordered > 0),
  quantity_received numeric(14,4) not null default 0 check (quantity_received >= 0),
  unit_cost         numeric(14,4) not null check (unit_cost >= 0),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint uq_purchase_order_items_org_id unique (organization_id, id),

  constraint purchase_order_items_received_lte_ordered_check
    check (quantity_received <= quantity_ordered)
);

-- Cross-tenant composite FKs
alter table public.purchase_order_items
  add constraint fk_poi_po_tenant
  foreign key (po_id, organization_id)
  references public.purchase_orders(id, organization_id)
  on delete cascade;

alter table public.purchase_order_items
  add constraint fk_poi_ingredient_tenant
  foreign key (ingredient_id, organization_id)
  references public.ingredients(id, organization_id)
  on delete restrict;

alter table public.purchase_order_items enable row level security;

create policy "purchase_order_items_select_member"
  on public.purchase_order_items for select
  using (public.is_member_of(organization_id));

create policy "purchase_order_items_insert_owner_admin_manager"
  on public.purchase_order_items for insert
  with check (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create policy "purchase_order_items_update_owner_admin_manager"
  on public.purchase_order_items for update
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create policy "purchase_order_items_delete_owner_admin_manager"
  on public.purchase_order_items for delete
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create trigger purchase_order_items_updated_at
  before update on public.purchase_order_items
  for each row
  execute function public.update_updated_at();

-- =============================================================
-- 4. PURCHASE RECEIPTS
-- =============================================================
create table if not exists public.purchase_receipts (
  id             uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  po_id          uuid not null,
  received_at    timestamptz not null default now(),
  notes          text,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),

  constraint uq_purchase_receipts_org_id unique (organization_id, id)
);

-- Cross-tenant composite FK
alter table public.purchase_receipts
  add constraint fk_receipt_po_tenant
  foreign key (po_id, organization_id)
  references public.purchase_orders(id, organization_id)
  on delete cascade;

alter table public.purchase_receipts enable row level security;

create policy "purchase_receipts_select_member"
  on public.purchase_receipts for select
  using (public.is_member_of(organization_id));

create policy "purchase_receipts_insert_owner_admin_manager"
  on public.purchase_receipts for insert
  with check (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

-- Immutable: no UPDATE/DELETE policies

-- =============================================================
-- 5. PURCHASE RECEIPT ITEMS
-- =============================================================
create table if not exists public.purchase_receipt_items (
  id             uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  receipt_id     uuid not null,
  po_item_id     uuid not null,
  quantity       numeric(14,4) not null check (quantity > 0),
  created_at     timestamptz not null default now()
);

-- Cross-tenant composite FKs
alter table public.purchase_receipt_items
  add constraint fk_receipt_item_receipt_tenant
  foreign key (receipt_id, organization_id)
  references public.purchase_receipts(id, organization_id)
  on delete cascade;

alter table public.purchase_receipt_items
  add constraint fk_receipt_item_po_item_tenant
  foreign key (po_item_id, organization_id)
  references public.purchase_order_items(id, organization_id)
  on delete cascade;

alter table public.purchase_receipt_items enable row level security;

create policy "purchase_receipt_items_select_member"
  on public.purchase_receipt_items for select
  using (public.is_member_of(organization_id));

create policy "purchase_receipt_items_insert_owner_admin_manager"
  on public.purchase_receipt_items for insert
  with check (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

-- Immutable: no UPDATE/DELETE policies

-- =============================================================
-- 6. RPC: generate_po_number
-- =============================================================
create or replace function public.generate_po_number(p_org_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max_num integer;
  v_next_num integer;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  if not public.is_member_of(p_org_id) then
    raise exception 'Sem acesso a esta organização';
  end if;

  select coalesce(
    max(substring(po_number from 4)::integer), 0
  ) into v_max_num
  from public.purchase_orders
  where organization_id = p_org_id
    and po_number ~ '^PO-[0-9]+$';

  v_next_num := v_max_num + 1;
  return 'PO-' || lpad(v_next_num::text, 6, '0');
end;
$$;

-- =============================================================
-- 7. RPC: receive_purchase_order
-- =============================================================
-- SECURITY DEFINER: bypasses RLS for balance writes
-- Validates: auth.uid(), membership, role
-- Atomic: updates quantities, status, receipts, and stock
-- Blocks receiving more than ordered
-- Updates ingredient cost_per_unit from unit_cost
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
begin
  -- 1. Validate authenticated user
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  -- 2. Load purchase order
  select * into v_po
  from public.purchase_orders
  where id = p_po_id
  for update;

  if v_po is null then
    raise exception 'Pedido de compra não encontrado';
  end if;

  v_org_id := v_po.organization_id;

  -- 3. Validate membership and role
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

  -- 4. Validate status
  if v_po.status not in ('draft', 'sent', 'partially_received') then
    raise exception 'Não é possível receber pedido com status: %', v_po.status;
  end if;

  -- 5. Create receipt
  insert into public.purchase_receipts (organization_id, po_id, notes, created_by)
  values (v_org_id, p_po_id, p_notes, auth.uid())
  returning id into v_receipt_id;

  -- 6. Process each item
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_po_item := null;

    -- Load and lock the PO item
    select * into v_po_item
    from public.purchase_order_items
    where id = (v_item->>'po_item_id')::uuid
      and organization_id = v_org_id
    for update;

    if v_po_item is null then
      raise exception 'Item do pedido não encontrado: %', v_item->>'po_item_id';
    end if;

    -- Validate quantity
    if (v_item->>'quantity')::numeric <= 0 then
      raise exception 'Quantidade recebida deve ser maior que zero';
    end if;

    v_total_received := v_po_item.quantity_received + (v_item->>'quantity')::numeric;

    if v_total_received > v_po_item.quantity_ordered then
      raise exception 'Quantidade recebida (%) excede a solicitada (%) para ingrediente %',
        v_total_received, v_po_item.quantity_ordered, v_po_item.ingredient_id;
    end if;

    -- Insert receipt item
    insert into public.purchase_receipt_items (organization_id, receipt_id, po_item_id, quantity)
    values (v_org_id, v_receipt_id, v_po_item.id, (v_item->>'quantity')::numeric);

    -- Update quantity_received on PO item
    update public.purchase_order_items
    set quantity_received = v_total_received,
        updated_at = now()
    where id = v_po_item.id;

    -- Auto stock entry via apply_inventory_movement logic
    -- Create or update balance
    insert into public.inventory_balances (organization_id, ingredient_id, quantity)
    values (v_org_id, v_po_item.ingredient_id, 0)
    on conflict (organization_id, ingredient_id) do nothing;

    -- Get current balance and validate
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

      -- Update balance
      update public.inventory_balances
      set quantity = v_new_qty,
          updated_at = now()
      where id = v_balance_id;

      -- Record movement
      insert into public.inventory_movements (
        organization_id, ingredient_id, type, quantity,
        previous_quantity, new_quantity, reason, reference_type, reference_id, created_by
      ) values (
        v_org_id, v_po_item.ingredient_id, 'entry', (v_item->>'quantity')::numeric,
        v_prev_qty, v_new_qty, 'Recebimento de compra ' || v_po.po_number,
        'purchase_order', p_po_id, auth.uid()
      );
    end;

    -- Update ingredient cost from PO unit_cost
    update public.ingredients
    set cost_per_unit = v_po_item.unit_cost,
        updated_at = now()
    where id = v_po_item.ingredient_id
      and organization_id = v_org_id;
  end loop;

  -- 7. Recalculate PO total from all items
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

  -- 8. Determine new status
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

  return v_receipt_id;
end;
$$;
