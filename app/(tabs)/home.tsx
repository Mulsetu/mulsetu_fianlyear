import { router } from 'expo-router';
import { ArrowDown, ArrowUp, Bell } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUser } from '@/contexts/UserContext';
import { getResponsiveDimensions } from '@/utils/responsive';
import { supabase } from '@/utils/supabaseClient';

export default function HomeScreen() {
  const { user } = useUser();
  const isTrader = user?.userType === 'Trader';
  const { containerMaxWidth } = getResponsiveDimensions();
  const displayName = user?.name?.trim() || 'User';
  const displayLocation = user?.location?.trim()
    || user?.market?.trim()
    || [user?.district, user?.state].filter(Boolean).join(', ')
    || 'Location not set';
  const userInitials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  // Highlight slider cards – live mandi prices for fruits (filtered by user's chosen mandi/commodity)
  const highlightCards = [
    {
      id: 'h1',
      fruitName: 'Mango',
    mandi: 'Lasalgaon Mandi',
      price: 3200,
      up: true,
      image: 'https://images.unsplash.com/photo-1605027990121-cf736893f678?q=80&w=1200&auto=format&fit=crop',
    },
    {
      id: 'h2',
      fruitName: 'Grapes',
      mandi: 'Nashik APMC',
      price: 3800,
      up: true,
      image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6d2b6?q=80&w=1200&auto=format&fit=crop',
    },
    {
      id: 'h3',
      fruitName: 'Apple',
      mandi: 'Pune Market',
      price: 1800,
      up: false,
      image: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?q=80&w=1200&auto=format&fit=crop',
    },
    {
      id: 'h4',
      fruitName: 'Pomegranate',
      mandi: 'Mumbai APMC',
      price: 4200,
      up: true,
      image: 'https://images.unsplash.com/photo-1615485925511-48d1c5c481f9?q=80&w=1200&auto=format&fit=crop',
    },
    {
      id: 'h5',
      fruitName: 'Banana',
      mandi: 'Nashik APMC',
      price: 1200,
      up: false,
      image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?q=80&w=1200&auto=format&fit=crop',
    },
  ];

  const trendTips = [
    { id: 't1', title: 'Onion arrivals up', tip: 'Price may fall, sell timely', up: false },
    { id: 't2', title: 'Grapes demand rising', tip: 'Consider delayed sale', up: true },
    { id: 't3', title: 'Tomato steady', tip: 'Plan transport to Pune', up: true },
  ];


  // Central agriculture schemes – Govt Scheme Updates (Farmer dashboard)
  const centralAgricultureSchemes = [
    { name: 'PM-KISAN', description: 'Income support of ₹6000 per year to farmers', website: 'https://pmkisan.gov.in' },
    { name: 'PM Fasal Bima Yojana', description: 'Crop insurance scheme for farmers', website: 'https://pmfby.gov.in' },
    { name: 'PM Krishi Sinchai Yojana', description: 'Irrigation scheme to improve water efficiency', website: 'https://pmksy.gov.in' },
    { name: 'Soil Health Card Scheme', description: 'Provides soil nutrient status and fertilizer advice', website: 'https://soilhealth.dac.gov.in' },
    { name: 'PM Kisan Maandhan Yojana', description: 'Pension scheme for small and marginal farmers', website: 'https://maandhan.in' },
    { name: 'PM Kusum Scheme', description: 'Solar pump subsidy and renewable energy for farmers', website: 'https://pmkusum.mnre.gov.in' },
    { name: 'eNAM', description: 'National Agriculture Market trading platform', website: 'https://enam.gov.in' },
    { name: 'Agriculture Infrastructure Fund', description: 'Financial support for agriculture infrastructure', website: 'https://agriinfra.dac.gov.in' },
    { name: 'National Bamboo Mission', description: 'Promotes bamboo cultivation and industry', website: 'https://nbm.nic.in' },
    { name: 'FPO Scheme', description: 'Support for forming Farmer Producer Organizations', website: 'https://sfacindia.com' },
  ];

  // Trader: ongoing (pending) bids
  interface OngoingBid {
    id: string;
    listingId: string;
    produce: string;
    seller: string;
    market: string;
    quantity: number;
    pricePerQuintal: number;
    totalAmount: number;
    status: string;
    createdAt: string;
    otherBidsCount: number; // number of other bids on this listing (so total = otherBidsCount + 1)
  }
  const [ongoingBids, setOngoingBids] = useState<OngoingBid[]>([]);
  const [loadingOngoingBids, setLoadingOngoingBids] = useState(false);

  // Leaderboard modal (bids on a listing)
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [leaderboardProduce, setLeaderboardProduce] = useState('');
  const [leaderboardOffers, setLeaderboardOffers] = useState<{ buyer_name: string; quantity: number; price_per_quintal: number; total_amount: number; status: string }[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [showSchemesModal, setShowSchemesModal] = useState(false);

  const openLeaderboard = useCallback(async (listingId: string, produce: string) => {
    setLeaderboardProduce(produce);
    setShowLeaderboardModal(true);
    setLeaderboardOffers([]);
    setLoadingLeaderboard(true);
    try {
      const { data, error } = await supabase
        .from('listing_offers')
        .select('buyer_name, quantity, price_per_quintal, total_amount, status')
        .eq('listing_id', listingId)
        .order('price_per_quintal', { ascending: false });

      if (error) {
        console.error('Error loading leaderboard:', error);
        setLeaderboardOffers([]);
        return;
      }
      setLeaderboardOffers((data ?? []).map((r: any) => ({
        buyer_name: r.buyer_name ?? 'Trader',
        quantity: Number(r.quantity ?? 0),
        price_per_quintal: Number(r.price_per_quintal ?? 0),
        total_amount: Number(r.total_amount ?? 0),
        status: r.status ?? 'pending',
      })));
    } finally {
      setLoadingLeaderboard(false);
    }
  }, []);

  const loadOngoingBids = useCallback(async () => {
    if (!user?.id || !isTrader) {
      setOngoingBids([]);
      return;
    }
    setLoadingOngoingBids(true);
    try {
      const { data: offersData, error } = await supabase
        .from('listing_offers')
        .select('id, listing_id, quantity, price_per_quintal, total_amount, status, created_at')
        .eq('buyer_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading ongoing bids:', error);
        setOngoingBids([]);
        return;
      }

      const offers = offersData ?? [];
      if (offers.length === 0) {
        setOngoingBids([]);
        return;
      }

      const listingIds = [...new Set(offers.map((o: any) => o.listing_id))];
      const { data: listingsData } = await supabase
        .from('listings')
        .select('id, produce, seller_display_name, market')
        .in('id', listingIds);

      const listingMap = new Map<string, { produce: string; seller: string; market: string }>();
      (listingsData ?? []).forEach((l: any) => {
        listingMap.set(l.id, {
          produce: l.produce ?? 'Listing',
          seller: l.seller_display_name ?? 'Seller',
          market: l.market ?? '',
        });
      });

      // Count how many bids (offers) exist per listing (including from other traders)
      const { data: allOffersForListings } = await supabase
        .from('listing_offers')
        .select('listing_id')
        .in('listing_id', listingIds);

      const countByListing = new Map<string, number>();
      (allOffersForListings ?? []).forEach((o: any) => {
        const lid = o.listing_id;
        countByListing.set(lid, (countByListing.get(lid) ?? 0) + 1);
      });

      const mapped: OngoingBid[] = offers.map((row: any) => {
        const listing = listingMap.get(row.listing_id);
        const totalBids = countByListing.get(row.listing_id) ?? 1;
        const otherBidsCount = Math.max(0, totalBids - 1);
        return {
          id: row.id,
          listingId: row.listing_id,
          produce: listing?.produce ?? 'Listing',
          seller: listing?.seller ?? 'Seller',
          market: listing?.market ?? '',
          quantity: Number(row.quantity ?? 0),
          pricePerQuintal: Number(row.price_per_quintal ?? 0),
          totalAmount: Number(row.total_amount ?? 0),
          status: row.status ?? 'pending',
          createdAt: row.created_at,
          otherBidsCount,
        };
      });
      setOngoingBids(mapped);
    } finally {
      setLoadingOngoingBids(false);
    }
  }, [user?.id, isTrader]);

  useEffect(() => {
    if (isTrader && user?.id) {
      loadOngoingBids();
    }
  }, [isTrader, user?.id, loadOngoingBids]);

  // Removed sparkline chart per request

  // Auto-scrolling tickers
  const newsRef = useRef<ScrollView | null>(null);
  const insightsRef = useRef<ScrollView | null>(null);
  const fruitSliderRef = useRef<ScrollView | null>(null);
  const [newsOffset, setNewsOffset] = useState(0);
  const [insightsOffset, setInsightsOffset] = useState(0);
  const [currentFruitIndex, setCurrentFruitIndex] = useState(0);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [newsWidth] = useState(1);
  const [insightsWidth, setInsightsWidth] = useState(1);

  useEffect(() => {
    const id = setInterval(() => {
      setNewsOffset((prev) => {
        const next = prev + 1;
        return next >= newsWidth ? 0 : next;
      });
    }, 16);
    return () => clearInterval(id);
  }, [newsWidth]);

  useEffect(() => {
    if (newsRef.current) {
      newsRef.current.scrollTo({ x: newsOffset, animated: false });
    }
  }, [newsOffset]);

  useEffect(() => {
    const id = setInterval(() => {
      setInsightsOffset((prev) => {
        const next = prev + 1;
        return next >= insightsWidth ? 0 : next;
      });
    }, 18);
    return () => clearInterval(id);
  }, [insightsWidth]);

  useEffect(() => {
    if (insightsRef.current) {
      insightsRef.current.scrollTo({ x: insightsOffset, animated: false });
    }
  }, [insightsOffset]);

  // Initialize fruit slider position
  useEffect(() => {
    if (fruitSliderRef.current) {
      fruitSliderRef.current.scrollTo({ x: 0, animated: false });
    }
  }, []);

  // Auto-scroll fruit slider
  useEffect(() => {
    if (isUserScrolling) return;
    
    const interval = setInterval(() => {
      setCurrentFruitIndex((prev) => {
        const next = (prev + 1) % highlightCards.length;
        if (fruitSliderRef.current) {
          fruitSliderRef.current.scrollTo({
            x: next * 236, // 220 (width) + 16 (marginRight)
            animated: true,
          });
        }
        return next;
      });
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, [isUserScrolling, highlightCards.length]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: 24,
          backgroundColor: '#ffffff',
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: typeof containerMaxWidth === 'number' ? containerMaxWidth : 480 }}>
        {/* Header bar - profile on left, Mulsetu logo centered */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#e5e7eb',
            position: 'relative',
            minHeight: 72,
            justifyContent: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', maxWidth: '58%' }}>
            {user?.avatar ? (
              <Image
                source={{ uri: user.avatar }}
                style={{ width: 38, height: 38, borderRadius: 19, marginRight: 10, borderWidth: 1, borderColor: '#d1d5db' }}
              />
            ) : (
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  marginRight: 10,
                  backgroundColor: '#19696c',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '800' }}>{userInitials || 'U'}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={{ marginTop: 2, fontSize: 12, fontWeight: '500', color: '#6b7280' }} numberOfLines={1}>
                {displayLocation}
              </Text>
            </View>
          </View>

          <View
            style={{
              position: 'absolute',
              right: 16,
              top: 0,
              bottom: 0,
              justifyContent: 'center',
            }}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f3f4f6',
                borderWidth: 1,
                borderColor: '#e5e7eb',
              }}
            >
              <Bell color="#19696c" size={18} />
            </TouchableOpacity>
          </View>

          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={require('../../assets/images/mulsetu_logo.png')}
                resizeMode="contain"
                style={{ width: 34, height: 34, marginRight: 8 }}
              />
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#19696c' }}>Mulsetu</Text>
            </View>
          </View>
        </View>

        {/* Highlight slider: live mandi prices with fruit images and names */}
        <View style={{ marginTop: 12 }}>
          <ScrollView
            ref={fruitSliderRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 6 }}
            pagingEnabled={false}
            snapToInterval={236}
            snapToAlignment="start"
            decelerationRate="fast"
            onScrollBeginDrag={() => setIsUserScrolling(true)}
            onScrollEndDrag={() => {
              setTimeout(() => setIsUserScrolling(false), 2000);
            }}
            onMomentumScrollEnd={(event) => {
              const offsetX = event.nativeEvent.contentOffset.x;
              const index = Math.round(offsetX / 236);
              setCurrentFruitIndex(index);
            }}
          >
            {highlightCards.map((card, index) => (
              <View
                key={card.id}
                style={{
                  marginRight: 16,
                  width: 220,
                  borderRadius: 14,
                  borderWidth: currentFruitIndex === index ? 2.5 : 1.5,
                  borderColor: currentFruitIndex === index ? '#60941a' : '#e5e7eb',
                  backgroundColor: '#ffffff',
                  overflow: 'hidden',
                  elevation: currentFruitIndex === index ? 8 : 3,
                  shadowColor: currentFruitIndex === index ? '#60941a' : '#000',
                  shadowOffset: { width: 0, height: currentFruitIndex === index ? 4 : 2 },
                  shadowOpacity: currentFruitIndex === index ? 0.2 : 0.1,
                  shadowRadius: currentFruitIndex === index ? 8 : 5,
                }}
              >
                {/* Fruit Image Section */}
                <View style={{ height: 100, width: '100%', position: 'relative' }}>
                  <Image
                    source={{ uri: card.image }}
                    resizeMode="cover"
                    style={{ width: '100%', height: '100%' }}
                  />
                  {/* Gradient Overlay for better text readability */}
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 48,
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    }}
                  />
                  {/* Fruit Name Overlay */}
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      backgroundColor: 'rgba(25, 105, 108, 0.95)',
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '800',
                        color: '#ffffff',
                        textAlign: 'center',
                        letterSpacing: 0.5,
                      }}
                    >
                      {card.fruitName}
                    </Text>
            </View>
                </View>
                {/* Price Section */}
                <View style={{ paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#ffffff' }}>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: '#9ca3af', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Live Mandi Price
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: '800',
                          color: '#60941a',
                          letterSpacing: -0.5,
                        }}
                      >
                        ₹{card.price.toLocaleString('en-IN')}/qtl
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color: '#19696c',
                          marginTop: 4,
                        }}
                      >
                        {card.mandi}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: 8,
                        backgroundColor: card.up ? 'rgba(96, 148, 26, 0.15)' : 'rgba(229, 57, 53, 0.15)',
                        paddingHorizontal: 8,
                        paddingVertical: 6,
                        borderRadius: 8,
                        minWidth: 36,
                      }}
                    >
                      {card.up ? (
                        <ArrowUp color="#60941a" size={18} />
                      ) : (
                        <ArrowDown color="#E53935" size={18} />
                      )}
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 10,
              gap: 6,
            }}
          >
            {highlightCards.map((_, index) => (
              <View
                key={index}
                style={{
                  width: currentFruitIndex === index ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: currentFruitIndex === index ? '#60941a' : '#d1d5db',
                }}
              />
            ))}
          </View>
        </View>

        {/* Quick CTA – single line tabs: Check Market Trends | Buy Crop */}
        <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                borderRadius: 16,
                backgroundColor: '#60941a',
                paddingVertical: 14,
                paddingHorizontal: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                elevation: 4,
                shadowColor: '#60941a',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 6,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.2)',
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }} numberOfLines={1}>Market Trends</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                borderRadius: 16,
                backgroundColor: '#19696c',
                paddingVertical: 14,
                paddingHorizontal: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                elevation: 4,
                shadowColor: '#19696c',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 6,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.2)',
              }}
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/buy')}
            >
              <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }} numberOfLines={1}>Buy Crop</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Trader: My Ongoing Bids – above Market Trend Insights */}
        {isTrader && (
          <View style={{ marginTop: 28, paddingHorizontal: 16, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#19696c' }}>My Ongoing Bids</Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/buy')}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#60941a' }}>View all</Text>
              </TouchableOpacity>
            </View>
            {loadingOngoingBids ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#19696c" />
                <Text style={{ marginTop: 8, fontSize: 13, color: '#6b7280' }}>Loading your bids…</Text>
              </View>
            ) : ongoingBids.length === 0 ? (
              <View
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                }}
              >
                <Text style={{ fontSize: 15, color: '#6b7280', textAlign: 'center' }}>
                  No ongoing bids. Place bids from the Buy tab.
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/buy')}
                  style={{
                    marginTop: 12,
                    alignSelf: 'center',
                    backgroundColor: '#19696c',
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#ffffff' }}>Go to Buy</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 16 }}
                snapToInterval={296}
                snapToAlignment="start"
                decelerationRate="fast"
              >
                {ongoingBids.map((bid) => (
                  <TouchableOpacity
                    key={bid.id}
                    onPress={() => router.push('/(tabs)/buy')}
                    activeOpacity={0.8}
                    style={{
                      width: 284,
                      marginRight: 12,
                      backgroundColor: '#ffffff',
                      borderRadius: 16,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: '#e5e7eb',
                      elevation: 2,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.06,
                      shadowRadius: 4,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#19696c', flex: 1 }} numberOfLines={1}>
                        {bid.produce}
                      </Text>
                      <View
                        style={{
                          backgroundColor: 'rgba(245, 158, 11, 0.2)',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#b45309', textTransform: 'capitalize' }}>
                          {bid.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Seller: {bid.seller}</Text>
                    {bid.market ? (
                      <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{bid.market}</Text>
                    ) : null}
                    {bid.otherBidsCount > 0 && (
                      <Text style={{ fontSize: 12, color: '#b45309', marginBottom: 6, fontWeight: '600' }}>
                        {bid.otherBidsCount} other bid{bid.otherBidsCount !== 1 ? 's' : ''} on this listing — you can update your bid
                      </Text>
                    )}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
                      <Text style={{ fontSize: 13, color: '#374151' }}>
                        {bid.quantity} qtl × ₹{bid.pricePerQuintal.toLocaleString('en-IN')}/qtl
                      </Text>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: '#60941a' }}>
                        ₹{bid.totalAmount.toLocaleString('en-IN')} total
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', marginTop: 10, gap: 10 }}>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          openLeaderboard(bid.listingId, bid.produce);
                        }}
                        style={{
                          flex: 1,
                          backgroundColor: '#f3f4f6',
                          paddingVertical: 10,
                          borderRadius: 12,
                          alignItems: 'center',
                          borderWidth: 1,
                          borderColor: '#e5e7eb',
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#19696c' }}>Check bid</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          router.push({ pathname: '/(tabs)/buy', params: { openOffer: bid.listingId } });
                        }}
                        style={{
                          flex: 1,
                          backgroundColor: '#19696c',
                          paddingVertical: 10,
                          borderRadius: 12,
                          alignItems: 'center',
                        }}
                        activeOpacity={0.8}
                      >
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#ffffff' }}>Update bid</Text>
                    </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Leaderboard modal – shown when "Check bid" is pressed */}
        <Modal
          visible={showLeaderboardModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowLeaderboardModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ backgroundColor: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 400, maxHeight: '80%' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#19696c' }}>Bid leaderboard</Text>
                <TouchableOpacity onPress={() => setShowLeaderboardModal(false)} style={{ padding: 4 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#6b7280' }}>Close</Text>
                </TouchableOpacity>
              </View>
              {leaderboardProduce ? (
                <Text style={{ fontSize: 14, color: '#6b7280', paddingHorizontal: 16, paddingTop: 8 }} numberOfLines={1}>{leaderboardProduce}</Text>
              ) : null}
              <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ padding: 16, paddingTop: 12 }}>
                {loadingLeaderboard ? (
                  <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#19696c" />
                    <Text style={{ marginTop: 8, fontSize: 13, color: '#6b7280' }}>Loading bids…</Text>
                  </View>
                ) : leaderboardOffers.length === 0 ? (
                  <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', paddingVertical: 20 }}>No bids yet on this listing.</Text>
                ) : (
                  leaderboardOffers.map((offer, idx) => {
                    const rank = idx + 1;
                    const rankLabel = rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`;
                    const isTopThree = rank <= 3;
                    const rankBg = rank === 1 ? '#D4AF37' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : '#e5e7eb';
                    return (
                      <View
                        key={idx}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 12,
                          borderBottomWidth: idx < leaderboardOffers.length - 1 ? 1 : 0,
                          borderBottomColor: '#f3f4f6',
                          backgroundColor: isTopThree ? 'rgba(25, 105, 108, 0.06)' : 'transparent',
                          marginHorizontal: -16,
                          paddingHorizontal: 16,
                        }}
                      >
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: rankBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: rank <= 3 ? '#fff' : '#374151' }}>{rankLabel}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>{offer.buyer_name}</Text>
                          <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{offer.quantity} qtl</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: '#19696c' }}>₹{offer.price_per_quintal.toLocaleString('en-IN')}/qtl</Text>
                          <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>₹{offer.total_amount.toLocaleString('en-IN')} total</Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Market Trend Insights - trader only */}
        {isTrader && (
          <View style={{ marginTop: 28, paddingHorizontal: 16, marginBottom: 24 }}>
            <Text style={{ marginBottom: 16, fontSize: 20, fontWeight: '800', color: '#19696c' }}>Market Trend Insights</Text>
            <ScrollView ref={insightsRef} horizontal showsHorizontalScrollIndicator={false}
              scrollEnabled={false}
              contentContainerStyle={{ paddingRight: 4 }}
              onContentSizeChange={(w) => setInsightsWidth(w / 2)}>
              {[...trendTips, ...trendTips].map((t, idx) => (
                <View
                  key={`${t.id}-${idx}`}
                  style={{
                    marginRight: 14,
                    borderRadius: 18,
                    backgroundColor: '#ffffff',
                    elevation: 4,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 6,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                  }}
                >
                  <View
                    style={{
                      backgroundColor: '#19696c',
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                    }}
                  >
                    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15, letterSpacing: 0.2 }}>
                      {t.title}
                    </Text>
                  </View>
                  <View style={{ padding: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View
                        style={{
                          backgroundColor: t.up ? 'rgba(96, 148, 26, 0.15)' : 'rgba(229, 57, 53, 0.15)',
                          paddingHorizontal: 6,
                          paddingVertical: 4,
                          borderRadius: 6,
                          marginRight: 10,
                        }}
                      >
                        {t.up ? <ArrowUp color="#60941a" size={18} /> : <ArrowDown color="#E53935" size={18} />}
                      </View>
                      <Text style={{ flex: 1, color: '#374151', fontSize: 14, fontWeight: '500', lineHeight: 20 }}>
                        {t.tip}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Govt Scheme Updates – hidden for Trader dashboard */}
        {!isTrader && (
        <View style={{ marginTop: 28, paddingHorizontal: 16, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#19696c' }}>Govt Scheme Updates</Text>
            <TouchableOpacity
              onPress={() => setShowSchemesModal(true)}
              style={{ paddingVertical: 4, paddingHorizontal: 8 }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#60941a' }}>View more</Text>
            </TouchableOpacity>
          </View>
          {centralAgricultureSchemes.slice(0, 3).map((scheme, index) => (
            <View
              key={`${scheme.name}-${index}`}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 16,
                marginBottom: 12,
                elevation: 3,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
                borderWidth: 1,
                borderColor: '#e5e7eb',
                overflow: 'hidden',
              }}
            >
              <View style={{ padding: 16 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#19696c', marginBottom: 6 }}>
                  {scheme.name}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '500', color: '#6b7280', lineHeight: 18, marginBottom: 12 }}>
                  {scheme.description}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => scheme.website && Linking.openURL(scheme.website)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    alignSelf: 'flex-start',
                    backgroundColor: 'rgba(96, 148, 26, 0.15)',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#60941a' }}>Visit website</Text>
                  <Text style={{ marginLeft: 4, fontSize: 12 }}>→</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setShowSchemesModal(true)}
            style={{
              backgroundColor: 'rgba(96, 148, 26, 0.12)',
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#60941a',
              borderStyle: 'dashed',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#60941a' }}>View more schemes</Text>
          </TouchableOpacity>
        </View>
        )}

        {/* Govt Schemes – All schemes popup */}
        <Modal
          visible={showSchemesModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSchemesModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%', paddingBottom: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#19696c' }}>All Govt Schemes</Text>
                <TouchableOpacity onPress={() => setShowSchemesModal(false)} style={{ padding: 8 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#60941a' }}>Close</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }} showsVerticalScrollIndicator={true}>
                {centralAgricultureSchemes.map((scheme, index) => (
                  <View
                    key={`all-${scheme.name}-${index}`}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: 14,
                      marginBottom: 10,
                      elevation: 2,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.08,
                      shadowRadius: 4,
                      borderWidth: 1,
                      borderColor: '#e5e7eb',
                      overflow: 'hidden',
                    }}
                  >
                    <View style={{ padding: 14 }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#19696c', marginBottom: 6 }}>
                        {scheme.name}
                      </Text>
                      <Text style={{ fontSize: 12, fontWeight: '500', color: '#6b7280', lineHeight: 18, marginBottom: 10 }}>
                        {scheme.description}
                      </Text>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => scheme.website && Linking.openURL(scheme.website)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          alignSelf: 'flex-start',
                          backgroundColor: 'rgba(96, 148, 26, 0.15)',
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#60941a' }}>Visit website</Text>
                        <Text style={{ marginLeft: 4, fontSize: 11 }}>→</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
