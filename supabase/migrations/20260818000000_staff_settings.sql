-- =============================================================
-- Toasty OS — Phase 12: Staff + Settings Real
-- Migration: 20260818000000_staff_settings.sql
-- =============================================================

-- =============================================================
-- 1. ORGANIZATION INVITES
-- =============================================================
create table if not exists public.organization_invites (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email           text not null,
  role            public.org_role not null default 'staff',
  token_hash      text not null,
  expires_at      timestamptz not null,
  accepted_at     timestamptz,
  invited_by      uuid not null references auth.users(id) on delete cascade,
  created_at      timestamptz not null default now()
);

-- Unique: one pending invite per email per org
create unique index if not exists uq_invite_org_email_pending
  on public.organization_invites (organization_id, lower(email))
  where accepted_at is null;

alter table public.organization_invites enable row level security;

-- RLS: owner/admin can manage invites in their org
create policy "invites_select_owner_admin"
  on public.organization_invites for select
  using (
    public.has_org_role(organization_id, 'owner')
    or public.has_org_role(organization_id, 'admin')
  );

create policy "invites_insert_owner_admin"
  on public.organization_invites for insert
  with check (
    public.has_org_role(organization_id, 'owner')
    or public.has_org_role(organization_id, 'admin')
  );

create policy "invites_update_owner_admin"
  on public.organization_invites for update
  using (
    public.has_org_role(organization_id, 'owner')
    or public.has_org_role(organization_id, 'admin')
  );

create policy "invites_delete_owner_admin"
  on public.organization_invites for delete
  using (
    public.has_org_role(organization_id, 'owner')
    or public.has_org_role(organization_id, 'admin')
  );

-- =============================================================
-- 2. ORGANIZATION SETTINGS
-- =============================================================
create table if not exists public.organization_settings (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade unique,
  phone           text,
  email           text,
  address         text,
  timezone        text not null default 'America/Sao_Paulo',
  currency        text not null default 'BRL',
  locale          text not null default 'pt-BR',
  updated_at      timestamptz not null default now()
);

alter table public.organization_settings enable row level security;

-- RLS: all members can read, owner/admin can update
create policy "org_settings_select_member"
  on public.organization_settings for select
  using (public.is_member_of(organization_id));

create policy "org_settings_insert_owner_admin"
  on public.organization_settings for insert
  with check (
    public.has_org_role(organization_id, 'owner')
    or public.has_org_role(organization_id, 'admin')
  );

create policy "org_settings_update_owner_admin"
  on public.organization_settings for update
  using (
    public.has_org_role(organization_id, 'owner')
    or public.has_org_role(organization_id, 'admin')
  );

-- =============================================================
-- 3. ORGANIZATION BUSINESS HOURS
-- =============================================================
create table if not exists public.organization_business_hours (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  weekday         integer not null check (weekday between 0 and 6),
  is_open         boolean not null default true,
  open_time       time not null default '09:00',
  close_time      time not null default '22:00',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- One entry per weekday per org
  constraint uq_org_business_hours_weekday
    unique (organization_id, weekday)
);

alter table public.organization_business_hours enable row level security;

-- RLS: all members can read, owner/admin/manager can update
create policy "business_hours_select_member"
  on public.organization_business_hours for select
  using (public.is_member_of(organization_id));

create policy "business_hours_insert_owner_admin_manager"
  on public.organization_business_hours for insert
  with check (
    public.has_org_role(organization_id, 'owner')
    or public.has_org_role(organization_id, 'admin')
    or public.has_org_role(organization_id, 'manager')
  );

create policy "business_hours_update_owner_admin_manager"
  on public.organization_business_hours for update
  using (
    public.has_org_role(organization_id, 'owner')
    or public.has_org_role(organization_id, 'admin')
    or public.has_org_role(organization_id, 'manager')
  );

create policy "business_hours_delete_owner_admin_manager"
  on public.organization_business_hours for delete
  using (
    public.has_org_role(organization_id, 'owner')
    or public.has_org_role(organization_id, 'admin')
    or public.has_org_role(organization_id, 'manager')
  );

-- =============================================================
-- 4. TRIGGER: update_updated_at on new tables
-- =============================================================
create trigger organization_settings_updated_at
  before update on public.organization_settings
  for each row
  execute function public.update_updated_at();

create trigger organization_business_hours_updated_at
  before update on public.organization_business_hours
  for each row
  execute function public.update_updated_at();

