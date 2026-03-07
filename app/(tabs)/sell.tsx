import { Colors } from '@/constants/theme';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/utils/supabaseClient';
import { uploadListingImages } from '@/utils/uploadListingImages';
import { getResponsiveDimensions, isDesktop } from '@/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    FlatList,
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

type ListingLocation = {
  latitude: number;
  longitude: number;
  address?: string;
};

type ListingPhotos = {
  cropPhotoUri: string | null; // fruit/produce photo
  qualityPhotoUri: string | null; // grade/quality photo
  packagingPhotoUri: string | null; // packaging/storage photo
};

interface Listing {
  id: string;
  produce: string;
  quality: string;
  quantity: number;
  minOfferSize: number;
  pricePerQuintal: number;
  sellerType: 'Farmer' | 'Trader';
  market: string;
  status: 'active' | 'sold' | 'expired' | 'cancelled';
  offers: Offer[];
  createdAt: string;
}

interface Offer {
  id: string;
  buyer: string;
  quantity: number;
  pricePerQuintal: number;
  totalAmount: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export default function SellProduceScreen() {
  const params = useLocalSearchParams();
  const { user } = useUser();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState<boolean>(true);
  const [isSubmittingListing, setIsSubmittingListing] = useState(false);
  const [formData, setFormData] = useState({
    produce: '',
    quality: '',
    quantity: '',
    minOfferSize: '',
    pricePerQuintal: '',
    sellerType: 'Farmer',
    market: '',
    photos: {
      cropPhotoUri: null,
      qualityPhotoUri: null,
      packagingPhotoUri: null,
    } as ListingPhotos,
    videoUri: null as string | null,
    location: null as ListingLocation | null,
  });
  const dimensions = getResponsiveDimensions();

  // Check if we should open the create form automatically
  useEffect(() => {
    if (params.openCreate === 'true') {
      setShowCreateModal(true);
    }
  }, [params.openCreate]);

  // Load listings for the logged-in seller
  useEffect(() => {
    const loadListings = async () => {
      if (!user?.id) {
        setListings([]);
        setIsLoadingListings(false);
        return;
      }

      try {
        setIsLoadingListings(true);
        const { data, error } = await supabase
          .from('listings')
          .select(
            'id, produce, quality, quantity, min_offer_size, price_per_quintal, seller_type, market, status, created_at'
          )
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading listings:', error);
          setListings([]);
          return;
        }

        const mapped: Listing[] =
          (data ?? []).map((row: any) => ({
            id: row.id,
            produce: row.produce,
            quality: row.quality ?? '',
            quantity: Number(row.quantity ?? 0),
            minOfferSize: Number(row.min_offer_size ?? 0),
            pricePerQuintal: Number(row.price_per_quintal ?? 0),
            sellerType: (row.seller_type ?? 'Farmer') as 'Farmer' | 'Trader',
            market: row.market ?? '',
            status: (row.status ?? 'active') as Listing['status'],
            offers: [],
            createdAt: row.created_at,
          })) ?? [];

        setListings(mapped);
      } finally {
        setIsLoadingListings(false);
      }
    };

    loadListings();
  }, [user?.id]);

  const handleCreateListing = () => {
    setShowCreateModal(true);
  };

