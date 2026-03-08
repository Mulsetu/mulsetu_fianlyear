import { supabase } from '@/utils/supabaseClient';

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

interface PredictPriceParams {
  crop: string;
  mandi?: string;
  horizon: Horizon;
  candidateMandis?: AiMandiCandidate[];
}

export async function predictPrices(params: PredictPriceParams): Promise<AiPredictionResult> {
  const { data, error } = await supabase.functions.invoke('ai-price-prediction', {
    body: {
      crop: params.crop,
      mandi: params.mandi,
      horizon: params.horizon,
      candidateMandis: params.candidateMandis,
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
