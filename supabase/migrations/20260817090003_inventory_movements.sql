-- =============================================================
-- Toasty OS — Inventory Balances + Movements + RPC
-- Migration: 20260817090003_inventory_movements.sql
-- =============================================================

-- =============================================================
-- 1. INVENTORY BALANCES
-- =============================================================
create table if not exists public.inventory_balances (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null
    references public.organizations(id) on delete cascade,
  ingredient_id     uuid not null,
  quantity          numeric(14,4) not null default 0
    constraint chk_balance_quantity_non_negative check (quantity >= 0),
  minimum_quantity  numeric(14,4) not null default 0
    constraint chk_balance_minimum_non_negative check (minimum_quantity >= 0),
  updated_at        timestamptz not null default now(),

  constraint uq_balance_org_ingredient unique (organization_id, ingredient_id)
);

-- Cross-tenant composite FK
alter table public.inventory_balances
  add constraint fk_balance_ingredient_tenant
  foreign key (ingredient_id, organization_id)
  references public.ingredients(id, organization_id)
  on delete cascade;

alter table public.inventory_balances enable row level security;

create index if not exists idx_balances_org_id
  on public.inventory_balances (organization_id);

create index if not exists idx_balances_ingredient_id
  on public.inventory_balances (ingredient_id);

-- =============================================================
-- 2. INVENTORY MOVEMENTS
-- =============================================================
create table if not exists public.inventory_movements (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null
    references public.organizations(id) on delete cascade,
  ingredient_id     uuid not null,
  type              text not null
    constraint chk_movement_type check (
      type in ('entry', 'exit', 'adjustment_in', 'adjustment_out')
    ),
  quantity          numeric(14,4) not null
    constraint chk_movement_quantity_positive check (quantity > 0),
  previous_quantity numeric(14,4) not null
    constraint chk_movement_previous_non_negative check (previous_quantity >= 0),
  new_quantity      numeric(14,4) not null
    constraint chk_movement_new_non_negative check (new_quantity >= 0),
  reason            text,
  reference_type    text,
  reference_id      uuid,
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now()
);

-- Cross-tenant composite FK
alter table public.inventory_movements
  add constraint fk_movement_ingredient_tenant
  foreign key (ingredient_id, organization_id)
  references public.ingredients(id, organization_id)
  on delete restrict;

alter table public.inventory_movements enable row level security;

create index if not exists idx_movements_org_id
  on public.inventory_movements (organization_id);

create index if not exists idx_movements_ingredient_id
  on public.inventory_movements (ingredient_id);

create index if not exists idx_movements_created_at
  on public.inventory_movements (organization_id, created_at desc);

-- =============================================================
-- 3. RLS: INVENTORY BALANCES
-- =============================================================
create policy "balances_select_member"
  on public.inventory_balances for select
  using (public.is_member_of(organization_id));

-- Writes go through RPC only — no direct INSERT/UPDATE/DELETE policies
-- The RPC uses SECURITY DEFINER to bypass RLS

-- =============================================================
-- 4. RLS: INVENTORY MOVEMENTS
-- =============================================================
create policy "movements_select_member"
  on public.inventory_movements for select
  using (public.is_member_of(organization_id));

-- Immutable ledger: no INSERT/UPDATE/DELETE policies
-- All movements go through RPC only

-- =============================================================
-- 5. TRIGGER: update updated_at
-- =============================================================
create trigger inventory_balances_updated_at
  before update on public.inventory_balances
  for each row
  execute function public.update_updated_at();

