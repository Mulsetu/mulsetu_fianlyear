-- ============================================
-- Fix RLS for state_market_import table
-- ============================================
-- This removes the restriction that was blocking
-- authenticated users from reading state_market_import

-- Grant SELECT permission to authenticated users
grant select on public.state_market_import to authenticated;

-- Create RLS policy to allow authenticated users to read
drop policy if exists "state_market_import_read_authenticated" on public.state_market_import;
create policy "state_market_import_read_authenticated"
  on public.state_market_import
  for select
  to authenticated
  using (true);

-- Ensure RLS is enabled (it should already be, but just in case)
alter table public.state_market_import enable row level security;
