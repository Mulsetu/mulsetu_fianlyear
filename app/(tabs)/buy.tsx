import { Colors } from '@/constants/theme';
import { useUser } from '@/contexts/UserContext';
import { getResponsiveDimensions, isDesktop } from '@/utils/responsive';
import { supabase } from '@/utils/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Linking,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface Listing {
  id: string;
  produce: string;
  seller: string;
  quantity: number;
  minOfferSize?: number;
  pricePerQuintal: number;
  market: string;
  quality: string;
  sellerType: 'Farmer' | 'Trader';
  locationAddress?: string;
  image?: string;
  cropPhotoUrl?: string;
  qualityPhotoUrl?: string;
  packagingPhotoUrl?: string;
  videoUrl?: string;
  offers: number;
  isPremium: boolean;
}

interface MyOffer {
  id: string;
  listingId: string;
  produce: string;
  seller: string;
  quantity: number;
  pricePerQuintal: number;
  totalAmount: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

type TrendDirection = 'up' | 'down' | 'flat';

interface ForecastPoint {
  dayLabel: string;
  price: number;
}

interface RecommendationResult {
  recommendedMaxBid: number;
  safeBidMin: number;
  fairPrice: number;
  lastPrice: number | null;
  sevenDayAvg: number | null;
  thirtyDayAvg: number | null;
  expectedNext7Avg: number | null;
  trend: TrendDirection;
  verdict: 'strong_buy' | 'buy' | 'avoid';
  reasons: string[];
  forecast: ForecastPoint[];
}

/** Only show images for http/https URLs; blob URLs often fail on web after refresh */
function isDisplayableImageUrl(uri: string | undefined): uri is string {
  return !!uri && (uri.startsWith('http://') || uri.startsWith('https://'));
}

export default function BuyProduceScreen() {
  const { user } = useUser();
  const router = useRouter();
  const params = useLocalSearchParams<{ openOffer?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [offerQuantity, setOfferQuantity] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [myOffers, setMyOffers] = useState<MyOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMyOffers, setLoadingMyOffers] = useState(false);
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'listings' | 'myOffers'>('listings');
  const [showProduceDropdown, setShowProduceDropdown] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedListingForDetail, setSelectedListingForDetail] = useState<Listing | null>(null);
  const [listingOffers, setListingOffers] = useState<Array<{ buyer_name: string; quantity: number; price_per_quintal: number; total_amount: number; status: string; created_at: string }>>([]);
  const [loadingListingOffers, setLoadingListingOffers] = useState(false);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [recommendationForListing, setRecommendationForListing] = useState<RecommendationResult | null>(null);
  const [recommendationListing, setRecommendationListing] = useState<Listing | null>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const dimensions = getResponsiveDimensions();

  // Listing IDs the current user has already offered on (one offer per listing)
  const myOfferListingIds = new Set(myOffers.map((o) => o.listingId));

