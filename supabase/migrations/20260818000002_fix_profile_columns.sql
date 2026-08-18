-- =============================================================
-- Toasty OS — Phase 12: Fix update_own_profile columns
-- Migration: 20260818000002_fix_profile_columns.sql
-- =============================================================

-- Recreate update_own_profile with actual profiles table columns
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