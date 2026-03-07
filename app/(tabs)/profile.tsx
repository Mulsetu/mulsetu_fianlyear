import { Colors } from '@/constants/theme';
import { useUser } from '@/contexts/UserContext';
import { getResponsiveDimensions, isDesktop } from '@/utils/responsive';
import { fetchAllStateMarkets } from '@/utils/stateMarketImport';
import { supabase } from '@/utils/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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

export default function ProfileScreen() {
  const { user, logout, refreshUser, isLoading } = useUser();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editLocation, setEditLocation] = useState(user?.location || '');
  const [editMarket, setEditMarket] = useState(user?.market || '');
  const [markets, setMarkets] = useState<Array<{ market_name: string; state_name: string }>>([]);
  const [loadingMarkets, setLoadingMarkets] = useState(false);
  const [marketSearch, setMarketSearch] = useState('');
  const [showMarketModal, setShowMarketModal] = useState(false);
  const dimensions = getResponsiveDimensions();

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditEmail(user.email);
      setEditPhone(user.phone || '');
      setEditLocation(user.location || '');
      setEditMarket(user.market || '');
    }
  }, [user]);

  useEffect(() => {
    if (isEditModalVisible) {
      loadMarkets();
    }
  }, [isEditModalVisible]);

  // state_market_import only, full list (paginated past 1000 rows)
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

  const filteredMarkets = markets.filter((m) => {
    const label = `${m.market_name}${m.state_name ? ` (${m.state_name})` : ''}`;
    if (!marketSearch.trim()) return true;
    return label.toLowerCase().includes(marketSearch.toLowerCase());
  });

  const marketOptionsList = filteredMarkets.map(
    (m) => `${m.market_name}${m.state_name ? ` (${m.state_name})` : ''}`
  );

  // Redirect to sign-in if not authenticated (wait for loading to complete)
  useEffect(() => {
    // Don't navigate while still loading user data
    if (!isLoading && !user) {
      // Use setTimeout to ensure router is mounted before navigation
      const timer = setTimeout(() => {
        try {
          router.replace('/sign-in');
        } catch (error) {
          // Router might not be ready yet, ignore error
          console.log('Router not ready yet');
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/sign-in');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        },
      ]
    );
  };

  const handleEditProfile = () => {
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      // Update profile in Supabase
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: editName,
          email: editEmail,
          phone: editPhone,
          location_text: editLocation,
          market: editMarket,
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        Alert.alert('Error', 'Failed to update profile. Please try again.');
        return;
      }

      // Refresh user data
      await refreshUser();
      
      Alert.alert('Success', 'Profile updated successfully!');
      setIsEditModalVisible(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setEditName(user.name);
      setEditEmail(user.email);
      setEditPhone(user.phone || '');
      setEditLocation(user.location || '');
      setEditMarket(user.market || '');
    }
    setIsEditModalVisible(false);
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Will redirect via useEffect if no user
  if (!user) {
    return null;
  }

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
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.subtitle}>Manage your account and preferences</Text>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
              {user.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={16} color="white" />
                </View>
              )}
            </View>
            
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <Ionicons name="pencil" size={16} color={Colors.light.primary} />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* User Stats */}
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Your Activity</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="trending-up" size={24} color={Colors.light.primary} />
                <Text style={styles.statValue}>{user.totalReports}</Text>
                <Text style={styles.statLabel}>Price Reports</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="calendar" size={24} color={Colors.light.secondary} />
                <Text style={styles.statValue}>
                  {new Date(user.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </Text>
                <Text style={styles.statLabel}>Member Since</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="location" size={24} color={Colors.light.primary} />
                <Text style={styles.statValue}>{user.district || 'N/A'}</Text>
                <Text style={styles.statLabel}>Location</Text>
              </View>
            </View>
          </View>

          {/* Account Details */}
          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>Account Details</Text>
            <View style={styles.detailsCard}>
              <View style={styles.detailItem}>
                <Ionicons name="person" size={20} color={Colors.light.icon} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Full Name</Text>
                  <Text style={styles.detailValue}>{user.name}</Text>
                </View>
              </View>
              
              <View style={styles.detailItem}>
                <Ionicons name="mail" size={20} color={Colors.light.icon} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{user.email}</Text>
                </View>
              </View>
              
              {user.phone && (
              <View style={styles.detailItem}>
                <Ionicons name="call" size={20} color={Colors.light.icon} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Phone</Text>
                    <Text style={styles.detailValue}>{user.phone}</Text>
                  </View>
                </View>
              )}
              
              {user.location && (
                <View style={styles.detailItem}>
                  <Ionicons name="location" size={20} color={Colors.light.icon} />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailValue}>{user.location}</Text>
                  </View>
                </View>
              )}
              
              <View style={styles.detailItem}>
                <Ionicons name="business" size={20} color={Colors.light.icon} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>User Type</Text>
                  <Text style={styles.detailValue}>{user.userType}</Text>
                </View>
              </View>
              
              <View style={styles.detailItem}>
                <Ionicons name="map" size={20} color={Colors.light.icon} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Market</Text>
                  <Text style={styles.detailValue}>{user.market || 'N/A'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Settings */}
          <View style={styles.settingsContainer}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <View style={styles.settingsCard}>
              <TouchableOpacity style={styles.settingItem}>
                <Ionicons name="notifications" size={20} color={Colors.light.icon} />
                <Text style={styles.settingLabel}>Notifications</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.light.icon} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingItem}>
                <Ionicons name="shield-checkmark" size={20} color={Colors.light.icon} />
                <Text style={styles.settingLabel}>Privacy & Security</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.light.icon} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingItem}>
                <Ionicons name="help-circle" size={20} color={Colors.light.icon} />
                <Text style={styles.settingLabel}>Help & Support</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.light.icon} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingItem}>
                <Ionicons name="information-circle" size={20} color={Colors.light.icon} />
                <Text style={styles.settingLabel}>About</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.light.icon} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={20} color="white" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCancelEdit}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your full name"
                placeholderTextColor={Colors.light.icon}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                placeholderTextColor={Colors.light.icon}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                placeholderTextColor={Colors.light.icon}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.input}
                value={editLocation}
                onChangeText={setEditLocation}
                placeholder="Enter your location"
                placeholderTextColor={Colors.light.icon}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mandi / Market</Text>
              <TouchableOpacity
                style={[styles.input, styles.pickerInput]}
                onPress={() => setShowMarketModal(true)}
                disabled={loadingMarkets}
              >
                {loadingMarkets ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={Colors.light.primary} style={{ marginRight: 8 }} />
                    <Text style={[styles.pickerText, { color: Colors.light.icon }]}>Loading markets...</Text>
                  </View>
                ) : (
                  <>
                    <Text style={[styles.pickerText, !editMarket && { color: Colors.light.icon }]}>
                      {editMarket || 'Select your mandi / market'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={Colors.light.icon} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>

        {/* Market Selection Modal */}
        <Modal
          visible={showMarketModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowMarketModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.marketModalContent}>
              <Text style={styles.modalTitle}>Select Mandi / Market</Text>
              {loadingMarkets ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={Colors.light.primary} />
                  <Text style={{ marginTop: 10, color: Colors.light.icon }}>Loading markets...</Text>
                </View>
              ) : (
                <>
                  {/* Search bar for markets */}
                  <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
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
                        value={marketSearch}
                        onChangeText={setMarketSearch}
                      />
                    </View>
                  </View>
                  <FlatList
                    data={marketOptionsList}
                    keyExtractor={(item) => item}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => {
                      const marketName = item.split(' (')[0];
                      return (
                        <TouchableOpacity
                          style={styles.modalItem}
                          onPress={() => {
                            setEditMarket(marketName);
                            setShowMarketModal(false);
                          }}
                        >
                          <Text style={styles.modalItemText}>{item}</Text>
                          {editMarket === marketName && (
                            <Ionicons name="checkmark" size={20} color={Colors.light.primary} />
                          )}
                        </TouchableOpacity>
                      );
                    }}
                  />
                </>
              )}
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowMarketModal(false)}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    marginBottom: 32,
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
  sectionTitle: {
    fontSize: isDesktop ? 20 : 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
    fontFamily: 'System',
  },
  profileCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'System',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  userName: {
    fontSize: isDesktop ? 24 : 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
    fontFamily: 'System',
  },
  userEmail: {
    fontSize: 16,
    color: Colors.light.icon,
    marginBottom: 16,
    fontFamily: 'System',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '10',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
    marginLeft: 8,
    fontFamily: 'System',
  },
  statsContainer: {
    marginBottom: 32,
  },
  statsGrid: {
    ...(isDesktop ? {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 16,
    } : {
      gap: 16,
    }),
  },
  statCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...(isDesktop && {
      flex: 1,
    }),
  },
  statValue: {
    fontSize: isDesktop ? 24 : 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginTop: 8,
    marginBottom: 4,
    fontFamily: 'System',
  },
  statLabel: {
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: 'center',
    fontFamily: 'System',
  },
  detailsContainer: {
    marginBottom: 32,
  },
  detailsCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  detailContent: {
    flex: 1,
    marginLeft: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.light.icon,
    marginBottom: 4,
    fontFamily: 'System',
  },
  detailValue: {
    fontSize: 16,
    color: Colors.light.text,
    fontFamily: 'System',
  },
  settingsContainer: {
    marginBottom: 32,
  },
  settingsCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  settingLabel: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 16,
    fontFamily: 'System',
  },
  logoutButton: {
    backgroundColor: Colors.light.error,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'System',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    fontFamily: 'System',
  },
  modalCancelText: {
    fontSize: 16,
    color: Colors.light.icon,
    fontFamily: 'System',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
    fontFamily: 'System',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  pickerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: {
    fontSize: 16,
    fontFamily: 'System',
    color: Colors.light.text,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalItemText: {
    fontSize: 16,
    color: Colors.light.text,
    fontFamily: 'System',
    flex: 1,
  },
  modalCloseButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  modalCloseText: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '600',
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
  marketModalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
});
