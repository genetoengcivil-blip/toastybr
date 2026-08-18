-- =============================================================
-- Toasty OS — Ingredients + Recipes + Costs
-- Migration: 20260817090002_ingredients_recipes_costs.sql
-- =============================================================

-- =============================================================
-- 1. INGREDIENTS
-- =============================================================
create table if not exists public.ingredients (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations(id) on delete cascade,
  name            text not null,
  description     text,
  unit            text not null
    constraint chk_ingredients_unit check (
      unit in ('g','kg','ml','l','un','cx','pct')
    ),
  cost_per_unit   numeric(14,4) not null default 0
    constraint chk_ingredients_cost_non_negative check (cost_per_unit >= 0),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint uq_ingredients_org_name unique (organization_id, name),
  constraint uq_ingredients_org_id unique (organization_id, id),
  constraint chk_ingredients_name_length check (char_length(trim(name)) between 1 and 120)
);

alter table public.ingredients enable row level security;

create index if not exists idx_ingredients_org_id
  on public.ingredients (organization_id);

create index if not exists idx_ingredients_org_active
  on public.ingredients (organization_id, is_active);

-- =============================================================
-- 2. PRODUCT RECIPE ITEMS
-- =============================================================
create table if not exists public.product_recipe_items (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations(id) on delete cascade,
  product_id      uuid not null,
  ingredient_id   uuid not null,
  quantity        numeric(14,4) not null
    constraint chk_recipe_items_quantity_positive check (quantity > 0),
  waste_percent   numeric(7,4) not null default 0
    constraint chk_recipe_items_waste_range check (waste_percent >= 0 and waste_percent <= 100),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint uq_recipe_items_org_product_ingredient
    unique (organization_id, product_id, ingredient_id)
);

-- Cross-tenant composite FKs
alter table public.product_recipe_items
  add constraint fk_recipe_item_product_tenant
  foreign key (product_id, organization_id)
  references public.products(id, organization_id)
  on delete cascade;

alter table public.product_recipe_items
  add constraint fk_recipe_item_ingredient_tenant
  foreign key (ingredient_id, organization_id)
  references public.ingredients(id, organization_id)
  on delete restrict;

alter table public.product_recipe_items enable row level security;

create index if not exists idx_recipe_items_org_id
  on public.product_recipe_items (organization_id);

create index if not exists idx_recipe_items_product_id
  on public.product_recipe_items (product_id);

create index if not exists idx_recipe_items_ingredient_id
  on public.product_recipe_items (ingredient_id);

-- =============================================================
-- 3. RLS: INGREDIENTS
-- =============================================================
create policy "ingredients_select_member"
  on public.ingredients for select
  using (public.is_member_of(organization_id));

create policy "ingredients_insert_member"
  on public.ingredients for insert
  with check (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create policy "ingredients_update_member"
  on public.ingredients for update
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create policy "ingredients_delete_member"
  on public.ingredients for delete
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

-- =============================================================
-- 4. RLS: PRODUCT RECIPE ITEMS
-- =============================================================
create policy "recipe_items_select_member"
  on public.product_recipe_items for select
  using (public.is_member_of(organization_id));

create policy "recipe_items_insert_member"
  on public.product_recipe_items for insert
  with check (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create policy "recipe_items_update_member"
  on public.product_recipe_items for update
  using (
    public.is_member_of(organization_id)
    and (
      public.has_org_role(organization_id, 'owner')
      or public.has_org_role(organization_id, 'admin')
      or public.has_org_role(organization_id, 'manager')
    )
  );

create policy "recipe_items_delete_member"
  on public.product_recipe_items for delete
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
create trigger ingredients_updated_at
  before update on public.ingredients
  for each row
  execute function public.update_updated_at();

create trigger product_recipe_items_updated_at
  before update on public.product_recipe_items
  for each row
  execute function public.update_updated_at();
