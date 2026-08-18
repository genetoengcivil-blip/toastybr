-- =============================================================
-- Toasty OS — Phase 12: Drop old update_own_profile overload
-- Migration: 20260818000003_drop_old_profile_rpc.sql
-- =============================================================

-- Drop the old overload (with avatar_url) to avoid ambiguity
DROP FUNCTION IF EXISTS public.update_own_profile(text, text);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';