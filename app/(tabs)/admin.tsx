import AdminAiManualQueue from '@/components/AdminAiManualQueue';
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

interface AdminStat {
  id: string;
  title: string;
  value: string;
  change: number;
  changeType: 'up' | 'down' | 'stable';
  icon: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  userType: string;
  status: 'active' | 'blocked' | 'pending';
  joinDate: string;
  lastActive: string;
}

const mockStats: AdminStat[] = [
  {
    id: '1',
    title: 'Total Users',
    value: '2,847',
    change: 12.5,
    changeType: 'up',
    icon: 'people',
  },
  {
    id: '2',
    title: 'Active Listings',
    value: '1,234',
    change: -2.1,
    changeType: 'down',
    icon: 'list',
  },
  {
    id: '3',
    title: 'Revenue (₹)',
    value: '₹45,678',
    change: 8.3,
    changeType: 'up',
    icon: 'cash',
  },
  {
    id: '4',
    title: 'Transactions',
    value: '3,456',
    change: 15.2,
    changeType: 'up',
    icon: 'swap-horizontal',
  },
];

const mockUsers: User[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    email: 'rajesh@example.com',
    userType: 'Farmer/Trader',
    status: 'active',
    joinDate: '2024-01-15',
    lastActive: '2 hours ago',
  },
  {
    id: '2',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    userType: 'Trader',
    status: 'active',
    joinDate: '2024-01-10',
    lastActive: '1 day ago',
  },
  {
    id: '3',
    name: 'Amit Patel',
    email: 'amit@example.com',
    userType: 'Logistics',
    status: 'blocked',
    joinDate: '2024-01-05',
    lastActive: '1 week ago',
  },
];

