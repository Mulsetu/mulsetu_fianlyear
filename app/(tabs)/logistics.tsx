import { Colors } from '@/constants/theme';
import { getResponsiveDimensions, isDesktop } from '@/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface TransportRequest {
  id: string;
  from: string;
  to: string;
  produce: string;
  quantity: number;
  weight: number;
  status: 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled';
  pickupDate: string;
  deliveryDate: string;
  price: number;
  customer: string;
  customerPhone: string;
  specialInstructions?: string;
}

interface Document {
  id: string;
  name: string;
  type: 'permit' | 'license' | 'insurance' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  uploadDate: string;
  expiryDate?: string;
}

const mockRequests: TransportRequest[] = [
  {
    id: '1',
    from: 'Mumbai APMC',
    to: 'Pune APMC',
    produce: 'Tomato',
    quantity: 50,
    weight: 2500,
    status: 'pending',
    pickupDate: '2024-01-20',
    deliveryDate: '2024-01-21',
    price: 5000,
    customer: 'Rajesh Kumar',
    customerPhone: '+91 98765 43210',
    specialInstructions: 'Handle with care, fragile produce',
  },
  {
    id: '2',
    from: 'Nashik APMC',
    to: 'Mumbai APMC',
    produce: 'Onion',
    quantity: 100,
    weight: 5000,
    status: 'accepted',
    pickupDate: '2024-01-22',
    deliveryDate: '2024-01-23',
    price: 8000,
    customer: 'Priya Sharma',
    customerPhone: '+91 98765 43211',
  },
  {
    id: '3',
    from: 'Pune APMC',
    to: 'Nagpur APMC',
    produce: 'Wheat',
    quantity: 200,
    weight: 10000,
    status: 'in_transit',
    pickupDate: '2024-01-18',
    deliveryDate: '2024-01-20',
    price: 12000,
    customer: 'Amit Patel',
    customerPhone: '+91 98765 43212',
  },
];

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Transport License',
    type: 'license',
    status: 'approved',
    uploadDate: '2024-01-01',
    expiryDate: '2025-01-01',
  },
  {
    id: '2',
    name: 'Vehicle Insurance',
    type: 'insurance',
    status: 'approved',
    uploadDate: '2024-01-01',
    expiryDate: '2024-12-31',
  },
  {
    id: '3',
    name: 'Permit Document',
    type: 'permit',
    status: 'pending',
    uploadDate: '2024-01-15',
  },
];

