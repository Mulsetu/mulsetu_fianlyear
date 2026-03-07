-- ============================================
-- Buy section: allow buyers to read active listings + seller display name
-- ============================================

-- 1) Add seller_display_name to listings (for Buy screen without joining user_profiles)
alter table public.listings
  add column if not exists seller_display_name text;

comment on column public.listings.seller_display_name is 'Display name of seller for buyer-facing listing cards';

-- 2) RLS: allow any authenticated user to SELECT active listings (for Buy tab)
drop policy if exists "listings_seller_crud_own" on public.listings;
create policy "listings_seller_crud_own"
  on public.listings
  for all
  to authenticated
  using (seller_id = auth.uid())
  with check (seller_id = auth.uid());

drop policy if exists "listings_buyer_select_active" on public.listings;
create policy "listings_buyer_select_active"
  on public.listings
  for select
  to authenticated
  using (status = 'active');

-- 3) Index for Buy screen filter (active listings by produce/market)
create index if not exists idx_listings_status_created
  on public.listings(status, created_at desc);

-- 4) Optional display fields on offers so "My Offers" can show produce/seller without joining
alter table public.listing_offers
  add column if not exists listing_produce text,
  add column if not exists listing_seller text;

-- 4b) One offer per buyer per listing
create unique index if not exists idx_listing_offers_one_per_buyer
  on public.listing_offers (listing_id, buyer_id);

-- 4c) Any trader can see all offers on a listing (so Trader B can see Trader X's quote and compete)
drop policy if exists "offers_select_any_trader" on public.listing_offers;
create policy "offers_select_any_trader"
  on public.listing_offers
  for select
  to authenticated
  using (true);

-- 5) View for Buy screen: active listings with offer count (avoids N+1)
-- Drop first so column list can change; replace would require same column order/names
drop view if exists public.listings_for_buy;
create view public.listings_for_buy as
select
  l.id,
  l.seller_id,
  l.seller_display_name,
  l.produce,
  l.quality,
  l.quantity,
  l.min_offer_size,
  l.price_per_quintal,
  l.seller_type,
  l.market,
  l.location_address,
  l.location_lat,
  l.location_lng,
  l.status,
  l.crop_photo_url,
  l.quality_photo_url,
  l.packaging_photo_url,
  l.video_url,
  l.created_at,
  (select count(*)::int from public.listing_offers o where o.listing_id = l.id) as offers_count
from public.listings l
where l.status = 'active';

-- RLS: view uses underlying listings table; buyer_select_active policy allows read
grant select on public.listings_for_buy to authenticated;
