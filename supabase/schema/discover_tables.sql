-- ============================================
-- Discover Tab Backend Schema
-- ============================================
-- This extends fruit_commodities with discover-specific data
-- and creates views for easy querying

-- ---------------------------------------------------------
-- 1) Add discover metadata columns to fruit_commodities
-- ---------------------------------------------------------

-- Add columns for discover tab (if they don't exist)
DO $$ 
BEGIN
    -- Add image_url column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'fruit_commodities' 
        AND column_name = 'image_url'
    ) THEN
        ALTER TABLE public.fruit_commodities 
        ADD COLUMN image_url text;
    END IF;

    -- Add display_order column for sorting
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'fruit_commodities' 
        AND column_name = 'display_order'
    ) THEN
        ALTER TABLE public.fruit_commodities 
        ADD COLUMN display_order integer DEFAULT 0;
    END IF;

    -- Add is_active column to show/hide fruits
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'fruit_commodities' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.fruit_commodities 
        ADD COLUMN is_active boolean DEFAULT true;
    END IF;

    -- Add search_keywords for better search
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'fruit_commodities' 
        AND column_name = 'search_keywords'
    ) THEN
        ALTER TABLE public.fruit_commodities 
        ADD COLUMN search_keywords text;
    END IF;
END $$;

-- ---------------------------------------------------------
-- 2) Create view for discover tab with price trends
-- ---------------------------------------------------------

CREATE OR REPLACE VIEW public.discover_fruits AS
WITH today_prices AS (
    SELECT 
        commodity_id,
        AVG(modal_price) as avg_price,
        MAX(modal_price) as max_price,
        MIN(modal_price) as min_price,
        COUNT(DISTINCT market_name) as market_count
    FROM public.daily_prices
    WHERE date = CURRENT_DATE
    GROUP BY commodity_id
),
yesterday_prices AS (
    SELECT 
        commodity_id,
        AVG(modal_price) as avg_price
    FROM public.daily_prices
    WHERE date = CURRENT_DATE - INTERVAL '1 day'
    GROUP BY commodity_id
)
SELECT 
    fc.commodity_id,
    fc.commodity_name,
    fc.image_url,
    fc.display_order,
    fc.is_active,
    fc.search_keywords,
    COALESCE(tp.avg_price, NULL) as current_price,
    CASE 
        WHEN tp.avg_price IS NULL THEN NULL
        WHEN yp.avg_price IS NULL THEN 'stable'
        WHEN tp.avg_price > yp.avg_price THEN 'up'
        WHEN tp.avg_price < yp.avg_price THEN 'down'
        ELSE 'stable'
    END as price_trend,
    tp.avg_price as avg_price_today,
    COALESCE(tp.market_count, 0) as market_count
FROM public.fruit_commodities fc
LEFT JOIN today_prices tp ON fc.commodity_id = tp.commodity_id
LEFT JOIN yesterday_prices yp ON fc.commodity_id = yp.commodity_id
WHERE fc.is_active = true;

-- ---------------------------------------------------------
-- 3) Create function to get discover fruits with search
-- ---------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_discover_fruits(
    search_query text DEFAULT NULL,
    limit_count integer DEFAULT 100
)
RETURNS TABLE (
    commodity_id integer,
    commodity_name text,
    image_url text,
    display_order integer,
    current_price numeric,
    price_trend text,
    avg_price_today numeric,
    market_count bigint
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        df.commodity_id,
        df.commodity_name,
        df.image_url,
        df.display_order,
        df.current_price,
        df.price_trend,
        df.avg_price_today,
        df.market_count
    FROM public.discover_fruits df
    WHERE 
        (search_query IS NULL OR search_query = '')
        OR LOWER(df.commodity_name) LIKE '%' || LOWER(search_query) || '%'
        OR LOWER(df.search_keywords) LIKE '%' || LOWER(search_query) || '%'
    ORDER BY df.display_order, df.commodity_name
    LIMIT limit_count;
END;
$$;

-- ---------------------------------------------------------
-- 4) Enable RLS on view (read-only for all authenticated users)
-- ---------------------------------------------------------

-- Note: Views inherit RLS from underlying tables
-- Since fruit_commodities and daily_prices should be readable by all,
-- we'll create a policy for the view

-- Grant access to authenticated users
GRANT SELECT ON public.discover_fruits TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_discover_fruits TO authenticated;

-- ---------------------------------------------------------
-- 5) Update image URLs for fruits (using Unsplash seed)
-- ---------------------------------------------------------

-- This will generate image URLs based on fruit name
-- Using a simpler approach: URL-encode the fruit name for Unsplash seed
-- Unsplash accepts plain text seeds, so we'll use the commodity name directly
UPDATE public.fruit_commodities
SET image_url = 'https://source.unsplash.com/seed/' || replace(replace(commodity_name, ' ', '-'), '(', '') || '/400x300/?fruit,fresh'
WHERE image_url IS NULL;

-- Update search keywords (add common names/aliases)
UPDATE public.fruit_commodities
SET search_keywords = commodity_name || ' ' || 
    CASE 
        WHEN commodity_name LIKE '%(%' THEN 
            -- Extract text in parentheses
            substring(commodity_name from '\(([^)]+)\)')
        ELSE ''
    END
WHERE search_keywords IS NULL;
