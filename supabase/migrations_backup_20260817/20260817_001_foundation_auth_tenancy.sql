-- =============================================================
-- Toasty OS — Foundation: Auth + Multi-Tenancy
-- Migration: 20260817_001_foundation_auth_tenancy.sql
-- Status: CRIADA — NÃO APLICADA
-- =============================================================

-- =============================================================
-- 1. PROFILES
-- =============================================================
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- RLS: user can read/edit only their own profile
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- =============================================================
-- 2. ORGANIZATIONS
-- =============================================================
create table if not exists public.organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organizations enable row level security;

-- =============================================================
-- 3. ORGANIZATION_MEMBERS
-- =============================================================
-- Idempotent enum creation
do $$
begin
  if not exists (select 1 from pg_type where typname = 'org_role') then
    create type public.org_role as enum ('owner', 'admin', 'manager', 'staff');
  end if;
end
$$;

create table if not exists public.organization_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            public.org_role not null default 'staff',
  created_at      timestamptz not null default now(),
  unique (organization_id, user_id)
);

alter table public.organization_members enable row level security;

-- Indexes for membership lookups (used by RLS helpers and getUserOrganizations)
create index if not exists idx_organization_members_user_id
  on public.organization_members (user_id);

create index if not exists idx_organization_members_organization_id
  on public.organization_members (organization_id);

-- =============================================================
-- 4. HELPER: check if user is member of an organization
-- =============================================================
-- SECURITY DEFINER to bypass RLS on organization_members.
-- set search_path = public to prevent search_path injection.
-- stable: result is constant within a single statement.
create or replace function public.is_member_of(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = org_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(org_id uuid, required_role public.org_role)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = org_id
      and user_id = auth.uid()
      and role = required_role
  );
$$;

-- =============================================================
-- 5. RLS: ORGANIZATIONS
-- =============================================================
-- User can only read orgs they belong to.
-- No INSERT/UPDATE/DELETE policies: org creation is via RPC only.
create policy "organizations_select_member"
  on public.organizations for select
  using (public.is_member_of(id));

-- =============================================================
-- 6. RLS: ORGANIZATION_MEMBERS
-- =============================================================
-- User can read members of orgs they belong to
create policy "organization_members_select_member"
  on public.organization_members for select
  using (public.is_member_of(organization_id));

-- Owner/admin can insert members into their orgs.
-- Note: create_organization() RPC uses SECURITY DEFINER and bypasses RLS,
-- so this policy does NOT apply to the initial owner membership creation.
create policy "organization_members_insert_owner_admin"
  on public.organization_members for insert
  with check (
    public.has_org_role(organization_id, 'owner')
    or public.has_org_role(organization_id, 'admin')
  );

-- Owner/admin can update members in their orgs
create policy "organization_members_update_owner_admin"
  on public.organization_members for update
  using (
    public.has_org_role(organization_id, 'owner')
    or public.has_org_role(organization_id, 'admin')
  );

-- Owner can delete members from their orgs
create policy "organization_members_delete_owner"
  on public.organization_members for delete
  using (public.has_org_role(organization_id, 'owner'));

-- =============================================================
-- 7. TRIGGER: auto-create profile on user signup
-- =============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', null));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- =============================================================
-- 8. TRIGGER: update updated_at on profiles and organizations
-- =============================================================
create or replace function public.update_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.update_updated_at();

create trigger organizations_updated_at
  before update on public.organizations
  for each row
  execute function public.update_updated_at();

-- =============================================================
-- 9. RPC: create organization + membership in one transaction
-- =============================================================
-- SECURITY DEFINER: bypasses RLS to insert org + owner membership.
-- auth.uid() is used internally — user_id is NOT accepted from frontend.
-- PL/pgSQL ensures atomicity: if either insert fails, both roll back.
create or replace function public.create_organization(
  org_name text,
  org_slug text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  insert into public.organizations (name, slug)
  values (org_name, org_slug)
  returning id into new_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, auth.uid(), 'owner');

  return new_org_id;
end;
$$;