export default function LogisticsScreen() {
  const [activeTab, setActiveTab] = useState<'requests' | 'documents' | 'profile'>('requests');
  const dimensions = getResponsiveDimensions();

  const handleRequestAction = (requestId: string, action: 'accept' | 'reject' | 'start' | 'complete') => {
    Alert.alert(
      action === 'accept' ? 'Accept Request' : 
      action === 'reject' ? 'Reject Request' :
      action === 'start' ? 'Start Transport' : 'Complete Delivery',
      `Are you sure you want to ${action} this request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'reject' ? 'Reject' : action === 'accept' ? 'Accept' : action === 'start' ? 'Start' : 'Complete',
          style: action === 'reject' ? 'destructive' : 'default',
          onPress: () => {
            Alert.alert('Success', `Request ${action}ed successfully!`);
          },
        },
      ]
    );
  };

  const renderRequestCard = ({ item }: { item: TransportRequest }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Text style={styles.requestId}>#{item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.routeInfo}>
        <View style={styles.locationItem}>
          <Ionicons name="location" size={16} color={Colors.light.primary} />
          <Text style={styles.locationText}>{item.from}</Text>
        </View>
        <View style={styles.arrow}>
          <Ionicons name="arrow-forward" size={16} color={Colors.light.icon} />
        </View>
        <View style={styles.locationItem}>
          <Ionicons name="location" size={16} color={Colors.light.secondary} />
          <Text style={styles.locationText}>{item.to}</Text>
        </View>
      </View>

      <View style={styles.produceInfo}>
        <Text style={styles.produceName}>{item.produce}</Text>
        <Text style={styles.produceDetails}>
          {item.quantity} quintals • {item.weight} kg
        </Text>
      </View>

      <View style={styles.datesInfo}>
        <View style={styles.dateItem}>
          <Ionicons name="calendar" size={16} color={Colors.light.icon} />
          <Text style={styles.dateText}>Pickup: {item.pickupDate}</Text>
        </View>
        <View style={styles.dateItem}>
          <Ionicons name="time" size={16} color={Colors.light.icon} />
          <Text style={styles.dateText}>Delivery: {item.deliveryDate}</Text>
        </View>
      </View>

      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{item.customer}</Text>
        <Text style={styles.customerPhone}>{item.customerPhone}</Text>
      </View>

      <View style={styles.priceInfo}>
        <Text style={styles.priceLabel}>Transport Fee</Text>
        <Text style={styles.priceValue}>₹{item.price.toLocaleString()}</Text>
      </View>

      {item.specialInstructions && (
        <View style={styles.instructions}>
          <Text style={styles.instructionsText}>
            <Text style={styles.instructionsLabel}>Special Instructions: </Text>
            {item.specialInstructions}
          </Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        {item.status === 'pending' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleRequestAction(item.id, 'reject')}
            >
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleRequestAction(item.id, 'accept')}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </>
        )}
        {item.status === 'accepted' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={() => handleRequestAction(item.id, 'start')}
          >
            <Text style={styles.startButtonText}>Start Transport</Text>
          </TouchableOpacity>
        )}
        {item.status === 'in_transit' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => handleRequestAction(item.id, 'complete')}
          >
            <Text style={styles.completeButtonText}>Mark Delivered</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderDocumentCard = ({ item }: { item: Document }) => (
    <View style={styles.documentCard}>
      <View style={styles.documentHeader}>
        <Ionicons name={getDocumentIcon(item.type)} size={24} color={Colors.light.primary} />
        <View style={styles.documentInfo}>
          <Text style={styles.documentName}>{item.name}</Text>
          <Text style={styles.documentType}>{item.type.toUpperCase()}</Text>
        </View>
        <View style={[styles.documentStatusBadge, { backgroundColor: getDocumentStatusColor(item.status) }]}>
          <Text style={styles.documentStatusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.documentDetails}>
        <Text style={styles.documentDate}>Uploaded: {item.uploadDate}</Text>
        {item.expiryDate && (
          <Text style={styles.documentExpiry}>Expires: {item.expiryDate}</Text>
        )}
      </View>

      <TouchableOpacity style={styles.uploadButton}>
        <Ionicons name="cloud-upload" size={16} color={Colors.light.primary} />
        <Text style={styles.uploadButtonText}>Upload New</Text>
      </TouchableOpacity>
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return Colors.light.primary;
      case 'accepted': return Colors.light.success;
      case 'in_transit': return Colors.light.secondary;
      case 'delivered': return Colors.light.success;
      case 'cancelled': return Colors.light.error;
      default: return Colors.light.icon;
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'permit': return 'document-text';
      case 'license': return 'card';
      case 'insurance': return 'shield';
      default: return 'document';
    }
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return Colors.light.success;
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
            <Text style={styles.title}>Logistics Dashboard</Text>
            <Text style={styles.subtitle}>Manage transport requests and documents</Text>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
              onPress={() => setActiveTab('requests')}
            >
              <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
                Requests
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'documents' && styles.activeTab]}
              onPress={() => setActiveTab('documents')}
            >
              <Text style={[styles.tabText, activeTab === 'documents' && styles.activeTabText]}>
                Documents
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
              onPress={() => setActiveTab('profile')}
            >
              <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
                Profile
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {activeTab === 'requests' && (
            <View style={styles.requestsContainer}>
              <View style={styles.requestsHeader}>
                <Text style={styles.sectionTitle}>Transport Requests</Text>
                <TouchableOpacity style={styles.filterButton}>
                  <Ionicons name="filter" size={16} color={Colors.light.primary} />
                  <Text style={styles.filterButtonText}>Filter</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={mockRequests}
                renderItem={renderRequestCard}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.requestsList}
              />
            </View>
          )}

          {activeTab === 'documents' && (
            <View style={styles.documentsContainer}>
              <Text style={styles.sectionTitle}>Documents</Text>
              <FlatList
                data={mockDocuments}
                renderItem={renderDocumentCard}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.documentsList}
              />
            </View>
          )}

          {activeTab === 'profile' && (
            <View style={styles.profileContainer}>
              <Text style={styles.sectionTitle}>Logistics Profile</Text>
              <View style={styles.profileCard}>
                <View style={styles.profileHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>L</Text>
                  </View>
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>Logistics Provider</Text>
                    <Text style={styles.profileEmail}>logistics@mulsetu.com</Text>
                    <Text style={styles.profileType}>Transport & Logistics</Text>
                  </View>
                </View>
                
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>24</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>3</Text>
                    <Text style={styles.statLabel}>In Progress</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>4.8</Text>
                    <Text style={styles.statLabel}>Rating</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
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
    flexDirection: 'row',
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    fontFamily: 'System',
  },
  activeTabText: {
    color: 'white',
  },
  requestsContainer: {
    flex: 1,
  },
  requestsHeader: {
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
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterButtonText: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: 'System',
  },
  requestsList: {
    gap: 16,
  },
  requestCard: {
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  requestId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
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
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 6,
    fontFamily: 'System',
  },
  arrow: {
    marginHorizontal: 12,
  },
  produceInfo: {
    marginBottom: 12,
  },
  produceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
    fontFamily: 'System',
  },
  produceDetails: {
    fontSize: 14,
    color: Colors.light.icon,
    fontFamily: 'System',
  },
  datesInfo: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 6,
    fontFamily: 'System',
  },
  customerInfo: {
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
    fontFamily: 'System',
  },
  customerPhone: {
    fontSize: 14,
    color: Colors.light.icon,
    fontFamily: 'System',
  },
  priceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  priceLabel: {
    fontSize: 14,
    color: Colors.light.icon,
    fontFamily: 'System',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.primary,
    fontFamily: 'System',
  },
  instructions: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: Colors.light.text,
    fontFamily: 'System',
  },
  instructionsLabel: {
    fontWeight: '600',
    color: Colors.light.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: Colors.light.error,
  },
  rejectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  acceptButton: {
    backgroundColor: Colors.light.success,
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  startButton: {
    backgroundColor: Colors.light.primary,
  },
  startButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  completeButton: {
    backgroundColor: Colors.light.secondary,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  documentsContainer: {
    flex: 1,
  },
  documentsList: {
    gap: 16,
  },
  documentCard: {
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
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  documentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  documentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 2,
    fontFamily: 'System',
  },
  documentType: {
    fontSize: 12,
    color: Colors.light.icon,
    fontFamily: 'System',
  },
  documentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  documentStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'System',
  },
  documentDetails: {
    marginBottom: 16,
  },
  documentDate: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 4,
    fontFamily: 'System',
  },
  documentExpiry: {
    fontSize: 14,
    color: Colors.light.icon,
    fontFamily: 'System',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary + '10',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  uploadButtonText: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: 'System',
  },
  profileContainer: {
    flex: 1,
  },
  profileCard: {
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'System',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
    fontFamily: 'System',
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.light.icon,
    marginBottom: 4,
    fontFamily: 'System',
  },
  profileType: {
    fontSize: 14,
    color: Colors.light.primary,
    fontFamily: 'System',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 4,
    fontFamily: 'System',
  },
  statLabel: {
    fontSize: 14,
    color: Colors.light.icon,
    fontFamily: 'System',
  },
});
