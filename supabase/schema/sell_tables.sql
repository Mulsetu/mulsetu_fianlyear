-- ============================================
-- Sell tab backend: listings + offers tables
-- ============================================

-- 1) Listings table
create table if not exists public.listings (
  id                  uuid primary key default gen_random_uuid(),
  seller_id           uuid not null references auth.users(id) on delete cascade,

  produce             text not null,
  quality             text,
  quantity            numeric,
  min_offer_size      numeric,
  price_per_quintal   numeric,
  seller_type         text not null default 'Farmer' check (seller_type in ('Farmer','Trader')),
  market              text,

  status              text not null default 'active'
                      check (status in ('active','sold','expired','cancelled')),

  -- Media (store public URLs; actual upload handled by app/storage)
  crop_photo_url      text,
  quality_photo_url   text,
  packaging_photo_url text,
  video_url           text,

  -- Location
  location_lat        numeric,
  location_lng        numeric,
  location_address    text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_listings_seller_id on public.listings(seller_id);
create index if not exists idx_listings_status on public.listings(status);

create or replace function public.set_listings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_listings_updated_at on public.listings;
create trigger trg_listings_updated_at
before update on public.listings
for each row
execute function public.set_listings_updated_at();

-- 2) Offers table
create table if not exists public.listing_offers (
  id                  uuid primary key default gen_random_uuid(),
  listing_id          uuid not null references public.listings(id) on delete cascade,
  buyer_id            uuid references auth.users(id) on delete set null,

  buyer_name          text,
  quantity            numeric,
  price_per_quintal   numeric,
  total_amount         numeric,

  status              text not null default 'pending'
                      check (status in ('pending','accepted','rejected')),

  created_at          timestamptz not null default now()
);

create index if not exists idx_offers_listing_id on public.listing_offers(listing_id);
create index if not exists idx_offers_buyer_id on public.listing_offers(buyer_id);

-- 3) RLS policies
alter table public.listings enable row level security;
alter table public.listing_offers enable row level security;

-- Listings: sellers can manage their own listings
drop policy if exists "listings_seller_crud_own" on public.listings;
create policy "listings_seller_crud_own"
  on public.listings
  for all
  to authenticated
  using (seller_id = auth.uid())
  with check (seller_id = auth.uid());

-- Offers:
-- - Seller can see offers on their listings
-- - Buyer can see their own offers
drop policy if exists "offers_select_seller_or_buyer" on public.listing_offers;
create policy "offers_select_seller_or_buyer"
  on public.listing_offers
  for select
  to authenticated
  using (
    buyer_id = auth.uid()
    or exists (
      select 1 from public.listings l
      where l.id = listing_id
        and l.seller_id = auth.uid()
    )
  );

-- Buyers can create offers for any listing
drop policy if exists "offers_insert_any_buyer" on public.listing_offers;
create policy "offers_insert_any_buyer"
  on public.listing_offers
  for insert
  to authenticated
  with check (buyer_id = auth.uid());

-- Buyer can update own offers (e.g., cancel); seller can update status
drop policy if exists "offers_update_buyer_or_seller" on public.listing_offers;
create policy "offers_update_buyer_or_seller"
  on public.listing_offers
  for update
  to authenticated
  using (
    buyer_id = auth.uid()
    or exists (
      select 1 from public.listings l
      where l.id = listing_id
        and l.seller_id = auth.uid()
    )
  );

grant select, insert, update on public.listings to authenticated;
grant select, insert, update on public.listing_offers to authenticated;

