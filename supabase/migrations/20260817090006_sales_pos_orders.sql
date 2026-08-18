-- =============================================================
-- Toasty OS — Sales: POS + Orders + Payments + Kitchen
-- Migration: 20260817090006_sales_pos_orders.sql
-- =============================================================

-- =============================================================
-- 0. SEQUENCE per org for order numbers
-- =============================================================
-- Dynamic creation in generate_order_number RPC

-- =============================================================
-- 1. SALES ORDERS
-- =============================================================
create table if not exists public.sales_orders (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations(id) on delete cascade,
  order_number    text not null,
  customer_id     uuid,
  channel         text not null default 'pos'
    constraint chk_sales_order_channel check (
      channel in ('pos', 'counter', 'takeaway', 'delivery')
    ),
  status          text not null default 'open'
    constraint chk_sales_order_status check (
      status in ('open', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')
    ),
  customer_name   text,
  customer_phone  text,
  subtotal        numeric(14,2) not null default 0
    constraint chk_sales_order_subtotal_non_negative check (subtotal >= 0),
  discount        numeric(14,2) not null default 0
    constraint chk_sales_order_discount_non_negative check (discount >= 0),
  service_fee     numeric(14,2) not null default 0
    constraint chk_sales_order_service_fee_non_negative check (service_fee >= 0),
  delivery_fee    numeric(14,2) not null default 0
    constraint chk_sales_order_delivery_fee_non_negative check (delivery_fee >= 0),
  total           numeric(14,2) not null default 0
    constraint chk_sales_order_total_non_negative check (total >= 0),
  notes           text,
  opened_by       uuid references auth.users(id) on delete set null,
  closed_by       uuid references auth.users(id) on delete set null,
  opened_at       timestamptz not null default now(),
  confirmed_at    timestamptz,
  ready_at        timestamptz,
  completed_at    timestamptz,
  cancelled_at    timestamptz,
  coupon_id       uuid,
  coupon_code     text,
  coupon_discount numeric(14,2) not null default 0
    constraint chk_sales_order_coupon_discount_non_negative check (coupon_discount >= 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint uq_sales_orders_org_id unique (organization_id, id)
);

-- Tenant-safe FK: customer must belong to same org
alter table public.sales_orders
  add constraint fk_sales_order_customer_tenant
  foreign key (customer_id, organization_id)
  references public.customers(id, organization_id)
  on delete set null;

-- Order number unique per org
create unique index idx_sales_orders_org_order_number
  on public.sales_orders (organization_id, order_number);

-- Indexes for common queries
create index idx_sales_orders_org_id
  on public.sales_orders (organization_id);

create index idx_sales_orders_org_status
  on public.sales_orders (organization_id, status);

create index idx_sales_orders_org_created
  on public.sales_orders (organization_id, created_at desc);

create index idx_sales_orders_customer_id
  on public.sales_orders (customer_id)
  where customer_id is not null;

alter table public.sales_orders enable row level security;

create policy "sales_orders_select_member"
  on public.sales_orders for select
  using (public.is_member_of(organization_id));

create policy "sales_orders_insert_member"
  on public.sales_orders for insert
  with check (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
      or public.has_org_role(organization_id, 'staff')
    )
  );

create policy "sales_orders_update_member"
  on public.sales_orders for update
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
      or public.has_org_role(organization_id, 'staff')
    )
  );

create trigger sales_orders_updated_at
  before update on public.sales_orders
  for each row
  execute function public.update_updated_at();

-- =============================================================
-- 2. SALES ORDER ITEMS
-- =============================================================
create table if not exists public.sales_order_items (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations(id) on delete cascade,
  sales_order_id  uuid not null
    references public.sales_orders(id) on delete cascade,
  product_id      uuid,
  product_name    text not null,
  quantity        numeric(12,3) not null
    constraint chk_sales_order_item_quantity_positive check (quantity > 0),
  unit_price      numeric(14,2) not null
    constraint chk_sales_order_item_price_non_negative check (unit_price >= 0),
  subtotal        numeric(14,2) not null
    constraint chk_sales_order_item_subtotal_non_negative check (subtotal >= 0),
  notes           text,
  created_at      timestamptz not null default now()
);

-- Tenant-safe FKs
alter table public.sales_order_items
  add constraint fk_sales_order_item_order_tenant
  foreign key (sales_order_id, organization_id)
  references public.sales_orders(id, organization_id)
  on delete cascade;

-- product_id tenant-safe FK when not null
alter table public.sales_order_items
  add constraint fk_sales_order_item_product_tenant
  foreign key (product_id, organization_id)
  references public.products(id, organization_id)
  on delete set null;

create index idx_sales_order_items_org_id
  on public.sales_order_items (organization_id);

create index idx_sales_order_items_order_id
  on public.sales_order_items (sales_order_id);