-- =============================================================
-- 6. RPC: apply_inventory_movement
-- =============================================================
-- SECURITY DEFINER: bypasses RLS for balance writes
-- Validates: auth.uid(), membership, role (owner/admin/manager only)
-- Uses FOR UPDATE to prevent race conditions on balance row
-- Blocks negative stock
-- Atomic: balance update + movement insert in one transaction
create or replace function public.apply_inventory_movement(
  p_ingredient_id uuid,
  p_type text,
  p_quantity numeric,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_user_role public.org_role;
  v_balance record;
  v_new_quantity numeric;
  v_movement_id uuid;
begin
  -- 1. Validate authenticated user
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  -- 2. Identify organization from ingredient
  select i.organization_id into v_org_id
  from public.ingredients i
  where i.id = p_ingredient_id;

  if v_org_id is null then
    raise exception 'Ingrediente não encontrado';
  end if;

  -- 3. Validate membership and role
  select om.role into v_user_role
  from public.organization_members om
  where om.organization_id = v_org_id
    and om.user_id = auth.uid();

  if v_user_role is null then
    raise exception 'Sem acesso a esta organização';
  end if;

  if v_user_role not in ('owner', 'admin', 'manager') then
    raise exception 'Sem permissão para movimentar estoque';
  end if;

  -- 4. Validate movement type
  if p_type not in ('entry', 'exit', 'adjustment_in', 'adjustment_out') then
    raise exception 'Tipo de movimentação inválido: %', p_type;
  end if;

  -- 5. Validate quantity
  if p_quantity <= 0 then
    raise exception 'Quantidade deve ser maior que zero';
  end if;

  -- 6. Lock balance row (FOR UPDATE) and read current
  select ib.id, ib.quantity into v_balance
  from public.inventory_balances ib
  where ib.organization_id = v_org_id
    and ib.ingredient_id = p_ingredient_id
  for update;

  -- 7. Auto-create balance if not exists
  if v_balance is null then
    insert into public.inventory_balances (organization_id, ingredient_id, quantity)
    values (v_org_id, p_ingredient_id, 0)
    returning id, quantity into v_balance;
  end if;

  -- 8. Calculate new quantity
  case p_type
    when 'entry', 'adjustment_in' then
      v_new_quantity := v_balance.quantity + p_quantity;
    when 'exit', 'adjustment_out' then
      v_new_quantity := v_balance.quantity - p_quantity;
  end case;

  -- 9. Block negative stock
  if v_new_quantity < 0 then
    raise exception 'Saldo insuficiente. Saldo atual: %, movimento: %', v_balance.quantity, p_quantity;
  end if;

  -- 10. Update balance
  update public.inventory_balances
  set quantity = v_new_quantity,
      updated_at = now()
  where id = v_balance.id;

  -- 11. Insert movement record
  insert into public.inventory_movements (
    organization_id, ingredient_id, type, quantity,
    previous_quantity, new_quantity, reason, created_by
  ) values (
    v_org_id, p_ingredient_id, p_type, p_quantity,
    v_balance.quantity, v_new_quantity, p_reason, auth.uid()
  )
  returning id into v_movement_id;

  return v_movement_id;
end;
$$;

-- =============================================================
-- 7. RPC: update_minimum_quantity
-- =============================================================
create or replace function public.update_minimum_quantity(
  p_ingredient_id uuid,
  p_minimum_quantity numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_user_role public.org_role;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  select i.organization_id into v_org_id
  from public.ingredients i
  where i.id = p_ingredient_id;

  if v_org_id is null then
    raise exception 'Ingrediente não encontrado';
  end if;

  select om.role into v_user_role
  from public.organization_members om
  where om.organization_id = v_org_id
    and om.user_id = auth.uid();

  if v_user_role is null then
    raise exception 'Sem acesso a esta organização';
  end if;

  if v_user_role not in ('owner', 'admin', 'manager') then
    raise exception 'Sem permissão para editar estoque mínimo';
  end if;

  if p_minimum_quantity < 0 then
    raise exception 'Estoque mínimo não pode ser negativo';
  end if;

  -- Upsert balance with minimum_quantity
  insert into public.inventory_balances (organization_id, ingredient_id, quantity, minimum_quantity)
  values (v_org_id, p_ingredient_id, 0, p_minimum_quantity)
  on conflict (organization_id, ingredient_id)
  do update set minimum_quantity = p_minimum_quantity, updated_at = now();
end;
$$;
