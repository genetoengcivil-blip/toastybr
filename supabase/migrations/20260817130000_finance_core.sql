-- =============================================================
-- Toasty OS — Finance Core: Categories, Cost Centers, AP/AR, Ledger
-- Migration: 20260817130000_finance_core.sql
-- =============================================================

-- =============================================================
-- 1. FINANCIAL CATEGORIES
-- =============================================================
create table if not exists public.financial_categories (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations(id) on delete cascade,
  name            text not null,
  type            text not null
    constraint chk_financial_category_type check (type in ('income', 'expense')),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint uq_financial_categories_org_id unique (organization_id, id)
);

-- Case-insensitive unique name+type per org (expression index)
create unique index uq_financial_categories_org_name_type
  on public.financial_categories (organization_id, lower(trim(name)), type);

create index idx_financial_categories_org_id
  on public.financial_categories (organization_id);

create index idx_financial_categories_org_type
  on public.financial_categories (organization_id, type);

alter table public.financial_categories enable row level security;

create policy "financial_categories_select_member"
  on public.financial_categories for select
  using (public.is_member_of(organization_id));

create policy "financial_categories_insert_manager"
  on public.financial_categories for insert
  with check (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create policy "financial_categories_update_manager"
  on public.financial_categories for update
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create policy "financial_categories_delete_manager"
  on public.financial_categories for delete
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create trigger trg_financial_categories_updated_at
  before update on public.financial_categories
  for each row execute function public.update_updated_at();

-- =============================================================
-- 2. COST CENTERS
-- =============================================================
create table if not exists public.cost_centers (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations(id) on delete cascade,
  name            text not null,
  description     text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint uq_cost_centers_org_id unique (organization_id, id)
);

-- Case-insensitive unique name per org (expression index)
create unique index uq_cost_centers_org_name
  on public.cost_centers (organization_id, lower(trim(name)));

create index idx_cost_centers_org_id
  on public.cost_centers (organization_id);

alter table public.cost_centers enable row level security;

create policy "cost_centers_select_member"
  on public.cost_centers for select
  using (public.is_member_of(organization_id));

create policy "cost_centers_insert_manager"
  on public.cost_centers for insert
  with check (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create policy "cost_centers_update_manager"
  on public.cost_centers for update
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create policy "cost_centers_delete_manager"
  on public.cost_centers for delete
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create trigger trg_cost_centers_updated_at
  before update on public.cost_centers
  for each row execute function public.update_updated_at();

-- =============================================================
-- 3. ACCOUNTS PAYABLE
-- =============================================================
create table if not exists public.accounts_payable (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null
    references public.organizations(id) on delete cascade,
  supplier_id       uuid,
  purchase_order_id uuid,
  category_id       uuid,
  cost_center_id    uuid,
  description       text not null
    constraint chk_ap_description_not_empty check (trim(description) <> ''),
  amount            numeric(14,2) not null
    constraint chk_ap_amount_positive check (amount > 0),
  due_date          date not null,
  status            text not null default 'pending'
    constraint chk_ap_status check (
      status in ('pending', 'partially_paid', 'paid', 'cancelled')
    ),
  paid_amount       numeric(14,2) not null default 0
    constraint chk_ap_paid_amount_non_negative check (paid_amount >= 0),
  paid_at           timestamptz,
  notes             text,
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint chk_ap_paid_amount_lte_amount check (paid_amount <= amount),
  constraint uq_accounts_payable_org_id unique (organization_id, id)
);

-- Tenant-safe composite FKs
alter table public.accounts_payable
  add constraint fk_ap_supplier_tenant
  foreign key (supplier_id, organization_id)
  references public.suppliers(id, organization_id)
  on delete set null;

alter table public.accounts_payable
  add constraint fk_ap_purchase_order_tenant
  foreign key (purchase_order_id, organization_id)
  references public.purchase_orders(id, organization_id)
  on delete set null;

alter table public.accounts_payable
  add constraint fk_ap_category_tenant
  foreign key (category_id, organization_id)
  references public.financial_categories(id, organization_id)
  on delete set null;

alter table public.accounts_payable
  add constraint fk_ap_cost_center_tenant
  foreign key (cost_center_id, organization_id)
  references public.cost_centers(id, organization_id)
  on delete set null;

create index idx_accounts_payable_org_id
  on public.accounts_payable (organization_id);

create index idx_accounts_payable_org_status
  on public.accounts_payable (organization_id, status);

create index idx_accounts_payable_org_due_date
  on public.accounts_payable (organization_id, due_date);

create index idx_accounts_payable_supplier_id
  on public.accounts_payable (supplier_id)
  where supplier_id is not null;

alter table public.accounts_payable enable row level security;

create policy "accounts_payable_select_member"
  on public.accounts_payable for select
  using (public.is_member_of(organization_id));

create policy "accounts_payable_insert_manager"
  on public.accounts_payable for insert
  with check (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create policy "accounts_payable_update_manager"
  on public.accounts_payable for update
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create policy "accounts_payable_delete_manager"
  on public.accounts_payable for delete
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create trigger trg_accounts_payable_updated_at
  before update on public.accounts_payable
  for each row execute function public.update_updated_at();

-- =============================================================
-- 4. ACCOUNTS RECEIVABLE
-- =============================================================
create table if not exists public.accounts_receivable (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null
    references public.organizations(id) on delete cascade,
  customer_id       uuid,
  sales_order_id    uuid,
  category_id       uuid,
  cost_center_id    uuid,
  description       text not null
    constraint chk_ar_description_not_empty check (trim(description) <> ''),
  amount            numeric(14,2) not null
    constraint chk_ar_amount_positive check (amount > 0),
  due_date          date not null,
  status            text not null default 'pending'
    constraint chk_ar_status check (
      status in ('pending', 'partially_received', 'received', 'cancelled')
    ),
  received_amount   numeric(14,2) not null default 0
    constraint chk_ar_received_amount_non_negative check (received_amount >= 0),
  received_at       timestamptz,
  notes             text,
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint chk_ar_received_amount_lte_amount check (received_amount <= amount),
  constraint uq_accounts_receivable_org_id unique (organization_id, id)
);

-- Tenant-safe composite FKs
alter table public.accounts_receivable
  add constraint fk_ar_customer_tenant
  foreign key (customer_id, organization_id)
  references public.customers(id, organization_id)
  on delete set null;

alter table public.accounts_receivable
  add constraint fk_ar_sales_order_tenant
  foreign key (sales_order_id, organization_id)
  references public.sales_orders(id, organization_id)
  on delete set null;

alter table public.accounts_receivable
  add constraint fk_ar_category_tenant
  foreign key (category_id, organization_id)
  references public.financial_categories(id, organization_id)
  on delete set null;

alter table public.accounts_receivable
  add constraint fk_ar_cost_center_tenant
  foreign key (cost_center_id, organization_id)
  references public.cost_centers(id, organization_id)
  on delete set null;

create index idx_accounts_receivable_org_id
  on public.accounts_receivable (organization_id);

create index idx_accounts_receivable_org_status
  on public.accounts_receivable (organization_id, status);

create index idx_accounts_receivable_org_due_date
  on public.accounts_receivable (organization_id, due_date);

create index idx_accounts_receivable_customer_id
  on public.accounts_receivable (customer_id)
  where customer_id is not null;

alter table public.accounts_receivable enable row level security;

create policy "accounts_receivable_select_member"
  on public.accounts_receivable for select
  using (public.is_member_of(organization_id));

create policy "accounts_receivable_insert_manager"
  on public.accounts_receivable for insert
  with check (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create policy "accounts_receivable_update_manager"
  on public.accounts_receivable for update
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create policy "accounts_receivable_delete_manager"
  on public.accounts_receivable for delete
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create trigger trg_accounts_receivable_updated_at
  before update on public.accounts_receivable
  for each row execute function public.update_updated_at();

-- =============================================================
-- 5. FINANCIAL TRANSACTIONS (IMMUTABLE LEDGER)
-- =============================================================
create table if not exists public.financial_transactions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations(id) on delete cascade,
  type            text not null
    constraint chk_ft_type check (
      type in ('sale', 'purchase', 'payment', 'receipt', 'manual', 'adjustment', 'reversal')
    ),
  direction       text not null
    constraint chk_ft_direction check (direction in ('in', 'out')),
  amount          numeric(14,2) not null
    constraint chk_ft_amount_positive check (amount > 0),
  category_id     uuid,
  cost_center_id  uuid,
  reference_type  text,
  reference_id    uuid,
  description     text not null
    constraint chk_ft_description_not_empty check (trim(description) <> ''),
  occurred_at     timestamptz not null default now(),
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),

  constraint uq_financial_transactions_org_id unique (organization_id, id)
);

-- Tenant-safe composite FKs for category and cost center
alter table public.financial_transactions
  add constraint fk_ft_category_tenant
  foreign key (category_id, organization_id)
  references public.financial_categories(id, organization_id)
  on delete set null;

alter table public.financial_transactions
  add constraint fk_ft_cost_center_tenant
  foreign key (cost_center_id, organization_id)
  references public.cost_centers(id, organization_id)
  on delete set null;

create index idx_financial_transactions_org_id
  on public.financial_transactions (organization_id);

create index idx_financial_transactions_org_occurred
  on public.financial_transactions (organization_id, occurred_at desc);

create index idx_financial_transactions_org_type
  on public.financial_transactions (organization_id, type);

create index idx_financial_transactions_org_direction
  on public.financial_transactions (organization_id, direction);

create index idx_financial_transactions_reference
  on public.financial_transactions (reference_type, reference_id)
  where reference_type is not null;

-- LEDGER: SELECT only. No UPDATE, No DELETE policies.
alter table public.financial_transactions enable row level security;

create policy "financial_transactions_select_member"
  on public.financial_transactions for select
  using (public.is_member_of(organization_id));

-- INSERT only via RPCs. No direct INSERT policy.
-- This ensures all ledger entries are server-authorized.

-- =============================================================
-- 6. RPC: pay_account_payable
-- =============================================================
-- Locks AP row, validates, updates, creates ledger entry atomically.

create or replace function public.pay_account_payable(
  p_ap_id        uuid,
  p_amount       numeric(14,2),
  p_category_id  uuid default null,
  p_cost_center_id uuid default null,
  p_notes        text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id     uuid;
  v_ap         record;
  v_new_paid   numeric(14,2);
  v_new_status text;
  v_user_id    uuid;
begin
  v_user_id := auth.uid();

  -- Lock AP row
  select * into v_ap
  from accounts_payable
  where id = p_ap_id
  for update;

  if not found then
    raise exception 'Conta a pagar não encontrada';
  end if;

  v_org_id := v_ap.organization_id;

  -- Auth
  if not is_member_of(v_org_id) then
    raise exception 'Não autorizado';
  end if;

  -- Role check
  if not (
    has_org_role(v_org_id, 'owner')
    or has_org_role(v_org_id, 'admin')
    or has_org_role(v_org_id, 'manager')
  ) then
    raise exception 'Sem permissão para pagar contas';
  end if;

  -- Validate status
  if v_ap.status in ('paid', 'cancelled') then
    raise exception 'Conta já % — impossível pagar', v_ap.status;
  end if;

  -- Validate amount
  if p_amount <= 0 then
    raise exception 'Valor deve ser maior que zero';
  end if;

  -- Prevent overpayment
  v_new_paid := v_ap.paid_amount + p_amount;
  if v_new_paid > v_ap.amount then
    raise exception 'Valor excede saldo pendente (R$ %)', to_char(v_ap.amount - v_ap.paid_amount, 'FM999G990D99');
  end if;

  -- Compute new status
  if v_new_paid >= v_ap.amount then
    v_new_status := 'paid';
  else
    v_new_status := 'partially_paid';
  end if;

  -- Update AP
  update accounts_payable
  set paid_amount = v_new_paid,
      status      = v_new_status,
      paid_at     = case when v_new_status = 'paid' then now() else paid_at end,
      notes       = case when p_notes is not null then p_notes else notes end,
      updated_at  = now()
  where id = p_ap_id;

  -- Create ledger entry (IMMUTABLE)
  insert into financial_transactions (
    organization_id, type, direction, amount, category_id, cost_center_id,
    reference_type, reference_id, description, occurred_at, created_by
  ) values (
    v_org_id, 'payment', 'out', p_amount,
    coalesce(p_category_id, v_ap.category_id),
    coalesce(p_cost_center_id, v_ap.cost_center_id),
    'accounts_payable', p_ap_id,
    'Pagamento: ' || v_ap.description,
    now(), v_user_id
  );

  return jsonb_build_object(
    'success', true,
    'paid_amount', v_new_paid,
    'status', v_new_status
  );
end;
$$;

-- =============================================================
-- 7. RPC: receive_account_receivable
-- =============================================================

create or replace function public.receive_account_receivable(
  p_ar_id          uuid,
  p_amount         numeric(14,2),
  p_category_id    uuid default null,
  p_cost_center_id uuid default null,
  p_notes          text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id      uuid;
  v_ar          record;
  v_new_received numeric(14,2);
  v_new_status  text;
  v_user_id     uuid;
begin
  v_user_id := auth.uid();

  -- Lock AR row
  select * into v_ar
  from accounts_receivable
  where id = p_ar_id
  for update;

  if not found then
    raise exception 'Conta a receber não encontrada';
  end if;

  v_org_id := v_ar.organization_id;

  -- Auth
  if not is_member_of(v_org_id) then
    raise exception 'Não autorizado';
  end if;

  -- Role check
  if not (
    has_org_role(v_org_id, 'owner')
    or has_org_role(v_org_id, 'admin')
    or has_org_role(v_org_id, 'manager')
  ) then
    raise exception 'Sem permissão para receber contas';
  end if;

  -- Validate status
  if v_ar.status in ('received', 'cancelled') then
    raise exception 'Conta já % — impossível receber', v_ar.status;
  end if;

  -- Validate amount
  if p_amount <= 0 then
    raise exception 'Valor deve ser maior que zero';
  end if;

  -- Prevent over-receipt
  v_new_received := v_ar.received_amount + p_amount;
  if v_new_received > v_ar.amount then
    raise exception 'Valor excede saldo pendente (R$ %)', to_char(v_ar.amount - v_ar.received_amount, 'FM999G990D99');
  end if;

  -- Compute new status
  if v_new_received >= v_ar.amount then
    v_new_status := 'received';
  else
    v_new_status := 'partially_received';
  end if;

  -- Update AR
  update accounts_receivable
  set received_amount = v_new_received,
      status          = v_new_status,
      received_at     = case when v_new_status = 'received' then now() else received_at end,
      notes           = case when p_notes is not null then p_notes else notes end,
      updated_at      = now()
  where id = p_ar_id;

  -- Create ledger entry (IMMUTABLE)
  insert into financial_transactions (
    organization_id, type, direction, amount, category_id, cost_center_id,
    reference_type, reference_id, description, occurred_at, created_by
  ) values (
    v_org_id, 'receipt', 'in', p_amount,
    coalesce(p_category_id, v_ar.category_id),
    coalesce(p_cost_center_id, v_ar.cost_center_id),
    'accounts_receivable', p_ar_id,
    'Recebimento: ' || v_ar.description,
    now(), v_user_id
  );

  return jsonb_build_object(
    'success', true,
    'received_amount', v_new_received,
    'status', v_new_status
  );
end;
$$;

-- =============================================================
-- 8. RPC: create_manual_financial_transaction
-- =============================================================

create or replace function public.create_manual_financial_transaction(
  p_org_id        uuid,
  p_direction     text,
  p_amount        numeric(14,2),
  p_description   text,
  p_category_id   uuid default null,
  p_cost_center_id uuid default null,
  p_occurred_at   timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();

  -- Auth
  if not is_member_of(p_org_id) then
    raise exception 'Não autorizado';
  end if;

  -- Role check
  if not (
    has_org_role(p_org_id, 'owner')
    or has_org_role(p_org_id, 'admin')
    or has_org_role(p_org_id, 'manager')
  ) then
    raise exception 'Sem permissão para lançamentos financeiros';
  end if;

  -- Validate
  if p_direction not in ('in', 'out') then
    raise exception 'Direção deve ser in ou out';
  end if;

  if p_amount <= 0 then
    raise exception 'Valor deve ser maior que zero';
  end if;

  if trim(p_description) = '' then
    raise exception 'Descrição não pode ser vazia';
  end if;

  -- Validate category belongs to org
  if p_category_id is not null then
    if not exists (
      select 1 from financial_categories
      where id = p_category_id and organization_id = p_org_id
    ) then
      raise exception 'Categoria não pertence a esta organização';
    end if;
  end if;

  -- Validate cost center belongs to org
  if p_cost_center_id is not null then
    if not exists (
      select 1 from cost_centers
      where id = p_cost_center_id and organization_id = p_org_id
    ) then
      raise exception 'Centro de custo não pertence a esta organização';
    end if;
  end if;

  -- Create ledger entry (IMMUTABLE)
  insert into financial_transactions (
    organization_id, type, direction, amount, category_id, cost_center_id,
    reference_type, reference_id, description, occurred_at, created_by
  ) values (
    p_org_id, 'manual', p_direction, p_amount,
    p_category_id, p_cost_center_id,
    null, null,
    p_description, p_occurred_at, v_user_id
  );

  return jsonb_build_object(
    'success', true,
    'id', (select id from financial_transactions
           where organization_id = p_org_id
           order by created_at desc limit 1)
  );
end;
$$;

-- =============================================================
-- 9. RPC: reverse_financial_transaction (for cancel operations)
-- =============================================================

create or replace function public.reverse_financial_transaction(
  p_original_id   uuid,
  p_description   text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_orig  record;
  v_user_id uuid;
  v_reversal_desc text;
begin
  v_user_id := auth.uid();

  select * into v_orig
  from financial_transactions
  where id = p_original_id;

  if not found then
    raise exception 'Transação não encontrada';
  end if;

  if not is_member_of(v_orig.organization_id) then
    raise exception 'Não autorizado';
  end if;

  if not (
    has_org_role(v_orig.organization_id, 'owner')
    or has_org_role(v_orig.organization_id, 'admin')
    or has_org_role(v_orig.organization_id, 'manager')
  ) then
    raise exception 'Sem permissão para estornar transações';
  end if;

  -- Cannot reverse a reversal
  if v_orig.type = 'reversal' then
    raise exception 'Não é possível estornar um estorno';
  end if;

  v_reversal_desc := coalesce(p_description, 'Estorno: ' || v_orig.description);

  -- Create reversal entry (IMMUTABLE)
  insert into financial_transactions (
    organization_id, type, direction, amount, category_id, cost_center_id,
    reference_type, reference_id, description, occurred_at, created_by
  ) values (
    v_orig.organization_id, 'reversal',
    case when v_orig.direction = 'in' then 'out' else 'in' end,
    v_orig.amount,
    v_orig.category_id, v_orig.cost_center_id,
    v_orig.reference_type, v_orig.reference_id,
    v_reversal_desc, now(), v_user_id
  );

  return jsonb_build_object('success', true);
end;
$$;

-- =============================================================
-- 10. RPC: finance_overview (for dashboard)
-- =============================================================

create or replace function public.finance_overview(
  p_org_id uuid,
  p_start_date date default null,
  p_end_date date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today       date := current_date;
  v_month_start date := date_trunc('month', v_today)::date;
  v_month_end   date := (date_trunc('month', v_today) + interval '1 month - 1 day')::date;
  v_result      jsonb;
begin
  if not is_member_of(p_org_id) then
    raise exception 'Não autorizado';
  end if;

  select jsonb_build_object(
    'today_in', coalesce(sum(case when direction = 'in' then amount else 0 end), 0),
    'today_out', coalesce(sum(case when direction = 'out' then amount else 0 end), 0),
    'month_in', 0,
    'month_out', 0,
    'open_payables', 0,
    'open_receivables', 0,
    'overdue_payables', 0,
    'overdue_receivables', 0
  ) into v_result
  from financial_transactions
  where organization_id = p_org_id
    and occurred_at::date = v_today;

  -- Month totals
  select jsonb_build_object(
    'today_in', (v_result->>'today_in')::numeric,
    'today_out', (v_result->>'today_out')::numeric,
    'month_in', coalesce(sum(case when direction = 'in' then amount else 0 end), 0),
    'month_out', coalesce(sum(case when direction = 'out' then amount else 0 end), 0),
    'open_payables', (v_result->>'open_payables')::numeric,
    'open_receivables', (v_result->>'open_receivables')::numeric,
    'overdue_payables', (v_result->>'overdue_payables')::numeric,
    'overdue_receivables', (v_result->>'overdue_receivables')::numeric
  ) into v_result
  from financial_transactions
  where organization_id = p_org_id
    and occurred_at::date between v_month_start and v_month_end;

  -- Open payables (pending + partially_paid)
  select jsonb_build_object(
    'today_in', (v_result->>'today_in')::numeric,
    'today_out', (v_result->>'today_out')::numeric,
    'month_in', (v_result->>'month_in')::numeric,
    'month_out', (v_result->>'month_out')::numeric,
    'open_payables', coalesce(sum(amount - paid_amount), 0),
    'open_receivables', (v_result->>'open_receivables')::numeric,
    'overdue_payables', (v_result->>'overdue_payables')::numeric,
    'overdue_receivables', (v_result->>'overdue_receivables')::numeric
  ) into v_result
  from accounts_payable
  where organization_id = p_org_id
    and status in ('pending', 'partially_paid');

  -- Open receivables
  select jsonb_build_object(
    'today_in', (v_result->>'today_in')::numeric,
    'today_out', (v_result->>'today_out')::numeric,
    'month_in', (v_result->>'month_in')::numeric,
    'month_out', (v_result->>'month_out')::numeric,
    'open_payables', (v_result->>'open_payables')::numeric,
    'open_receivables', coalesce(sum(amount - received_amount), 0),
    'overdue_payables', (v_result->>'overdue_payables')::numeric,
    'overdue_receivables', (v_result->>'overdue_receivables')::numeric
  ) into v_result
  from accounts_receivable
  where organization_id = p_org_id
    and status in ('pending', 'partially_received');

  -- Overdue payables
  select jsonb_build_object(
    'today_in', (v_result->>'today_in')::numeric,
    'today_out', (v_result->>'today_out')::numeric,
    'month_in', (v_result->>'month_in')::numeric,
    'month_out', (v_result->>'month_out')::numeric,
    'open_payables', (v_result->>'open_payables')::numeric,
    'open_receivables', (v_result->>'open_receivables')::numeric,
    'overdue_payables', coalesce(sum(amount - paid_amount), 0),
    'overdue_receivables', (v_result->>'overdue_receivables')::numeric
  ) into v_result
  from accounts_payable
  where organization_id = p_org_id
    and status in ('pending', 'partially_paid')
    and due_date < v_today;

  -- Overdue receivables
  select jsonb_build_object(
    'today_in', (v_result->>'today_in')::numeric,
    'today_out', (v_result->>'today_out')::numeric,
    'month_in', (v_result->>'month_in')::numeric,
    'month_out', (v_result->>'month_out')::numeric,
    'open_payables', (v_result->>'open_payables')::numeric,
    'open_receivables', (v_result->>'open_receivables')::numeric,
    'overdue_payables', (v_result->>'overdue_payables')::numeric,
    'overdue_receivables', coalesce(sum(amount - received_amount), 0)
  ) into v_result
  from accounts_receivable
  where organization_id = p_org_id
    and status in ('pending', 'partially_received')
    and due_date < v_today;

  return v_result;
end;
$$;

-- =============================================================
-- 11. RPC: finance_cashflow_chart (daily data for chart)
-- =============================================================

create or replace function public.finance_cashflow_chart(
  p_org_id  uuid,
  p_days    integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start date := (current_date - (p_days || ' days')::interval)::date;
begin
  if not is_member_of(p_org_id) then
    raise exception 'Não autorizado';
  end if;

  return (
    select coalesce(jsonb_agg(
      jsonb_build_object(
        'date', d.day,
        'in', coalesce(inc.total_in, 0),
        'out', coalesce(out.total_out, 0)
      ) order by d.day
    ), '[]'::jsonb)
    from (
      select generate_series(v_start, current_date, '1 day'::interval)::date as day
    ) d
    left join lateral (
      select sum(amount) as total_in
      from financial_transactions
      where organization_id = p_org_id
        and direction = 'in'
        and occurred_at::date = d.day
    ) inc on true
    left join lateral (
      select sum(amount) as total_out
      from financial_transactions
      where organization_id = p_org_id
        and direction = 'out'
        and occurred_at::date = d.day
    ) out on true
  );
end;
$$;

-- =============================================================
-- 12. RPC: finance_dre (simplified DRE)
-- =============================================================

create or replace function public.finance_dre(
  p_org_id     uuid,
  p_start_date date,
  p_end_date   date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_revenue_in      numeric(14,2);
  v_revenue_out     numeric(14,2);
  v_expenses_in     numeric(14,2);
  v_expenses_out    numeric(14,2);
  v_manual_in       numeric(14,2);
  v_manual_out      numeric(14,2);
begin
  if not is_member_of(p_org_id) then
    raise exception 'Não autorizado';
  end if;

  -- Sales revenue (in)
  select coalesce(sum(amount), 0) into v_revenue_in
  from financial_transactions
  where organization_id = p_org_id
    and type = 'sale'
    and direction = 'in'
    and occurred_at::date between p_start_date and p_end_date;

  -- Reversals of sales (out)
  select coalesce(sum(amount), 0) into v_revenue_out
  from financial_transactions
  where organization_id = p_org_id
    and type = 'reversal'
    and direction = 'out'
    and reference_type = 'sale'
    and occurred_at::date between p_start_date and p_end_date;

  -- Purchase expenses (out)
  select coalesce(sum(amount), 0) into v_expenses_out
  from financial_transactions
  where organization_id = p_org_id
    and type = 'purchase'
    and direction = 'out'
    and occurred_at::date between p_start_date and p_end_date;

  -- Reversals of purchases (in)
  select coalesce(sum(amount), 0) into v_expenses_in
  from financial_transactions
  where organization_id = p_org_id
    and type = 'reversal'
    and direction = 'in'
    and reference_type = 'purchase'
    and occurred_at::date between p_start_date and p_end_date;

  -- Manual income
  select coalesce(sum(amount), 0) into v_manual_in
  from financial_transactions
  where organization_id = p_org_id
    and type = 'manual'
    and direction = 'in'
    and occurred_at::date between p_start_date and p_end_date;

  -- Manual expenses
  select coalesce(sum(amount), 0) into v_manual_out
  from financial_transactions
  where organization_id = p_org_id
    and type = 'manual'
    and direction = 'out'
    and occurred_at::date between p_start_date and p_end_date;

  return jsonb_build_object(
    'revenue_gross', v_revenue_in,
    'revenue_reversals', v_revenue_out,
    'revenue_net', v_revenue_in - v_revenue_out,
    'cogs_estimated', v_expenses_out - v_expenses_in,
    'operating_expenses_manual', v_manual_out - v_manual_in,
    'operating_result', (v_revenue_in - v_revenue_out)
                        - (v_expenses_out - v_expenses_in)
                        - (v_manual_out - v_manual_in)
  );
end;
$$;

-- =============================================================
-- 13. RPC: finance_category_summary
-- =============================================================

create or replace function public.finance_category_summary(
  p_org_id     uuid,
  p_start_date date,
  p_end_date   date,
  p_type       text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_member_of(p_org_id) then
    raise exception 'Não autorizado';
  end if;

  return (
    select coalesce(jsonb_agg(
      jsonb_build_object(
        'category_id', ft.category_id,
        'category_name', coalesce(fc.name, 'Sem categoria'),
        'direction', ft.direction,
        'total', sum(ft.amount)
      ) order by sum(ft.amount) desc
    ), '[]'::jsonb)
    from financial_transactions ft
    left join financial_categories fc
      on fc.id = ft.category_id and fc.organization_id = ft.organization_id
    where ft.organization_id = p_org_id
      and ft.occurred_at::date between p_start_date and p_end_date
      and (p_type is null or fc.type = p_type)
    group by ft.category_id, fc.name, ft.direction
  );
end;
$$;

-- =============================================================
-- 14. RPC: finance_payment_method_summary
-- =============================================================

create or replace function public.finance_payment_method_summary(
  p_org_id     uuid,
  p_start_date date,
  p_end_date   date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_member_of(p_org_id) then
    raise exception 'Não autorizado';
  end if;

  return (
    select coalesce(jsonb_agg(
      jsonb_build_object(
        'method', sp.method,
        'total', sum(sp.amount),
        'count', count(*)
      ) order by sum(sp.amount) desc
    ), '[]'::jsonb)
    from sales_payments sp
    join sales_orders so on so.id = sp.sales_order_id
    where so.organization_id = p_org_id
      and sp.status = 'confirmed'
      and sp.created_at::date between p_start_date and p_end_date
  );
end;
$$;
