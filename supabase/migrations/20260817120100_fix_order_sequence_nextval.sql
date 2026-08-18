-- =============================================================
-- Toasty OS — Fix generate_order_number nextval syntax
-- Migration: 20260817120100_fix_order_sequence_nextval.sql
-- =============================================================
-- Fix: 'nextval(public.%I)' causes "missing FROM-clause entry for table public"
-- Changed to 'nextval(%L)' which passes sequence name as a proper string literal.

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
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  if not public.is_member_of(p_org_id) then
    raise exception 'Sem acesso a esta organização';
  end if;

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

  execute format('SELECT nextval(%L)', v_seq_name)
  into v_next;

  v_order_number := 'ORD-' || lpad(v_next::text, 6, '0');

  return v_order_number;
end;
$$;
