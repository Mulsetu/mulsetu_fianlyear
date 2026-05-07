import { supabase } from '@/utils/supabaseClient';

const MODEL_SERVER_URL = process.env.EXPO_PUBLIC_MODEL_SERVER_URL || process.env.EXPO_PUBLIC_MODEL_SERVER || '';

export type Horizon = '1D' | '7D';

export interface AiPredictionPoint {
  dayLabel: string;
  price: number;
}

export interface AiNearbyMandi {
  name: string;
  distanceKm: number;
  targetPrice: number;
  extraPerQtl: number;
  netProfit: number;
  worthIt: boolean;
  reason?: string;
}

export interface AiMandiCandidate {
  name: string;
  stateName?: string;
}

export interface AiPredictionResult {
  predictions: AiPredictionPoint[];
  baseMandi: string;
  nearbyMandis: AiNearbyMandi[];
  confidence: 'low' | 'medium' | 'high';
  model: string;
  summary: string;
}

function normalizeServerUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function buildCommodityCandidates(crop: string): string[] {
  const raw = (crop || '').trim();
  const candidates = new Set<string>();

  if (raw) {
    candidates.add(raw);
  }

  const withoutModelPrefix = raw.replace(/^final_models_/i, '').trim();
  if (withoutModelPrefix) {
    candidates.add(withoutModelPrefix);
  }

  const withoutParens = withoutModelPrefix.replace(/\s*\([^)]*\)\s*$/g, '').trim();
  if (withoutParens) {
    candidates.add(withoutParens);
  }

  return Array.from(candidates).filter(Boolean);
}

