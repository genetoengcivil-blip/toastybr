-- =============================================================
-- Toasty OS — CRM: Customers + Loyalty + Coupons + Campaigns
-- Migration: 20260817090005_crm_customers.sql
-- =============================================================

-- =============================================================
-- 1. CUSTOMERS (soft delete — no DELETE policy)
-- =============================================================
create table if not exists public.customers (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations(id) on delete cascade,
  name            text not null,
  email           text,
  phone           text,
  document        text,
  total_orders    integer not null default 0,
  total_spent     numeric(12,2) not null default 0,
  last_order_at   timestamptz,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint uq_customers_org_id unique (organization_id, id)
);

-- Partial unique: document per org (only when not empty)
create unique index idx_customers_org_document
  on public.customers (organization_id, document)
  where document is not null and trim(document) <> '';

-- Index for search
create index idx_customers_org_name
  on public.customers (organization_id, name);

create index idx_customers_org_email
  on public.customers (organization_id, email)
  where email is not null;

alter table public.customers enable row level security;

create policy "customers_select_member"
  on public.customers for select
  using (public.is_member_of(organization_id));

create policy "customers_insert_owner_admin_manager_staff"
  on public.customers for insert
  with check (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
      or public.has_org_role(organization_id, 'staff')
    )
  );

create policy "customers_update_owner_admin_manager_staff"
  on public.customers for update
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
      or public.has_org_role(organization_id, 'staff')
    )
  );

-- NO DELETE POLICY — soft delete only (is_active = false)

create trigger customers_updated_at
  before update on public.customers
  for each row
  execute function public.update_updated_at();

-- =============================================================
-- 2. CUSTOMER ADDRESSES
-- =============================================================
create table if not exists public.customer_addresses (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations(id) on delete cascade,
  customer_id     uuid not null,
  label           text not null,
  street          text not null,
  number          text,
  complement      text,
  neighborhood    text,
  city            text not null,
  state           text not null,
  zip_code        text,
  is_default      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Tenant-safe FK: customer must belong to same org
alter table public.customer_addresses
  add constraint fk_addr_customer_tenant
  foreign key (customer_id, organization_id)
  references public.customers(id, organization_id)
  on delete cascade;

-- Partial unique: only one default address per customer
create unique index idx_addr_default_per_customer
  on public.customer_addresses (customer_id)
  where is_default = true;

create index idx_addr_org_id
  on public.customer_addresses (organization_id);

create index idx_addr_customer_id
  on public.customer_addresses (customer_id);

alter table public.customer_addresses enable row level security;

create policy "addresses_select_member"
  on public.customer_addresses for select
  using (public.is_member_of(organization_id));

create policy "addresses_insert_owner_admin_manager_staff"
  on public.customer_addresses for insert
  with check (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
      or public.has_org_role(organization_id, 'staff')
    )
  );

create policy "addresses_update_owner_admin_manager_staff"
  on public.customer_addresses for update
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
      or public.has_org_role(organization_id, 'staff')
    )
  );

create policy "addresses_delete_owner_admin_manager"
  on public.customer_addresses for delete
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create trigger customer_addresses_updated_at
  before update on public.customer_addresses
  for each row
  execute function public.update_updated_at();

