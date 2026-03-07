-- ============================================
-- State + Market master tables (from Excel)
-- ============================================
-- You said your Excel has 2 columns:
--   1) state_name
--   2) market_name
--
-- Recommended flow:
-- 1) Run this script in Supabase SQL Editor
-- 2) Upload your CSV into `public.state_market_import`
-- 3) Run the "Normalize import into states/markets" section at bottom

-- ---------------------------------------------------------
-- 0) Master tables
-- ---------------------------------------------------------

create table if not exists public.states (
  id            bigserial primary key,
  state_name    text not null unique,
  display_order integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists public.markets (
  id            bigserial primary key,
  state_id      bigint not null references public.states(id) on delete cascade,
  market_name   text not null,
  display_order integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),

  constraint markets_unique_per_state unique (state_id, market_name)
);

create index if not exists idx_markets_state_id on public.markets(state_id);
create index if not exists idx_markets_market_name on public.markets(market_name);

-- ---------------------------------------------------------
-- 1) Import table (upload Excel-as-CSV here)
-- ---------------------------------------------------------

create table if not exists public.state_market_import (
  id          bigserial primary key,
  state_name  text not null,
  market_name text not null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 2) RLS (read-only from app, admin manages data)
-- ---------------------------------------------------------

alter table public.states enable row level security;
alter table public.markets enable row level security;
-- state_market_import: RLS disabled - all authenticated users can read
alter table public.state_market_import disable row level security;

drop policy if exists "states_read_authenticated" on public.states;
create policy "states_read_authenticated"
  on public.states
  for select
  to authenticated
  using (is_active = true);

drop policy if exists "markets_read_authenticated" on public.markets;
create policy "markets_read_authenticated"
  on public.markets
  for select
  to authenticated
  using (is_active = true);

-- state_market_import: No RLS - authenticated (profile) and anon (sign-up) can read
grant select on public.state_market_import to authenticated;
grant select on public.state_market_import to anon;

grant select on public.states to authenticated;
grant select on public.markets to authenticated;

-- ---------------------------------------------------------
-- 3) Normalize import into states + markets (run after CSV upload)
-- ---------------------------------------------------------
-- This upserts unique states, then inserts unique markets per state.
-- Safe to re-run.

-- Upsert states
insert into public.states (state_name)
select distinct trim(state_name)
from public.state_market_import
where state_name is not null and trim(state_name) <> ''
on conflict (state_name) do nothing;

-- Insert markets
insert into public.markets (state_id, market_name)
select
  s.id,
  trim(i.market_name) as market_name
from public.state_market_import i
join public.states s
  on s.state_name = trim(i.state_name)
where i.market_name is not null and trim(i.market_name) <> ''
group by s.id, trim(i.market_name)
on conflict (state_id, market_name) do nothing;

