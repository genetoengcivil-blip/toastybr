-- =============================================================
-- Toasty OS — Phase 12: Fix pgcrypto for invite RPC
-- Migration: 20260818000001_fix_invite_pgcrypto.sql
-- =============================================================

-- Ensure pgcrypto is available (needed for gen_random_bytes + digest)
-- In Supabase, pgcrypto is usually in the extensions schema
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Recreate invite RPC with extensions-qualified functions
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

  -- Admin cannot invite admin/owner
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

  -- Generate token (random bytes → hex) using extensions schema
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

-- Recreate accept invite RPC with extensions-qualified digest
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

  v_token_hash := encode(extensions.digest(p_token, 'sha256'), 'hex');

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

-- Recreate update_own_profile with extensions-qualified functions
create or replace function public.update_own_profile(
  p_full_name text default null,
  p_phone text default null,
  p_address text default null
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
    phone = coalesce(p_phone, phone),
    address = coalesce(p_address, address)
  where id = v_caller_id;

  return true;
end;
$$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
