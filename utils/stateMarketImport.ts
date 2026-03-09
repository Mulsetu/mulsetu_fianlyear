import { supabase } from './supabaseClient';

const PAGE_SIZE = 1000; // Supabase/PostgREST default max per request
const MAX_RETRIES = 3;

export type StateMarketRow = { market_name: string; state_name: string };

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(operation: () => Promise<T>, retries: number = MAX_RETRIES): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        // Short exponential backoff to recover from transient network/session hiccups.
        await wait(250 * Math.pow(2, attempt - 1));
      }
    }
  }

  throw lastError;
}

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
    const { data, error } = await withRetry(async () => {
      const response = await supabase
        .from('state_market_import')
        .select('market_name, state_name')
        .order('market_name', { ascending: true })
        .range(from, to);

      if (response.error) {
        throw response.error;
      }

      return response;
    });

    if (error) throw error;
    if (!data || data.length === 0) break;

    all.push(...data);
    hasMore = data.length === PAGE_SIZE;
    from += PAGE_SIZE;
  }

  return all;
}
