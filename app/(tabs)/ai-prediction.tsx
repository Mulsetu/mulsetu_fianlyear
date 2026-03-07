import { Colors } from '@/constants/theme';
import { useUser } from '@/contexts/UserContext';
import { fetchAllStateMarkets } from '@/utils/stateMarketImport';
import { supabase } from '@/utils/supabaseClient';
import { getResponsiveDimensions, isDesktop } from '@/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Horizon = '1D' | '7D';

export default function AiPredictionScreen() {
  const { user } = useUser();
  const dimensions = getResponsiveDimensions();

  const [fruits, setFruits] = useState<string[]>([]);
  const [isLoadingFruits, setIsLoadingFruits] = useState<boolean>(true);
  const [fruitModalVisible, setFruitModalVisible] = useState(false);
  const [selectedFruit, setSelectedFruit] = useState<string>('');
  const [horizon, setHorizon] = useState<Horizon>('1D');
  
  // Mandi selection state
  const [markets, setMarkets] = useState<Array<{ market_name: string; state_name: string }>>([]);
  const [loadingMarkets, setLoadingMarkets] = useState(false);
  const [selectedMandi, setSelectedMandi] = useState<string>(user?.market || '');
  const [mandiModalVisible, setMandiModalVisible] = useState(false);
  const [mandiSearch, setMandiSearch] = useState('');

  // Load fruits from Supabase (fruit_commodities)
  useEffect(() => {
    const loadFruits = async () => {
      try {
        setIsLoadingFruits(true);
        const { data, error } = await supabase
          .from('fruit_commodities')
          .select('commodity_name')
          .order('commodity_name', { ascending: true });

        if (error) {
          console.error('Error loading fruits for AI Prediction:', error);
          setFruits([]);
          return;
        }

        const names =
          (data ?? [])
            .map((row: any) => row.commodity_name as string | null)
            .filter((n): n is string => !!n) ?? [];

        setFruits(names);
        if (names.length > 0 && !selectedFruit) {
          setSelectedFruit(names[0]);
        }
      } finally {
        setIsLoadingFruits(false);
      }
    };

    loadFruits();
  }, []);

  // Load markets from state_market_import (full list, paginated past 1000 rows)
  useEffect(() => {
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

    loadMarkets();
  }, []);

  // Set initial mandi from user profile
  useEffect(() => {
    if (user?.market && !selectedMandi) {
      setSelectedMandi(user.market);
    }
  }, [user]);

  const filteredMarkets = markets.filter((m) => {
    const label = `${m.market_name}${m.state_name ? ` (${m.state_name})` : ''}`;
    if (!mandiSearch.trim()) return true;
    return label.toLowerCase().includes(mandiSearch.toLowerCase());
  });

  const marketOptionsList = filteredMarkets.map(
    (m) => `${m.market_name}${m.state_name ? ` (${m.state_name})` : ''}`
  );

  // Mock AI predictions – for now static, later will come from backend model
  const predictions = useMemo(() => {
    const base = 3000;
    const volatility = selectedFruit.length * 10;
    const days = Array.from({ length: 7 }, (_, i) => {
      const delta = (i - 3) * volatility * 0.1;
      return {
        dayLabel: i === 0 ? 'Tomorrow' : `Day ${i + 1}`,
        price: Math.round(base + delta),
      };
    });
    return days;
  }, [selectedFruit]);

  const visiblePredictions = horizon === '1D' ? predictions.slice(0, 1) : predictions;
  const maxPrice = Math.max(...predictions.map(p => p.price));
  const minPrice = Math.min(...predictions.map(p => p.price));
  const avgPrice = Math.round(
    predictions.reduce((sum, p) => sum + p.price, 0) / predictions.length,
  );

  // Mock profit comparison
  const baseMandi = selectedMandi || user?.market || 'Select Mandi';
  const basePrice = predictions[0].price;
  const nearbyMandis = useMemo(() => {
    const others = [
      { name: 'Nearby APMC 1', distanceKm: 25, factor: 1.08 },
      { name: 'Nearby APMC 2', distanceKm: 40, factor: 0.97 },
      { name: 'Nearby APMC 3', distanceKm: 60, factor: 1.12 },
    ];
    const quantityQtl = 10; // assume 10 qtl
    const transportPerKmPerQtl = 5; // ₹ per km per qtl (mock)

    return others.map(o => {
      const targetPrice = Math.round(basePrice * o.factor);
      const extraPerQtl = targetPrice - basePrice;
      const extraTotal = extraPerQtl * quantityQtl;
      const transportCost = o.distanceKm * transportPerKmPerQtl * quantityQtl;
      const netProfit = extraTotal - transportCost;
      const worthIt = netProfit > 0;

      return {
        ...o,
        targetPrice,
        extraPerQtl,
        netProfit,
        worthIt,
      };
    });
  }, [basePrice]);

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
          </View>

          {/* Fruit Selector */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Select Crop</Text>
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
              {visiblePredictions.map((p, idx) => {
                const widthPct = Math.max(20, (p.price / maxPrice) * 100);
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
              These are mock AI predictions for UI only. We&apos;ll connect the real model to
              Supabase later.
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
              <TouchableOpacity
                style={styles.mandiDropdown}
                onPress={() => {
                  if (!loadingMarkets && markets.length > 0) {
                    setMandiModalVisible(true);
                  }
                }}
                disabled={loadingMarkets || markets.length === 0}
              >
                <Text
                  style={[
                    styles.mandiDropdownText,
                    (!selectedMandi || markets.length === 0) && styles.mandiDropdownPlaceholder,
                  ]}
                >
                  {loadingMarkets
                    ? 'Loading mandis...'
                    : selectedMandi || 'Select your mandi'}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={18}
                  color={Colors.light.icon}
                />
              </TouchableOpacity>
              {selectedMandi && (
                <Text style={styles.baseMandiPrice}>
                  Tomorrow&apos;s predicted price:{' '}
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
              Transport and distance are approximated. Later we will plug in real routes, fuel
              costs and live mandi prices from Supabase.
            </Text>
          </View>
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
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: isDesktop ? 20 : 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 10,
    fontFamily: 'System',
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