alter table public.sales_order_items enable row level security;

create policy "sales_order_items_select_member"
  on public.sales_order_items for select
  using (public.is_member_of(organization_id));

create policy "sales_order_items_insert_member"
  on public.sales_order_items for insert
  with check (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
      or public.has_org_role(organization_id, 'staff')
    )
  );

-- Immutable: no UPDATE/DELETE policies
-- Item modifications go through finalize_sales_order / cancel_sales_order RPCs

-- =============================================================
-- 3. SALES PAYMENTS
-- =============================================================
create table if not exists public.sales_payments (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations(id) on delete cascade,
  sales_order_id  uuid not null
    references public.sales_orders(id) on delete cascade,
  method          text not null
    constraint chk_sales_payment_method check (
      method in ('cash', 'pix', 'debit_card', 'credit_card', 'other')
    ),
  amount          numeric(14,2) not null
    constraint chk_sales_payment_amount_positive check (amount > 0),
  status          text not null default 'confirmed'
    constraint chk_sales_payment_status check (
      status in ('confirmed', 'cancelled')
    ),
  reference       text,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- Tenant-safe FK
alter table public.sales_payments
  add constraint fk_sales_payment_order_tenant
  foreign key (sales_order_id, organization_id)
  references public.sales_orders(id, organization_id)
  on delete cascade;

create index idx_sales_payments_org_id
  on public.sales_payments (organization_id);

create index idx_sales_payments_order_id
  on public.sales_payments (sales_order_id);

alter table public.sales_payments enable row level security;

create policy "sales_payments_select_member"
  on public.sales_payments for select
  using (public.is_member_of(organization_id));

create policy "sales_payments_insert_member"
  on public.sales_payments for insert
  with check (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
      or public.has_org_role(organization_id, 'staff')
    )
  );

-- Immutable: no UPDATE/DELETE policies
-- Payment modifications go through finalize_sales_order / cancel_sales_order RPCs

-- =============================================================
-- 4. MODIFY COUPON REDEMPTIONS
-- =============================================================
-- Add order linkage + unique constraint + reversed_at

alter table public.coupon_redemptions
  add constraint fk_redemption_order_tenant
  foreign key (sales_order_id, organization_id)
  references public.sales_orders(id, organization_id)
  on delete set null;

-- Unique: one coupon per order
create unique index idx_redemptions_order_id
  on public.coupon_redemptions (sales_order_id)
  where sales_order_id is not null;

-- Reversed tracking
alter table public.coupon_redemptions
  add column if not exists reversed_at timestamptz;