  const requestMediaPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow media library access to upload photos/videos.');
      return false;
    }
    return true;
  };

  const pickPhoto = async (kind: keyof ListingPhotos) => {
    const ok = await requestMediaPermissions();
    if (!ok) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled) return;
    const uri = result.assets?.[0]?.uri;
    if (!uri) return;

    setFormData((prev) => ({
      ...prev,
      photos: {
        ...prev.photos,
        [kind]: uri,
      },
    }));
  };

  const pickVideo = async () => {
    const ok = await requestMediaPermissions();
    if (!ok) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 0.8 as any,
    });

    if (result.canceled) return;
    const uri = result.assets?.[0]?.uri;
    if (!uri) return;

    setFormData((prev) => ({
      ...prev,
      videoUri: uri,
    }));
  };

  const clearVideo = () => {
    setFormData((prev) => ({ ...prev, videoUri: null }));
  };

  const clearPhoto = (kind: keyof ListingPhotos) => {
    setFormData((prev) => ({
      ...prev,
      photos: {
        ...prev.photos,
        [kind]: null,
      },
    }));
  };

  const captureLocation = async () => {
    try {
      setIsFetchingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow location access to capture your mandi location.');
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = pos.coords;
      let address: string | undefined;
      try {
        const results = await Location.reverseGeocodeAsync({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        const first = results?.[0];
        if (first) {
          const parts = [first.name, first.street, first.city, first.region, first.postalCode].filter(Boolean);
          address = parts.join(', ');
        }
      } catch {
        // ignore reverse geocode errors
      }

      setFormData((prev) => ({
        ...prev,
        location: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          address,
        },
      }));
    } catch (e) {
      Alert.alert('Error', 'Failed to get your location. Please try again.');
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const clearLocation = () => {
    setFormData((prev) => ({ ...prev, location: null }));
  };

  const handleSubmitListing = async () => {
    if (!user?.id) {
      Alert.alert('Not signed in', 'Please sign in to create a listing.');
      return;
    }

    const { produce, quality, quantity, minOfferSize, pricePerQuintal, market, photos, location } = formData;
    
    if (!produce || !quality || !quantity || !minOfferSize || !pricePerQuintal || !market) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Media + location validations (can be relaxed later)
    if (!photos.cropPhotoUri || !photos.qualityPhotoUri || !photos.packagingPhotoUri) {
      Alert.alert('Photos required', 'Please upload all 3 photos: Crop, Quality, and Packaging.');
      return;
    }
    if (!location) {
      Alert.alert('Location required', 'Please capture your location using Google Maps/location.');
      return;
    }

    setIsSubmittingListing(true);
    try {
      const { cropPhotoUrl, qualityPhotoUrl, packagingPhotoUrl } = await uploadListingImages(
        supabase,
        user.id,
        {
          crop: photos.cropPhotoUri,
          quality: photos.qualityPhotoUri,
          packaging: photos.packagingPhotoUri,
        }
      );

      const { error } = await supabase.from('listings').insert({
        seller_id: user.id,
        seller_display_name: user.name ?? undefined,
        produce,
        quality,
        quantity: Number(quantity),
        min_offer_size: Number(minOfferSize),
        price_per_quintal: Number(pricePerQuintal),
        seller_type: formData.sellerType,
        market,
        status: 'active',
        crop_photo_url: cropPhotoUrl,
        quality_photo_url: qualityPhotoUrl,
        packaging_photo_url: packagingPhotoUrl,
        video_url: formData.videoUri,
        location_lat: location.latitude,
        location_lng: location.longitude,
        location_address: location.address,
      });

      if (error) {
        console.error('Error creating listing:', error);
        Alert.alert('Error', 'Failed to create listing. Please try again.');
        return;
      }

      Alert.alert('Success', 'Listing created successfully!');
      setShowCreateModal(false);
      setFormData({
        produce: '',
        quality: '',
        quantity: '',
        minOfferSize: '',
        pricePerQuintal: '',
        sellerType: 'Farmer',
        market: '',
        photos: {
          cropPhotoUri: null,
          qualityPhotoUri: null,
          packagingPhotoUri: null,
        },
        videoUri: null,
        location: null,
      });

      // Reload listings list
      if (user?.id) {
        const { data, error: reloadError } = await supabase
          .from('listings')
          .select(
            'id, produce, quality, quantity, min_offer_size, price_per_quintal, seller_type, market, status, created_at'
          )
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });

        if (!reloadError && data) {
          const mapped: Listing[] = data.map((row: any) => ({
            id: row.id,
            produce: row.produce,
            quality: row.quality ?? '',
            quantity: Number(row.quantity ?? 0),
            minOfferSize: Number(row.min_offer_size ?? 0),
            pricePerQuintal: Number(row.price_per_quintal ?? 0),
            sellerType: (row.seller_type ?? 'Farmer') as 'Farmer' | 'Trader',
            market: row.market ?? '',
            status: (row.status ?? 'active') as Listing['status'],
            offers: [],
            createdAt: row.created_at,
          }));
          setListings(mapped);
        }
      }
    } catch (e: any) {
      console.error('Unexpected error creating listing:', e);
      Alert.alert('Error', e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setIsSubmittingListing(false);
    }
  };

  const loadOffersForListing = async (listingId: string) => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('listing_offers')
      .select('id, buyer_name, quantity, price_per_quintal, total_amount, status, created_at')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading offers:', error);
      return;
    }

    const offers: Offer[] =
      (data ?? []).map((row: any) => ({
        id: row.id,
        buyer: row.buyer_name ?? 'Buyer',
        quantity: Number(row.quantity ?? 0),
        pricePerQuintal: Number(row.price_per_quintal ?? 0),
        totalAmount: Number(row.total_amount ?? 0),
        status: row.status as Offer['status'],
        createdAt: row.created_at,
      })) ?? [];

    setSelectedListing((prev) =>
      prev && prev.id === listingId ? { ...prev, offers } : prev
    );
  };

  const handleViewOffers = (listing: Listing) => {
    setSelectedListing({ ...listing, offers: [] });
    setShowOffersModal(true);
    loadOffersForListing(listing.id);
  };

  const handleOfferAction = (offerId: string, action: 'accept' | 'reject') => {
    Alert.alert(
      action === 'accept' ? 'Accept Offer' : 'Reject Offer',
      `Are you sure you want to ${action} this offer?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'accept' ? 'Accept' : 'Reject',
          style: action === 'accept' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('listing_offers')
                .update({ status: action === 'accept' ? 'accepted' : 'rejected' })
                .eq('id', offerId);

              if (error) {
                console.error('Error updating offer:', error);
                Alert.alert('Error', 'Failed to update offer status. Please try again.');
                return;
              }

              if (selectedListing) {
                await loadOffersForListing(selectedListing.id);
              }

              Alert.alert('Success', `Offer ${action}ed successfully!`);
            } catch (e) {
              console.error('Unexpected error updating offer:', e);
              Alert.alert('Error', 'Something went wrong. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderListingCard = ({ item }: { item: Listing }) => (
    <View style={styles.listingCard}>
      <View style={styles.listingHeader}>
        <View style={styles.produceInfo}>
          <Text style={styles.produceName}>{item.produce}</Text>
          <Text style={styles.qualityText}>{item.quality}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.listingDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="cube" size={16} color={Colors.light.icon} />
          <Text style={styles.detailText}>{item.quantity} quintals available</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color={Colors.light.icon} />
          <Text style={styles.detailText}>{item.market}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="person" size={16} color={Colors.light.icon} />
          <Text style={styles.detailText}>{item.sellerType}</Text>
        </View>
      </View>

      <View style={styles.priceSection}>
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>Price per quintal</Text>
          <Text style={styles.priceValue}>₹{item.pricePerQuintal.toLocaleString()}</Text>
        </View>
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>Min offer size</Text>
          <Text style={styles.priceValue}>{item.minOfferSize} quintals</Text>
        </View>
      </View>

      <View style={styles.offersSection}>
        <View style={styles.offersInfo}>
          <Ionicons name="people" size={16} color={Colors.light.primary} />
          <Text style={styles.offersText}>{item.offers.length} offers received</Text>
        </View>
        <TouchableOpacity
          style={styles.viewOffersButton}
          onPress={() => handleViewOffers(item)}
        >
          <Text style={styles.viewOffersText}>View Offers</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOfferCard = ({ item }: { item: Offer }) => (
    <View style={styles.offerCard}>
      <View style={styles.offerHeader}>
        <Text style={styles.buyerName}>{item.buyer}</Text>
        <View style={[styles.offerStatusBadge, { backgroundColor: getOfferStatusColor(item.status) }]}>
          <Text style={styles.offerStatusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.offerDetails}>
        <View style={styles.offerDetailItem}>
          <Text style={styles.offerDetailLabel}>Quantity</Text>
          <Text style={styles.offerDetailValue}>{item.quantity} quintals</Text>
        </View>
        <View style={styles.offerDetailItem}>
          <Text style={styles.offerDetailLabel}>Price per quintal</Text>
          <Text style={styles.offerDetailValue}>₹{item.pricePerQuintal.toLocaleString()}</Text>
        </View>
        <View style={styles.offerDetailItem}>
          <Text style={styles.offerDetailLabel}>Total Amount</Text>
          <Text style={styles.offerDetailValue}>₹{item.totalAmount.toLocaleString()}</Text>
        </View>
      </View>

      {item.status === 'pending' && (
        <View style={styles.offerActions}>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => handleOfferAction(item.id, 'reject')}
          >
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleOfferAction(item.id, 'accept')}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return Colors.light.success;
      case 'sold': return Colors.light.primary;
      case 'expired': return Colors.light.error;
      default: return Colors.light.icon;
    }
  };

  const getOfferStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return Colors.light.success;
      case 'rejected': return Colors.light.error;
      case 'pending': return Colors.light.primary;
      default: return Colors.light.icon;
    }
  };

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
            <Text style={styles.title}>Sell Produce</Text>
            <Text style={styles.subtitle}>Create listings and manage your offers</Text>
          </View>

          {/* Listings + Create CTA in one view */}
          <View style={styles.listingsContainer}>
            <View style={styles.listingsHeader}>
              <Text style={styles.sectionTitle}>My Listings</Text>
              <TouchableOpacity style={styles.createButton} onPress={handleCreateListing}>
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.createButtonText}>Create New</Text>
              </TouchableOpacity>
            </View>

            {isLoadingListings ? (
              <View style={styles.listingsList}>
                <Text style={styles.detailText}>Loading your listings...</Text>
              </View>
            ) : listings.length === 0 ? (
              <View style={styles.createContainer}>
                <TouchableOpacity style={styles.createListingButton} onPress={handleCreateListing}>
                  <Ionicons name="add-circle" size={48} color={Colors.light.primary} />
                  <Text style={styles.createListingText}>Create Your First Listing</Text>
                  <Text style={styles.createListingSubtext}>
                    Start selling your produce to buyers
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={listings}
                renderItem={renderListingCard}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.listingsList}
              />
            )}
          </View>
        </View>
      </ScrollView>

      {/* Create Listing Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Listing</Text>

            <ScrollView style={styles.modalScrollView}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Produce</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter produce name"
                  value={formData.produce}
                  onChangeText={(text) => setFormData({ ...formData, produce: text })}
                  placeholderTextColor={Colors.light.icon}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Quality/Grade</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Grade A, Grade B"
                  value={formData.quality}
                  onChangeText={(text) => setFormData({ ...formData, quality: text })}
                  placeholderTextColor={Colors.light.icon}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Quantity (quintals)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter quantity"
                    value={formData.quantity}
                    onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                    keyboardType="numeric"
                    placeholderTextColor={Colors.light.icon}
                  />
                </View>
                <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Min Offer Size</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Min quantity"
                    value={formData.minOfferSize}
                    onChangeText={(text) => setFormData({ ...formData, minOfferSize: text })}
                    keyboardType="numeric"
                    placeholderTextColor={Colors.light.icon}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Price per quintal (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter price"
                  value={formData.pricePerQuintal}
                  onChangeText={(text) => setFormData({ ...formData, pricePerQuintal: text })}
                  keyboardType="numeric"
                  placeholderTextColor={Colors.light.icon}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Market</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter market name"
                  value={formData.market}
                  onChangeText={(text) => setFormData({ ...formData, market: text })}
                  placeholderTextColor={Colors.light.icon}
                />
              </View>

              {/* Media Uploads */}
              <View style={styles.mediaSection}>
                <Text style={styles.sectionTitle}>Upload Photos (3)</Text>
                <Text style={styles.mediaHint}>Crop photo, quality/grade photo, and packaging/storage photo.</Text>

                <View style={styles.mediaGrid}>
                  {/* Crop Photo */}
                  <View style={styles.mediaTile}>
                    <Text style={styles.mediaLabel}>Crop Photo</Text>
                    {formData.photos.cropPhotoUri ? (
                      <View>
                        <Image source={{ uri: formData.photos.cropPhotoUri }} style={styles.mediaPreview} />
                        <View style={styles.mediaActionsRow}>
                          <TouchableOpacity style={styles.mediaSmallBtn} onPress={() => pickPhoto('cropPhotoUri')}>
                            <Ionicons name="refresh" size={16} color={Colors.light.primary} />
                            <Text style={styles.mediaSmallBtnText}>Replace</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.mediaSmallBtn} onPress={() => clearPhoto('cropPhotoUri')}>
                            <Ionicons name="trash" size={16} color={Colors.light.error} />
                            <Text style={[styles.mediaSmallBtnText, { color: Colors.light.error }]}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.mediaPickBtn} onPress={() => pickPhoto('cropPhotoUri')}>
                        <Ionicons name="image" size={22} color={Colors.light.primary} />
                        <Text style={styles.mediaPickText}>Upload</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Quality Photo */}
                  <View style={styles.mediaTile}>
                    <Text style={styles.mediaLabel}>Quality Photo</Text>
                    {formData.photos.qualityPhotoUri ? (
                      <View>
                        <Image source={{ uri: formData.photos.qualityPhotoUri }} style={styles.mediaPreview} />
                        <View style={styles.mediaActionsRow}>
                          <TouchableOpacity style={styles.mediaSmallBtn} onPress={() => pickPhoto('qualityPhotoUri')}>
                            <Ionicons name="refresh" size={16} color={Colors.light.primary} />
                            <Text style={styles.mediaSmallBtnText}>Replace</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.mediaSmallBtn} onPress={() => clearPhoto('qualityPhotoUri')}>
                            <Ionicons name="trash" size={16} color={Colors.light.error} />
                            <Text style={[styles.mediaSmallBtnText, { color: Colors.light.error }]}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.mediaPickBtn} onPress={() => pickPhoto('qualityPhotoUri')}>
                        <Ionicons name="image" size={22} color={Colors.light.primary} />
                        <Text style={styles.mediaPickText}>Upload</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Packaging Photo */}
                  <View style={styles.mediaTile}>
                    <Text style={styles.mediaLabel}>Packaging Photo</Text>
                    {formData.photos.packagingPhotoUri ? (
                      <View>
                        <Image source={{ uri: formData.photos.packagingPhotoUri }} style={styles.mediaPreview} />
                        <View style={styles.mediaActionsRow}>
                          <TouchableOpacity style={styles.mediaSmallBtn} onPress={() => pickPhoto('packagingPhotoUri')}>
                            <Ionicons name="refresh" size={16} color={Colors.light.primary} />
                            <Text style={styles.mediaSmallBtnText}>Replace</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.mediaSmallBtn} onPress={() => clearPhoto('packagingPhotoUri')}>
                            <Ionicons name="trash" size={16} color={Colors.light.error} />
                            <Text style={[styles.mediaSmallBtnText, { color: Colors.light.error }]}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.mediaPickBtn} onPress={() => pickPhoto('packagingPhotoUri')}>
                        <Ionicons name="image" size={22} color={Colors.light.primary} />
                        <Text style={styles.mediaPickText}>Upload</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Video Upload */}
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.sectionTitle}>Upload Video (optional)</Text>
                  <Text style={styles.mediaHint}>Short video of your produce (helps buyers).</Text>
                  {formData.videoUri ? (
                    <View style={styles.videoRow}>
                      <Ionicons name="videocam" size={20} color={Colors.light.primary} />
                      <Text style={styles.videoText} numberOfLines={1}>{formData.videoUri}</Text>
                      <TouchableOpacity style={styles.videoBtn} onPress={pickVideo}>
                        <Text style={styles.videoBtnText}>Replace</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.videoBtn, { backgroundColor: Colors.light.error }]} onPress={clearVideo}>
                        <Text style={styles.videoBtnText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.videoUploadBtn} onPress={pickVideo}>
                      <Ionicons name="cloud-upload" size={20} color="#fff" />
                      <Text style={styles.videoUploadText}>Upload Video</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Location Capture */}
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.sectionTitle}>Location (Google Map)</Text>
                  <Text style={styles.mediaHint}>We will store your latitude/longitude for the listing.</Text>

                  {formData.location ? (
                    <View style={styles.locationBox}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.locationText} numberOfLines={2}>
                          {formData.location.address ? formData.location.address : 'Location captured'}
                        </Text>
                        <Text style={styles.locationCoords}>
                          {formData.location.latitude.toFixed(5)}, {formData.location.longitude.toFixed(5)}
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.locationSmallBtn} onPress={captureLocation} disabled={isFetchingLocation}>
                        <Ionicons name="refresh" size={16} color={Colors.light.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.locationSmallBtn} onPress={clearLocation} disabled={isFetchingLocation}>
                        <Ionicons name="trash" size={16} color={Colors.light.error} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.locationBtn, isFetchingLocation && { opacity: 0.7 }]}
                      onPress={captureLocation}
                      disabled={isFetchingLocation}
                    >
                      <Ionicons name="navigate" size={20} color="#fff" />
                      <Text style={styles.locationBtnText}>
                        {isFetchingLocation ? 'Getting location…' : 'Use Current Location'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, isSubmittingListing && { opacity: 0.8 }]}
                onPress={handleSubmitListing}
                disabled={isSubmittingListing}
              >
                {isSubmittingListing ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.submitButtonText}>Uploading photos…</Text>
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>Create Listing</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Offers Modal */}
      <Modal
        visible={showOffersModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOffersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Offers for {selectedListing?.produce}
            </Text>

            {selectedListing && (
              <FlatList
                data={selectedListing.offers}
                renderItem={renderOfferCard}
                keyExtractor={(item) => item.id}
                style={styles.offersList}
              />
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowOffersModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
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
    marginBottom: 24,
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
  tabContainer: {
    display: 'none',
  },
  tab: {
    flex: 1,
  },
  activeTab: {
    backgroundColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 16,
  },
  activeTabText: {
    color: 'white',
  },
  listingsContainer: {
    flex: 1,
  },
  listingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: isDesktop ? 20 : 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    fontFamily: 'System',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'System',
  },
  listingDetails: {
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 8,
    fontFamily: 'System',
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  priceItem: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: Colors.light.icon,
    marginBottom: 4,
    fontFamily: 'System',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.primary,
    fontFamily: 'System',
  },
  offersSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offersInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offersText: {
    fontSize: 14,
    color: Colors.light.primary,
    marginLeft: 6,
    fontFamily: 'System',
  },
  viewOffersButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewOffersText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '600',
    marginRight: 4,
    fontFamily: 'System',
  },
  createContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createListingButton: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.light.background,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
  },
  createListingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'System',
  },
  createListingSubtext: {
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: 'center',
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
      width: 600,
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
  modalScrollView: {
    maxHeight: 400,
  },
  mediaSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  mediaHint: {
    fontSize: 12,
    color: Colors.light.icon,
    marginBottom: 12,
    fontFamily: 'System',
  },
  mediaGrid: {
    gap: 12,
  },
  mediaTile: {
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 12,
  },
  mediaLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
    fontFamily: 'System',
  },
  mediaPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    paddingVertical: 10,
    backgroundColor: '#fff',
    gap: 8,
  },
  mediaPickText: {
    color: Colors.light.primary,
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'System',
  },
  mediaPreview: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
  },
  mediaActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  mediaSmallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 8,
  },
  mediaSmallBtnText: {
    color: Colors.light.primary,
    fontWeight: '700',
    fontSize: 13,
    fontFamily: 'System',
  },
  videoUploadBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: Colors.light.primary,
    gap: 8,
  },
  videoUploadText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'System',
  },
  videoRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 10,
    gap: 10,
  },
  videoText: {
    flex: 1,
    color: Colors.light.text,
    fontSize: 12,
    fontFamily: 'System',
  },
  videoBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  videoBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
    fontFamily: 'System',
  },
  locationBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: Colors.light.secondary,
    gap: 8,
  },
  locationBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    fontFamily: 'System',
  },
  locationBox: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 12,
    gap: 10,
  },
  locationText: {
    color: Colors.light.text,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'System',
  },
  locationCoords: {
    color: Colors.light.icon,
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'System',
  },
  locationSmallBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
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
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'System',
  },
  offersList: {
    maxHeight: 300,
  },
  offerCard: {
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  buyerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    fontFamily: 'System',
  },
  offerStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offerStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'System',
  },
  offerDetails: {
    marginBottom: 12,
  },
  offerDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  offerDetailLabel: {
    fontSize: 14,
    color: Colors.light.icon,
    fontFamily: 'System',
  },
  offerDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    fontFamily: 'System',
  },
  offerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: Colors.light.error,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: Colors.light.success,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  closeButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
});