async function predictFromLocalModelServer(params: PredictPriceParams): Promise<AiPredictionResult | null> {
  if (!MODEL_SERVER_URL) {
    return null;
  }

  try {
    const response = await fetch(`${normalizeServerUrl(MODEL_SERVER_URL)}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        crop: params.crop,
        mandi: params.mandi,
        horizon: params.horizon,
        candidateMandis: params.candidateMandis,
        recentPrices: params.recentPrices,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data || !Array.isArray(data.predictions) || data.predictions.length === 0) {
      return null;
    }

    const predictions: AiPredictionPoint[] = data.predictions.map((item: any, index: number) => ({
      dayLabel: typeof item?.dayLabel === 'string' ? item.dayLabel : (index === 0 ? 'Tomorrow' : `Day ${index + 1}`),
      price: Number.isFinite(item?.price) ? Math.max(1, Math.round(item.price)) : 0,
    }));

    if (predictions.some((item) => item.price <= 0)) {
      return null;
    }

    const nearbyMandis: AiNearbyMandi[] = Array.isArray(data.nearbyMandis)
      ? data.nearbyMandis.map((item: any) => ({
        name: typeof item?.name === 'string' ? item.name : 'Nearby mandi',
        distanceKm: Number.isFinite(item?.distanceKm) ? Math.max(0, Math.round(item.distanceKm)) : 0,
        targetPrice: Number.isFinite(item?.targetPrice) ? Math.max(1, Math.round(item.targetPrice)) : predictions[0].price,
        extraPerQtl: Number.isFinite(item?.extraPerQtl) ? Math.round(item.extraPerQtl) : 0,
        netProfit: Number.isFinite(item?.netProfit) ? Math.round(item.netProfit) : 0,
        worthIt: Boolean(item?.worthIt),
        reason: typeof item?.reason === 'string' ? item.reason : undefined,
      }))
      : [];

    return {
      predictions,
      baseMandi: typeof data.baseMandi === 'string' && data.baseMandi.trim().length > 0
        ? data.baseMandi
        : (params.mandi || 'Your selected mandi'),
      nearbyMandis,
      confidence: data.confidence === 'high' || data.confidence === 'medium' || data.confidence === 'low'
        ? data.confidence
        : 'low',
      model: typeof data.model === 'string' ? data.model : 'local-model-server',
      summary: typeof data.summary === 'string' ? data.summary : 'Forecast generated.',
    };
  } catch {
    return null;
  }
}

interface PredictPriceParams {
  crop: string;
  mandi?: string;
  horizon: Horizon;
  candidateMandis?: AiMandiCandidate[];
  recentPrices?: number[];
}

export async function predictPrices(params: PredictPriceParams): Promise<AiPredictionResult> {
  const localResult = await predictFromLocalModelServer(params);
  if (localResult) {
    return localResult;
  }

  const { data, error } = await supabase.functions.invoke('ai-price-prediction', {
    body: {
      crop: params.crop,
      mandi: params.mandi,
      horizon: params.horizon,
      candidateMandis: params.candidateMandis,
      recentPrices: params.recentPrices,
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to fetch AI prediction');
  }

  if (!data || !Array.isArray(data.predictions) || data.predictions.length === 0) {
    throw new Error('Invalid prediction payload from backend');
  }

  const predictions: AiPredictionPoint[] = data.predictions.map((item: any, index: number) => ({
    dayLabel: typeof item?.dayLabel === 'string' ? item.dayLabel : (index === 0 ? 'Tomorrow' : `Day ${index + 1}`),
    price: Number.isFinite(item?.price) ? Math.max(1, Math.round(item.price)) : 0,
  }));

  if (predictions.some((item) => item.price <= 0)) {
    throw new Error('Prediction response contained invalid prices');
  }

  const nearbyMandis: AiNearbyMandi[] = Array.isArray(data.nearbyMandis)
    ? data.nearbyMandis.map((item: any) => ({
      name: typeof item?.name === 'string' ? item.name : 'Nearby mandi',
      distanceKm: Number.isFinite(item?.distanceKm) ? Math.max(0, Math.round(item.distanceKm)) : 0,
      targetPrice: Number.isFinite(item?.targetPrice) ? Math.max(1, Math.round(item.targetPrice)) : predictions[0].price,
      extraPerQtl: Number.isFinite(item?.extraPerQtl) ? Math.round(item.extraPerQtl) : 0,
      netProfit: Number.isFinite(item?.netProfit) ? Math.round(item.netProfit) : 0,
      worthIt: Boolean(item?.worthIt),
      reason: typeof item?.reason === 'string' ? item.reason : undefined,
    }))
    : [];

  return {
    predictions,
    baseMandi: typeof data.baseMandi === 'string' && data.baseMandi.trim().length > 0
      ? data.baseMandi
      : (params.mandi || 'Your selected mandi'),
    nearbyMandis,
    confidence: data.confidence === 'high' || data.confidence === 'medium' || data.confidence === 'low'
      ? data.confidence
      : 'low',
    model: typeof data.model === 'string' ? data.model : 'unknown-model',
    summary: typeof data.summary === 'string' ? data.summary : 'Forecast generated.',
  };
}

export interface ModelCatalog {
  crops: Record<string, string[]>;
  cropList: string[];
}

export async function fetchModelCatalog(): Promise<ModelCatalog> {
  if (!MODEL_SERVER_URL) return { crops: {}, cropList: [] };
  try {
    const res = await fetch(`${MODEL_SERVER_URL.replace(/\/+$/,'')}/catalog`);
    if (!res.ok) return { crops: {}, cropList: [] };
    const json = await res.json();
    return json as ModelCatalog;
  } catch {
    return { crops: {}, cropList: [] };
  }
}

export async function fetchRecentPrices(crop: string, mandi: string, days: number = 7): Promise<number[] | null> {
  try {
    let commodityId: number | null = null;

    for (const candidate of buildCommodityCandidates(crop)) {
      const { data: commodity, error: commodityErr } = await supabase
        .from('fruit_commodities')
        .select('commodity_id')
        .ilike('commodity_name', candidate)
        .limit(1)
        .maybeSingle();

      if (!commodityErr && commodity?.commodity_id) {
        commodityId = commodity.commodity_id as number;
        break;
      }
    }

    if (!commodityId) return null;

    const { data, error } = await supabase
      .from('daily_prices')
      .select('modal_price, date')
      .eq('commodity_id', commodityId)
      .ilike('market_name', mandi)
      .order('date', { ascending: false })
      .limit(days);

    if (error || !data) return null;

    const prices = (data as any[])
      .map((r) => Number(r.modal_price))
      .filter((v) => Number.isFinite(v));

    if (prices.length === 0) return null;
    return prices.reverse(); // oldest -> newest
  } catch {
    return null;
  }
}