-- =============================================================
-- 5. RPC: generate_order_number
-- =============================================================
-- Sequential: ORD-000001, ORD-000002, etc.
-- Creates org-specific sequence if needed
-- SECURITY DEFINER: bypasses RLS for sequence management
create or replace function public.generate_order_number(
  p_org_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seq_name text;
  v_next bigint;
  v_order_number text;
begin
  -- 1. Validate authenticated user
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  -- 2. Validate membership
  if not public.is_member_of(p_org_id) then
    raise exception 'Sem acesso a esta organização';
  end if;

  -- 3. Create org-specific sequence if needed
  v_seq_name := 'order_seq_' || replace(p_org_id::text, '-', '');

  if not exists (
    select 1 from pg_sequences
    where schemaname = 'public'
      and sequencename = v_seq_name
  ) then
    execute format(
      'CREATE SEQUENCE public.%I START WITH 1 INCREMENT BY 1 CACHE 1',
      v_seq_name
    );
  end if;

  -- 4. Get next value
  execute format('SELECT nextval(%L)', v_seq_name)
  into v_next;

  -- 5. Format: ORD-000001
  v_order_number := 'ORD-' || lpad(v_next::text, 6, '0');

  return v_order_number;
end;
$$;

-- =============================================================
-- 6. RPC: update_order_status
-- =============================================================
-- Validates transitions server-side
-- confirmed → preparing → ready → completed
-- open/confirmed/preparing/ready → cancelled
-- SECURITY DEFINER
create or replace function public.update_order_status(
  p_order_id uuid,
  p_new_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_current_status text;
begin
  -- 1. Validate authenticated user
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  -- 2. Load order
  select so.organization_id, so.status into v_org_id, v_current_status
  from public.sales_orders so
  where so.id = p_order_id;

  if v_org_id is null then
    raise exception 'Pedido não encontrado';
  end if;

  -- 3. Validate membership
  if not public.is_member_of(v_org_id) then
    raise exception 'Sem acesso a esta organização';
  end if;

  -- 4. Validate new status
  if p_new_status not in ('confirmed', 'preparing', 'ready', 'completed', 'cancelled') then
    raise exception 'Status inválido: %', p_new_status;
  end if;

  -- 5. Validate transition
  case v_current_status
    when 'open' then
      if p_new_status not in ('confirmed', 'cancelled') then
        raise exception 'Transição inválida: % → %', v_current_status, p_new_status;
      end if;
    when 'confirmed' then
      if p_new_status not in ('preparing', 'cancelled') then
        raise exception 'Transição inválida: % → %', v_current_status, p_new_status;
      end if;
    when 'preparing' then
      if p_new_status not in ('ready', 'cancelled') then
        raise exception 'Transição inválida: % → %', v_current_status, p_new_status;
      end if;
    when 'ready' then
      if p_new_status not in ('completed', 'cancelled') then
        raise exception 'Transição inválida: % → %', v_current_status, p_new_status;
      end if;
    when 'completed' then
      raise exception 'Pedido finalizado não pode alterar status';
    when 'cancelled' then
      raise exception 'Pedido cancelado não pode alterar status';
  end case;

  -- 6. Update status + timestamps
  update public.sales_orders
  set status = p_new_status,
      confirmed_at = case when p_new_status = 'confirmed' then now() else confirmed_at end,
      ready_at = case when p_new_status = 'ready' then now() else ready_at end,
      completed_at = case when p_new_status = 'completed' then now() else completed_at end,
      cancelled_at = case when p_new_status = 'cancelled' then now() else cancelled_at end,
      closed_by = case when p_new_status in ('completed', 'cancelled') then auth.uid() else closed_by end,
      updated_at = now()
  where id = p_order_id
    and organization_id = v_org_id;
end;
$$;

-- =============================================================
-- 7. RPC: finalize_sales_order
-- =============================================================
-- Atomic: validate → prices → totals → coupon → payments →
--          inventory → movements → customer metrics → loyalty → done
-- SECURITY DEFINER
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
  -- 1. Validate authenticated user
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  -- 2. Load order
  select so.* into v_order
  from public.sales_orders so
  where so.id = p_order_id;

  if v_order is null then
    raise exception 'Pedido não encontrado';
  end if;

  v_org_id := v_order.organization_id;

  -- 3. Validate membership and role
  select om.role into v_user_role
  from public.organization_members om
  where om.organization_id = v_org_id
    and om.user_id = auth.uid();

  if v_user_role is null then
    raise exception 'Sem acesso a esta organização';
  end if;

  -- Staff can finalize POS orders
  if v_user_role not in ('owner', 'admin', 'manager', 'staff') then
    raise exception 'Sem permissão para finalizar pedido';
  end if;

  -- 4. Validate status
  if v_order.status <> 'open' then
    raise exception 'Pedido não está aberto. Status atual: %', v_order.status;
  end if;

  -- 5. Load and validate items
  for v_item in
    select soi.*, p.price as official_price
    from public.sales_order_items soi
    left join public.products p on p.id = soi.product_id
    where soi.sales_order_id = p_order_id
      and soi.organization_id = v_org_id
  loop
    -- Use official price from DB
    v_official_price := coalesce(v_item.official_price, v_item.unit_price);

    v_item_calculated_subtotal := v_item.quantity * v_official_price;
    v_new_subtotal := v_new_subtotal + v_item_calculated_subtotal;
  end loop;

  -- 6. Validate items exist
  if v_new_subtotal = 0 then
    raise exception 'Pedido sem itens';
  end if;

  -- 7. Apply coupon if provided
  if p_coupon_id is not null then
    select c.* into v_coupon
    from public.coupons c
    where c.id = p_coupon_id
      and c.organization_id = v_org_id
    for update;

    if v_coupon is null then
      raise exception 'Cupom não encontrado';
    end if;

    -- Validate coupon
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

    -- Calculate discount
    if v_coupon.type = 'percentage' then
      v_effective_discount := round(v_new_subtotal * v_coupon.value / 100, 2);
    else
      v_effective_discount := v_coupon.value;
    end if;

    -- Cap discount at subtotal
    if v_effective_discount > v_new_subtotal then
      v_effective_discount := v_new_subtotal;
    end if;

    -- Increment current_uses
    update public.coupons
    set current_uses = current_uses + 1,
        updated_at = now()
    where id = p_coupon_id;
  end if;

  -- 8. Validate payments
  select coalesce(sum(sp.amount), 0) into v_payments_total
  from public.sales_payments sp
  where sp.sales_order_id = p_order_id
    and sp.status = 'confirmed';

  -- 9. Calculate final total
  v_new_total := v_new_subtotal - v_effective_discount + p_service_fee + p_delivery_fee;

  if v_new_total < 0 then
    v_new_total := 0;
  end if;

  if v_payments_total < v_new_total then
    raise exception 'Pagamento insuficiente. Total: R$ %, Pago: R$ %', v_new_total, v_payments_total;
  end if;

  -- 10. Process inventory consumption (aggregate by ingredient)
  -- Temporary table to aggregate consumption
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

  -- 11. Lock inventory balances in deterministic order
  for v_balance in
    select ib.id, ib.ingredient_id, ib.quantity,
           tc.total_consumption
    from tmp_ingredient_consumption tc
    join public.inventory_balances ib
      on ib.ingredient_id = tc.ingredient_id
      and ib.organization_id = v_org_id
    order by tc.ingredient_id
  loop
    -- Validate sufficient stock
    if v_balance.quantity < v_balance.total_consumption then
      raise exception 'Estoque insuficiente para ingrediente. Disponível: %, Necessário: %',
        v_balance.quantity, v_balance.total_consumption;
    end if;

    -- Deduct stock
    v_new_qty := v_balance.quantity - v_balance.total_consumption;

    update public.inventory_balances
    set quantity = v_new_qty,
        updated_at = now()
    where id = v_balance.id;

    -- Create exit movement
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

  -- 12. Record coupon redemption
  if p_coupon_id is not null then
    insert into public.coupon_redemptions (
      organization_id, coupon_id, customer_id, sales_order_id, discount_amount
    ) values (
      v_org_id, p_coupon_id, p_customer_id, p_order_id, v_effective_discount
    );
  end if;

  -- 13. Update customer metrics
  if p_customer_id is not null then
    update public.customers
    set total_orders = total_orders + 1,
        total_spent = total_spent + v_new_total,
        last_order_at = now(),
        updated_at = now()
    where id = p_customer_id
      and organization_id = v_org_id;
  end if;

  -- 14. Process loyalty earn
  if p_customer_id is not null then
    select ls.* into v_loyalty_settings
    from public.loyalty_settings ls
    where ls.organization_id = v_org_id
      and ls.is_active = true;

    if v_loyalty_settings is not null and v_loyalty_settings.points_per_real > 0 then
      -- Check for existing earn on this order (idempotency)
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
          -- Get or create loyalty account
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

  -- 15. Update order status
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

  -- 16. Build result
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
-- 8. RPC: cancel_sales_order
-- =============================================================
-- Reverses inventory, loyalty, coupon
-- SECURITY DEFINER
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
begin
  -- 1. Validate authenticated user
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  -- 2. Load order
  select so.* into v_order
  from public.sales_orders so
  where so.id = p_order_id;

  if v_order is null then
    raise exception 'Pedido não encontrado';
  end if;

  v_org_id := v_order.organization_id;

  -- 3. Validate membership and role
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

  -- 4. Validate status (can cancel if not terminal)
  if v_order.status in ('completed', 'cancelled') then
    raise exception 'Pedido já % — não pode cancelar', v_order.status;
  end if;

  -- 5. Reverse inventory if already consumed
  if v_order.status in ('confirmed', 'preparing', 'ready') then
    for v_movement in
      select im.*
      from public.inventory_movements im
      where im.reference_type = 'sales_order'
        and im.reference_id = p_order_id
        and im.organization_id = v_org_id
        and im.type = 'exit'
    loop
      -- Create reversal entry
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

      -- Restore balance
      update public.inventory_balances
      set quantity = quantity + v_movement.quantity,
          updated_at = now()
      where organization_id = v_org_id
        and ingredient_id = v_movement.ingredient_id;
    end loop;
  end if;

  -- 6. Reverse loyalty earn
  for v_loyalty_tx in
    select lt.*
    from public.loyalty_transactions lt
    where lt.organization_id = v_org_id
      and lt.customer_id = v_order.customer_id
      and lt.reference_type = 'sales_order'
      and lt.reference_id = p_order_id
      and lt.type = 'earn'
  loop
    -- Create reversal
    perform public.apply_loyalty_transaction(
      v_loyalty_tx.customer_id,
      'reversal',
      v_loyalty_tx.points,
      'sales_order_cancellation',
      p_order_id,
      'Reversão do cancelamento ' || v_order.order_number
    );
  end loop;

  -- 7. Handle coupon (mark reversed, decrement uses)
  for v_redemption in
    select cr.*
    from public.coupon_redemptions cr
    where cr.sales_order_id = p_order_id
      and cr.organization_id = v_org_id
      and cr.reversed_at is null
  loop
    -- Mark redemption as reversed
    update public.coupon_redemptions
    set reversed_at = now()
    where id = v_redemption.id;

    -- Decrement coupon uses
    update public.coupons
    set current_uses = greatest(current_uses - 1, 0),
        updated_at = now()
    where id = v_redemption.coupon_id
      and organization_id = v_org_id;
  end loop;

  -- 8. Update customer metrics (decrement orders/spend, recalc last_order_at)
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

  -- 9. Update order status
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
end;
$$;