-- =============================================================
-- 5. RPC: invite_organization_member
-- =============================================================
create or replace function public.invite_organization_member(
  p_org_id uuid,
  p_email text,
  p_role public.org_role
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid;
  v_caller_role public.org_role;
  v_invite_id uuid;
  v_token text;
  v_token_hash text;
  v_role_hierarchy int;
  v_caller_hierarchy int;
begin
  -- Validate caller
  v_caller_id := auth.uid();
  if v_caller_id is null then
    raise exception 'Não autenticado';
  end if;

  -- Validate caller is member of this org
  if not public.is_member_of(p_org_id) then
    raise exception 'Não é membro desta organização';
  end if;

  -- Get caller role
  select role into v_caller_role
  from public.organization_members
  where organization_id = p_org_id and user_id = v_caller_id;

  -- Only owner/admin can invite
  if v_caller_role not in ('owner', 'admin') then
    raise exception 'Sem permissão para convidar membros';
  end if;

  -- Manager cannot invite admin/owner
  if v_caller_role = 'admin' and p_role in ('owner', 'admin') then
    raise exception 'Admin não pode convidar para roles admin ou owner';
  end if;

  -- Role hierarchy: caller cannot invite someone to a role >= their own
  -- owner=1, admin=2, manager=3, staff=4
  v_role_hierarchy := case p_role
    when 'owner' then 1
    when 'admin' then 2
    when 'manager' then 3
    when 'staff' then 4
  end;
  v_caller_hierarchy := case v_caller_role
    when 'owner' then 1
    when 'admin' then 2
    when 'manager' then 3
    when 'staff' then 4
  end;

  if v_role_hierarchy < v_caller_hierarchy then
    raise exception 'Não é possível convidar para uma role superior à sua';
  end if;

  -- Check if user already exists in this org
  if exists (
    select 1 from public.organization_members
    where organization_id = p_org_id
      and user_id in (select id from auth.users where lower(email) = lower(p_email))
  ) then
    raise exception 'Usuário já é membro desta organização';
  end if;

  -- Check for existing pending invite
  if exists (
    select 1 from public.organization_invites
    where organization_id = p_org_id
      and lower(email) = lower(p_email)
      and accepted_at is null
      and expires_at > now()
  ) then
    raise exception 'Convite pendente já existe para este e-mail';
  end if;

  -- Generate token (random bytes → hex)
  -- Use extensions.gen_random_bytes if pgcrypto available, else fallback to uuid-based
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_token_hash := encode(extensions.digest(v_token, 'sha256'), 'hex');

  -- Create invite
  insert into public.organization_invites (
    organization_id, email, role, token_hash, expires_at, invited_by
  ) values (
    p_org_id, lower(p_email), p_role,
    v_token_hash,
    now() + interval '7 days',
    v_caller_id
  ) returning id into v_invite_id;

  return v_invite_id;
end;
$$;

-- =============================================================
-- 6. RPC: accept_organization_invite
-- =============================================================
create or replace function public.accept_organization_invite(
  p_token text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid;
  v_caller_email text;
  v_invite record;
  v_member_id uuid;
  v_token_hash text;
begin
  v_caller_id := auth.uid();
  if v_caller_id is null then
    raise exception 'Não autenticado';
  end if;

  select email into v_caller_email
  from auth.users
  where id = v_caller_id;

  v_token_hash := encode(digest(p_token, 'sha256'), 'hex');

  select * into v_invite
  from public.organization_invites
  where token_hash = v_token_hash
    and accepted_at is null
    and expires_at > now();

  if v_invite is null then
    raise exception 'Convite inválido ou expirado';
  end if;

  if lower(v_caller_email) != lower(v_invite.email) then
    raise exception 'Este convite não é para o seu e-mail';
  end if;

  if exists (
    select 1 from public.organization_members
    where organization_id = v_invite.organization_id
      and user_id = v_caller_id
  ) then
    raise exception 'Você já é membro desta organização';
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (v_invite.organization_id, v_caller_id, v_invite.role)
  returning id into v_member_id;

  update public.organization_invites
  set accepted_at = now()
  where id = v_invite.id;

  return v_member_id;
end;
$$;

-- =============================================================
-- 7. RPC: cancel_organization_invite
-- =============================================================
create or replace function public.cancel_organization_invite(
  p_invite_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid;
  v_invite record;
begin
  v_caller_id := auth.uid();
  if v_caller_id is null then
    raise exception 'Não autenticado';
  end if;

  select * into v_invite
  from public.organization_invites
  where id = p_invite_id;

  if v_invite is null then
    raise exception 'Convite não encontrado';
  end if;

  if not (
    public.has_org_role(v_invite.organization_id, 'owner')
    or public.has_org_role(v_invite.organization_id, 'admin')
  ) then
    raise exception 'Sem permissão para cancelar convites';
  end if;

  delete from public.organization_invites
  where id = p_invite_id;

  return true;
end;
$$;

-- =============================================================
-- 8. RPC: change_organization_member_role
-- =============================================================
create or replace function public.change_organization_member_role(
  p_org_id uuid,
  p_member_id uuid,
  p_new_role public.org_role
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid;
  v_caller_role public.org_role;
  v_target_role public.org_role;
  v_target_user_id uuid;
  v_role_hierarchy int;
  v_caller_hierarchy int;
  v_owner_count int;
  v_new_role_hierarchy int;
begin
  v_caller_id := auth.uid();
  if v_caller_id is null then
    raise exception 'Não autenticado';
  end if;

  if not public.is_member_of(p_org_id) then
    raise exception 'Não é membro desta organização';
  end if;

  select role into v_caller_role
  from public.organization_members
  where organization_id = p_org_id and user_id = v_caller_id;

  if v_caller_role not in ('owner', 'admin') then
    raise exception 'Sem permissão para alterar roles';
  end if;

  select role, user_id into v_target_role, v_target_user_id
  from public.organization_members
  where id = p_member_id and organization_id = p_org_id;

  if v_target_role is null then
    raise exception 'Membro não encontrado';
  end if;

  if v_target_user_id = v_caller_id then
    raise exception 'Não é possível alterar a própria role';
  end if;

  v_caller_hierarchy := case v_caller_role
    when 'owner' then 1 when 'admin' then 2 when 'manager' then 3 when 'staff' then 4
  end;
  v_new_role_hierarchy := case p_new_role
    when 'owner' then 1 when 'admin' then 2 when 'manager' then 3 when 'staff' then 4
  end;
  v_role_hierarchy := case v_target_role
    when 'owner' then 1 when 'admin' then 2 when 'manager' then 3 when 'staff' then 4
  end;

  if v_new_role_hierarchy < v_caller_hierarchy then
    raise exception 'Não é possível promover para uma role superior à sua';
  end if;

  if v_role_hierarchy < v_caller_hierarchy then
    raise exception 'Não é possível alterar a role de alguém com role superior ou igual à sua';
  end if;

  if v_caller_role = 'admin' then
    if v_target_role = 'owner' or p_new_role = 'owner' then
      raise exception 'Admin não pode alterar roles de owner ou promover para owner';
    end if;
  end if;

  if v_target_role = 'owner' and p_new_role != 'owner' then
    select count(*) into v_owner_count
    from public.organization_members
    where organization_id = p_org_id and role = 'owner';

    if v_owner_count <= 1 then
      raise exception 'Não é possível rebaixar o último owner';
    end if;
  end if;

  update public.organization_members
  set role = p_new_role
  where id = p_member_id and organization_id = p_org_id;

  return true;
end;
$$;

-- =============================================================
-- 9. RPC: remove_organization_member
-- =============================================================
create or replace function public.remove_organization_member(
  p_org_id uuid,
  p_member_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid;
  v_caller_role public.org_role;
  v_target_role public.org_role;
  v_target_user_id uuid;
  v_owner_count int;
  v_role_hierarchy int;
  v_caller_hierarchy int;
begin
  v_caller_id := auth.uid();
  if v_caller_id is null then
    raise exception 'Não autenticado';
  end if;

  if not public.is_member_of(p_org_id) then
    raise exception 'Não é membro desta organização';
  end if;

  select role into v_caller_role
  from public.organization_members
  where organization_id = p_org_id and user_id = v_caller_id;

  if v_caller_role not in ('owner', 'admin') then
    raise exception 'Sem permissão para remover membros';
  end if;

  select role, user_id into v_target_role, v_target_user_id
  from public.organization_members
  where id = p_member_id and organization_id = p_org_id;

  if v_target_role is null then
    raise exception 'Membro não encontrado';
  end if;

  if v_target_user_id = v_caller_id then
    raise exception 'Não é possível remover a si mesmo';
  end if;

  v_caller_hierarchy := case v_caller_role
    when 'owner' then 1 when 'admin' then 2 when 'manager' then 3 when 'staff' then 4
  end;
  v_role_hierarchy := case v_target_role
    when 'owner' then 1 when 'admin' then 2 when 'manager' then 3 when 'staff' then 4
  end;

  if v_role_hierarchy < v_caller_hierarchy then
    raise exception 'Não é possível remover alguém com role superior ou igual à sua';
  end if;

  if v_caller_role = 'admin' and v_target_role = 'owner' then
    raise exception 'Admin não pode remover owner';
  end if;

  if v_target_role = 'owner' then
    select count(*) into v_owner_count
    from public.organization_members
    where organization_id = p_org_id and role = 'owner';

    if v_owner_count <= 1 then
      raise exception 'Não é possível remover o último owner';
    end if;
  end if;

  delete from public.organization_members
  where id = p_member_id and organization_id = p_org_id;

  return true;
end;
$$;

-- =============================================================
-- 10. RPC: update_organization_settings
-- =============================================================
create or replace function public.update_organization_settings(
  p_org_id uuid,
  p_name text default null,
  p_phone text default null,
  p_email text default null,
  p_address text default null,
  p_timezone text default null,
  p_currency text default null,
  p_locale text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid;
begin
  v_caller_id := auth.uid();
  if v_caller_id is null then
    raise exception 'Não autenticado';
  end if;

  if not (
    public.has_org_role(p_org_id, 'owner')
    or public.has_org_role(p_org_id, 'admin')
  ) then
    raise exception 'Sem permissão para editar configurações';
  end if;

  if p_name is not null then
    update public.organizations
    set name = p_name
    where id = p_org_id;
  end if;

  insert into public.organization_settings (
    organization_id, phone, email, address, timezone, currency, locale
  ) values (
    p_org_id,
    coalesce(p_phone, ''),
    coalesce(p_email, ''),
    coalesce(p_address, ''),
    coalesce(p_timezone, 'America/Sao_Paulo'),
    coalesce(p_currency, 'BRL'),
    coalesce(p_locale, 'pt-BR')
  )
  on conflict (organization_id) do update set
    phone = coalesce(p_phone, organization_settings.phone),
    email = coalesce(p_email, organization_settings.email),
    address = coalesce(p_address, organization_settings.address),
    timezone = coalesce(p_timezone, organization_settings.timezone),
    currency = coalesce(p_currency, organization_settings.currency),
    locale = coalesce(p_locale, organization_settings.locale);

  return true;
end;
$$;

-- =============================================================
-- 11. RPC: update_organization_business_hours
-- =============================================================
create or replace function public.update_organization_business_hours(
  p_org_id uuid,
  p_weekday integer,
  p_is_open boolean,
  p_open_time time default '09:00',
  p_close_time time default '22:00'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid;
begin
  v_caller_id := auth.uid();
  if v_caller_id is null then
    raise exception 'Não autenticado';
  end if;

  if not (
    public.has_org_role(p_org_id, 'owner')
    or public.has_org_role(p_org_id, 'admin')
    or public.has_org_role(p_org_id, 'manager')
  ) then
    raise exception 'Sem permissão para editar horários';
  end if;

  if p_weekday < 0 or p_weekday > 6 then
    raise exception 'Dia da semana inválido (0-6)';
  end if;

  insert into public.organization_business_hours (
    organization_id, weekday, is_open, open_time, close_time
  ) values (
    p_org_id, p_weekday, p_is_open, p_open_time, p_close_time
  )
  on conflict (organization_id, weekday) do update set
    is_open = p_is_open,
    open_time = p_open_time,
    close_time = p_close_time;

  return true;
end;
$$;

-- =============================================================
-- 12. RPC: update_own_profile
-- =============================================================
create or replace function public.update_own_profile(
  p_full_name text default null,
  p_avatar_url text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid;
begin
  v_caller_id := auth.uid();
  if v_caller_id is null then
    raise exception 'Não autenticado';
  end if;

  update public.profiles
  set
    full_name = coalesce(p_full_name, full_name),
    avatar_url = coalesce(p_avatar_url, avatar_url)
  where id = v_caller_id;

  return true;
end;
$$;

-- =============================================================
-- 13. GRANTS (Data API)
-- =============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_invites TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.organization_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_business_hours TO authenticated;

REVOKE ALL ON public.organization_invites FROM anon;
REVOKE ALL ON public.organization_settings FROM anon;
REVOKE ALL ON public.organization_business_hours FROM anon;

REVOKE EXECUTE ON FUNCTION public.invite_organization_member FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.accept_organization_invite FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cancel_organization_invite FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.change_organization_member_role FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.remove_organization_member FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_organization_settings FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_organization_business_hours FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_own_profile FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.invite_organization_member TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_organization_invite TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_organization_invite TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_organization_member_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_organization_member TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_organization_settings TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_organization_business_hours TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_own_profile TO authenticated;

-- =============================================================
-- 14. SCHEMA CACHE RELOAD
-- =============================================================
NOTIFY pgrst, 'reload schema';
