-- =============================================================
-- Toasty OS — Fix generate_order_number syntax
-- Migration: 20260817120000_fix_order_sequence.sql
-- =============================================================
-- Fix: 'NO CACHE' is invalid PostgreSQL syntax.
-- Changed to 'CACHE 1' which is equivalent (no caching).

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