  // Show success message for a few seconds (works better on web than Alert alone)
  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(t);
  }, [successMessage]);

  // All fruit/produce names from listings for dropdown (unique, sorted)
  const produceOptions = useMemo(() => {
    const names = Array.from(new Set(listings.map((l) => l.produce).filter(Boolean))) as string[];
    return ['All', ...names.sort((a, b) => a.localeCompare(b))];
  }, [listings]);

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const baseSelect = 'id, seller_display_name, produce, quality, quantity, price_per_quintal, seller_type, market, crop_photo_url, offers_count, created_at';
      const fullSelect = baseSelect + ', min_offer_size, location_address, quality_photo_url, packaging_photo_url, video_url';
      const { data, error } = await supabase
        .from('listings_for_buy')
        .select(fullSelect)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST204') {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('listings_for_buy')
            .select(baseSelect)
            .order('created_at', { ascending: false });
          if (fallbackError) {
            console.error('Error loading listings:', fallbackError);
            setListings([]);
            return;
          }
          const mapped: Listing[] = (fallbackData ?? []).map((row: any) => ({
            id: row.id,
            produce: row.produce ?? '',
            seller: row.seller_display_name ?? 'Seller',
            quantity: Number(row.quantity ?? 0),
            pricePerQuintal: Number(row.price_per_quintal ?? 0),
            market: row.market ?? '',
            quality: row.quality ?? '',
            sellerType: (row.seller_type ?? 'Farmer') as 'Farmer' | 'Trader',
            image: row.crop_photo_url ?? undefined,
            offers: Number(row.offers_count ?? 0),
            isPremium: true,
          }));
          setListings(mapped);
          return;
        }
        console.error('Error loading listings:', error);
        setListings([]);
        return;
      }

      const mapped: Listing[] = (data ?? []).map((row: any) => ({
        id: row.id,
        produce: row.produce ?? '',
        seller: row.seller_display_name ?? 'Seller',
        quantity: Number(row.quantity ?? 0),
        minOfferSize: row.min_offer_size != null ? Number(row.min_offer_size) : undefined,
        pricePerQuintal: Number(row.price_per_quintal ?? 0),
        market: row.market ?? '',
        quality: row.quality ?? '',
        sellerType: (row.seller_type ?? 'Farmer') as 'Farmer' | 'Trader',
        locationAddress: row.location_address ?? undefined,
        image: row.crop_photo_url ?? undefined,
        cropPhotoUrl: row.crop_photo_url ?? undefined,
        qualityPhotoUrl: row.quality_photo_url ?? undefined,
        packagingPhotoUrl: row.packaging_photo_url ?? undefined,
        videoUrl: row.video_url ?? undefined,
        offers: Number(row.offers_count ?? 0),
        isPremium: true,
      }));
      setListings(mapped);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMyOffers = useCallback(async () => {
    if (!user?.id) {
      setMyOffers([]);
      return;
    }
    setLoadingMyOffers(true);
    try {
      const { data: offersData, error } = await supabase
        .from('listing_offers')
        .select('id, listing_id, quantity, price_per_quintal, total_amount, status, created_at')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading my offers:', error);
        setMyOffers([]);
        return;
      }

      const offers = offersData ?? [];
      if (offers.length === 0) {
        setMyOffers([]);
        return;
      }

      const listingIds = [...new Set(offers.map((o: any) => o.listing_id))];
      const { data: listingsData } = await supabase
        .from('listings')
        .select('id, produce, seller_display_name')
        .in('id', listingIds);

      const listingMap = new Map<string | number, { produce: string; seller: string }>();
      (listingsData ?? []).forEach((l: any) => {
        listingMap.set(l.id, {
          produce: l.produce ?? 'Listing',
          seller: l.seller_display_name ?? 'Seller',
        });
      });

      const mapped: MyOffer[] = offers.map((row: any) => {
        const listing = listingMap.get(row.listing_id);
        return {
          id: row.id,
          listingId: row.listing_id,
          produce: listing?.produce ?? 'Listing',
          seller: listing?.seller ?? 'Seller',
          quantity: Number(row.quantity ?? 0),
          pricePerQuintal: Number(row.price_per_quintal ?? 0),
          totalAmount: Number(row.total_amount ?? 0),
          status: (row.status ?? 'pending') as MyOffer['status'],
          createdAt: row.created_at,
        };
      });
      setMyOffers(mapped);
    } finally {
      setLoadingMyOffers(false);
    }
  }, [user?.id]);

  const loadListingOffers = useCallback(async (listingId: string) => {
    setLoadingListingOffers(true);
    setListingOffers([]);
    try {
      const { data, error } = await supabase
        .from('listing_offers')
        .select('buyer_name, quantity, price_per_quintal, total_amount, status, created_at')
        .eq('listing_id', listingId)
        .order('price_per_quintal', { ascending: false });

      if (error) {
        console.error('Error loading listing offers:', error);
        setListingOffers([]);
        return;
      }
      setListingOffers((data ?? []).map((r: any) => ({
        buyer_name: r.buyer_name ?? 'Trader',
        quantity: Number(r.quantity ?? 0),
        price_per_quintal: Number(r.price_per_quintal ?? 0),
        total_amount: Number(r.total_amount ?? 0),
        status: r.status ?? 'pending',
        created_at: r.created_at ?? '',
      })));
    } finally {
      setLoadingListingOffers(false);
    }
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  useEffect(() => {
    loadMyOffers();
  }, [loadMyOffers]);

  useEffect(() => {
    if (showDetailModal && selectedListingForDetail?.id) {
      loadListingOffers(selectedListingForDetail.id);
    } else {
      setListingOffers([]);
    }
  }, [showDetailModal, selectedListingForDetail?.id, loadListingOffers]);

  // Open offer modal when navigated from dashboard with openOffer=listingId
  useEffect(() => {
    const listingId = params.openOffer;
    if (!listingId || !myOffers.length) return;
    const myOffer = myOffers.find((o) => o.listingId === listingId);
    if (!myOffer) return;

    const listingFromState = listings.find((l) => l.id === listingId);
    if (listingFromState) {
      setSelectedListing(listingFromState);
      setOfferQuantity(String(myOffer.quantity));
      setOfferPrice(String(myOffer.pricePerQuintal));
      setShowOfferModal(true);
      router.replace('/(tabs)/buy');
      return;
    }

    let cancelled = false;
    (async () => {
      const { data: rows, error } = await supabase
        .from('listings_for_buy')
        .select('id, seller_display_name, produce, quality, quantity, price_per_quintal, seller_type, market, crop_photo_url, offers_count, min_offer_size, location_address, quality_photo_url, packaging_photo_url, video_url')
        .eq('id', listingId)
        .limit(1)
        .maybeSingle();
      if (cancelled || error || !rows) {
        if (!cancelled) router.replace('/(tabs)/buy');
        return;
      }
      const row = rows as any;
      const listing: Listing = {
        id: row.id,
        produce: row.produce ?? '',
        seller: row.seller_display_name ?? 'Seller',
        quantity: Number(row.quantity ?? 0),
        minOfferSize: row.min_offer_size != null ? Number(row.min_offer_size) : undefined,
        pricePerQuintal: Number(row.price_per_quintal ?? 0),
        market: row.market ?? '',
        quality: row.quality ?? '',
        sellerType: (row.seller_type ?? 'Farmer') as 'Farmer' | 'Trader',
        locationAddress: row.location_address ?? undefined,
        image: row.crop_photo_url ?? undefined,
        cropPhotoUrl: row.crop_photo_url ?? undefined,
        qualityPhotoUrl: row.quality_photo_url ?? undefined,
        packagingPhotoUrl: row.packaging_photo_url ?? undefined,
        videoUrl: row.video_url ?? undefined,
        offers: Number(row.offers_count ?? 0),
        isPremium: true,
      };
      setSelectedListing(listing);
      setOfferQuantity(String(myOffer.quantity));
      setOfferPrice(String(myOffer.pricePerQuintal));
      setShowOfferModal(true);
      router.replace('/(tabs)/buy');
    })();
    return () => { cancelled = true; };
  }, [params.openOffer, myOffers, listings, router]);

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.produce.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.seller.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.market.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || listing.produce === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const handleMakeOffer = (listing: Listing) => {
    setSelectedListing(listing);
    setShowOfferModal(true);
    const existing = myOffers.find((o) => o.listingId === listing.id);
    if (existing) {
      setOfferQuantity(String(existing.quantity));
      setOfferPrice(String(existing.pricePerQuintal));
    } else {
      setOfferQuantity('');
      setOfferPrice('');
    }
  };

  const handleShowRecommendation = async (listing: Listing) => {
    setRecommendationListing(listing);
    setRecommendationForListing(null);
    setRecommendationError(null);
    setShowRecommendationModal(true);
    setLoadingRecommendation(true);
    try {
      const result = await fetchRecommendationForListing(listing);
      if (!result) {
        setRecommendationError('No historical mandi price data found for this crop and market.');
      } else {
        setRecommendationForListing(result);
      }
    } catch (err: any) {
      console.error('Error fetching recommendation:', err);
      setRecommendationError(err?.message || 'Unable to generate recommendation. Please try again.');
    } finally {
      setLoadingRecommendation(false);
    }
  };

  const isUpdatingBid = selectedListing != null && myOfferListingIds.has(selectedListing.id);

  const handleSubmitOffer = async () => {
    if (!selectedListing || !user?.id) {
      Alert.alert('Error', 'Please sign in to place a bid.');
      return;
    }
    const qty = Number(offerQuantity);
    const price = Number(offerPrice);
    if (!offerQuantity || !offerPrice || isNaN(qty) || isNaN(price) || qty <= 0 || price <= 0) {
      Alert.alert('Error', 'Please enter valid quantity and price.');
      return;
    }

    setSubmittingOffer(true);
    try {
      const totalAmount = qty * price;
      if (isUpdatingBid) {
        const { error } = await supabase
          .from('listing_offers')
          .update({
            quantity: qty,
            price_per_quintal: price,
            total_amount: totalAmount,
            buyer_name: user.name ?? undefined,
          })
          .eq('listing_id', selectedListing.id)
          .eq('buyer_id', user.id);

        if (error) {
          console.error('Bid update error:', error);
          Alert.alert('Error', error.message || 'Failed to update bid.');
          return;
        }
        setSuccessMessage('Bid updated! Your new quote is visible on the leaderboard.');
      } else {
        const { error } = await supabase.from('listing_offers').insert({
          listing_id: selectedListing.id,
          buyer_id: user.id,
          buyer_name: user.name ?? undefined,
          quantity: qty,
          price_per_quintal: price,
          total_amount: totalAmount,
          status: 'pending',
        });

        if (error) {
          console.error('Offer submit error:', error);
          if (error.code === '23505') {
            Alert.alert('Already submitted', 'You already have a bid on this listing. Use "Update my bid" to change it.');
            setShowOfferModal(false);
            setSelectedListing(null);
            loadMyOffers();
            return;
          }
          Alert.alert('Error', error.message || 'Failed to place bid.');
          return;
        }
        setSuccessMessage('Bid placed! You can update it anytime. Check the leaderboard and "My Offers".');
      }

      setShowOfferModal(false);
      setOfferQuantity('');
      setOfferPrice('');
      setSelectedListing(null);
      loadListings();
      loadMyOffers();
    } finally {
      setSubmittingOffer(false);
    }
  };

  const renderListingCard = ({ item }: { item: Listing }) => (
    <View style={styles.listingCard}>
      {/* Crop photo thumbnail – only http/https URLs to avoid blob load errors on web */}
      {isDisplayableImageUrl(item.cropPhotoUrl || item.image) ? (
        <TouchableOpacity
          style={styles.cardImageWrap}
          onPress={() => {
            setSelectedListingForDetail(item);
            setShowDetailModal(true);
          }}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: item.cropPhotoUrl || item.image }}
            style={styles.cardImage}
            resizeMode="cover"
          />
          <View style={styles.viewPhotosBadge}>
            <Ionicons name="images" size={14} color="#fff" />
            <Text style={styles.viewPhotosBadgeText}>View all photos & details</Text>
          </View>
        </TouchableOpacity>
      ) : null}

      <View style={styles.listingHeader}>
        <View style={styles.produceInfo}>
          <Text style={styles.produceName}>{item.produce}</Text>
          {item.quality ? <Text style={styles.qualityText}>{item.quality}</Text> : null}
        </View>
        {item.isPremium && (
          <View style={styles.premiumBadge}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.premiumText}>Premium</Text>
          </View>
        )}
      </View>

      {/* Farmer / seller details */}
      <View style={styles.sellerBlock}>
        <View style={styles.sellerRow}>
          <Ionicons name="person" size={16} color={Colors.light.icon} />
          <Text style={styles.sellerText}>{item.seller}</Text>
          <View style={styles.sellerTypeChip}>
            <Text style={styles.sellerTypeText}>{item.sellerType}</Text>
          </View>
        </View>
        {item.market ? (
          <View style={styles.detailRow}>
            <Ionicons name="business" size={16} color={Colors.light.icon} />
            <Text style={styles.detailLabel}>APMC / Market: </Text>
            <Text style={styles.detailValue}>{item.market}</Text>
          </View>
        ) : null}
        {item.locationAddress ? (
          <View style={styles.detailRow}>
            <Ionicons name="location" size={16} color={Colors.light.icon} />
            <Text style={styles.detailLabel}>Location: </Text>
            <Text style={styles.detailValue} numberOfLines={2}>{item.locationAddress}</Text>
          </View>
        ) : null}
      </View>

      {/* Listing details */}
      <View style={styles.listingDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="cube" size={16} color={Colors.light.icon} />
          <Text style={styles.detailText}>Qty: {item.quantity} quintals</Text>
        </View>
        {item.minOfferSize != null && item.minOfferSize > 0 ? (
          <View style={styles.detailItem}>
            <Ionicons name="cart" size={16} color={Colors.light.icon} />
            <Text style={styles.detailText}>Min order: {item.minOfferSize} qtl</Text>
          </View>
        ) : null}
        <View style={styles.detailItem}>
          <Ionicons name="people" size={16} color={Colors.light.icon} />
          <Text style={styles.detailText}>{item.offers} offers</Text>
        </View>
      </View>

      <View style={styles.priceSection}>
        <Text style={styles.priceLabel}>Price per quintal</Text>
        <Text style={styles.priceValue}>₹{item.pricePerQuintal.toLocaleString()}</Text>
      </View>

      <TouchableOpacity
        style={styles.recommendButton}
        onPress={() => handleShowRecommendation(item)}
      >
        <Ionicons name="sparkles" size={16} color={Colors.light.primary} />
        <Text style={styles.recommendButtonText}>AI recommendation</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.viewDetailsButton}
        onPress={() => {
          setSelectedListingForDetail(item);
          setShowDetailModal(true);
        }}
      >
        <Ionicons name="images" size={16} color={Colors.light.primary} />
        <Text style={styles.viewDetailsButtonText}>View photos & full details</Text>
      </TouchableOpacity>

      {myOfferListingIds.has(item.id) ? (
        <TouchableOpacity
          style={styles.updateBidButton}
          onPress={() => handleMakeOffer(item)}
        >
          <Ionicons name="pencil" size={16} color="white" />
          <Text style={styles.updateBidButtonText}>Update my bid</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.offerButton}
          onPress={() => handleMakeOffer(item)}
        >
          <Ionicons name="hand-left" size={16} color="white" />
          <Text style={styles.offerButtonText}>Place bid</Text>
        </TouchableOpacity>
      )}
    </View>
  );

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
            <Text style={styles.title}>Buy Produce</Text>
            <Text style={styles.subtitle}>Browse listings, place bids, and update your bid to compete</Text>
          </View>

          {/* Tabs: All Listings | My Offers */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'listings' && styles.tabActive]}
              onPress={() => setActiveTab('listings')}
            >
              <Ionicons name="list" size={18} color={activeTab === 'listings' ? '#fff' : Colors.light.icon} />
              <Text style={[styles.tabLabel, activeTab === 'listings' && styles.tabLabelActive]}>All Listings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'myOffers' && styles.tabActive]}
              onPress={() => setActiveTab('myOffers')}
            >
              <Ionicons name="document-text" size={18} color={activeTab === 'myOffers' ? '#fff' : Colors.light.icon} />
              <Text style={[styles.tabLabel, activeTab === 'myOffers' && styles.tabLabelActive]}>My Offers</Text>
              {myOffers.length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{myOffers.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Success message after submitting offer */}
          {successMessage ? (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={22} color="#0d9488" />
              <Text style={styles.successBannerText}>{successMessage}</Text>
            </View>
          ) : null}

          {activeTab === 'listings' ? (
            <>
              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                  <Ionicons name="search" size={20} color={Colors.light.icon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search produce, seller, or market..."
                    placeholderTextColor={Colors.light.icon}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </View>

              {/* Produce filter dropdown */}
              <View style={styles.filtersContainer}>
                <Text style={styles.dropdownLabel}>Filter by produce</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setShowProduceDropdown(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownText} numberOfLines={1}>
                    {selectedFilter === 'all' ? 'All fruits / produce' : selectedFilter}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={Colors.light.icon} />
                </TouchableOpacity>
              </View>

              {/* Produce dropdown modal */}
              <Modal
                visible={showProduceDropdown}
                transparent
                animationType="fade"
                onRequestClose={() => setShowProduceDropdown(false)}
              >
                <TouchableOpacity
                  style={styles.dropdownOverlay}
                  activeOpacity={1}
                  onPress={() => setShowProduceDropdown(false)}
                >
                  <View style={styles.dropdownModal} onStartShouldSetResponder={() => true}>
                    <Text style={styles.dropdownModalTitle}>Select produce</Text>
                    <ScrollView style={styles.dropdownScroll} keyboardShouldPersistTaps="handled">
                      {produceOptions.map((name) => {
                        const value = name === 'All' ? 'all' : name;
                        return (
                          <TouchableOpacity
                            key={name}
                            style={[styles.dropdownOption, selectedFilter === value && styles.dropdownOptionActive]}
                            onPress={() => {
                              setSelectedFilter(value);
                              setShowProduceDropdown(false);
                            }}
                          >
                            <Text style={[styles.dropdownOptionText, selectedFilter === value && styles.dropdownOptionTextActive]}>
                              {name === 'All' ? 'All fruits / produce' : name}
                            </Text>
                            {selectedFilter === value && <Ionicons name="checkmark" size={20} color={Colors.light.primary} />}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </TouchableOpacity>
              </Modal>

              {/* Listings */}
              <View style={styles.listingsContainer}>
                <Text style={styles.sectionTitle}>
                  {loading ? 'Loading...' : `${filteredListings.length} Listings Found`}
                </Text>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.light.primary} />
                    <Text style={styles.loadingText}>Loading listings...</Text>
                  </View>
                ) : (
                  <FlatList
                    data={filteredListings}
                    renderItem={renderListingCard}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    contentContainerStyle={styles.listingsList}
                    ListEmptyComponent={
                      <Text style={styles.emptyText}>No listings available. Check back later.</Text>
                    }
                  />
                )}
              </View>
            </>
          ) : (
            /* My Offers tab */
            <View style={styles.myOffersSection}>
              <Text style={styles.sectionTitle}>My Offers</Text>
              {!user ? (
                <Text style={styles.emptyText}>Sign in to see your offers.</Text>
              ) : loadingMyOffers ? (
                <ActivityIndicator size="small" color={Colors.light.primary} style={{ paddingVertical: 16 }} />
              ) : myOffers.length === 0 ? (
                <Text style={styles.emptyText}>You haven’t made any offers yet. Switch to “All Listings” and submit an offer.</Text>
              ) : (
                <View style={styles.myOffersList}>
                  {myOffers.map((offer) => (
                    <View key={offer.id} style={styles.myOfferCard}>
                      <View style={styles.myOfferRow}>
                        <Text style={styles.myOfferProduce}>{offer.produce}</Text>
                        <View style={[styles.statusBadge, offer.status === 'accepted' && styles.statusAccepted, offer.status === 'rejected' && styles.statusRejected]}>
                          <Text style={styles.statusBadgeText}>{offer.status}</Text>
                        </View>
                      </View>
                      <Text style={styles.myOfferSeller}>Seller: {offer.seller}</Text>
                      <Text style={styles.myOfferDetail}>{offer.quantity} qtl × ₹{offer.pricePerQuintal.toLocaleString()} = ₹{offer.totalAmount.toLocaleString()}</Text>
                      <Text style={styles.myOfferDate}>{new Date(offer.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Offer Modal */}
      <Modal
        visible={showOfferModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOfferModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{isUpdatingBid ? 'Update your bid' : 'Place a bid'}</Text>
            
            {selectedListing && (
              <View style={styles.listingSummary}>
                <Text style={styles.listingSummaryText}>
                  {selectedListing.produce} - {selectedListing.quantity} quintals
                </Text>
                <Text style={styles.listingSummaryText}>
                  Seller: {selectedListing.seller}
                </Text>
                <Text style={styles.listingSummaryText}>
                  Market: {selectedListing.market}
                </Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Quantity (quintals)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter quantity"
                value={offerQuantity}
                onChangeText={setOfferQuantity}
                keyboardType="numeric"
                placeholderTextColor={Colors.light.icon}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Price per quintal (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your offer price"
                value={offerPrice}
                onChangeText={setOfferPrice}
                keyboardType="numeric"
                placeholderTextColor={Colors.light.icon}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowOfferModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, submittingOffer && styles.submitButtonDisabled]}
                onPress={handleSubmitOffer}
                disabled={submittingOffer}
              >
                {submittingOffer ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>{isUpdatingBid ? 'Update bid' : 'Place bid'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Recommendation modal for AI-based quote & market trend */}
      <Modal
        visible={showRecommendationModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowRecommendationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.recModalContent}>
            <Text style={styles.modalTitle}>AI Recommendation</Text>

            {recommendationListing && (
              <View style={styles.listingSummary}>
                <Text style={styles.listingSummaryText}>
                  {recommendationListing.produce} - {recommendationListing.quantity} quintals
                </Text>
                <Text style={styles.listingSummaryText}>
                  Market: {recommendationListing.market}
                </Text>
                <Text style={styles.listingSummaryText}>
                  Seller asking: ₹{recommendationListing.pricePerQuintal.toLocaleString()}/qtl
                </Text>
              </View>
            )}

            {loadingRecommendation ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.light.primary} />
                <Text style={styles.loadingText}>Analyzing mandi prices and trend…</Text>
              </View>
            ) : recommendationError ? (
              <View style={styles.recErrorBlock}>
                <Ionicons name="warning" size={20} color="#b91c1c" />
                <Text style={styles.recErrorText}>{recommendationError}</Text>
              </View>
            ) : recommendationForListing ? (
              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={true}>
                <View style={styles.recVerdictRow}>
                  <Text style={styles.inputLabel}>Should you bid?</Text>
                  <View
                    style={[
                      styles.recVerdictChip,
                      recommendationForListing.verdict === 'strong_buy' && styles.recVerdictStrongBuy,
                      recommendationForListing.verdict === 'buy' && styles.recVerdictBuy,
                      recommendationForListing.verdict === 'avoid' && styles.recVerdictAvoid,
                    ]}
                  >
                    <Text style={styles.recVerdictText}>
                      {recommendationForListing.verdict === 'strong_buy'
                        ? 'Strong Buy'
                        : recommendationForListing.verdict === 'buy'
                        ? 'Buy (within limit)'
                        : 'Avoid / Too expensive'}
                    </Text>
                  </View>
                </View>

                <View style={styles.recNumbersRow}>
                  <View style={styles.recNumberBlock}>
                    <Text style={styles.recNumberLabel}>Max quote for profit</Text>
                    <Text style={styles.recNumberValue}>
                      ₹{recommendationForListing.recommendedMaxBid.toLocaleString()}/qtl
                    </Text>
                  </View>
                  <View style={styles.recNumberBlock}>
                    <Text style={styles.recNumberLabel}>Fair mandi price</Text>
                    <Text style={styles.recNumberValue}>
                      ₹{recommendationForListing.fairPrice.toLocaleString()}/qtl
                    </Text>
                  </View>
                </View>

                <View style={styles.recAnalysisBlock}>
                  <Text style={styles.detailSectionTitle}>Why this recommendation?</Text>
                  {recommendationForListing.reasons.map((reason, idx) => (
                    <Text key={idx} style={styles.recReasonText}>
                      • {reason}
                    </Text>
                  ))}
                </View>

                <View style={styles.recTrendBlock}>
                  <Text style={styles.detailSectionTitle}>Next 7 days mandi trend</Text>
                  {(() => {
                    const forecast = recommendationForListing.forecast;
                    const maxPrice = Math.max(...forecast.map((p) => p.price));
                    return forecast.map((p, idx) => {
                      const widthPct = maxPrice > 0 ? Math.max(20, (p.price / maxPrice) * 100) : 20;
                      return (
                        <View key={idx} style={styles.predictionRow}>
                          <Text style={styles.predictionDay}>{p.dayLabel}</Text>
                          <View style={styles.predictionBarTrack}>
                            <View
                              style={[styles.predictionBarFill, { width: `${widthPct}%` }]}
                            />
                          </View>
                          <Text style={styles.predictionPrice}>₹{p.price}/qtl</Text>
                        </View>
                      );
                    });
                  })()}
                </View>
              </ScrollView>
            ) : null}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowRecommendationModal(false)}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Listing detail modal – photos & full details for quoting */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <SafeAreaView style={styles.detailModalContainer}>
          <View style={styles.detailModalHeader}>
            <Text style={styles.detailModalTitle}>Listing details</Text>
            <TouchableOpacity onPress={() => setShowDetailModal(false)} style={styles.detailModalClose}>
              <Ionicons name="close" size={28} color={Colors.light.text} />
            </TouchableOpacity>
          </View>
          {selectedListingForDetail ? (
            <ScrollView
              style={styles.detailModalScroll}
              contentContainerStyle={styles.detailModalScrollContent}
              showsVerticalScrollIndicator={true}
            >
              {/* Photo gallery – only http/https URLs to avoid blob load errors on web */}
              <Text style={styles.detailSectionTitle}>Photos</Text>
              <View style={styles.detailPhotoGrid}>
                {isDisplayableImageUrl(selectedListingForDetail.cropPhotoUrl || selectedListingForDetail.image) ? (
                  <View style={styles.detailPhotoBlock}>
                    <Image
                      source={{ uri: selectedListingForDetail.cropPhotoUrl || selectedListingForDetail.image }}
                      style={styles.detailPhoto}
                      resizeMode="cover"
                    />
                    <Text style={styles.detailPhotoLabel}>Crop / Produce</Text>
                  </View>
                ) : null}
                {isDisplayableImageUrl(selectedListingForDetail.qualityPhotoUrl) ? (
                  <View style={styles.detailPhotoBlock}>
                    <Image
                      source={{ uri: selectedListingForDetail.qualityPhotoUrl }}
                      style={styles.detailPhoto}
                      resizeMode="cover"
                    />
                    <Text style={styles.detailPhotoLabel}>Quality</Text>
                  </View>
                ) : null}
                {isDisplayableImageUrl(selectedListingForDetail.packagingPhotoUrl) ? (
                  <View style={styles.detailPhotoBlock}>
                    <Image
                      source={{ uri: selectedListingForDetail.packagingPhotoUrl }}
                      style={styles.detailPhoto}
                      resizeMode="cover"
                    />
                    <Text style={styles.detailPhotoLabel}>Packaging</Text>
                  </View>
                ) : null}
              </View>
              {!isDisplayableImageUrl(selectedListingForDetail.cropPhotoUrl || selectedListingForDetail.image) &&
               !isDisplayableImageUrl(selectedListingForDetail.qualityPhotoUrl) &&
               !isDisplayableImageUrl(selectedListingForDetail.packagingPhotoUrl) && (
                <Text style={styles.detailNoPhotos}>No photos added for this listing.</Text>
              )}

              {selectedListingForDetail.videoUrl ? (
                <TouchableOpacity
                  style={styles.detailVideoLink}
                  onPress={() => Linking.openURL(selectedListingForDetail.videoUrl!)}
                >
                  <Ionicons name="videocam" size={20} color={Colors.light.primary} />
                  <Text style={styles.detailVideoLinkText}>Watch video</Text>
                </TouchableOpacity>
              ) : null}

              {/* Seller & listing info */}
              <Text style={styles.detailSectionTitle}>Seller & location</Text>
              <View style={styles.detailInfoBlock}>
                <View style={styles.sellerRow}>
                  <Ionicons name="person" size={18} color={Colors.light.icon} />
                  <Text style={styles.sellerText}>{selectedListingForDetail.seller}</Text>
                  <View style={styles.sellerTypeChip}>
                    <Text style={styles.sellerTypeText}>{selectedListingForDetail.sellerType}</Text>
                  </View>
                </View>
                {selectedListingForDetail.market ? (
                  <View style={styles.detailRow}>
                    <Ionicons name="business" size={16} color={Colors.light.icon} />
                    <Text style={styles.detailLabel}>APMC / Market: </Text>
                    <Text style={styles.detailValue}>{selectedListingForDetail.market}</Text>
                  </View>
                ) : null}
                {selectedListingForDetail.locationAddress ? (
                  <View style={styles.detailRow}>
                    <Ionicons name="location" size={16} color={Colors.light.icon} />
                    <Text style={styles.detailLabel}>Location: </Text>
                    <Text style={styles.detailValue}>{selectedListingForDetail.locationAddress}</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.detailSectionTitle}>Listing</Text>
              <View style={styles.detailInfoBlock}>
                <Text style={styles.detailProduceName}>{selectedListingForDetail.produce}</Text>
                {selectedListingForDetail.quality ? <Text style={styles.qualityText}>Quality: {selectedListingForDetail.quality}</Text> : null}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Quantity: </Text>
                  <Text style={styles.detailValue}>{selectedListingForDetail.quantity} quintals</Text>
                </View>
                {selectedListingForDetail.minOfferSize != null && selectedListingForDetail.minOfferSize > 0 ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Min order: </Text>
                    <Text style={styles.detailValue}>{selectedListingForDetail.minOfferSize} qtl</Text>
                  </View>
                ) : null}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Asking price: </Text>
                  <Text style={[styles.detailValue, styles.detailPrice]}>₹{selectedListingForDetail.pricePerQuintal.toLocaleString()}/qtl</Text>
                </View>
                <Text style={styles.detailOffers}>{selectedListingForDetail.offers} offer(s) received</Text>
              </View>

              {/* Bids leaderboard – ranked by price per quintal (highest first) */}
              <Text style={styles.detailSectionTitle}>Bid leaderboard</Text>
              {loadingListingOffers ? (
                <View style={styles.otherOffersLoading}>
                  <ActivityIndicator size="small" color={Colors.light.primary} />
                  <Text style={styles.otherOffersLoadingText}>Loading bids…</Text>
                </View>
              ) : listingOffers.length === 0 ? (
                <View style={styles.otherOffersBlock}>
                  <Text style={styles.otherOffersEmpty}>No bids yet. Place the first bid below.</Text>
                </View>
              ) : (
                <View style={styles.leaderboardBlock}>
                  {listingOffers.map((offer, idx) => {
                    const rank = idx + 1;
                    const rankLabel = rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`;
                    const isTopThree = rank <= 3;
                    return (
                      <View key={idx} style={[styles.leaderboardRow, isTopThree && styles.leaderboardRowTop]}>
                        <View style={[styles.leaderboardRank, rank === 1 && styles.leaderboardRank1, rank === 2 && styles.leaderboardRank2, rank === 3 && styles.leaderboardRank3]}>
                          <Text style={styles.leaderboardRankText}>{rankLabel}</Text>
                        </View>
                        <View style={styles.leaderboardLeft}>
                          <Text style={styles.leaderboardName}>{offer.buyer_name}</Text>
                          <Text style={styles.leaderboardQty}>{offer.quantity} qtl</Text>
                        </View>
                        <View style={styles.leaderboardRight}>
                          <Text style={styles.leaderboardPrice}>₹{offer.price_per_quintal.toLocaleString()}/qtl</Text>
                          <Text style={styles.leaderboardTotal}>₹{offer.total_amount.toLocaleString()} total</Text>
                        </View>
                      </View>
                    );
                  })}
                  <Text style={styles.otherOffersHint}>Place or update your bid below to compete.</Text>
                </View>
              )}

              {myOfferListingIds.has(selectedListingForDetail.id) ? (
                <TouchableOpacity
                  style={styles.updateBidButton}
                  onPress={() => {
                    setShowDetailModal(false);
                    setSelectedListingForDetail(null);
                    handleMakeOffer(selectedListingForDetail);
                  }}
                >
                  <Ionicons name="pencil" size={16} color="white" />
                  <Text style={styles.updateBidButtonText}>Update my bid</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.offerButton}
                  onPress={() => {
                    setShowDetailModal(false);
                    setSelectedListingForDetail(null);
                    handleMakeOffer(selectedListingForDetail);
                  }}
                >
                  <Ionicons name="hand-left" size={16} color="white" />
                  <Text style={styles.offerButtonText}>Make Offer / Give quote</Text>
                </TouchableOpacity>
              )}
              <View style={{ height: 40 }} />
            </ScrollView>
          ) : null}
        </SafeAreaView>
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
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
    ...(isDesktop && {
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingBottom: 40,
    }),
  },
  content: {
    flex: 1,
    paddingHorizontal: isDesktop ? 0 : 24,
    paddingTop: Platform.OS === 'ios' ? 20 : 24,
    width: '100%',
  },
  header: {
    marginBottom: 16,
  },
  tabBar: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: Colors.light.primary,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.icon,
    fontFamily: 'System',
  },
  tabLabelActive: {
    color: '#fff',
  },
  tabBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'System',
  },
  title: {
    fontSize: isDesktop ? 32 : 28,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: isDesktop ? 18 : 16,
    color: Colors.light.icon,
    fontFamily: 'System',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 148, 136, 0.12)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(13, 148, 136, 0.3)',
  },
  successBannerText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#0d9488',
    fontWeight: '600',
    fontFamily: 'System',
  },
  myOffersSection: {
    marginBottom: 28,
  },
  myOffersList: {
    gap: 12,
  },
  myOfferCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  myOfferRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  myOfferProduce: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    fontFamily: 'System',
  },
  myOfferSeller: {
    fontSize: 13,
    color: Colors.light.icon,
    marginBottom: 4,
    fontFamily: 'System',
  },
  myOfferDetail: {
    fontSize: 13,
    color: Colors.light.text,
    fontFamily: 'System',
  },
  myOfferDate: {
    fontSize: 12,
    color: Colors.light.icon,
    marginTop: 6,
    fontFamily: 'System',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  statusAccepted: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  statusRejected: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
    fontFamily: 'System',
    textTransform: 'capitalize',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 12,
    fontFamily: 'System',
  },
  filtersContainer: {
    marginBottom: 20,
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
    fontFamily: 'System',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.light.text,
    flex: 1,
    fontFamily: 'System',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  dropdownModal: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  dropdownModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    fontFamily: 'System',
  },
  dropdownScroll: {
    maxHeight: 320,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  dropdownOptionActive: {
    backgroundColor: 'rgba(25, 105, 108, 0.08)',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: Colors.light.text,
    fontFamily: 'System',
  },
  dropdownOptionTextActive: {
    fontWeight: '600',
    color: Colors.light.primary,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
    marginRight: 12,
  },
  filterButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: Colors.light.text,
    fontFamily: 'System',
  },
  filterButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  listingsContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: isDesktop ? 20 : 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
    fontFamily: 'System',
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.light.icon,
    fontFamily: 'System',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.icon,
    textAlign: 'center',
    paddingVertical: 32,
    fontFamily: 'System',
  },
  listingsList: {
    gap: 16,
  },
  listingCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  cardImageWrap: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: Colors.light.inputBackground,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  viewPhotosBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  viewPhotosBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'System',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    backgroundColor: 'rgba(25, 105, 108, 0.06)',
  },
  viewDetailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
    fontFamily: 'System',
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  produceInfo: {
    flex: 1,
  },
  produceName: {
    fontSize: isDesktop ? 20 : 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    fontFamily: 'System',
  },
  qualityText: {
    fontSize: 14,
    color: Colors.light.icon,
    marginTop: 2,
    fontFamily: 'System',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700' + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700' + '40',
  },
  premiumText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B8860B',
    marginLeft: 4,
    fontFamily: 'System',
  },
  sellerBlock: {
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(25, 105, 108, 0.06)',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.primary,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  sellerText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    fontFamily: 'System',
  },
  sellerTypeChip: {
    backgroundColor: 'rgba(25, 105, 108, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sellerTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
    fontFamily: 'System',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
    gap: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.light.icon,
    fontFamily: 'System',
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.text,
    fontFamily: 'System',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  listingDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 6,
    fontFamily: 'System',
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  priceLabel: {
    fontSize: 14,
    color: Colors.light.icon,
    fontFamily: 'System',
  },
  priceValue: {
    fontSize: isDesktop ? 20 : 18,
    fontWeight: 'bold',
    color: Colors.light.primary,
    fontFamily: 'System',
  },
  offerButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerButtonDisabled: {
    backgroundColor: Colors.light.icon,
  },
  offerSentButton: {
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(25, 105, 108, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(25, 105, 108, 0.3)',
  },
  offerSentButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
    fontFamily: 'System',
  },
  offerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'System',
  },
  recommendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    backgroundColor: 'rgba(25, 105, 108, 0.04)',
  },
  recommendButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.primary,
    fontFamily: 'System',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
    ...(isDesktop && {
      width: 500,
    }),
  },
  recModalContent: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
    ...(isDesktop && {
      width: 520,
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'System',
  },
  listingSummary: {
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  listingSummaryText: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 4,
    fontFamily: 'System',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
    fontFamily: 'System',
  },
  input: {
    backgroundColor: Colors.light.inputBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'System',
    color: Colors.light.text,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    fontFamily: 'System',
  },
  submitButton: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'System',
  },
  recErrorBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginTop: 8,
  },
  recErrorText: {
    flex: 1,
    fontSize: 13,
    color: '#b91c1c',
    fontFamily: 'System',
  },
  detailModalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  detailModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  detailModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    fontFamily: 'System',
  },
  detailModalClose: {
    padding: 4,
  },
  detailModalScroll: {
    flex: 1,
  },
  detailModalScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 20,
    marginBottom: 10,
    fontFamily: 'System',
  },
  detailPhotoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailPhotoBlock: {
    width: '48%',
    minWidth: 140,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.light.inputBackground,
  },
  detailPhoto: {
    width: '100%',
    height: 140,
  },
  detailPhotoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.icon,
    padding: 8,
    fontFamily: 'System',
  },
  detailNoPhotos: {
    fontSize: 14,
    color: Colors.light.icon,
    fontStyle: 'italic',
    fontFamily: 'System',
  },
  detailVideoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    alignSelf: 'flex-start',
  },
  detailVideoLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
    fontFamily: 'System',
  },
  detailInfoBlock: {
    padding: 14,
    backgroundColor: 'rgba(25, 105, 108, 0.06)',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.primary,
  },
  detailProduceName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 6,
    fontFamily: 'System',
  },
  detailOffers: {
    fontSize: 13,
    color: Colors.light.icon,
    marginTop: 6,
    fontFamily: 'System',
  },
  detailPrice: {
    fontWeight: '700',
    color: Colors.light.primary,
  },
  otherOffersLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  otherOffersLoadingText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  otherOffersBlock: {
    backgroundColor: Colors.light.cardBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 4,
  },
  otherOffersEmpty: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
  },
  otherOfferRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  otherOfferLeft: {
    flex: 1,
  },
  otherOfferRight: {
    alignItems: 'flex-end',
  },
  otherOfferTrader: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  otherOfferQty: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  otherOfferPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  otherOfferTotal: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  otherOffersHint: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 10,
    fontStyle: 'italic',
  },
  leaderboardBlock: {
    backgroundColor: Colors.light.cardBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 4,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  leaderboardRowTop: {
    backgroundColor: 'rgba(25, 105, 108, 0.06)',
    marginHorizontal: -14,
    paddingHorizontal: 14,
    marginVertical: -2,
    paddingVertical: 14,
  },
  leaderboardRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  leaderboardRank1: {
    backgroundColor: '#D4AF37',
  },
  leaderboardRank2: {
    backgroundColor: '#C0C0C0',
  },
  leaderboardRank3: {
    backgroundColor: '#CD7F32',
  },
  leaderboardRankText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },
  leaderboardLeft: {
    flex: 1,
  },
  leaderboardRight: {
    alignItems: 'flex-end',
  },
  leaderboardName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  leaderboardQty: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  leaderboardPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  leaderboardTotal: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  updateBidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  updateBidButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  recVerdictRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  recVerdictChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  recVerdictStrongBuy: {
    backgroundColor: '#dcfce7',
  },
  recVerdictBuy: {
    backgroundColor: '#e0f2fe',
  },
  recVerdictAvoid: {
    backgroundColor: '#fee2e2',
  },
  recVerdictText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.text,
    fontFamily: 'System',
  },
  recNumbersRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  recNumberBlock: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    backgroundColor: Colors.light.inputBackground,
  },
  recNumberLabel: {
    fontSize: 12,
    color: Colors.light.icon,
    marginBottom: 4,
    fontFamily: 'System',
  },
  recNumberValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    fontFamily: 'System',
  },
  recAnalysisBlock: {
    marginTop: 6,
  },
  recReasonText: {
    fontSize: 13,
    color: Colors.light.text,
    marginTop: 4,
    fontFamily: 'System',
  },
  recTrendBlock: {
    marginTop: 16,
  },
});

async function fetchRecommendationForListing(listing: Listing): Promise<RecommendationResult | null> {
  if (!listing.produce || !listing.market) {
    return null;
  }

  const produceName = listing.produce.trim();

  const { data: exactCommodityRows, error: exactError } = await supabase
    .from('fruit_commodities')
    .select('commodity_id, commodity_name')
    .ilike('commodity_name', produceName)
    .limit(1);

  if (exactError) {
    throw exactError;
  }

  let commodityRow = exactCommodityRows?.[0];

  if (!commodityRow) {
    const { data: fuzzyCommodityRows, error: fuzzyError } = await supabase
      .from('fruit_commodities')
      .select('commodity_id, commodity_name')
      .ilike('commodity_name', `%${produceName}%`)
      .limit(1);

    if (fuzzyError) {
      throw fuzzyError;
    }

    commodityRow = fuzzyCommodityRows?.[0];
  }

  if (!commodityRow) {
    return null;
  }

  const commodityId = commodityRow.commodity_id as number;

  const { data: priceRows, error: priceError } = await supabase
    .from('all_prices')
    .select('date, modal_price')
    .eq('commodity_id', commodityId)
    .eq('market_name', listing.market)
    .order('date', { ascending: false })
    .limit(60);

  if (priceError) {
    throw priceError;
  }

  const cleaned =
    (priceRows ?? [])
      .filter((r: any) => r.modal_price != null)
      .map((r: any) => ({
        date: r.date as string,
        price: Number(r.modal_price),
      })) ?? [];

  if (!cleaned.length) {
    return null;
  }

  cleaned.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const lastPrice = cleaned[cleaned.length - 1]?.price ?? null;
  const last7 = cleaned.slice(-7);
  const last30 = cleaned.slice(-30);

  const avg = (rows: { price: number }[]): number | null => {
    if (!rows.length) return null;
    const sum = rows.reduce((s, r) => s + r.price, 0);
    return sum / rows.length;
  };

  const avg7Raw = avg(last7);
  const avg30Raw = avg(last30);

  const sevenDayAvg = avg7Raw != null ? Math.round(avg7Raw) : null;
  const thirtyDayAvg = avg30Raw != null ? Math.round(avg30Raw) : null;

  let trend: TrendDirection = 'flat';
  if (sevenDayAvg != null && thirtyDayAvg != null && thirtyDayAvg > 0) {
    const changePct = (sevenDayAvg - thirtyDayAvg) / thirtyDayAvg;
    if (changePct > 0.07) {
      trend = 'up';
    } else if (changePct < -0.07) {
      trend = 'down';
    }
  }

  const forecast: ForecastPoint[] = [];
  const base = lastPrice ?? sevenDayAvg ?? thirtyDayAvg ?? 0;
  const trendFactor = trend === 'up' ? 0.08 : trend === 'down' ? -0.08 : 0;

  for (let i = 1; i <= 7; i++) {
    const factorForDay = trendFactor * (i / 7);
    const price = Math.round(base * (1 + factorForDay));
    forecast.push({
      dayLabel: `Day ${i}`,
      price,
    });
  }

  const expectedNext7Avg =
    forecast.length > 0
      ? Math.round(
          forecast.reduce((sum, p) => sum + p.price, 0) / forecast.length
        )
      : null;

  const fairPriceBase = sevenDayAvg ?? lastPrice ?? thirtyDayAvg ?? base;
  const fairPrice = Math.round(fairPriceBase);

  const safetyMargin = 0.1;
  const recommendedMaxBid =
    expectedNext7Avg != null
      ? Math.floor(expectedNext7Avg * (1 - safetyMargin))
      : Math.floor(fairPrice * (1 - safetyMargin));

  const safeBidMin = Math.floor(fairPrice * 0.9);

  let verdict: 'strong_buy' | 'buy' | 'avoid' = 'buy';
  const ask = listing.pricePerQuintal;

  if (ask <= recommendedMaxBid && trend === 'up') {
    verdict = 'strong_buy';
  } else if (ask <= recommendedMaxBid) {
    verdict = 'buy';
  } else {
    verdict = 'avoid';
  }

  const reasons: string[] = [];

  if (sevenDayAvg != null && thirtyDayAvg != null) {
    const changePct = ((sevenDayAvg - thirtyDayAvg) / thirtyDayAvg) * 100;
    reasons.push(
      `Last 7-day mandi average: ₹${sevenDayAvg.toLocaleString()}/qtl vs 30-day average ₹${thirtyDayAvg.toLocaleString()}/qtl (${changePct >= 0 ? '+' : ''}${changePct.toFixed(
        1
      )}%).`
    );
  } else if (sevenDayAvg != null) {
    reasons.push(
      `Last 7-day mandi average price is around ₹${sevenDayAvg.toLocaleString()}/qtl.`
    );
  }

  if (expectedNext7Avg != null) {
    reasons.push(
      `Expected next 7-day average mandi price: ~₹${expectedNext7Avg.toLocaleString()}/qtl based on recent trend.`
    );
  }

  reasons.push(
    `To keep around 10% safety margin, we suggest bidding up to ₹${recommendedMaxBid.toLocaleString()}/qtl.`
  );

  if (ask > recommendedMaxBid) {
    reasons.push(
      `Current asking price ₹${ask.toLocaleString()}/qtl is above the safe limit, so profit margin will shrink.`
    );
  } else {
    reasons.push(
      `Current asking price ₹${ask.toLocaleString()}/qtl is within the suggested profitable range.`
    );
  }

  return {
    recommendedMaxBid,
    safeBidMin,
    fairPrice,
    lastPrice,
    sevenDayAvg,
    thirtyDayAvg,
    expectedNext7Avg,
    trend,
    verdict,
    reasons,
    forecast,
  };
}
