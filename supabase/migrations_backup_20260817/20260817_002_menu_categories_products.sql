-- =============================================================
-- Toasty OS — Menu: Categories + Products (revised)
-- Migration: 20260817_002_menu_categories_products.sql
-- =============================================================

-- =============================================================
-- 1. MENU CATEGORIES
-- =============================================================
create table if not exists public.menu_categories (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations(id) on delete cascade,
  name            text not null,
  description     text,
  sort_order      integer not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint uq_menu_categories_org_name unique (organization_id, name),
  constraint chk_menu_categories_name_length check (char_length(name) between 1 and 120),
  constraint chk_menu_categories_sort_order_non_negative check (sort_order >= 0)
);

alter table public.menu_categories enable row level security;

create index if not exists idx_menu_categories_org_id
  on public.menu_categories (organization_id);

create index if not exists idx_menu_categories_org_sort
  on public.menu_categories (organization_id, sort_order);

-- =============================================================
-- 2. PRODUCTS
-- =============================================================
create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations(id) on delete cascade,
  category_id     uuid
    references public.menu_categories(id) on delete set null,
  name            text not null,
  description     text,
  price           numeric(12,2) not null,
  image_url       text,
  sku             text,
  is_active       boolean not null default true,
  is_available    boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint chk_products_name_length check (char_length(name) between 1 and 200),
  constraint chk_products_price_non_negative check (price >= 0),
  constraint chk_products_sort_order_non_negative check (sort_order >= 0)
);

-- Cross-tenant composite FK protection:
-- category_id must belong to the same organization as the product
alter table public.products
  add constraint fk_products_category_org
  check (
    category_id is null
    or exists (
      select 1 from public.menu_categories mc
      where mc.id = category_id
        and mc.organization_id = organization_id
    )
  );

alter table public.products enable row level security;

-- Unique partial index: SKU must be unique within an organization (when not null)
create unique index if not exists uq_products_org_sku
  on public.products (organization_id, sku)
  where sku is not null;

create index if not exists idx_products_org_id
  on public.products (organization_id);

create index if not exists idx_products_category_id
  on public.products (category_id);

create index if not exists idx_products_org_active
  on public.products (organization_id, is_active);

create index if not exists idx_products_org_available
  on public.products (organization_id, is_available);

-- =============================================================
-- 3. RLS: MENU CATEGORIES
-- =============================================================
create policy "menu_categories_select_member"
  on public.menu_categories for select
  using (public.is_member_of(organization_id));

create policy "menu_categories_insert_member"
  on public.menu_categories for insert
  with check (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create policy "menu_categories_update_member"
  on public.menu_categories for update
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create policy "menu_categories_delete_member"
  on public.menu_categories for delete
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

-- =============================================================
-- 4. RLS: PRODUCTS
-- =============================================================
create policy "products_select_member"
  on public.products for select
  using (public.is_member_of(organization_id));

create policy "products_insert_member"
  on public.products for insert
  with check (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create policy "products_update_member"
  on public.products for update
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create policy "products_delete_member"
  on public.products for delete
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

-- =============================================================
-- 5. TRIGGERS: update updated_at
-- =============================================================
create trigger menu_categories_updated_at
  before update on public.menu_categories
  for each row
  execute function public.update_updated_at();

create trigger products_updated_at
  before update on public.products
  for each row
  execute function public.update_updated_at();
