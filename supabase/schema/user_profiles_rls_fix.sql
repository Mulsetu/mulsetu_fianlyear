-- ============================================
-- COMPLETE FIX for RLS infinite recursion error
-- ============================================
-- Run this ENTIRE script in Supabase SQL Editor
-- This will drop ALL existing policies and create clean ones

-- Step 1: Drop ALL existing policies on user_profiles
-- (This ensures we remove any problematic policies)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.user_profiles';
    END LOOP;
END $$;

-- Step 2: Ensure RLS is enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create clean, simple SELECT policy
-- Users can only read their own profile
CREATE POLICY "users_select_own_profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Step 4: Create INSERT policy
-- Users can only insert their own profile (id must match auth.uid())
CREATE POLICY "users_insert_own_profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Step 5: Create UPDATE policy
-- Users can only update their own profile
CREATE POLICY "users_update_own_profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 6: Verify policies were created
-- (This will show you all policies on the table)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles' 
AND schemaname = 'public';
