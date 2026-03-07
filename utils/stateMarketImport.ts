import { supabase } from './supabaseClient';

const PAGE_SIZE = 1000; // Supabase/PostgREST default max per request

export type StateMarketRow = { market_name: string; state_name: string };

/**
 * Fetch ALL rows from state_market_import (paginated).
 * Supabase returns max 1000 rows per request by default, so we paginate to get the full list.
 */
export async function fetchAllStateMarkets(): Promise<StateMarketRow[]> {
  const all: StateMarketRow[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('state_market_import')
      .select('market_name, state_name')
      .order('market_name', { ascending: true })
      .range(from, to);

    if (error) throw error;
    if (!data || data.length === 0) break;

    all.push(...data);
    hasMore = data.length === PAGE_SIZE;
    from += PAGE_SIZE;
  }

  return all;
}
