import { supabase } from "@/utils/supabaseClient";
import { router } from "expo-router";
import { ArrowDown, ArrowUp, Search } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";

// Type definitions
interface DiscoverFruit {
	commodity_id: number;
	commodity_name: string;
	image_url: string | null;
	display_order: number | null;
	current_price: number | null;
	price_trend: 'up' | 'down' | 'stable' | null;
	avg_price_today: number | null;
	market_count: number | null;
}

export default function DiscoverScreen() {
	const [searchQuery, setSearchQuery] = useState("");
	const [fruits, setFruits] = useState<DiscoverFruit[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Animation for price trend arrows
	const translateY = useSharedValue(0);
	const opacity = useSharedValue(1);
	const initialized = useRef(false);
	if (!initialized.current) {
		initialized.current = true;
		translateY.value = withRepeat(
			withSequence(
				withTiming(-4, { duration: 700, easing: Easing.inOut(Easing.ease) }),
				withTiming(0, { duration: 700, easing: Easing.inOut(Easing.ease) })
			),
			-1,
			true
		);
		opacity.value = withRepeat(
			withSequence(
				withTiming(0.6, { duration: 700 }),
				withTiming(1, { duration: 700 })
			),
			-1,
			true
		);
	}

	const arrowStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: translateY.value }],
		opacity: opacity.value,
	}));

	// Fetch fruits from Supabase
	useEffect(() => {
		loadFruits();
	}, []);

	const loadFruits = async () => {
		try {
			setIsLoading(true);
			setError(null);

			// Try to use the discover_fruits view first, fallback to fruit_commodities table
			let data: any[] | null = null;
			let fetchError: any = null;

			// First, try the view
			const viewResult = await supabase
				.from('discover_fruits')
				.select('*')
				.order('display_order', { ascending: true, nullsLast: true })
				.order('commodity_name', { ascending: true });

			if (viewResult.error) {
				console.log('View not found, falling back to fruit_commodities table');
				// Fallback to fruit_commodities table
				const tableResult = await supabase
					.from('fruit_commodities')
					.select('commodity_id, commodity_name, image_url, display_order, is_active, search_keywords')
					.order('commodity_name', { ascending: true });

				if (tableResult.error) {
					fetchError = tableResult.error;
				} else {
					// Map fruit_commodities data to DiscoverFruit format
					// Filter by is_active if it exists, otherwise show all
					const fruitsData = tableResult.data || [];
					const filteredFruits = fruitsData.filter((fruit: any) => {
						// If is_active column exists, filter by it; otherwise show all
						return fruit.is_active !== false;
					});

					data = filteredFruits.map((fruit: any) => ({
						commodity_id: fruit.commodity_id,
						commodity_name: fruit.commodity_name,
						image_url: fruit.image_url || null,
						display_order: fruit.display_order || null,
						current_price: null,
						price_trend: null,
						avg_price_today: null,
						market_count: null,
					}));
				}
			} else {
				data = viewResult.data;
			}

			if (fetchError) {
				console.error('Error fetching fruits:', fetchError);
				setError(fetchError.message);
				setFruits([]);
				return;
			}

			if (data) {
				setFruits(data as DiscoverFruit[]);
			}
		} catch (err) {
			console.error('Error loading fruits:', err);
			setError('Failed to load fruits. Please try again.');
			setFruits([]);
		} finally {
			setIsLoading(false);
		}
	};

	// Filter fruits based on search query
	const filteredCrops = useMemo(() => {
		if (!searchQuery.trim()) return fruits;
		const query = searchQuery.toLowerCase();
		return fruits.filter((fruit) => 
			fruit.commodity_name.toLowerCase().includes(query)
		);
	}, [searchQuery, fruits]);

	function onPressViewPrice(cropName: string) {
		// Navigate to dedicated price report page
		router.push((`/price-report/${encodeURIComponent(cropName)}` as any));
	}

	const renderCropCard = ({ item, index }: { item: DiscoverFruit; index: number }) => {
		// Determine price trend (up/down/stable)
		const isUp = item.price_trend === 'up';
		const isDown = item.price_trend === 'down';
		
		// Use image_url from database, or fallback to Unsplash
		const fruitImageUri = item.image_url || 
			`https://source.unsplash.com/seed/${encodeURIComponent(item.commodity_name)}/400x300/?fruit,fresh`;

		return (
			<View style={styles.card}>
				<Image
					source={{ uri: fruitImageUri }}
					style={styles.cardImage}
					resizeMode="cover"
				/>
				<View style={styles.cardHeaderRow}>
					<Text style={styles.cardTitle} numberOfLines={1}>
						{item.commodity_name}
					</Text>
					{item.price_trend && (
						<Animated.View style={arrowStyle}>
							{isUp ? (
								<ArrowUp color="#22c55e" size={18} />
							) : isDown ? (
								<ArrowDown color="#ef4444" size={18} />
							) : null}
						</Animated.View>
					)}
				</View>
				{item.current_price && (
					<Text style={styles.priceText}>
						₹{Math.round(item.current_price)}/qtl
					</Text>
				)}
				<Pressable 
					style={styles.viewPriceBtn} 
					onPress={() => onPressViewPrice(item.commodity_name)}
				>
					<Text style={styles.viewPriceText}>View Price</Text>
				</Pressable>
			</View>
		);
	};

	const renderEmptyState = () => {
		if (isLoading) {
			return (
				<View style={styles.emptyContainer}>
					<ActivityIndicator size="large" color="#19696c" />
					<Text style={styles.emptyText}>Loading fruits...</Text>
				</View>
			);
		}

		if (error) {
			return (
				<View style={styles.emptyContainer}>
					<Text style={styles.errorText}>{error}</Text>
					<Pressable style={styles.retryButton} onPress={loadFruits}>
						<Text style={styles.retryButtonText}>Retry</Text>
					</Pressable>
				</View>
			);
		}

		if (filteredCrops.length === 0) {
			return (
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyText}>
						{searchQuery ? 'No fruits found matching your search.' : 'No fruits available.'}
					</Text>
				</View>
			);
		}

		return null;
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
			<View style={{ flex: 1, backgroundColor: "#ffffff" }}>
				{/* Search Bar */}
				<View style={styles.searchBar}>
					<Search color="#19696c" size={20} />
					<TextInput
						style={styles.searchInput}
						placeholder="Search fruits…"
						placeholderTextColor="#64748b"
						value={searchQuery}
						onChangeText={setSearchQuery}
						returnKeyType="search"
					/>
				</View>

				{/* Crops Grid */}
				<FlatList
					data={filteredCrops}
					keyExtractor={(item) => `fruit-${item.commodity_id}`}
					numColumns={2}
					contentContainerStyle={[
						{ paddingHorizontal: 16, paddingBottom: 16 },
						filteredCrops.length === 0 && styles.emptyListContainer
					]}
					columnWrapperStyle={filteredCrops.length > 0 ? { justifyContent: "space-between" } : undefined}
					renderItem={({ item, index }) => renderCropCard({ item, index })}
					ListEmptyComponent={renderEmptyState}
					refreshing={isLoading}
					onRefresh={loadFruits}
				/>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
    searchBar: {
        backgroundColor: '#ffffff',
        borderColor: '#19696c',
        borderWidth: 1,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
        elevation: 1,
    },
    searchInput: {
        marginLeft: 8,
        flex: 1,
        color: '#475569',
    },
    card: {
        width: '48%',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 8,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
        elevation: 1,
    },
    cardImage: {
        width: '100%',
        height: 96,
        borderRadius: 10,
        backgroundColor: '#f3f4f6',
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    cardTitle: {
        color: '#19696c',
        fontWeight: '600',
        flex: 1,
        marginRight: 6,
    },
    viewPriceBtn: {
        backgroundColor: '#60941a',
        borderRadius: 10,
        paddingVertical: 8,
        marginTop: 8,
    },
    viewPriceText: {
        color: '#ffffff',
        textAlign: 'center',
        fontWeight: '600',
    },
    priceText: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
        textAlign: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 32,
    },
    emptyListContainer: {
        flexGrow: 1,
    },
    emptyText: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        marginTop: 16,
    },
    errorText: {
        fontSize: 16,
        color: '#ef4444',
        textAlign: 'center',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#19696c',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    retryButtonText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 16,
    },
});
