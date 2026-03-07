-- ============================================
-- Disable RLS on state_market_import table
-- ============================================
-- This completely removes RLS from state_market_import
-- so all authenticated users can read without restrictions

-- Drop all existing policies
drop policy if exists "state_market_import_read_authenticated" on public.state_market_import;

-- Disable RLS entirely
alter table public.state_market_import disable row level security;

-- Grant SELECT to authenticated (profile tab) and anon (sign-up page before login)
grant select on public.state_market_import to authenticated;
grant select on public.state_market_import to anon;