import { authStyles } from '@/styles/authStyles';
import { fetchAllStateMarkets } from '@/utils/stateMarketImport';
import { supabase } from '@/utils/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const INSTALL_LINKS = {
  androidApk: 'https://your-domain.com/mulsetu.apk',
  ios: 'https://testflight.apple.com/join/your-invite-code',
  pwa: '/',
};

type DeferredInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

declare global {
  interface Window {
    __mulsetuDeferredInstallPrompt?: DeferredInstallPromptEvent | null;
  }
}

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('');
  const [market, setMarket] = useState('');
  const [language, setLanguage] = useState('English');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [showMarketModal, setShowMarketModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [markets, setMarkets] = useState<Array<{ market_name: string; state_name: string }>>([]);
  const [loadingMarkets, setLoadingMarkets] = useState(true);
  const [marketSearch, setMarketSearch] = useState('');
  const deferredInstallPromptRef = useRef<DeferredInstallPromptEvent | null>(null);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    userType?: string;
    market?: string;
    acceptTerms?: string;
  }>({});

  // Registration should only allow self-signup for Farmer, Trader and Logistics Partner
  const userTypes: Array<'Farmer' | 'Trader' | 'Logistics'> = ['Farmer', 'Trader', 'Logistics'];
  const languages = ['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu'];

  // Load markets from Supabase
  useEffect(() => {
    loadMarkets();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const deferredEvent = event as DeferredInstallPromptEvent;
      deferredInstallPromptRef.current = deferredEvent;
      window.__mulsetuDeferredInstallPrompt = deferredEvent;
    };

    const handleAppInstalled = () => {
      deferredInstallPromptRef.current = null;
      window.__mulsetuDeferredInstallPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    // If the event was captured on an earlier route, reuse it here.
    if (window.__mulsetuDeferredInstallPrompt) {
      deferredInstallPromptRef.current = window.__mulsetuDeferredInstallPrompt;
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Same table as profile: state_market_import, fetched in full (paginated past 1000 rows)
  const loadMarkets = async () => {
    try {
      setLoadingMarkets(true);
      const data = await fetchAllStateMarkets();
      setMarkets(data);
    } catch (err) {
      console.error('Error loading markets from state_market_import:', err);
      Alert.alert('Error', 'Failed to load markets. Please try again later.');
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

  const validateForm = () => {
    const newErrors: {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
      confirmPassword?: string;
      userType?: string;
      state?: string;
      district?: string;
      market?: string;
      acceptTerms?: string;
    } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(phone.trim())) {
      newErrors.phone = 'Enter a valid 10-digit phone number';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!userType) {
      newErrors.userType = 'Please select your user type';
    }

    if (!market) {
      newErrors.market = 'Please select your market';
    }

    if (!acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // 1) Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone,
          },
        },
      });

      if (authError || !authData.user) {
        console.error('Supabase signUp error:', authError?.message);
        Alert.alert('Error', authError?.message || 'Failed to create account. Please try again.');
        return;
      }

      const user = authData.user;

      // 2) Insert profile row
      const { error: profileError } = await supabase.from('user_profiles').insert({
        id: user.id,
        full_name: name,
        email,
        phone,
        role: userType,
        market,
        language,
      });

      if (profileError) {
        console.error('Supabase profile insert error:', profileError.message);
        Alert.alert(
          'Error',
          'Account created in auth, but failed to save profile. Please contact support.'
        );
        return;
      }

      Alert.alert('Account created', 'Your Mulsetu account has been created. Please sign in.');
      
      // Navigate to sign-in screen
      router.replace('/sign-in');
    } catch (err) {
      console.error('Sign up error:', err);
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenInstallLink = async (url: string, label: string) => {
    if (label === 'PWA/Web' && Platform.OS === 'web') {
      const deferredPrompt =
        deferredInstallPromptRef.current ?? window.__mulsetuDeferredInstallPrompt ?? null;

      if (deferredPrompt) {
        await deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredInstallPromptRef.current = null;
        window.__mulsetuDeferredInstallPrompt = null;
        return;
      }

      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);

      Alert.alert(
        'Install steps',
        isIos
          ? 'On iPhone/iPad use Safari: tap Share, then Add to Home Screen.'
          : 'Open in Chrome and use menu > Install app (or Add to Home screen).'
      );
      return;
    }

    const isPlaceholder =
      url.includes('your-domain.com') ||
      url.includes('your-invite-code') ||
      url.includes('your-vercel-domain');

    if (isPlaceholder) {
      Alert.alert('Install link not configured', `Please update the ${label} link in app/sign-up.tsx.`);
      return;
    }

    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert('Unable to open link', `Could not open ${label} link.`);
      return;
    }

    await Linking.openURL(url);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={authStyles.container}>
          {/* Logo */}
          <View style={authStyles.logoContainer}>
             <Image source={require('@/assets/images/mulsetu_logo.png')} style={{ width: 70, height: 70, alignSelf: 'center', marginBottom: 3 }} contentFit="contain" />
            <Text style={authStyles.logo}>Mulsetu</Text>
            <Text style={authStyles.logoSubtext}>Your Digital Mandi Partner</Text>
          </View>

          {/* Form */}
          <View style={authStyles.formContainer}>
            <Text style={authStyles.title}>Create Account</Text>
            <Text style={authStyles.subtitle}>Join Mulsetu to get started</Text>

            {/* Name Input */}
            <View style={authStyles.inputContainer}>
              <Text style={authStyles.inputLabel}>Full Name</Text>
              <TextInput
                style={[authStyles.input, errors.name && { borderColor: '#dc3545' }]}
                placeholder="Enter your full name"
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {errors.name && <Text style={authStyles.errorText}>{errors.name}</Text>}
            </View>

            {/* Email Input */}
            <View style={authStyles.inputContainer}>
              <Text style={authStyles.inputLabel}>Email</Text>
              <TextInput
                style={[authStyles.input, errors.email && { borderColor: '#dc3545' }]}
                placeholder="Enter your email"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.email && <Text style={authStyles.errorText}>{errors.email}</Text>}
            </View>

          {/* Phone Number Input */}
          <View style={authStyles.inputContainer}>
            <Text style={authStyles.inputLabel}>Phone Number</Text>
            <TextInput
              style={[authStyles.input, errors.phone && { borderColor: '#dc3545' }]}
              placeholder="Enter your phone number"
              placeholderTextColor="#9ca3af"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={10}
            />
            {errors.phone && <Text style={authStyles.errorText}>{errors.phone}</Text>}
          </View>

            {/* Password Input */}
            <View style={authStyles.inputContainer}>
              <Text style={authStyles.inputLabel}>Password</Text>
              <TextInput
                style={[authStyles.input, errors.password && { borderColor: '#dc3545' }]}
                placeholder="Create a password"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.password && <Text style={authStyles.errorText}>{errors.password}</Text>}
            </View>

            {/* Confirm Password Input */}
            <View style={authStyles.inputContainer}>
              <Text style={authStyles.inputLabel}>Confirm Password</Text>
              <TextInput
                style={[authStyles.input, errors.confirmPassword && { borderColor: '#dc3545' }]}
                placeholder="Confirm your password"
                placeholderTextColor="#9ca3af"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.confirmPassword && <Text style={authStyles.errorText}>{errors.confirmPassword}</Text>}
            </View>

            {/* User Type Selection */}
            <View style={authStyles.inputContainer}>
              <Text style={authStyles.inputLabel}>User Type</Text>
              <TouchableOpacity
                style={[authStyles.input, authStyles.pickerInput, errors.userType && { borderColor: '#dc3545' }]}
                onPress={() => setShowUserTypeModal(true)}
              >
                <Text style={[authStyles.pickerText, !userType && { color: '#9ca3af' }]}>
                  {userType || 'Select your user type'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#9ca3af" />
              </TouchableOpacity>
              {errors.userType && <Text style={authStyles.errorText}>{errors.userType}</Text>}
            </View>

            {/* Market Selection */}
            <View style={authStyles.inputContainer}>
              <Text style={authStyles.inputLabel}>Mandi / Market</Text>
              <TouchableOpacity
                style={[authStyles.input, authStyles.pickerInput, errors.market && { borderColor: '#dc3545' }]}
                onPress={() => setShowMarketModal(true)}
                disabled={loadingMarkets}
              >
                {loadingMarkets ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#60941a" style={{ marginRight: 8 }} />
                    <Text style={[authStyles.pickerText, { color: '#9ca3af' }]}>Loading markets...</Text>
                  </View>
                ) : (
                  <>
                    <Text style={[authStyles.pickerText, !market && { color: '#9ca3af' }]}>
                      {market || 'Select your mandi / market'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#9ca3af" />
                  </>
                )}
              </TouchableOpacity>
              {errors.market && <Text style={authStyles.errorText}>{errors.market}</Text>}
            </View>

            {/* Language Selection */}
            <View style={authStyles.inputContainer}>
              <Text style={authStyles.inputLabel}>Language</Text>
              <TouchableOpacity
                style={[authStyles.input, authStyles.pickerInput]}
                onPress={() => setShowLanguageModal(true)}
              >
                <Text style={authStyles.pickerText}>{language}</Text>
                <Ionicons name="chevron-down" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Terms and Conditions */}
            <View style={authStyles.inputContainer}>
              <TouchableOpacity
                style={authStyles.checkboxContainer}
                onPress={() => setAcceptTerms(!acceptTerms)}
              >
                <View style={[authStyles.checkbox, acceptTerms && authStyles.checkboxChecked]}>
                  {acceptTerms && <Ionicons name="checkmark" size={16} color="white" />}
                </View>
                <Text style={authStyles.checkboxText}>
                  I agree to the{' '}
                  <Text style={authStyles.link}>Terms and Conditions</Text>
                  {' '}and{' '}
                  <Text style={authStyles.link}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>
              {errors.acceptTerms && <Text style={authStyles.errorText}>{errors.acceptTerms}</Text>}
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={authStyles.primaryButton}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={authStyles.loadingContainer}>
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text style={authStyles.loadingText}>Creating Account...</Text>
                </View>
              ) : (
                <Text style={authStyles.primaryButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Install Buttons */}
            <View style={authStyles.installSection}>
              <Text style={authStyles.installTitle}>Install Mulsetu</Text>

              <TouchableOpacity
                style={authStyles.installButton}
                onPress={() => handleOpenInstallLink(INSTALL_LINKS.androidApk, 'Android APK')}
              >
                <Ionicons name="logo-android" size={18} color="#ffffff" />
                <Text style={authStyles.installButtonText}>Install for Android (APK)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={authStyles.installButton}
                onPress={() => handleOpenInstallLink(INSTALL_LINKS.ios, 'iPhone')}
              >
                <Ionicons name="logo-apple" size={18} color="#ffffff" />
                <Text style={authStyles.installButtonText}>Install for iPhone</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[authStyles.installButton, authStyles.installPwaButton]}
                onPress={() => handleOpenInstallLink(INSTALL_LINKS.pwa, 'PWA/Web')}
              >
                <Ionicons name="download-outline" size={18} color="#ffffff" />
                <Text style={authStyles.installButtonText}>Install as PWA (Web)</Text>
              </TouchableOpacity>

              <Text style={authStyles.installHint}>
                Android: after download, open the APK file to complete install.
              </Text>
            </View>

            {/* Sign In Link */}
            <View style={authStyles.linkContainer}>
              <Text style={authStyles.linkText}>Already have an account? </Text>
              <Link href="/sign-in" asChild>
                <TouchableOpacity>
                  <Text style={authStyles.link}>Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* User Type Modal */}
      <Modal
        visible={showUserTypeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUserTypeModal(false)}
      >
        <View style={authStyles.modalOverlay}>
          <View style={authStyles.modalContent}>
            <Text style={authStyles.modalTitle}>Select User Type</Text>
            <FlatList
              data={userTypes}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const label =
                  item === 'Logistics' ? 'Logistics Partner' : item;

                return (
                <TouchableOpacity
                  style={authStyles.modalItem}
                  onPress={() => {
                    setUserType(item);
                    setShowUserTypeModal(false);
                  }}
                >
                    <Text style={authStyles.modalItemText}>{label}</Text>
                  {userType === item && <Ionicons name="checkmark" size={20} color="#60941a" />}
                </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity
              style={authStyles.modalCloseButton}
              onPress={() => setShowUserTypeModal(false)}
            >
              <Text style={authStyles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Market Modal */}
      <Modal
        visible={showMarketModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMarketModal(false)}
      >
        <View style={authStyles.modalOverlay}>
          <View style={authStyles.modalContent}>
            <Text style={authStyles.modalTitle}>Select Mandi / Market</Text>
            {loadingMarkets ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#60941a" />
                <Text style={{ marginTop: 10, color: '#9ca3af' }}>Loading markets...</Text>
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
                      borderColor: '#e5e7eb',
                      backgroundColor: '#f9fafb',
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                    }}
                  >
                    <Ionicons
                      name="search"
                      size={18}
                      color="#9ca3af"
                      style={{ marginRight: 6 }}
                    />
                    <TextInput
                      style={{
                        flex: 1,
                        fontSize: 14,
                        color: '#111827',
                        paddingVertical: 4,
                      }}
                      placeholder="Search mandi / market"
                      placeholderTextColor="#9ca3af"
                      value={marketSearch}
                      onChangeText={setMarketSearch}
                    />
                  </View>
                </View>
                <FlatList
                  data={marketOptionsList}
                  keyExtractor={(item) => item}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={authStyles.modalItem}
                      onPress={() => {
                        // Extract just the market name (before the state part)
                        const marketName = item.split(' (')[0];
                        setMarket(marketName);
                        setShowMarketModal(false);
                      }}
                    >
                      <Text style={authStyles.modalItemText}>{item}</Text>
                      {market === item.split(' (')[0] && (
                        <Ionicons name="checkmark" size={20} color="#60941a" />
                      )}
                    </TouchableOpacity>
                  )}
                />
              </>
            )}
            <TouchableOpacity
              style={authStyles.modalCloseButton}
              onPress={() => setShowMarketModal(false)}
            >
              <Text style={authStyles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Language Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={authStyles.modalOverlay}>
          <View style={authStyles.modalContent}>
            <Text style={authStyles.modalTitle}>Select Language</Text>
            <FlatList
              data={languages}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={authStyles.modalItem}
                  onPress={() => {
                    setLanguage(item);
                    setShowLanguageModal(false);
                  }}
                >
                  <Text style={authStyles.modalItemText}>{item}</Text>
                  {language === item && <Ionicons name="checkmark" size={20} color="#60941a" />}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={authStyles.modalCloseButton}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={authStyles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
