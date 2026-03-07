-- ============================================
-- RLS Policies for user_profiles table
-- ============================================
-- This file fixes the "infinite recursion" error by ensuring
-- policies don't reference the same table they protect.

-- First, drop any existing policies to avoid conflicts
drop policy if exists "Users can read own profile" on public.user_profiles;
drop policy if exists "Users can insert own profile" on public.user_profiles;
drop policy if exists "Users can update own profile" on public.user_profiles;
drop policy if exists "Users can delete own profile" on public.user_profiles;

-- Enable RLS on the table (if not already enabled)
alter table public.user_profiles enable row level security;

-- Policy 1: SELECT - Users can read their own profile
-- This uses auth.uid() directly, NOT a subquery, to avoid recursion
create policy "Users can read own profile"
  on public.user_profiles
  for select
  using (auth.uid() = id);

-- Policy 2: INSERT - Users can insert their own profile
-- Only allow if the id matches the authenticated user's id
create policy "Users can insert own profile"
  on public.user_profiles
  for insert
  with check (auth.uid() = id);

-- Policy 3: UPDATE - Users can update their own profile
-- Only allow if the id matches the authenticated user's id
create policy "Users can update own profile"
  on public.user_profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Policy 4: DELETE - Users can delete their own profile (optional)
-- Uncomment if you want users to be able to delete their profiles
-- create policy "Users can delete own profile"
--   on public.user_profiles
--   for delete
--   using (auth.uid() = id);
