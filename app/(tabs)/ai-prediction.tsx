import { Colors } from '@/constants/theme';
import { useUser } from '@/contexts/UserContext';
import { AiMandiCandidate, AiNearbyMandi, Horizon } from '@/utils/aiPrediction';
import { getResponsiveDimensions, isDesktop } from '@/utils/responsive';
import { fetchAllStateMarkets } from '@/utils/stateMarketImport';
import { supabase } from '@/utils/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type PredictionPoint = {
  dayLabel: string;
  price: number;
};

type ManualQueueStatus = 'pending' | 'completed' | 'failed';
type ScreenMode = 'prediction' | 'history';

type PredictionHistoryRow = {
  id: string;
  crop: string;
  mandi: string;
  horizon: Horizon;
  response_json: any;
  created_at: string;
};

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function buildLocalFallbackPredictions(crop: string): PredictionPoint[] {
  const base = 2500 + (crop.length % 11) * 95;

  return Array.from({ length: 7 }, (_, index) => {
    const dayShift = index - 3;
    const price = Math.max(400, Math.round(base + dayShift * 42));

    return {
      dayLabel: index === 0 ? 'Tomorrow' : `Day ${index + 1}`,
      price,
    };
  });
}

function buildLocalFallbackNearbyMandis(basePrice: number, candidateMandis: AiMandiCandidate[]): AiNearbyMandi[] {
  const names = candidateMandis.map((item) => item.name).filter(Boolean);
  const options = [
    { name: names[0] || 'Nearby APMC 1', distanceKm: 25, factor: 1.08 },
    { name: names[1] || 'Nearby APMC 2', distanceKm: 40, factor: 0.97 },
    { name: names[2] || 'Nearby APMC 3', distanceKm: 60, factor: 1.12 },
  ];

  const quantityQtl = 10;
  const transportPerKmPerQtl = 5;

  return options.map((option) => {
    const targetPrice = Math.max(1, Math.round(basePrice * option.factor));
    const extraPerQtl = targetPrice - basePrice;
    const netProfit = extraPerQtl * quantityQtl - option.distanceKm * transportPerKmPerQtl * quantityQtl;

    return {
      name: option.name,
      distanceKm: option.distanceKm,
      targetPrice,
      extraPerQtl,
      netProfit,
      worthIt: netProfit > 0,
      reason: netProfit > 0 ? 'Higher effective return after transport' : 'Transport cost reduces profit',
    };
  });
}