export default function AdminScreen() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'settings'>('overview');
  const dimensions = getResponsiveDimensions();

  const handleUserAction = (userId: string, action: 'block' | 'unblock' | 'delete') => {
    Alert.alert(
      action === 'delete' ? 'Delete User' : action === 'block' ? 'Block User' : 'Unblock User',
      `Are you sure you want to ${action} this user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'delete' ? 'Delete' : action === 'block' ? 'Block' : 'Unblock',
          style: action === 'delete' ? 'destructive' : 'default',
          onPress: () => {
            Alert.alert('Success', `User ${action}ed successfully!`);
          },
        },
      ]
    );
  };

  const renderStatCard = ({ item }: { item: AdminStat }) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Ionicons name={item.icon as any} size={24} color={Colors.light.primary} />
        <View style={[
          styles.changeIndicator,
          { backgroundColor: getChangeColor(item.changeType) }
        ]}>
          <Ionicons 
            name={getChangeIcon(item.changeType)} 
            size={12} 
            color="white" 
          />
          <Text style={styles.changeText}>
            {item.change > 0 ? '+' : ''}{item.change}%
          </Text>
        </View>
      </View>
      <Text style={styles.statValue}>{item.value}</Text>
      <Text style={styles.statTitle}>{item.title}</Text>
    </View>
  );

  const renderUserCard = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {item.name.split(' ').map(n => n[0]).join('')}
          </Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <Text style={styles.userType}>{item.userType}</Text>
        </View>
      </View>
      <View style={styles.userActions}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.blockButton]}
            onPress={() => handleUserAction(item.id, item.status === 'blocked' ? 'unblock' : 'block')}
          >
            <Ionicons 
              name={item.status === 'blocked' ? 'checkmark' : 'ban'} 
              size={16} 
              color="white" 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleUserAction(item.id, 'delete')}
          >
            <Ionicons name="trash" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'up': return Colors.light.success;
      case 'down': return Colors.light.error;
      default: return Colors.light.icon;
    }
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'remove';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return Colors.light.success;
      case 'blocked': return Colors.light.error;
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
            <Text style={styles.title}>Admin Dashboard</Text>
            <Text style={styles.subtitle}>Manage users and system settings</Text>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
              onPress={() => setActiveTab('overview')}
            >
              <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
                Overview
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'users' && styles.activeTab]}
              onPress={() => setActiveTab('users')}
            >
              <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
                Users
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
              onPress={() => setActiveTab('settings')}
            >
              <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
                Settings
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {activeTab === 'overview' && (
            <View style={styles.overviewContainer}>
              <Text style={styles.sectionTitle}>System Overview</Text>
              <FlatList
                data={mockStats}
                renderItem={renderStatCard}
                keyExtractor={(item) => item.id}
                numColumns={isDesktop ? 2 : 1}
                scrollEnabled={false}
                contentContainerStyle={styles.statsList}
                columnWrapperStyle={isDesktop ? styles.statsRow : undefined}
              />

              <View style={styles.quickActions}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsGrid}>
                  <TouchableOpacity style={styles.actionCard}>
                    <Ionicons name="cloud-upload" size={32} color={Colors.light.primary} />
                    <Text style={styles.actionTitle}>Bulk Upload</Text>
                    <Text style={styles.actionSubtitle}>Upload market data</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionCard}>
                    <Ionicons name="analytics" size={32} color={Colors.light.secondary} />
                    <Text style={styles.actionTitle}>Analytics</Text>
                    <Text style={styles.actionSubtitle}>View reports</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionCard}>
                    <Ionicons name="settings" size={32} color={Colors.light.primary} />
                    <Text style={styles.actionTitle}>System Settings</Text>
                    <Text style={styles.actionSubtitle}>Configure app</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionCard}>
                    <Ionicons name="notifications" size={32} color={Colors.light.secondary} />
                    <Text style={styles.actionTitle}>Notifications</Text>
                    <Text style={styles.actionSubtitle}>Send alerts</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {activeTab === 'users' && (
            <View style={styles.usersContainer}>
              <View style={styles.usersHeader}>
                <Text style={styles.sectionTitle}>User Management</Text>
                <TouchableOpacity style={styles.addButton}>
                  <Ionicons name="add" size={20} color="white" />
                  <Text style={styles.addButtonText}>Add User</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={mockUsers}
                renderItem={renderUserCard}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.usersList}
              />
            </View>
          )}

          {activeTab === 'settings' && (
            <View style={styles.settingsContainer}>
              <Text style={styles.sectionTitle}>System Settings</Text>
              <View style={styles.settingsCard}>
                <View style={styles.settingItem}>
                  <Ionicons name="server" size={20} color={Colors.light.icon} />
                  <Text style={styles.settingLabel}>Server Status</Text>
                  <View style={styles.settingValue}>
                    <View style={styles.statusIndicator} />
                    <Text style={styles.statusText}>Online</Text>
                  </View>
                </View>
                <View style={styles.settingItem}>
                  <Ionicons name="shield" size={20} color={Colors.light.icon} />
                  <Text style={styles.settingLabel}>Security Level</Text>
                  <Text style={styles.settingValueText}>High</Text>
                </View>
                <View style={styles.settingItem}>
                  <Ionicons name="time" size={20} color={Colors.light.icon} />
                  <Text style={styles.settingLabel}>Maintenance Mode</Text>
                  <Text style={styles.settingValueText}>Disabled</Text>
                </View>
              </View>

              <AdminAiManualQueue />
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
  overviewContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: isDesktop ? 20 : 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
    fontFamily: 'System',
  },
  statsList: {
    gap: 16,
  },
  statsRow: {
    justifyContent: 'space-between',
  },
  statCard: {
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
    ...(isDesktop && {
      flex: 1,
      marginHorizontal: 8,
    }),
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  changeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
    fontFamily: 'System',
  },
  statValue: {
    fontSize: isDesktop ? 24 : 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
    fontFamily: 'System',
  },
  statTitle: {
    fontSize: 14,
    color: Colors.light.icon,
    fontFamily: 'System',
  },
  quickActions: {
    marginTop: 32,
  },
  actionsGrid: {
    ...(isDesktop ? {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    } : {
      gap: 16,
    }),
  },
  actionCard: {
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
      minWidth: 150,
    }),
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginTop: 12,
    marginBottom: 4,
    fontFamily: 'System',
  },
  actionSubtitle: {
    fontSize: 12,
    color: Colors.light.icon,
    textAlign: 'center',
    fontFamily: 'System',
  },
  usersContainer: {
    flex: 1,
  },
  usersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: 'System',
  },
  usersList: {
    gap: 16,
  },
  userCard: {
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'System',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 2,
    fontFamily: 'System',
  },
  userEmail: {
    fontSize: 14,
    color: Colors.light.icon,
    marginBottom: 2,
    fontFamily: 'System',
  },
  userType: {
    fontSize: 12,
    color: Colors.light.primary,
    fontFamily: 'System',
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockButton: {
    backgroundColor: Colors.light.primary,
  },
  deleteButton: {
    backgroundColor: Colors.light.error,
  },
  settingsContainer: {
    flex: 1,
  },
  settingsCard: {
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  settingLabel: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 12,
    fontFamily: 'System',
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValueText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
    fontFamily: 'System',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.success,
    marginRight: 8,
  },
});
