-- Supabase schema for Mulsetu fruit price data
-- These are the exact SQL statements we ran in Supabase.

-- ---------------------------------------------------------
-- 1) Fruit master table (from Agmarknet commodity list)
-- ---------------------------------------------------------

create table if not exists public.fruit_commodities (
  commodity_id        integer primary key,
  commodity_group_id  integer not null,
  commodity_name      text    not null,
  created_at          timestamptz default now()
);

-- Seed data for all fruit commodities
insert into public.fruit_commodities (commodity_group_id, commodity_id, commodity_name) values
(5,303,'Amla(Nelli Kai)'),
(5,17,'Apple'),
(5,276,'Apricot(Jardalu/Khumani)'),
(5,458,'Avocado'),
(5,347,'Bael'),
(5,19,'Banana'),
(5,304,'Ber(Zizyphus/Borehannu)'),
(5,462,'Bilimbi'),
(5,463,'Black Currant'),
(5,464,'Blueberry'),
(5,159,'Borehannu'),
(5,426,'Bread Fruit'),
(5,466,'Carissa(Karvand)'),
(5,158,'Chakotha'),
(5,278,'Cherry'),
(5,58,'Chikoos(Sapota)'),
(5,300,'Custard Apple(Sharifa)'),
(5,424,'Dragon fruit'),
(5,477,'Garcinia'),
(5,423,'Goose berry(Nellikkai)'),
(5,22,'Grapes'),
(5,484,'Grey Fruit'),
(5,156,'Guava'),
(5,486,'Hog Plum'),
(5,487,'Indian Sherbet Berry(Phalsa)'),
(5,153,'Jack Fruit'),
(5,155,'Jamun(Narale Hannu)'),
(5,157,'Karbuja(Musk Melon)'),
(5,443,'Khirni'),
(5,284,'Kinnow'),
(5,492,'Kiwi Fruit'),
(5,151,'Lime'),
(5,299,'Litchi'),
(5,285,'Lukad'),
(5,20,'Mango'),
(5,499,'Mangosteen'),
(5,152,'Marasebu'),
(5,64,'Mousambi(Sweet Lime)'),
(5,502,'Mulberry'),
(5,181,'Nearle Hannu'),
(5,182,'Nelli Kai'),
(5,18,'Orange'),
(5,59,'Papaya'),
(5,504,'Passion Fruit'),
(5,281,'Peach'),
(5,280,'Pear(Marasebu)'),
(5,277,'Persimon(Japani Fal)'),
(5,21,'Pineapple'),
(5,279,'Plum'),
(5,160,'Pomegranate'),
(5,513,'Quince(Nakh)'),
(5,514,'Rambutan'),
(5,447,'Ramphal'),
(5,162,'Seetapal'),
(5,154,'Siddota'),
(5,527,'Soursop'),
(5,528,'Star Fruit(Kamraikh)'),
(5,529,'Strawberry'),
(5,161,'Tender Coconut'),
(5,425,'Water Apple'),
(5,60,'Water Melon'),
(5,544,'Wild Melon'),
(5,427,'Wild lemon'),
(5,428,'Wood Apple')
on conflict (commodity_id) do nothing;


-- ---------------------------------------------------------
-- 2) Daily prices table (Agmarknet time-series)
-- ---------------------------------------------------------

create table if not exists public.daily_prices (
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

  constraint daily_prices_unique unique (
    date, commodity_id, state_name, market_name, variety, grade
  )
);