export default function AiPredictionScreen() {
  const { user } = useUser();
  const dimensions = getResponsiveDimensions();

  const [fruits, setFruits] = useState<string[]>([]);
  const [isLoadingFruits, setIsLoadingFruits] = useState<boolean>(true);
  const [fruitModalVisible, setFruitModalVisible] = useState(false);
  const [selectedFruit, setSelectedFruit] = useState<string>('');
  const [horizon, setHorizon] = useState<Horizon>('1D');
  const [predictions, setPredictions] = useState<PredictionPoint[]>([]);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
  const [predictionError, setPredictionError] = useState<string>('');
  const [predictionSummary, setPredictionSummary] = useState<string>('');
  const [predictionModel, setPredictionModel] = useState<string>('');
  const [baseMandiName, setBaseMandiName] = useState<string>('');
  const [nearbyMandis, setNearbyMandis] = useState<AiNearbyMandi[]>([]);
  const [activeRequestId, setActiveRequestId] = useState<string>('');
  const [queueStatus, setQueueStatus] = useState<ManualQueueStatus | ''>('');
  const [screenMode, setScreenMode] = useState<ScreenMode>('prediction');
  const [historyRows, setHistoryRows] = useState<PredictionHistoryRow[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState('');
  
  // Mandi selection state
  const [markets, setMarkets] = useState<{ market_name: string; state_name: string }[]>([]);
  const [loadingMarkets, setLoadingMarkets] = useState(false);
  const [selectedMandi, setSelectedMandi] = useState<string>(user?.market || '');
  const [mandiModalVisible, setMandiModalVisible] = useState(false);
  const [mandiSearch, setMandiSearch] = useState('');

  const loadFruits = async () => {
    try {
      setIsLoadingFruits(true);
      let lastError: unknown;

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        const { data, error } = await supabase
          .from('fruit_commodities')
          .select('commodity_name')
          .order('commodity_name', { ascending: true });

        if (!error) {
          const names =
            (data ?? [])
              .map((row: any) => row.commodity_name as string | null)
              .filter((n): n is string => !!n) ?? [];

          setFruits(names);
          if (names.length > 0) {
            setSelectedFruit((prev) => prev || names[0]);
          }
          return;
        }

        lastError = error;
        if (attempt < 3) {
          await wait(250 * Math.pow(2, attempt - 1));
        }
      }

      console.error('Error loading fruits for AI Prediction:', lastError);
      setFruits([]);
    } finally {
      setIsLoadingFruits(false);
    }
  };

  const loadMarkets = async () => {
    try {
      setLoadingMarkets(true);
      const data = await fetchAllStateMarkets();
      setMarkets(data);
    } catch (err) {
      console.error('Error loading markets from state_market_import:', err);
      setMarkets([]);
    } finally {
      setLoadingMarkets(false);
    }
  };

  // Load fruits from Supabase (fruit_commodities)
  useEffect(() => {
    loadFruits();
  }, []);

  // Load markets from state_market_import (full list, paginated past 1000 rows)
  useEffect(() => {
    loadMarkets();
  }, []);

  // Soft refresh background data periodically so users don't need manual reload.
  useEffect(() => {
    const intervalId = setInterval(() => {
      loadFruits();
      loadMarkets();
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  // Set initial mandi from user profile
  useEffect(() => {
    if (user?.market) {
      setSelectedMandi((prev) => prev || user.market);
    }
  }, [user]);

  const candidateMandis: AiMandiCandidate[] = useMemo(
    () => markets
      .filter((market) => market.market_name !== selectedMandi)
      .slice(0, 25)
      .map((market) => ({
        name: market.market_name,
        stateName: market.state_name || undefined,
      })),
    [markets, selectedMandi],
  );

  const applyPredictionPayload = (
    payload: any,
    payloadHorizon: Horizon,
    payloadMandi: string,
  ): boolean => {
    if (!payload || !Array.isArray(payload.predictions) || payload.predictions.length === 0) {
      return false;
    }

    const parsedPredictions: PredictionPoint[] = payload.predictions.map((item: any, index: number) => ({
      dayLabel: typeof item?.dayLabel === 'string' ? item.dayLabel : (index === 0 ? 'Tomorrow' : `Day ${index + 1}`),
      price: Number.isFinite(item?.price) ? Math.max(1, Math.round(item.price)) : 0,
    }));

    const parsedNearby: AiNearbyMandi[] = Array.isArray(payload.nearbyMandis)
      ? payload.nearbyMandis.map((item: any) => ({
        name: typeof item?.name === 'string' ? item.name : 'Nearby mandi',
        distanceKm: Number.isFinite(item?.distanceKm) ? Math.max(0, Math.round(item.distanceKm)) : 0,
        targetPrice: Number.isFinite(item?.targetPrice)
          ? Math.max(1, Math.round(item.targetPrice))
          : parsedPredictions[0].price,
        extraPerQtl: Number.isFinite(item?.extraPerQtl) ? Math.round(item.extraPerQtl) : 0,
        netProfit: Number.isFinite(item?.netProfit) ? Math.round(item.netProfit) : 0,
        worthIt: Boolean(item?.worthIt),
        reason: typeof item?.reason === 'string' ? item.reason : undefined,
      }))
      : [];

    const horizonPredictions = payloadHorizon === '1D' ? parsedPredictions.slice(0, 1) : parsedPredictions;
    setPredictions(horizonPredictions);
    setNearbyMandis(parsedNearby);
    setBaseMandiName(typeof payload.baseMandi === 'string' ? payload.baseMandi : payloadMandi);
    setPredictionSummary(typeof payload.summary === 'string' ? payload.summary : 'Manual AI response loaded.');
    setPredictionModel(typeof payload.model === 'string' ? payload.model : 'manual-admin');
    setPredictionError('');
    return true;
  };

  const loadPredictionHistory = useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      setHistoryError('');

      let query = supabase
        .from('ai_prediction_manual_requests')
        .select('id, crop, mandi, horizon, response_json, created_at, status')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(25);

      if (selectedFruit) {
        query = query.eq('crop', selectedFruit);
      }

      if (selectedMandi) {
        query = query.eq('mandi', selectedMandi);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const rows = (data ?? [])
        .filter((row: any) => row?.response_json && Array.isArray(row.response_json.predictions))
        .map((row: any) => ({
          id: String(row.id),
          crop: String(row.crop ?? ''),
          mandi: String(row.mandi ?? ''),
          horizon: row.horizon === '7D' ? '7D' : '1D',
          response_json: row.response_json,
          created_at: String(row.created_at ?? ''),
        } as PredictionHistoryRow));

      setHistoryRows(rows);
    } catch (error) {
      console.error('Error loading AI prediction history:', error);
      setHistoryRows([]);
      setHistoryError(error instanceof Error ? error.message : 'Failed to load history');
    } finally {
      setIsLoadingHistory(false);
    }
  }, [selectedFruit, selectedMandi]);

  const handleUseHistory = (item: PredictionHistoryRow) => {
    const ok = applyPredictionPayload(item.response_json, item.horizon, item.mandi);
    if (!ok) {
      setPredictionError('Saved history item is invalid.');
      return;
    }

    setSelectedFruit(item.crop);
    setSelectedMandi(item.mandi);
    setHorizon(item.horizon);
    setQueueStatus('completed');
    setActiveRequestId('');
    setIsLoadingPrediction(false);
    setScreenMode('prediction');
  };

  const formatHistoryDate = (iso: string): string => {
    if (!iso) {
      return 'Unknown time';
    }

    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return 'Unknown time';
    }

    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCheckPrediction = async () => {
    if (!selectedFruit || !selectedMandi) {
      return;
    }

    setIsLoadingPrediction(true);
    setPredictionError('');
    setQueueStatus('pending');

    try {
      const candidateListText = candidateMandis
        .slice(0, 25)
        .map((item, index) => `${index + 1}. ${item.name}${item.stateName ? ` (${item.stateName})` : ''}`)
        .join('\n');

      const manualPrompt =
        `Generate crop intelligence for crop '${selectedFruit}' and mandi '${selectedMandi}'.\n` +
        `Horizon: ${horizon}.\n` +
        'Return ONLY strict JSON with keys: predictions, baseMandi, nearbyMandis, confidence, summary, model.\n' +
        'Use INR per quintal values and realistic volatility.\n' +
        'For nearbyMandis use exactly 3 names from candidate list and include distanceKm, targetPrice, extraPerQtl, netProfit, worthIt, reason.\n' +
        (candidateListText ? `Candidate mandis:\n${candidateListText}` : '');

      const { data, error } = await supabase
        .from('ai_prediction_manual_requests')
        .insert({
          crop: selectedFruit,
          mandi: selectedMandi,
          horizon,
          candidate_mandis: candidateMandis,
          prompt: manualPrompt,
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error || !data?.id) {
        throw new Error(error?.message || 'Failed to create manual AI request');
      }

      setActiveRequestId(data.id);
      setPredictions([]);
      setNearbyMandis([]);
      setPredictionSummary('');
      setPredictionModel('manual-queue');
      setBaseMandiName(selectedMandi || user?.market || 'Your mandi');
    } catch (error) {
      setQueueStatus('failed');
      setPredictionError(error instanceof Error ? error.message : 'Failed to queue manual request');
      const fallback = buildLocalFallbackPredictions(selectedFruit);
      const fallbackNearby = buildLocalFallbackNearbyMandis(fallback[0].price, candidateMandis);
      setPredictions(horizon === '1D' ? fallback.slice(0, 1) : fallback);
      setPredictionSummary('Using fallback estimate because request could not be queued.');
      setPredictionModel('local-fallback');
      setBaseMandiName(selectedMandi || user?.market || 'Your mandi');
      setNearbyMandis(fallbackNearby);
    }
  };

  useEffect(() => {
    if (!activeRequestId) {
      return;
    }

    const pollRequest = async () => {
      const { data, error } = await supabase
        .from('ai_prediction_manual_requests')
        .select('status, response_json, admin_note')
        .eq('id', activeRequestId)
        .maybeSingle();

      if (error || !data) {
        return;
      }

      const status = data.status as ManualQueueStatus;
      setQueueStatus(status);

      if (status === 'failed') {
        setPredictionError(data.admin_note || 'Prediction request failed.');
        setPredictionSummary('');
        setPredictionModel('manual-queue-failed');
        setIsLoadingPrediction(false);
        setActiveRequestId('');
        return;
      }

      if (status !== 'completed') {
        return;
      }

      const payload = data.response_json as any;
      const ok = applyPredictionPayload(payload, horizon, selectedMandi);
      if (!ok) {
        setPredictionError('Prediction data is invalid.');
        setPredictionSummary('');
        setPredictionModel('manual-queue-invalid');
        setIsLoadingPrediction(false);
        setActiveRequestId('');
        return;
      }
      setIsLoadingPrediction(false);
      setActiveRequestId('');
      loadPredictionHistory();
    };

    pollRequest();
    const intervalId = setInterval(pollRequest, 1500);
    return () => clearInterval(intervalId);
  }, [activeRequestId, horizon, loadPredictionHistory, selectedMandi]);

  useEffect(() => {
    if (screenMode !== 'history') {
      return;
    }

    loadPredictionHistory();
  }, [loadPredictionHistory, screenMode]);

  const filteredMarkets = markets.filter((m) => {
    const label = `${m.market_name}${m.state_name ? ` (${m.state_name})` : ''}`;
    if (!mandiSearch.trim()) return true;
    return label.toLowerCase().includes(mandiSearch.toLowerCase());
  });

  const marketOptionsList = filteredMarkets.map(
    (m) => `${m.market_name}${m.state_name ? ` (${m.state_name})` : ''}`
  );

  const visiblePredictions = predictions;
  const maxPrice = predictions.length > 0 ? Math.max(...predictions.map((p) => p.price)) : 0;
  const minPrice = predictions.length > 0 ? Math.min(...predictions.map((p) => p.price)) : 0;
  const avgPrice = predictions.length > 0
    ? Math.round(predictions.reduce((sum, p) => sum + p.price, 0) / predictions.length)
    : 0;

  const basePrice = predictions[0]?.price ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.light.background} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, { maxWidth: dimensions.containerMaxWidth }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>AI Price Prediction</Text>
            <Text style={styles.subtitle}>
              See tomorrow&apos;s price and plan the best mandi for maximum profit.
            </Text>
            <View style={styles.screenModeToggle}>
              <TouchableOpacity
                style={[styles.screenModeChip, screenMode === 'prediction' && styles.screenModeChipActive]}
                onPress={() => setScreenMode('prediction')}
              >
                <Text style={[styles.screenModeChipText, screenMode === 'prediction' && styles.screenModeChipTextActive]}>
                  Prediction
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.screenModeChip, screenMode === 'history' && styles.screenModeChipActive]}
                onPress={() => setScreenMode('history')}
              >
                <Text style={[styles.screenModeChipText, screenMode === 'history' && styles.screenModeChipTextActive]}>
                  History
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {screenMode === 'history' ? (
            <View style={styles.card}>
              <View style={styles.historyTopRow}>
                <Text style={styles.sectionTitle}>Prediction History</Text>
                <TouchableOpacity onPress={loadPredictionHistory}>
                  <Text style={styles.historyRefreshText}>Refresh</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.cardSubtitle}>
                Showing recent completed predictions
                {selectedFruit ? ` for ${selectedFruit}` : ''}
                {selectedMandi ? ` in ${selectedMandi}` : ''}.
              </Text>

              {isLoadingHistory && (
                <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                  <ActivityIndicator size="small" color={Colors.light.primary} />
                  <Text style={styles.infoText}>Loading saved predictions...</Text>
                </View>
              )}

              {!isLoadingHistory && !!historyError && (
                <Text style={styles.infoText}>Failed to load history: {historyError}</Text>
              )}

              {!isLoadingHistory && !historyError && historyRows.length === 0 && (
                <Text style={styles.infoText}>
                  No completed prediction history found yet.
                </Text>
              )}

              {!isLoadingHistory && !historyError && historyRows.map((item) => {
                const topPrice = Array.isArray(item.response_json?.predictions)
                  ? Math.round(item.response_json.predictions[0]?.price ?? 0)
                  : 0;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.historyRow}
                    onPress={() => handleUseHistory(item)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyCropText}>{item.crop} | {item.mandi}</Text>
                      <Text style={styles.historyMetaText}>
                        {item.horizon} | {formatHistoryDate(item.created_at)}
                      </Text>
                      <Text style={styles.historyMetaText} numberOfLines={2}>
                        {typeof item.response_json?.summary === 'string'
                          ? item.response_json.summary
                          : 'Tap to load this prediction'}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
                      <Text style={styles.historyPriceText}>₹{topPrice}/qtl</Text>
                      <Ionicons name="arrow-forward-circle-outline" size={18} color={Colors.light.primary} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <>
              {/* Input Selectors */}
              <View style={styles.card}>
            <Text style={styles.sectionTitle}>Select Inputs</Text>
            <Text style={styles.fieldLabel}>Crop Name</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => {
                if (!isLoadingFruits && fruits.length > 0) {
                  setFruitModalVisible(true);
                }
              }}
              disabled={isLoadingFruits || fruits.length === 0}
            >
              <Text
                style={[
                  styles.dropdownText,
                  (!selectedFruit || fruits.length === 0) && styles.dropdownPlaceholder,
                ]}
              >
                {isLoadingFruits
                  ? 'Loading crops...'
                  : selectedFruit || 'Select crop'}
              </Text>
              <Ionicons
                name="chevron-down"
                size={18}
                color={Colors.light.icon}
              />
            </TouchableOpacity>

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Mandi / Market Name</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => {
                if (!loadingMarkets && markets.length > 0) {
                  setMandiModalVisible(true);
                }
              }}
              disabled={loadingMarkets || markets.length === 0}
            >
              <Text
                style={[
                  styles.dropdownText,
                  (!selectedMandi || markets.length === 0) && styles.dropdownPlaceholder,
                ]}
              >
                {loadingMarkets
                  ? 'Loading mandis...'
                  : selectedMandi || 'Select mandi / market'}
              </Text>
              <Ionicons
                name="chevron-down"
                size={18}
                color={Colors.light.icon}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.checkButton,
                (!selectedFruit || !selectedMandi || isLoadingPrediction) && styles.checkButtonDisabled,
              ]}
              onPress={handleCheckPrediction}
              disabled={!selectedFruit || !selectedMandi || isLoadingPrediction}
            >
              {isLoadingPrediction ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.checkButtonText}>Check Prediction</Text>
              )}
            </TouchableOpacity>
              </View>

              {/* Prediction Horizon */}
              <View style={styles.card}>
            <View style={styles.horizonHeader}>
              <Text style={styles.sectionTitle}>Price Prediction</Text>
              <View style={styles.horizonToggle}>
                {(['1D', '7D'] as Horizon[]).map(h => {
                  const active = h === horizon;
                  return (
                    <TouchableOpacity
                      key={h}
                      style={[styles.horizonChip, active && styles.horizonChipActive]}
                      onPress={() => setHorizon(h)}
                    >
                      <Text
                        style={[styles.horizonChipText, active && styles.horizonChipTextActive]}
                      >
                        {h === '1D' ? 'Tomorrow' : 'Next 7 days'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Summary Row */}
            <Text style={styles.cardSubtitle}>
              Showing forecast for <Text style={{ fontWeight: '700' }}>{selectedFruit || 'selected crop'}</Text>
              {' in '}<Text style={{ fontWeight: '700' }}>{selectedMandi || 'selected mandi'}</Text>
            </Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Min</Text>
                <Text style={[styles.summaryValue, { color: '#22c55e' }]}>
                  ₹{minPrice}/qtl
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Avg</Text>
                <Text style={[styles.summaryValue, { color: Colors.light.primary }]}>
                  ₹{avgPrice}/qtl
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Max</Text>
                <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
                  ₹{maxPrice}/qtl
                </Text>
              </View>
            </View>

            {/* Simple bar chart style list */}
            <View style={styles.predictionList}>
              {isLoadingPrediction && (
                <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                  <ActivityIndicator size="small" color={Colors.light.primary} />
                  <Text style={styles.infoText}>Loading prediction...</Text>
                </View>
              )}
              {predictions.length === 0 && !isLoadingPrediction && (
                <Text style={styles.infoText}>
                  Select crop and mandi, then tap Check Prediction to fetch AI forecast.
                </Text>
              )}
              {visiblePredictions.map((p, idx) => {
                const widthPct = maxPrice > 0 ? Math.max(20, (p.price / maxPrice) * 100) : 20;
                return (
                  <View key={idx} style={styles.predictionRow}>
                    <Text style={styles.predictionDay}>{p.dayLabel}</Text>
                    <View style={styles.predictionBarTrack}>
                      <View style={[styles.predictionBarFill, { width: `${widthPct}%` }]} />
                    </View>
                    <Text style={styles.predictionPrice}>₹{p.price}/qtl</Text>
                  </View>
                );
              })}
            </View>

            <Text style={styles.infoText}>
              {predictionSummary || 'Prediction summary will appear here after you tap Check Prediction.'}
            </Text>
            {!!activeRequestId && (
              <Text style={styles.infoText}>
                Queue status: {queueStatus || 'pending'} | Request ID: {activeRequestId}
              </Text>
            )}
            <Text style={styles.infoText}>
              Model: {predictionModel || 'loading...'}
              {predictionError ? ` | Warning: ${predictionError}` : ''}
            </Text>
              </View>

              {/* Profit Check Section */}
              <View style={styles.card}>
            <Text style={styles.sectionTitle}>Check Profit by Mandi</Text>
            <Text style={styles.cardSubtitle}>
              Compare your mandi with nearby mandis based on predicted prices.
            </Text>

            <View style={styles.baseMandiCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="home" size={20} color={Colors.light.primary} />
                <Text style={styles.baseMandiLabel}>Your Mandi</Text>
              </View>
              <View style={styles.mandiDropdown}>
                <Text
                  style={[
                    styles.mandiDropdownText,
                    (!selectedMandi || markets.length === 0) && styles.mandiDropdownPlaceholder,
                  ]}
                >
                  {selectedMandi || 'Select mandi / market from inputs above'}
                </Text>
              </View>
              {selectedMandi && (
                <Text style={styles.baseMandiPrice}>
                  {baseMandiName ? `${baseMandiName} | ` : ''}
                  Tomorrow&apos;s predicted price: 
                  <Text style={{ fontWeight: '700' }}>₹{basePrice}/qtl</Text>
                </Text>
              )}
            </View>

            <View style={styles.nearbyList}>
              {nearbyMandis.map((m, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.nearbyRow,
                    m.worthIt ? styles.nearbyRowWorth : styles.nearbyRowNotWorth,
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nearbyName}>{m.name}</Text>
                    <View style={styles.nearbyMetaRow}>
                      <Ionicons name="navigate" size={14} color={Colors.light.icon} />
                      <Text style={styles.nearbyMetaText}>{m.distanceKm} km away</Text>
                    </View>
                  </View>
                  <View style={styles.nearbyPriceBlock}>
                    <Text style={styles.nearbyPrice}>₹{m.targetPrice}/qtl</Text>
                    <Text
                      style={[
                        styles.nearbyDiff,
                        m.extraPerQtl >= 0 ? styles.nearbyDiffPositive : styles.nearbyDiffNegative,
                      ]}
                    >
                      {m.extraPerQtl >= 0 ? '+' : '-'}₹{Math.abs(m.extraPerQtl)} /qtl
                    </Text>
                    <Text
                      style={[
                        styles.nearbyNet,
                        m.worthIt ? styles.nearbyNetPositive : styles.nearbyNetNegative,
                      ]}
                    >
                      {m.worthIt ? 'Worth it' : 'Not worth it'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <Text style={styles.infoText}>
              Nearby mandi comparison is generated from the same AI response using your selected
              crop and mandi.
            </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Crop selection modal */}
      <Modal
        visible={fruitModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFruitModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalSheetHeader}>
              <Text style={styles.modalSheetTitle}>Select Crop</Text>
              <TouchableOpacity onPress={() => setFruitModalVisible(false)}>
                <Ionicons name="close" size={22} color={Colors.light.icon} />
              </TouchableOpacity>
            </View>
            {isLoadingFruits ? (
              <View style={styles.modalSheetBody}>
                <ActivityIndicator size="small" color={Colors.light.primary} />
                <Text style={styles.infoText}>Loading crops...</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalSheetBody}>
                {fruits.map(name => (
                  <TouchableOpacity
                    key={name}
                    style={styles.modalItem}
                    onPress={() => {
                      setSelectedFruit(name);
                      setFruitModalVisible(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{name}</Text>
                    {selectedFruit === name && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={Colors.light.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Mandi selection modal */}
      <Modal
        visible={mandiModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMandiModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalSheetHeader}>
              <Text style={styles.modalSheetTitle}>Select Mandi / Market</Text>
              <TouchableOpacity onPress={() => setMandiModalVisible(false)}>
                <Ionicons name="close" size={22} color={Colors.light.icon} />
              </TouchableOpacity>
            </View>
            {loadingMarkets ? (
              <View style={styles.modalSheetBody}>
                <ActivityIndicator size="small" color={Colors.light.primary} />
                <Text style={styles.infoText}>Loading mandis...</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalSheetBody} keyboardShouldPersistTaps="handled">
                {/* Search bar for mandis */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: Colors.light.border,
                    backgroundColor: Colors.light.inputBackground,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    marginBottom: 8,
                  }}
                >
                  <Ionicons
                    name="search"
                    size={18}
                    color={Colors.light.icon}
                    style={{ marginRight: 6 }}
                  />
                  <TextInput
                    style={{
                      flex: 1,
                      fontSize: 14,
                      color: Colors.light.text,
                      fontFamily: 'System',
                      paddingVertical: 4,
                    }}
                    placeholder="Search mandi / market"
                    placeholderTextColor={Colors.light.icon}
                    value={mandiSearch}
                    onChangeText={setMandiSearch}
                  />
                </View>
                {marketOptionsList.map((item, idx) => {
                  const marketName = item.split(' (')[0];
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={styles.modalItem}
                      onPress={() => {
                        setSelectedMandi(marketName);
                        setMandiModalVisible(false);
                      }}
                    >
                      <Text style={styles.modalItemText}>{item}</Text>
                      {selectedMandi === marketName && (
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color={Colors.light.primary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
    // Extra bottom padding so content is not hidden behind the bottom tab bar
    paddingBottom: isDesktop ? 80 : 140,
    ...(isDesktop && {
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingBottom: 40,
    }),
  },
  content: {
    flex: 1,
    paddingHorizontal: isDesktop ? 0 : 24,
    paddingTop: 24,
    width: '100%',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: isDesktop ? 28 : 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: isDesktop ? 16 : 14,
    color: Colors.light.icon,
    fontFamily: 'System',
  },
  screenModeToggle: {
    marginTop: 12,
    flexDirection: 'row',
    borderRadius: 999,
    backgroundColor: Colors.light.inputBackground,
    padding: 3,
    alignSelf: 'flex-start',
  },
  screenModeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  screenModeChipActive: {
    backgroundColor: Colors.light.primary,
  },
  screenModeChipText: {
    fontSize: 12,
    color: Colors.light.text,
    fontFamily: 'System',
    fontWeight: '600',
  },
  screenModeChipTextActive: {
    color: 'white',
  },
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)' } as any)
      : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }),
  },
  sectionTitle: {
    fontSize: isDesktop ? 20 : 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 10,
    fontFamily: 'System',
  },
  fieldLabel: {
    fontSize: 13,
    color: Colors.light.icon,
    marginBottom: 6,
    fontFamily: 'System',
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.inputBackground,
  },
  chipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  chipText: {
    color: Colors.light.text,
    fontSize: 14,
    fontFamily: 'System',
  },
  chipTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.inputBackground,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownText: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
    fontFamily: 'System',
  },
  dropdownPlaceholder: {
    color: Colors.light.icon,
  },
  checkButton: {
    marginTop: 14,
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonDisabled: {
    opacity: 0.55,
  },
  checkButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'System',
  },
  horizonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  horizonToggle: {
    flexDirection: 'row',
    borderRadius: 999,
    backgroundColor: Colors.light.inputBackground,
    padding: 3,
  },
  horizonChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  horizonChipActive: {
    backgroundColor: Colors.light.primary,
  },
  horizonChipText: {
    fontSize: 11,
    color: Colors.light.text,
    fontFamily: 'System',
  },
  horizonChipTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.light.icon,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  predictionList: {
    gap: 8,
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  predictionDay: {
    width: 90,
    fontSize: 13,
    color: Colors.light.text,
  },
  predictionBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: Colors.light.inputBackground,
    overflow: 'hidden',
  },
  predictionBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: Colors.light.primary,
  },
  predictionPrice: {
    width: 80,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    color: Colors.light.text,
  },
  infoText: {
    fontSize: 12,
    color: Colors.light.icon,
    marginTop: 10,
    fontFamily: 'System',
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.light.icon,
    marginBottom: 10,
    fontFamily: 'System',
  },
  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyRefreshText: {
    color: Colors.light.primary,
    fontWeight: '700',
    fontSize: 12,
    fontFamily: 'System',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    backgroundColor: Colors.light.inputBackground,
  },
  historyCropText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    fontFamily: 'System',
    marginBottom: 2,
  },
  historyMetaText: {
    fontSize: 12,
    color: Colors.light.icon,
    fontFamily: 'System',
    marginTop: 2,
  },
  historyPriceText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
    fontFamily: 'System',
    marginBottom: 4,
  },
  baseMandiCard: {
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  baseMandiLabel: {
    marginLeft: 6,
    fontSize: 13,
    color: Colors.light.icon,
    fontFamily: 'System',
  },
  baseMandiName: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    fontFamily: 'System',
  },
  mandiDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  mandiDropdownText: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
    fontFamily: 'System',
  },
  mandiDropdownPlaceholder: {
    color: Colors.light.icon,
  },
  baseMandiPrice: {
    marginTop: 8,
    fontSize: 13,
    color: Colors.light.icon,
    fontFamily: 'System',
  },
  nearbyList: {
    gap: 8,
    marginTop: 4,
  },
  nearbyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  nearbyRowWorth: {
    backgroundColor: '#ecfdf3',
    borderColor: '#22c55e33',
  },
  nearbyRowNotWorth: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef444433',
  },
  nearbyName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    fontFamily: 'System',
  },
  nearbyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  nearbyMetaText: {
    marginLeft: 4,
    fontSize: 12,
    color: Colors.light.icon,
    fontFamily: 'System',
  },
  nearbyPriceBlock: {
    alignItems: 'flex-end',
    minWidth: 110,
  },
  nearbyPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
    fontFamily: 'System',
  },
  nearbyDiff: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  nearbyDiffPositive: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
  },
  nearbyDiffNegative: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
  },
  nearbyNet: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'System',
  },
  nearbyNetPositive: {
    color: '#166534',
  },
  nearbyNetNegative: {
    color: '#991b1b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 24,
  },
  modalSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    fontFamily: 'System',
  },
  modalSheetBody: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalItemText: {
    fontSize: 15,
    color: Colors.light.text,
    fontFamily: 'System',
  },
});

