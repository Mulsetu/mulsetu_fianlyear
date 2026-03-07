-- ============================================
-- daily_prices_history + union view for app
-- ============================================
-- Purpose:
-- - `daily_prices` holds the latest snapshot (updated 2x/day)
-- - `daily_prices_history` stores immutable historical rows (archived daily)
-- - `all_prices` view lets the app query both as one dataset

-- ---------------------------------------------------------
-- 1) History table (same shape as daily_prices)
-- ---------------------------------------------------------

create table if not exists public.daily_prices_history (
  id              bigserial primary key,
  date            date        not null,
  commodity_id    integer     not null references public.fruit_commodities(commodity_id),
  state_name      text        not null,
  market_name     text        not null,
  variety         text,
  grade           text,
  arrivals        numeric,
  arrival_unit    text,
  min_price       numeric,
  max_price       numeric,
  modal_price     numeric,
  price_unit      text,
  fetched_at      timestamptz default now(),

  constraint daily_prices_history_unique unique (
    date, commodity_id, state_name, market_name, variety, grade
  )
);

create index if not exists idx_dph_date on public.daily_prices_history(date);
create index if not exists idx_dph_commodity_date on public.daily_prices_history(commodity_id, date);
create index if not exists idx_dph_state_market on public.daily_prices_history(state_name, market_name);

-- ---------------------------------------------------------
-- 2) Union view for reading both tables as one
-- ---------------------------------------------------------
-- NOTE: keep column list explicit and aligned.

create or replace view public.all_prices as
select
  date,
  commodity_id,
  state_name,
  market_name,
  variety,
  grade,
  arrivals,
  arrival_unit,
  min_price,
  max_price,
  modal_price,
  price_unit,
  fetched_at
from public.daily_prices
union all
select
  date,
  commodity_id,
  state_name,
  market_name,
  variety,
  grade,
  arrivals,
  arrival_unit,
  min_price,
  max_price,
  modal_price,
  price_unit,
  fetched_at
from public.daily_prices_history;

-- ---------------------------------------------------------
-- 3) RLS (read-only)
-- ---------------------------------------------------------
-- If you already use RLS for these tables, keep policies consistent.
-- If you are not using RLS here, you can skip enabling it.

alter table public.daily_prices_history enable row level security;

drop policy if exists "daily_prices_history_read_authenticated" on public.daily_prices_history;
create policy "daily_prices_history_read_authenticated"
  on public.daily_prices_history
  for select
  to authenticated
  using (true);

-- optional: allow anon read (public price data)
drop policy if exists "daily_prices_history_read_anon" on public.daily_prices_history;
create policy "daily_prices_history_read_anon"
  on public.daily_prices_history
  for select
  to anon
  using (true);

grant select on public.daily_prices_history to authenticated;
grant select on public.daily_prices_history to anon;
grant select on public.all_prices to authenticated;
grant select on public.all_prices to anon;

