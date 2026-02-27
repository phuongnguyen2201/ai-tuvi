
-- =============================================
-- SECURITY FIX: Enable RLS on all unprotected tables
-- and add missing policies
-- =============================================

-- 1. PROFILES - Enable RLS (policies already exist for SELECT/UPDATE)
-- INSERT handled by handle_new_user trigger (SECURITY DEFINER)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. PAYMENTS - Enable RLS (policies already exist for SELECT/INSERT)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 3. TUVI_READINGS - Enable RLS (ALL policy already exists)
ALTER TABLE public.tuvi_readings ENABLE ROW LEVEL SECURITY;

-- 4. COMPATIBILITY_CHECKS - Enable RLS (INSERT policy already exists)
ALTER TABLE public.compatibility_checks ENABLE ROW LEVEL SECURITY;

-- 5. DAY_ANALYSES - Enable RLS (INSERT policy already exists)
ALTER TABLE public.day_analyses ENABLE ROW LEVEL SECURITY;

-- 6. MINTED_NFTS - Enable RLS (SELECT public + service role ALL policies exist)
ALTER TABLE public.minted_nfts ENABLE ROW LEVEL SECURITY;

-- 7. PENDING_MINTS - Enable RLS (no user-facing policies needed; edge functions use service role)
ALTER TABLE public.pending_mints ENABLE ROW LEVEL SECURITY;

-- 8. CHART_ANALYSES - Add missing UPDATE policy (SELECT/INSERT already exist)
-- Client code performs .update() on this table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chart_analyses' AND policyname = 'Users can update own analyses'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update own analyses" ON public.chart_analyses FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

-- 9. USER_FEATURES - Remove dangerous INSERT policy that allows self-granting premium
-- Admin-actions edge function uses service role (bypasses RLS), so this is safe
DROP POLICY IF EXISTS "Users can insert own features" ON public.user_features;
