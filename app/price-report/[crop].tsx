import { supabase } from "@/utils/supabaseClient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { G, Line, Rect, Text as SvgText } from "react-native-svg";

interface NearbyMandi {
    name: string;
    price: number;
    distance: number;
    isSelected: boolean;
}

interface PriceDataPoint {
    day: string;
    price: number;
    date: string;
}

interface ComparisonBar {
    label: string;
    value: number;
}

export default function PriceReportScreen() {
    const { crop } = useLocalSearchParams<{ crop: string }>();
    const router = useRouter();

    const [selectedState, setSelectedState] = useState<string>("");
    const [selectedMandi, setSelectedMandi] = useState<string>("");
    const [openDropdown, setOpenDropdown] = useState<"state" | "mandi" | null>(null);
    
    // Data fetching states
    const [commodityId, setCommodityId] = useState<number | null>(null);
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);
    const [timeSeriesData, setTimeSeriesData] = useState<PriceDataPoint[]>([]);
    const [comparisonBars, setComparisonBars] = useState<ComparisonBar[]>([]);
    const [nearbyMandis, setNearbyMandis] = useState<NearbyMandi[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingPrices, setIsLoadingPrices] = useState(false);

    // State + Market options derived from price data for this commodity
    const [states, setStates] = useState<string[]>([]);
    const [markets, setMarkets] = useState<string[]>([]);
    const [isLoadingStates, setIsLoadingStates] = useState(true);
    const [isLoadingMarkets, setIsLoadingMarkets] = useState(false);

    // Load states for this commodity (from price tables) once commodityId is known
    useEffect(() => {
        const loadStates = async () => {
            if (!commodityId) return;
            try {
                setIsLoadingStates(true);

                const fetchFrom = async (table: string) => {
                    const { data, error } = await supabase
                        .from(table)
                        .select("state_name")
                        .eq("commodity_id", commodityId);
                    return { data, error };
                };

                // Prefer union view (all_prices), fallback to daily_prices
                let data: any[] | null = null;
                let error: any | null = null;

                const fromView = await fetchFrom("all_prices");
                if (fromView.error) {
                    const fromDaily = await fetchFrom("daily_prices");
                    data = fromDaily.data ?? [];
                    error = fromDaily.error;
                } else {
                    data = fromView.data ?? [];
                    error = null;
                }

                if (error) {
                    console.error("Error fetching states from price data:", error);
                    setStates([]);
                    return;
                }

                const uniqueStates = Array.from(
                    new Set(
                        (data ?? [])
                            .map((row: any) => row.state_name as string | null)
                            .filter((name): name is string => !!name)
                    )
                ).sort((a, b) => a.localeCompare(b));

                setStates(uniqueStates);
            } finally {
                setIsLoadingStates(false);
            }
        };

        loadStates();
    }, [commodityId]);

    // Load markets for this commodity + selected state (from price tables)
    useEffect(() => {
        const loadMarkets = async () => {
            if (!selectedState || !commodityId) {
                setMarkets([]);
                return;
            }
            try {
                setIsLoadingMarkets(true);

                const fetchFrom = async (table: string) => {
                    const { data, error } = await supabase
                        .from(table)
                        .select("market_name")
                        .eq("commodity_id", commodityId)
                        .eq("state_name", selectedState);
                    return { data, error };
                };

                let data: any[] | null = null;
                let error: any | null = null;

                const fromView = await fetchFrom("all_prices");
                if (fromView.error) {
                    const fromDaily = await fetchFrom("daily_prices");
                    data = fromDaily.data ?? [];
                    error = fromDaily.error;
                } else {
                    data = fromView.data ?? [];
                    error = null;
                }

                if (error) {
                    console.error("Error fetching markets from price data:", error);
                    setMarkets([]);
                    return;
                }

                const uniqueMarkets = Array.from(
                    new Set(
                        (data ?? [])
                            .map((row: any) => row.market_name as string | null)
                            .filter((name): name is string => !!name)
                    )
                ).sort((a, b) => a.localeCompare(b));

                setMarkets(uniqueMarkets);
            } finally {
                setIsLoadingMarkets(false);
            }
        };

        loadMarkets();
    }, [selectedState, commodityId]);

    // Fetch commodity_id from fruit name
    useEffect(() => {
        const fetchCommodityId = async () => {
            if (!crop) return;
            
            try {
                const { data, error } = await supabase
                    .from('fruit_commodities')
                    .select('commodity_id')
                    .eq('commodity_name', crop)
                    .single();

                if (error) {
                    console.error('Error fetching commodity ID:', error);
                    return;
                }

                if (data) {
                    setCommodityId(data.commodity_id);
                }
            } catch (err) {
                console.error('Error:', err);
            }
        };

        fetchCommodityId();
    }, [crop]);

    // Fetch price data when filters change
    useEffect(() => {
        if (!commodityId) return;
        fetchPriceData();
    }, [commodityId, selectedState, selectedMandi]);

    const fetchPriceData = async () => {
        if (!commodityId) return;
        
        setIsLoadingPrices(true);
        try {
            // Use a wider window so older sample data (up to 1 year) also shows in the trend.
            const TREND_DAYS = 365;
            const sourceTable = "all_prices"; // view (daily_prices + daily_prices_history)

            // Build query filters (prefer union view; fallback to daily_prices if view missing)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - TREND_DAYS);
            const startDate = sevenDaysAgo.toISOString().split("T")[0];

            const buildQuery = (table: string) => {
                let q = supabase
                    .from(table)
                    .select('date, modal_price, state_name, market_name, min_price, max_price')
                    .eq('commodity_id', commodityId);

                // Apply location filters (State and Market only)
                if (selectedMandi && selectedState) {
                    q = q.eq('state_name', selectedState).eq('market_name', selectedMandi);
                } else if (selectedState) {
                    q = q.eq('state_name', selectedState);
                }

                return q.gte('date', startDate).order('date', { ascending: true });
            };

            // Try view first
            let priceData: any[] | null = null;
            let error: any | null = null;

            const viewRes = await buildQuery(sourceTable);
            if (viewRes.error) {
                // fallback
                const dailyRes = await buildQuery("daily_prices");
                priceData = dailyRes.data as any[] | null;
                error = dailyRes.error;
            } else {
                priceData = viewRes.data as any[] | null;
                error = null;
            }

            if (error) {
                console.error('Error fetching price data:', error);
                setIsLoadingPrices(false);
                return;
            }

            if (priceData && priceData.length > 0) {
                // Process time series data (keep chart readable: show last 7 points)
                const groupedByDate = priceData.reduce((acc: any, item: any) => {
                    const date = item.date;
                    if (!acc[date]) {
                        acc[date] = [];
                    }
                    acc[date].push(item.modal_price);
                    return acc;
                }, {});

                const allPoints: PriceDataPoint[] = Object.keys(groupedByDate)
                    .sort()
                    .map((dateStr) => {
                        const prices = groupedByDate[dateStr];
                        const avgPrice = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
                        const date = new Date(dateStr);
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                        
                        return {
                            day: dayName,
                            price: Math.round(avgPrice),
                            date: dateStr,
                        };
                    });

                setTimeSeriesData(allPoints.slice(-7));

                // Get current price (today's or most recent)
                const today = new Date().toISOString().split('T')[0];
                const todayData = priceData.filter((p: any) => p.date === today);
                
                if (selectedMandi && todayData.length > 0) {
                    // Get price for selected mandi
                    const mandiData = todayData.find((p: any) => p.market_name === selectedMandi);
                    if (mandiData) {
                        setCurrentPrice(Math.round(mandiData.modal_price));
                    }
                } else if (todayData.length > 0) {
                    // Average of today's prices
                    const avg = todayData.reduce((sum: number, p: any) => sum + p.modal_price, 0) / todayData.length;
                    setCurrentPrice(Math.round(avg));
                } else if (priceData.length > 0) {
                    // Use most recent data
                    const latest = priceData[priceData.length - 1];
                    setCurrentPrice(Math.round(latest.modal_price));
                }

                // Fetch nearby mandis prices (use today's slice)
                await fetchNearbyMandisPrices(priceData);

                // Build comparison bars for latest snapshot
                // X-axis: State names (India view) or Mandi names (when a state is selected)
                let latestDate: string | null = null;
                for (const row of priceData) {
                    if (!latestDate || row.date > latestDate) {
                        latestDate = row.date;
                    }
                }

                if (latestDate) {
                    const latestData = priceData.filter((p: any) => p.date === latestDate);

                    if (!selectedState) {
                        // India view: group by state_name
                        const byState = new Map<string, { sum: number; count: number }>();
                        latestData.forEach((row: any) => {
                            const key = row.state_name || "Unknown";
                            const prev = byState.get(key) ?? { sum: 0, count: 0 };
                            prev.sum += Number(row.modal_price ?? 0);
                            prev.count += 1;
                            byState.set(key, prev);
                        });

                        const bars: ComparisonBar[] = Array.from(byState.entries()).map(
                            ([label, { sum, count }]) => ({
                                label,
                                value: Math.round(sum / Math.max(count, 1)),
                            })
                        );

                        // Show top 7 states by price
                        bars.sort((a, b) => b.value - a.value);
                        setComparisonBars(bars.slice(0, 7));
                    } else {
                        // State view: group by market_name within selected state
                        const byMarket = new Map<string, { sum: number; count: number }>();
                        latestData.forEach((row: any) => {
                            if (row.state_name !== selectedState) return;
                            const key = row.market_name || "Unknown";
                            const prev = byMarket.get(key) ?? { sum: 0, count: 0 };
                            prev.sum += Number(row.modal_price ?? 0);
                            prev.count += 1;
                            byMarket.set(key, prev);
                        });

                        const bars: ComparisonBar[] = Array.from(byMarket.entries()).map(
                            ([label, { sum, count }]) => ({
                                label,
                                value: Math.round(sum / Math.max(count, 1)),
                            })
                        );

                        // Show top 7 mandis by price
                        bars.sort((a, b) => b.value - a.value);
                        setComparisonBars(bars.slice(0, 7));
                    }
                } else {
                    setComparisonBars([]);
                }
            } else {
                // No data available
                setTimeSeriesData([]);
                setCurrentPrice(null);
                setNearbyMandis([]);
                setComparisonBars([]);
            }
        } catch (err) {
            console.error('Error fetching prices:', err);
        } finally {
            setIsLoadingPrices(false);
            setIsLoading(false);
        }
    };

    const fetchNearbyMandisPrices = async (priceData: any[]) => {
        if (!selectedState || markets.length === 0) {
            setNearbyMandis([]);
            return;
        }

        // Use the most recent date available in the filtered price data
        let latestDate: string | null = null;
        for (const row of priceData) {
            if (!latestDate || row.date > latestDate) {
                latestDate = row.date;
            }
        }

        if (!latestDate) {
            setNearbyMandis([]);
            return;
        }

        const todayData = priceData.filter((p: any) => p.date === latestDate);

        const mandisList: NearbyMandi[] = [];
        const marketsToShow = markets.slice(0, 5);

        marketsToShow.forEach((mandiName) => {
            // Match market by name (flexible matching)
            const mandiPriceData = todayData.filter((p: any) => {
                const marketName = p.market_name.toLowerCase();
                const mandiLower = mandiName.toLowerCase();
                
                return marketName.includes(mandiLower) || mandiLower.includes(marketName);
            });

            if (mandiPriceData.length > 0) {
                const avgPrice = mandiPriceData.reduce((sum, p) => sum + p.modal_price, 0) / mandiPriceData.length;
                mandisList.push({
                    name: mandiName,
                    price: Math.round(avgPrice),
                    distance: Math.round(5 + Math.random() * 45), // Mock distance
                    isSelected: mandiName === selectedMandi,
                });
            }
        });

        // Sort by price (highest first)
        mandisList.sort((a, b) => b.price - a.price);
        setNearbyMandis(mandisList);
    };

    const prices = comparisonBars.length
        ? comparisonBars.map(b => b.value)
        : timeSeriesData.map(d => d.price);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;

    const cropImageUri = `https://source.unsplash.com/seed/${encodeURIComponent(String(crop ?? "crop"))}/400x300/?farm,produce`;

    const handleStateSelect = (stateName: string) => {
        setSelectedState(stateName);
        setSelectedMandi("");
        setOpenDropdown(null);
    };

    const handleMandiSelect = (mandiName: string) => {
        setSelectedMandi(mandiName);
        setOpenDropdown(null);
    };

    const getSelectedMandiLabel = () => {
        if (selectedMandi) {
            const mandi = markets.find(m => m === selectedMandi);
            return mandi || "";
        }
        return "";
    };

    const getSelectedStateLabel = () => {
        if (selectedState) {
            const state = states.find(s => s === selectedState);
            return state || "";
        }
        return "";
    };


    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft color="#ffffff" size={24} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Image
                        source={require("../../assets/images/mulsetu_logo.png")}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.headerTitle}>Price Report</Text>
                </View>
                <TouchableOpacity style={styles.bellButton}>
                    <Ionicons name="notifications-outline" size={24} color="#ffffff" />
                </TouchableOpacity>
                    </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Current Price Section */}
                {currentPrice && (
                    <View style={styles.currentPriceCard}>
                        <Text style={styles.currentPriceLabel}>Current Price</Text>
                        <Text style={styles.currentPriceValue}>₹{currentPrice}/qtl</Text>
                        <Text style={styles.currentPriceMandi}>
                            {selectedMandi ? getSelectedMandiLabel() : selectedState ? getSelectedStateLabel() : "India Average"}
                        </Text>
                    </View>
                )}

                {/* Loading Indicator */}
                {isLoadingPrices && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#19696c" />
                        <Text style={styles.loadingText}>Loading price data...</Text>
                    </View>
                )}

                {/* Price Analysis Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>
                        {String(crop)} Price Analysis
                    </Text>
                    <Text style={styles.cardSubtitle}>
                        Real-time price trends across {selectedState ? getSelectedStateLabel() : "India"}
                    </Text>
                    </View>

                {/* Find Exact Price Section */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Find Exact Price</Text>
                    <Text style={styles.cardSubtitle}>Select your location to get precise pricing.</Text>

                    {/* State Dropdown */}
                    <View style={styles.dropdownContainer}>
                        <Text style={styles.dropdownLabel}>State</Text>
                        <TouchableOpacity
                            style={styles.dropdown}
                            onPress={() => setOpenDropdown(openDropdown === "state" ? null : "state")}
                        >
                            <Text style={[styles.dropdownText, !selectedState && styles.placeholder]}>
                                {selectedState ? getSelectedStateLabel() : "Select State"}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#19696c" />
                        </TouchableOpacity>
                        </View>

                    {/* Mandi Dropdown */}
                    {selectedState && (
                        <View style={styles.dropdownContainer}>
                            <Text style={styles.dropdownLabel}>Mandi</Text>
                            <TouchableOpacity
                                style={styles.dropdown}
                                onPress={() => setOpenDropdown(openDropdown === "mandi" ? null : "mandi")}
                            >
                                <Text style={[styles.dropdownText, !selectedMandi && styles.placeholder]}>
                                    {selectedMandi ? getSelectedMandiLabel() : "Select Mandi"}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#19696c" />
                            </TouchableOpacity>
                        </View>
                    )}
                    </View>

                {/* Price Trends Card with comparison chart */}
                <View style={styles.card}>
                    <View style={styles.trendsHeader}>
                        <Text style={styles.trendsTitle}>Price Trends - {selectedState ? getSelectedStateLabel() : "India"}</Text>
                        <View style={styles.priceSummary}>
                            <Text style={styles.priceMin}>Min: ₹{minPrice}</Text>
                            <Text style={styles.priceMax}>Max: ₹{maxPrice}</Text>
                            <Text style={styles.priceAvg}>Avg: ₹{avgPrice}</Text>
                        </View>
                    </View>

                    {/* Bar chart: X-axis = States (India) or Mandis (state view), Y-axis = Price */}
                    {comparisonBars.length > 0 ? (
                        <View style={styles.chartContainer}>
                            <Svg width="100%" height={220} viewBox="0 0 320 220">
                                {(() => {
                                    const chartWidth = 260;
                                    const chartHeight = 160;
                                    const paddingLeft = 40;
                                    const paddingTop = 20;
                                    
                                    const dataPoints = comparisonBars.length;
                                    const barSpacing = 10;
                                    const totalSpacing = barSpacing * (dataPoints + 1);
                                    const barWidth = dataPoints > 0 ? (chartWidth - totalSpacing) / dataPoints : 0;
                                    const maxVal = maxPrice || 1;
                                    
                                    if (dataPoints === 0) {
                                        return <G />;
                                    }
                                
                                    // Draw grid lines and Y-axis labels
                                    const gridLines = 5;
                                    const gridElements = [];
                                    for (let i = 0; i <= gridLines; i++) {
                                        const y = paddingTop + (chartHeight / gridLines) * i;
                                        const price = maxVal - (maxVal / gridLines) * i;
                                        gridElements.push(
                                            <G key={`grid-${i}`}>
                                                <Line
                                                    x1={paddingLeft}
                                                    y1={y}
                                                    x2={paddingLeft + chartWidth}
                                                    y2={y}
                                                    stroke="#e5e7eb"
                                                    strokeWidth="1"
                                                    strokeDasharray="4,4"
                                                />
                                                <SvgText
                                                    x={paddingLeft - 8}
                                                    y={y + 4}
                                                    fontSize="10"
                                                    textAnchor="end"
                                                    fill="#64748b"
                                                >
                                                    ₹{price.toFixed(0)}
                                                </SvgText>
                                            </G>
                                        );
                                    }

                                    // Draw bars
                                    const barElements = comparisonBars.map((bar, index) => {
                                        const x = paddingLeft + barSpacing + index * (barWidth + barSpacing);
                                        const barHeight = (bar.value / maxVal) * chartHeight;
                                        const y = paddingTop + chartHeight - barHeight;

                                        return (
                                            <G key={`bar-${index}`}>
                                                <Rect
                                                    x={x}
                                                    y={y}
                                                    width={barWidth}
                                                    height={barHeight}
                                                    fill="#60941a"
                                                    rx={4}
                                                />
                                                <SvgText
                                                    x={x + barWidth / 2}
                                                    y={y - 6}
                                                    fontSize="11"
                                                    textAnchor="middle"
                                                    fill="#111827"
                                                    fontWeight="bold"
                                                >
                                                    ₹{bar.value}
                                                </SvgText>
                                                <SvgText
                                                    x={x + barWidth / 2}
                                                    y={paddingTop + chartHeight + 20}
                                                    fontSize="10"
                                                    textAnchor="middle"
                                                    fill="#64748b"
                                                >
                                                    {bar.label.length > 8 ? `${bar.label.slice(0, 7)}…` : bar.label}
                                                </SvgText>
                                            </G>
                                        );
                                    });

                                    return (
                                        <G>
                                            {gridElements}
                                            {barElements}
                                        </G>
                                    );
                                })()}
                            </Svg>
                        </View>
                    ) : (
                        <View style={styles.noDataContainer}>
                            <Text style={styles.noDataText}>
                                {isLoadingPrices ? 'Loading price data...' : 'No price data available for the selected filters.'}
                            </Text>
                        </View>
                    )}
                    </View>

                {/* Price Comparison with Nearby Mandis */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Price Comparison</Text>
                    <Text style={styles.cardSubtitle}>Compare prices with nearby mandis to get the best deal.</Text>
                    
                    {nearbyMandis.length > 0 ? (() => {
                        const highestPrice = nearbyMandis[0]?.price || 0;
                        
                        return (
                            <View style={styles.comparisonContainer}>
                                {nearbyMandis.map((mandi, index) => {
                                    const isHighest = mandi.price === highestPrice;
                                    const priceDiff = selectedMandi && nearbyMandis.find(m => m.isSelected) 
                                        ? mandi.price - nearbyMandis.find(m => m.isSelected)!.price 
                                        : 0;
                                    
                                    return (
                                        <View
                                            key={index}
                                            style={[
                                                styles.mandiComparisonRow,
                                                isHighest && styles.highestMandiRow,
                                                index < nearbyMandis.length - 1 && styles.mandiRowBorder,
                                            ]}
                                        >
                                            <View style={styles.mandiInfo}>
                                                <View style={styles.mandiNameRow}>
                                                    <Text style={styles.mandiName}>{mandi.name}</Text>
                                                    {mandi.isSelected && (
                                                        <View style={styles.selectedBadge}>
                                                            <Text style={styles.selectedBadgeText}>Selected</Text>
                                                        </View>
                                                    )}
                                                    {isHighest && !mandi.isSelected && (
                                                        <View style={styles.highestBadge}>
                                                            <Ionicons name="trending-up" size={14} color="#ffffff" />
                                                            <Text style={styles.highestBadgeText}>Highest</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <View style={styles.mandiMeta}>
                                                    <Ionicons name="location" size={14} color="#64748b" />
                                                    <Text style={styles.mandiDistance}>{mandi.distance} km away</Text>
                                                    {selectedMandi && priceDiff !== 0 && (
                                                        <Text style={[styles.priceDiff, priceDiff > 0 ? styles.priceDiffPositive : styles.priceDiffNegative]}>
                                                            {priceDiff > 0 ? '+' : ''}₹{Math.abs(priceDiff)} {priceDiff > 0 ? 'higher' : 'lower'}
                                                        </Text>
                                                    )}
                                                </View>
                        </View>
                                            <View style={styles.mandiPriceContainer}>
                                                <Text style={[styles.mandiPriceValue, isHighest && styles.highestPrice]}>
                                                    ₹{mandi.price}/qtl
                                                </Text>
                                                {isHighest && (
                                                    <Ionicons name="trophy" size={18} color="#f59e0b" style={styles.trophyIcon} />
                                                )}
                    </View>
                            </View>
                                    );
                                })}
                            </View>
                        );
                    })() : (
                        <View style={styles.noDataContainer}>
                            <Text style={styles.noDataText}>
                                {isLoadingPrices ? 'Loading comparison data...' : 'No price comparison data available. Please select a state to see nearby mandis.'}
                            </Text>
                        </View>
                    )}
                            </View>
            </ScrollView>

            {/* State Dropdown Modal */}
            <Modal
                visible={openDropdown === "state"}
                transparent
                animationType="slide"
                onRequestClose={() => setOpenDropdown(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select State</Text>
                            <TouchableOpacity onPress={() => setOpenDropdown(null)}>
                                <Ionicons name="close" size={24} color="#19696c" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {isLoadingStates ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="small" color="#19696c" />
                                    <Text style={styles.loadingText}>Loading states...</Text>
                                </View>
                            ) : states.length === 0 ? (
                                <View style={styles.noDataContainer}>
                                    <Text style={styles.noDataText}>No states found for this crop.</Text>
                                </View>
                            ) : (
                                states.map((stateName) => (
                                    <TouchableOpacity
                                        key={stateName}
                                        style={styles.modalItem}
                                        onPress={() => handleStateSelect(stateName)}
                                    >
                                        <Text style={styles.modalItemText}>{stateName}</Text>
                                        {selectedState === stateName && (
                                            <Ionicons name="checkmark" size={20} color="#60941a" />
                                        )}
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </View>
                                </View>
            </Modal>


            {/* Mandi Dropdown Modal */}
            <Modal
                visible={openDropdown === "mandi"}
                transparent
                animationType="slide"
                onRequestClose={() => setOpenDropdown(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Mandi</Text>
                            <TouchableOpacity onPress={() => setOpenDropdown(null)}>
                                <Ionicons name="close" size={24} color="#19696c" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {isLoadingMarkets ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="small" color="#19696c" />
                                    <Text style={styles.loadingText}>Loading markets...</Text>
                                </View>
                            ) : markets.length === 0 ? (
                                <View style={styles.noDataContainer}>
                                    <Text style={styles.noDataText}>No markets found for this state.</Text>
                            </View>
                            ) : (
                                markets.map((mandiName) => (
                                    <TouchableOpacity
                                        key={mandiName}
                                        style={styles.modalItem}
                                        onPress={() => handleMandiSelect(mandiName)}
                                    >
                                        <Text style={styles.modalItemText}>{mandiName}</Text>
                                        {selectedMandi === mandiName && (
                                            <Ionicons name="checkmark" size={20} color="#60941a" />
                                        )}
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </View>
                    </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#ffffff",
    },
    header: {
        backgroundColor: "#19696c",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 4,
    },
    headerCenter: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        justifyContent: "center",
    },
    logo: {
        width: 32,
        height: 32,
        marginRight: 8,
    },
    headerTitle: {
        color: "#ffffff",
        fontSize: 18,
        fontWeight: "700",
    },
    bellButton: {
        padding: 4,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    currentPriceCard: {
        backgroundColor: "#60941a",
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        alignItems: "center",
    },
    currentPriceLabel: {
        color: "rgba(255, 255, 255, 0.9)",
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
    },
    currentPriceValue: {
        color: "#ffffff",
        fontSize: 32,
        fontWeight: "800",
        marginBottom: 4,
    },
    currentPriceMandi: {
        color: "rgba(255, 255, 255, 0.9)",
        fontSize: 14,
        fontWeight: "500",
    },
    card: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardTitle: {
        color: "#60941a",
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 4,
    },
    cardSubtitle: {
        color: "#64748b",
        fontSize: 13,
        marginBottom: 16,
    },
    trendsHeader: {
        marginBottom: 16,
    },
    trendsTitle: {
        color: "#60941a",
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 12,
    },
    priceSummary: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 12,
    },
    priceMin: {
        color: "#22c55e",
        fontSize: 12,
        fontWeight: "600",
    },
    priceMax: {
        color: "#ef4444",
        fontSize: 12,
        fontWeight: "600",
    },
    priceAvg: {
        color: "#19696c",
        fontSize: 12,
        fontWeight: "600",
    },
    chartContainer: {
        marginVertical: 16,
        height: 220,
        width: "100%",
    },
    legend: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 20,
        marginTop: 12,
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
    },
    legendColor: {
        width: 16,
        height: 16,
        borderRadius: 4,
        marginRight: 6,
    },
    legendText: {
        color: "#374151",
        fontSize: 12,
        fontWeight: "500",
    },
    dropdownContainer: {
        marginBottom: 16,
    },
    dropdownLabel: {
        color: "#19696c",
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
    },
    dropdown: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: "#19696c",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: "#ffffff",
    },
    dropdownText: {
        color: "#19696c",
        fontSize: 15,
        flex: 1,
    },
    placeholder: {
        color: "#94a3b8",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#ffffff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: "80%",
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    modalTitle: {
        color: "#19696c",
        fontSize: 18,
        fontWeight: "700",
    },
    modalItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    modalItemText: {
        color: "#19696c",
        fontSize: 15,
    },
    comparisonContainer: {
        marginTop: 8,
    },
    mandiComparisonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 12,
        backgroundColor: "#f9fafb",
        borderRadius: 12,
        marginBottom: 8,
    },
    highestMandiRow: {
        backgroundColor: "#fef3c7",
        borderWidth: 2,
        borderColor: "#f59e0b",
    },
    mandiRowBorder: {
        marginBottom: 8,
    },
    mandiInfo: {
        flex: 1,
        marginRight: 12,
    },
    mandiNameRow: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        marginBottom: 6,
    },
    mandiName: {
        color: "#19696c",
        fontSize: 15,
        fontWeight: "600",
        marginRight: 8,
    },
    selectedBadge: {
        backgroundColor: "#60941a",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    selectedBadgeText: {
        color: "#ffffff",
        fontSize: 10,
        fontWeight: "700",
    },
    highestBadge: {
        backgroundColor: "#f59e0b",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginLeft: 8,
    },
    highestBadgeText: {
        color: "#ffffff",
        fontSize: 10,
        fontWeight: "700",
        marginLeft: 4,
    },
    mandiMeta: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
    },
    mandiDistance: {
        color: "#64748b",
        fontSize: 12,
        marginLeft: 4,
    },
    priceDiff: {
        fontSize: 11,
        fontWeight: "600",
        marginLeft: 12,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    priceDiffPositive: {
        color: "#ef4444",
        backgroundColor: "#fee2e2",
    },
    priceDiffNegative: {
        color: "#22c55e",
        backgroundColor: "#dcfce7",
    },
    mandiPriceContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    mandiPriceValue: {
        color: "#60941a",
        fontSize: 18,
        fontWeight: "800",
        marginRight: 6,
    },
    highestPrice: {
        color: "#f59e0b",
        fontSize: 20,
    },
    trophyIcon: {
        marginLeft: 4,
    },
    loadingContainer: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#64748b',
        fontSize: 14,
    },
    noDataContainer: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    noDataText: {
        color: '#64748b',
        fontSize: 14,
        textAlign: 'center',
    },
});
