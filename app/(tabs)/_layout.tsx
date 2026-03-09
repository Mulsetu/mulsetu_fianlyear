import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useUser } from '@/contexts/UserContext';
import { router, Tabs } from 'expo-router';
import { Brain, Home, Search, Shield, ShoppingCart, Truck, Upload, User } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Platform, Text } from 'react-native';

export default function TabLayout() {
  const { user, isLoading } = useUser();

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/sign-in');
    }
  }, [user, isLoading]);

  const role = user?.userType;
  const isFarmer = role === 'Farmer';
  const isTrader = role === 'Trader';
  const isLogistics = role === 'Logistics';
  const isAdmin = role === 'Admin';

  // Default behaviour: if no role yet, treat as farmer-style dashboard
  const showFarmerStyle = isFarmer || isTrader || (!role && !isLogistics && !isAdmin);
  const showHomeTab = showFarmerStyle;
  const showDiscoverTab = showFarmerStyle;
  const showAiTab = showFarmerStyle;
  // Farmer should NOT see Buy tab; Trader can. Trader dashboard: no Sell tab.
  const showBuyTab = isTrader;
  const showSellTab = showFarmerStyle && !isTrader;
  const showProfileTab = showFarmerStyle;

  const activeColor = Colors.light.onSecondary; // white – selected tab
  const inactiveColor = 'rgba(255, 255, 255, 0.6)'; // dimmed – unselected tabs
  const renderTabLabel = (label: string) => {
    const TabLabel = ({ color }: { color: string }) => (
      <Text style={{ color, fontSize: 12, fontWeight: '500' }}>{label}</Text>
    );

    TabLabel.displayName = `${label.replace(/\s+/g, '')}TabLabel`;
    return TabLabel;
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        headerShown: false,
        tabBarButton: Platform.OS === 'ios' ? HapticTab : undefined,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
        tabBarStyle: {
          backgroundColor: Colors.light.secondary,
          borderTopColor: Colors.light.secondary,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          minHeight: Platform.OS === 'ios' ? 80 : 64,
          height: Platform.OS === 'ios' ? 80 : 64,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}>
          <Tabs.Screen
            name="home"
            options={{
              title: 'Home',
              tabBarLabel: renderTabLabel('Home'),
              href: showHomeTab ? undefined : null,
              tabBarIcon: ({ color }) => (
                <Home color={String(color)} size={22} strokeWidth={2.2} />
              ),
            }}
          />
          <Tabs.Screen
            name="discover"
            options={{
              title: 'Discover',
              tabBarLabel: renderTabLabel('Discover'),
              href: showDiscoverTab ? undefined : null,
              tabBarIcon: ({ color }) => (
                <Search color={String(color)} size={22} strokeWidth={2.2} />
              ),
            }}
          />
          <Tabs.Screen
            name="ai-prediction"
            options={{
              title: 'AI Prediction',
              tabBarLabel: renderTabLabel('AI Prediction'),
              href: showAiTab ? undefined : null,
              tabBarIcon: ({ color }) => (
                <Brain color={String(color)} size={22} strokeWidth={2.2} />
              ),
            }}
          />
          <Tabs.Screen
            name="buy"
            options={{
              title: 'Buy',
              tabBarLabel: renderTabLabel('Buy'),
              href: showBuyTab ? undefined : null,
              tabBarIcon: ({ color }) => (
                <ShoppingCart color={String(color)} size={22} strokeWidth={2.2} />
              ),
            }}
          />
          <Tabs.Screen
            name="sell"
            options={{
              title: 'Sell',
              tabBarLabel: renderTabLabel('Sell'),
              href: showSellTab ? undefined : null,
              tabBarIcon: ({ color }) => (
                <Upload color={String(color)} size={22} strokeWidth={2.2} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarLabel: renderTabLabel('Profile'),
              href: showProfileTab ? undefined : null,
              tabBarIcon: ({ color }) => (
                <User color={String(color)} size={22} strokeWidth={2.2} />
              ),
            }}
          />
          {/* Hide auto-generated index route and legacy explore route from tab bar */}
          <Tabs.Screen name="index" options={{ href: null }} />
          <Tabs.Screen name="explore" options={{ href: null }} />
          {/* Admin dashboard tab: visible only for Admin role */}
          <Tabs.Screen
            name="admin"
            options={{
              title: 'Admin',
              href: isAdmin ? undefined : null,
              tabBarIcon: ({ color }) => (
                <Shield color={String(color)} size={22} strokeWidth={2.2} />
              ),
            }}
          />
          {/* Price history stays hidden but routable */}
          <Tabs.Screen name="history" options={{ href: null }} />
          {/* Logistics partner dashboard tab: visible only for Logistics role */}
          <Tabs.Screen
            name="logistics"
            options={{
              title: 'Logistics',
              href: isLogistics ? undefined : null,
              tabBarIcon: ({ color }) => (
                <Truck color={String(color)} size={22} strokeWidth={2.2} />
              ),
            }}
          />
    </Tabs>
  );
}