-- =============================================================
-- 3. CUSTOMER NOTES (immutable — no UPDATE/DELETE)
-- =============================================================
create table if not exists public.customer_notes (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations(id) on delete cascade,
  customer_id     uuid not null,
  content         text not null,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- Tenant-safe FK: customer must belong to same org
alter table public.customer_notes
  add constraint fk_notes_customer_tenant
  foreign key (customer_id, organization_id)
  references public.customers(id, organization_id)
  on delete restrict;

create index idx_notes_org_id
  on public.customer_notes (organization_id);

create index idx_notes_customer_id
  on public.customer_notes (customer_id);

alter table public.customer_notes enable row level security;

create policy "notes_select_member"
  on public.customer_notes for select
  using (public.is_member_of(organization_id));

create policy "notes_insert_member"
  on public.customer_notes for insert
  with check (public.is_member_of(organization_id));

-- Immutable: no UPDATE/DELETE policies

-- =============================================================
-- 4. CUSTOMER TAGS
-- =============================================================
create table if not exists public.customer_tags (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations(id) on delete cascade,
  name            text not null,
  created_at      timestamptz not null default now(),

  constraint uq_customer_tags_org_id unique (organization_id, id)
);

-- Case-insensitive unique name per org
create unique index idx_customer_tags_org_name
  on public.customer_tags (organization_id, lower(trim(name)));

alter table public.customer_tags enable row level security;

create policy "tags_select_member"
  on public.customer_tags for select
  using (public.is_member_of(organization_id));

create policy "tags_insert_owner_admin_manager"
  on public.customer_tags for insert
  with check (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create policy "tags_update_owner_admin_manager"
  on public.customer_tags for update
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create policy "tags_delete_owner_admin_manager"
  on public.customer_tags for delete
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

-- =============================================================
-- 5. CUSTOMER TAG ASSIGNMENTS
-- =============================================================
create table if not exists public.customer_tag_assignments (
  organization_id uuid not null
    references public.organizations(id) on delete cascade,
  customer_id     uuid not null,
  tag_id          uuid not null,
  created_at      timestamptz not null default now(),

  primary key (customer_id, tag_id)
);

-- Tenant-safe FKs
alter table public.customer_tag_assignments
  add constraint fk_tag_assign_customer_tenant
  foreign key (customer_id, organization_id)
  references public.customers(id, organization_id)
  on delete cascade;

alter table public.customer_tag_assignments
  add constraint fk_tag_assign_tag_tenant
  foreign key (tag_id, organization_id)
  references public.customer_tags(id, organization_id)
  on delete cascade;

create index idx_tag_assign_org_id
  on public.customer_tag_assignments (organization_id);

alter table public.customer_tag_assignments enable row level security;

create policy "tag_assign_select_member"
  on public.customer_tag_assignments for select
  using (public.is_member_of(organization_id));

create policy "tag_assign_insert_owner_admin_manager"
  on public.customer_tag_assignments for insert
  with check (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create policy "tag_assign_delete_owner_admin_manager"
  on public.customer_tag_assignments for delete
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

-- =============================================================
-- 6. LOYALTY ACCOUNTS
-- =============================================================
create table if not exists public.loyalty_accounts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations(id) on delete cascade,
  customer_id     uuid not null,
  points_balance  integer not null default 0
    constraint chk_loyalty_balance_non_negative check (points_balance >= 0),
  lifetime_points integer not null default 0
    constraint chk_loyalty_lifetime_non_negative check (lifetime_points >= 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint uq_loyalty_accounts_org_customer unique (organization_id, customer_id),
  constraint uq_loyalty_accounts_org_id unique (organization_id, id)
);

-- Tenant-safe FK
alter table public.loyalty_accounts
  add constraint fk_loyalty_customer_tenant
  foreign key (customer_id, organization_id)
  references public.customers(id, organization_id)
  on delete cascade;

create index idx_loyalty_accounts_org_id
  on public.loyalty_accounts (organization_id);

alter table public.loyalty_accounts enable row level security;

create policy "loyalty_accounts_select_member"
  on public.loyalty_accounts for select
  using (public.is_member_of(organization_id));

-- Writes go through RPC only

create trigger loyalty_accounts_updated_at
  before update on public.loyalty_accounts
  for each row
  execute function public.update_updated_at();

-- =============================================================
-- 7. LOYALTY TRANSACTIONS (immutable ledger)
-- =============================================================
create table if not exists public.loyalty_transactions (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null
    references public.organizations(id) on delete cascade,
  customer_id         uuid not null,
  loyalty_account_id  uuid not null,
  type                text not null
    constraint chk_loyalty_tx_type check (
      type in ('earn', 'redeem', 'adjustment_in', 'adjustment_out', 'reversal')
    ),
  points              integer not null
    constraint chk_loyalty_tx_points_positive check (points > 0),
  balance_before      integer not null,
  balance_after       integer not null,
  reference_type      text,
  reference_id        uuid,
  description         text,
  created_by          uuid references auth.users(id) on delete set null,
  created_at          timestamptz not null default now()
);

-- Tenant-safe FKs
alter table public.loyalty_transactions
  add constraint fk_loyalty_tx_account_tenant
  foreign key (loyalty_account_id, organization_id)
  references public.loyalty_accounts(id, organization_id)
  on delete restrict;

alter table public.loyalty_transactions
  add constraint fk_loyalty_tx_customer_tenant
  foreign key (customer_id, organization_id)
  references public.customers(id, organization_id)
  on delete cascade;

create index idx_loyalty_tx_org_id
  on public.loyalty_transactions (organization_id);

create index idx_loyalty_tx_account_id
  on public.loyalty_transactions (loyalty_account_id);

create index idx_loyalty_tx_customer_id
  on public.loyalty_transactions (customer_id);

alter table public.loyalty_transactions enable row level security;

create policy "loyalty_transactions_select_member"
  on public.loyalty_transactions for select
  using (public.is_member_of(organization_id));

-- Immutable: no INSERT/UPDATE/DELETE policies
-- All transactions go through RPC only

-- =============================================================
-- 8. LOYALTY SETTINGS
-- =============================================================
create table if not exists public.loyalty_settings (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations(id) on delete cascade,
  points_per_real numeric(10,2) not null default 1.00,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint uq_loyalty_settings_org unique (organization_id)
);

alter table public.loyalty_settings enable row level security;

create policy "loyalty_settings_select_member"
  on public.loyalty_settings for select
  using (public.is_member_of(organization_id));

create policy "loyalty_settings_insert_owner_admin_manager"
  on public.loyalty_settings for insert
  with check (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create policy "loyalty_settings_update_owner_admin_manager"
  on public.loyalty_settings for update
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create trigger loyalty_settings_updated_at
  before update on public.loyalty_settings
  for each row
  execute function public.update_updated_at();

-- =============================================================
-- 9. COUPONS
-- =============================================================
create table if not exists public.coupons (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations(id) on delete cascade,
  code            text not null,
  type            text not null
    constraint chk_coupon_type check (type in ('percentage', 'fixed')),
  value           numeric(12,2) not null
    constraint chk_coupon_value_positive check (value > 0),
  min_order       numeric(12,2) not null default 0
    constraint chk_coupon_min_order_non_negative check (min_order >= 0),
  max_uses        integer
    constraint chk_coupon_max_uses check (max_uses is null or max_uses > 0),
  current_uses    integer not null default 0
    constraint chk_coupon_current_uses_non_negative check (current_uses >= 0),
  starts_at       timestamptz,
  expires_at      timestamptz,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint uq_coupons_org_id unique (organization_id, id),
  constraint chk_coupon_code_not_empty check (trim(code) <> ''),
  constraint chk_coupon_percentage_max check (
    type <> 'percentage' or value <= 100
  ),
  constraint chk_coupon_max_uses_gte_current check (
    max_uses is null or current_uses <= max_uses
  ),
  constraint chk_coupon_dates check (
    expires_at is null or starts_at is null or expires_at > starts_at
  )
);

-- Case-insensitive unique code per org
create unique index idx_coupons_org_code
  on public.coupons (organization_id, lower(trim(code)));

create index idx_coupons_org_id
  on public.coupons (organization_id);

alter table public.coupons enable row level security;

create policy "coupons_select_member"
  on public.coupons for select
  using (public.is_member_of(organization_id));

create policy "coupons_insert_owner_admin_manager"
  on public.coupons for insert
  with check (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create policy "coupons_update_owner_admin_manager"
  on public.coupons for update
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create policy "coupons_delete_owner_admin_manager"
  on public.coupons for delete
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create trigger coupons_updated_at
  before update on public.coupons
  for each row
  execute function public.update_updated_at();

-- =============================================================
-- 10. COUPON REDEMPTIONS (immutable ledger — architecture ready)
-- =============================================================
create table if not exists public.coupon_redemptions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations(id) on delete cascade,
  coupon_id       uuid not null,
  customer_id     uuid,
  sales_order_id  uuid,
  discount_amount numeric(12,2) not null
    constraint chk_redemption_discount_non_negative check (discount_amount >= 0),
  created_at      timestamptz not null default now()
);

-- Tenant-safe FKs
alter table public.coupon_redemptions
  add constraint fk_redemption_coupon_tenant
  foreign key (coupon_id, organization_id)
  references public.coupons(id, organization_id)
  on delete restrict;

-- Customer FK only when not null (conditional tenant-safe not possible in PG, use RPC validation)
alter table public.coupon_redemptions
  add constraint fk_redemption_customer_tenant
  foreign key (customer_id, organization_id)
  references public.customers(id, organization_id)
  on delete set null;

create index idx_redemptions_org_id
  on public.coupon_redemptions (organization_id);

create index idx_redemptions_coupon_id
  on public.coupon_redemptions (coupon_id);

alter table public.coupon_redemptions enable row level security;

create policy "redemptions_select_member"
  on public.coupon_redemptions for select
  using (public.is_member_of(organization_id));

-- Immutable: no INSERT/UPDATE/DELETE policies
-- Redemptions will go through RPC when sales domain exists

-- =============================================================
-- 11. CAMPAIGNS
-- =============================================================
create table if not exists public.campaigns (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations(id) on delete cascade,
  name            text not null,
  description     text,
  type            text not null
    constraint chk_campaign_type check (type in ('whatsapp', 'email', 'sms', 'in_store')),
  status          text not null default 'draft'
    constraint chk_campaign_status check (
      status in ('draft', 'scheduled', 'active', 'completed', 'cancelled')
    ),
  reach           integer not null default 0
    constraint chk_campaign_reach_non_negative check (reach >= 0),
  conversions     integer not null default 0
    constraint chk_campaign_conversions_non_negative check (conversions >= 0),
  starts_at       timestamptz,
  ends_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint uq_campaigns_org_id unique (organization_id, id),
  constraint chk_campaign_name_not_empty check (trim(name) <> ''),
  constraint chk_campaign_dates check (
    ends_at is null or starts_at is null or ends_at > starts_at
  )
);

create index idx_campaigns_org_id
  on public.campaigns (organization_id);

alter table public.campaigns enable row level security;

create policy "campaigns_select_member"
  on public.campaigns for select
  using (public.is_member_of(organization_id));

create policy "campaigns_insert_owner_admin_manager"
  on public.campaigns for insert
  with check (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create policy "campaigns_update_owner_admin_manager"
  on public.campaigns for update
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create policy "campaigns_delete_owner_admin_manager"
  on public.campaigns for delete
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create trigger campaigns_updated_at
  before update on public.campaigns
  for each row
  execute function public.update_updated_at();

-- =============================================================
-- 12. RPC: apply_loyalty_transaction
-- =============================================================
-- SECURITY DEFINER: bypasses RLS for balance writes
-- Validates: auth.uid(), membership, role per operation type
-- Uses FOR UPDATE to prevent race conditions
-- Auto-creates account if needed
-- Blocks negative balance
-- Atomic: balance update + transaction insert
create or replace function public.apply_loyalty_transaction(
  p_customer_id uuid,
  p_type text,
  p_points integer,
  p_reference_type text default null,
  p_reference_id uuid default null,
  p_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_user_role public.org_role;
  v_account record;
  v_new_balance integer;
  v_tx_id uuid;
begin
  -- 1. Validate authenticated user
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  -- 2. Identify organization from customer
  select c.organization_id into v_org_id
  from public.customers c
  where c.id = p_customer_id;

  if v_org_id is null then
    raise exception 'Cliente não encontrado';
  end if;

  -- 3. Validate membership and role
  select om.role into v_user_role
  from public.organization_members om
  where om.organization_id = v_org_id
    and om.user_id = auth.uid();

  if v_user_role is null then
    raise exception 'Sem acesso a esta organização';
  end if;

  -- 4. Role validation per operation type
  if p_type in ('adjustment_in', 'adjustment_out', 'redeem') then
    if v_user_role not in ('owner', 'admin', 'manager') then
      raise exception 'Sem permissão para ajustar pontos';
    end if;
  end if;

  -- 5. Validate transaction type
  if p_type not in ('earn', 'redeem', 'adjustment_in', 'adjustment_out', 'reversal') then
    raise exception 'Tipo de transação inválido: %', p_type;
  end if;

  -- 6. Validate points
  if p_points <= 0 then
    raise exception 'Pontos devem ser maior que zero';
  end if;

  -- 7. Lock and read/create loyalty account
  select la.id, la.points_balance into v_account
  from public.loyalty_accounts la
  where la.organization_id = v_org_id
    and la.customer_id = p_customer_id
  for update;

  if v_account is null then
    insert into public.loyalty_accounts (organization_id, customer_id, points_balance, lifetime_points)
    values (v_org_id, p_customer_id, 0, 0)
    returning id, points_balance into v_account;
  end if;

  -- 8. Calculate new balance
  case p_type
    when 'earn', 'adjustment_in', 'reversal' then
      v_new_balance := v_account.points_balance + p_points;
    when 'redeem', 'adjustment_out' then
      v_new_balance := v_account.points_balance - p_points;
  end case;

  -- 9. Block negative balance
  if v_new_balance < 0 then
    raise exception 'Saldo insuficiente. Saldo atual: %, transação: %', v_account.points_balance, p_points;
  end if;

  -- 10. Update loyalty account
  update public.loyalty_accounts
  set points_balance = v_new_balance,
      lifetime_points = case
        when p_type in ('earn', 'adjustment_in', 'reversal') then lifetime_points + p_points
        else lifetime_points
      end,
      updated_at = now()
  where id = v_account.id;

  -- 11. Insert transaction record
  insert into public.loyalty_transactions (
    organization_id, customer_id, loyalty_account_id,
    type, points, balance_before, balance_after,
    reference_type, reference_id, description, created_by
  ) values (
    v_org_id, p_customer_id, v_account.id,
    p_type, p_points, v_account.points_balance, v_new_balance,
    p_reference_type, p_reference_id, p_description, auth.uid()
  )
  returning id into v_tx_id;

  return v_tx_id;
end;
$$;

-- =============================================================
-- 13. RPC: set_default_customer_address
-- =============================================================
-- SECURITY DEFINER: atomic default address swap
-- Validates: auth.uid(), membership, role, tenant ownership
create or replace function public.set_default_customer_address(
  p_address_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_user_role public.org_role;
  v_customer_id uuid;
begin
  -- 1. Validate authenticated user
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  -- 2. Load address and customer
  select ca.organization_id, ca.customer_id into v_org_id, v_customer_id
  from public.customer_addresses ca
  where ca.id = p_address_id;

  if v_org_id is null then
    raise exception 'Endereço não encontrado';
  end if;

  -- 3. Validate membership and role
  select om.role into v_user_role
  from public.organization_members om
  where om.organization_id = v_org_id
    and om.user_id = auth.uid();

  if v_user_role is null then
    raise exception 'Sem acesso a esta organização';
  end if;

  if v_user_role not in ('owner', 'admin', 'manager', 'staff') then
    raise exception 'Sem permissão para alterar endereço';
  end if;

  -- 4. Remove current default for this customer
  update public.customer_addresses
  set is_default = false,
      updated_at = now()
  where customer_id = v_customer_id
    and organization_id = v_org_id
    and is_default = true;

  -- 5. Set new default
  update public.customer_addresses
  set is_default = true,
      updated_at = now()
  where id = p_address_id
    and organization_id = v_org_id;
end;
$$;

-- =============================================================
-- 14. RPC: update_campaign_status
-- =============================================================
-- SECURITY DEFINER: validates status transitions server-side
-- Allowed transitions:
--   draft -> scheduled, cancelled
--   scheduled -> active, cancelled
--   active -> completed, cancelled
--   completed = terminal
--   cancelled = terminal
create or replace function public.update_campaign_status(
  p_campaign_id uuid,
  p_new_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_user_role public.org_role;
  v_current_status text;
begin
  -- 1. Validate authenticated user
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  -- 2. Load campaign
  select c.organization_id, c.status into v_org_id, v_current_status
  from public.campaigns c
  where c.id = p_campaign_id;

  if v_org_id is null then
    raise exception 'Campanha não encontrada';
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
    raise exception 'Sem permissão para alterar status da campanha';
  end if;

  -- 4. Validate transition
  if p_new_status not in ('draft', 'scheduled', 'active', 'completed', 'cancelled') then
    raise exception 'Status inválido: %', p_new_status;
  end if;

  case v_current_status
    when 'draft' then
      if p_new_status not in ('scheduled', 'cancelled') then
        raise exception 'Transição inválida: % -> %', v_current_status, p_new_status;
      end if;
    when 'scheduled' then
      if p_new_status not in ('active', 'cancelled') then
        raise exception 'Transição inválida: % -> %', v_current_status, p_new_status;
      end if;
    when 'active' then
      if p_new_status not in ('completed', 'cancelled') then
        raise exception 'Transição inválida: % -> %', v_current_status, p_new_status;
      end if;
    when 'completed' then
      raise exception 'Campanha finalizada não pode alterar status';
    when 'cancelled' then
      raise exception 'Campanha cancelada não pode alterar status';
  end case;

  -- 5. Update status
  update public.campaigns
  set status = p_new_status,
      updated_at = now()
  where id = p_campaign_id
    and organization_id = v_org_id;
end;
$$;
