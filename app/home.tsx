import { Colors } from '@/constants/theme';
import { getResponsiveDimensions, isDesktop } from '@/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function HomeScreen() {
  const handleSignOut = () => {
    // TODO: Implement actual sign out with Supabase
    router.push('/sign-in');
  };

  const dimensions = getResponsiveDimensions();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>Mulsetu</Text>
          <Text style={styles.logoSubtext}>Your Digital Mandi Partner</Text>
        </View>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.content, { maxWidth: dimensions.containerMaxWidth }]}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>
              Welcome to Mulsetu
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Transparent Price Discovery for Farmers and Traders
            </Text>
          </View>

          <View style={styles.featuresContainer}>
            <View style={styles.featureCard}>
              <Ionicons name="trending-up" size={isDesktop ? 40 : 32} color={Colors.light.primary} />
              <Text style={styles.featureTitle}>Real-time Prices</Text>
              <Text style={styles.featureDescription}>
                Get live market prices for agricultural commodities
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Ionicons name="shield-checkmark" size={isDesktop ? 40 : 32} color={Colors.light.secondary} />
              <Text style={styles.featureTitle}>Transparent Trading</Text>
              <Text style={styles.featureDescription}>
                Fair and transparent marketplace for farmers and traders
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Ionicons name="analytics" size={isDesktop ? 40 : 32} color={Colors.light.primary} />
              <Text style={styles.featureTitle}>Market Analytics</Text>
              <Text style={styles.featureDescription}>
                Detailed insights and trends to make informed decisions
              </Text>
            </View>
          </View>

          <View style={styles.comingSoonContainer}>
            <Text style={styles.comingSoonText}>
              🚀 Coming Soon: Full marketplace features will be available after Supabase integration
            </Text>
          </View>
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
    ...(isDesktop && {
      alignItems: 'center',
      paddingHorizontal: 24,
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  logoContainer: {
    flex: 1,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
    fontFamily: 'System',
  },
  logoSubtext: {
    fontSize: 12,
    color: Colors.light.secondary,
    fontWeight: '500',
    fontFamily: 'System',
  },
  signOutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.inputBackground,
  },
  content: {
    flex: 1,
    paddingHorizontal: isDesktop ? 0 : 24,
    paddingTop: isDesktop ? 48 : 32,
    width: '100%',
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: isDesktop ? 36 : 28,
    fontWeight: 'bold',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'System',
  },
  welcomeSubtitle: {
    fontSize: isDesktop ? 20 : 16,
    color: Colors.light.icon,
    textAlign: 'center',
    lineHeight: isDesktop ? 28 : 24,
    fontFamily: 'System',
  },
  featuresContainer: {
    marginBottom: 32,
    ...(isDesktop && {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 20,
    }),
  },
  featureCard: {
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 16,
    padding: isDesktop ? 32 : 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    ...(isDesktop && {
      flex: 1,
      minWidth: 280,
      maxWidth: 350,
      marginBottom: 0,
    }),
  },
  featureTitle: {
    fontSize: isDesktop ? 22 : 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 12,
    marginBottom: 8,
    fontFamily: 'System',
  },
  featureDescription: {
    fontSize: isDesktop ? 16 : 14,
    color: Colors.light.icon,
    textAlign: 'center',
    lineHeight: isDesktop ? 24 : 20,
    fontFamily: 'System',
  },
  comingSoonContainer: {
    backgroundColor: Colors.light.primary + '10',
    borderRadius: 12,
    padding: isDesktop ? 24 : 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
    ...(isDesktop && {
      marginTop: 20,
    }),
  },
  comingSoonText: {
    fontSize: isDesktop ? 16 : 14,
    color: Colors.light.text,
    textAlign: 'center',
    fontFamily: 'System',
    lineHeight: isDesktop ? 24 : 20,
  },
});
