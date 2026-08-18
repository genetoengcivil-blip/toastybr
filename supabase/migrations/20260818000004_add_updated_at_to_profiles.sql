-- =============================================================
-- Toasty OS — Phase 12: Add updated_at to profiles
-- Migration: 20260818000004_add_updated_at_to_profiles.sql
-- =============================================================

-- Add updated_at column if missing
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS updated_at timestamptz not null default now();

-- Ensure trigger is set
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';