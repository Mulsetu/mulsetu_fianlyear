import { useUser } from '@/contexts/UserContext';
import { authStyles } from '@/styles/authStyles';
import { supabase } from '@/utils/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { login } = useUser();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // 1) Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        console.error('Supabase signIn error:', authError?.message);
        Alert.alert('Error', authError?.message || 'Failed to sign in. Please check your credentials.');
        return;
      }

      const authUser = authData.user;

      // 2) Load user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError || !profile) {
        console.error('Supabase profile error:', profileError?.message);
        Alert.alert('Error', 'Could not load your profile. Please try again.');
        return;
      }

      // 3) Map Supabase profile to app User shape
      const mappedUser = {
        id: authUser.id,
        name: profile.full_name,
        email: profile.email,
        userType: profile.role as 'Farmer' | 'Trader' | 'Logistics' | 'Admin',
        state: profile.state ?? '',
        district: profile.district ?? '',
        market: profile.market ?? '',
        language: profile.language ?? 'English',
        isPremium: profile.is_premium,
        walletBalance: Number(profile.wallet_balance ?? 0),
        avatar: profile.avatar_url ?? undefined,
        phone: profile.phone ?? undefined,
        location: profile.location_text ?? undefined,
        joinDate: profile.join_date ?? new Date().toISOString(),
        totalReports: profile.total_reports ?? 0,
        verified: profile.verified,
        warningCount: profile.warning_count ?? 0,
        isBlocked: profile.is_blocked,
      };

      await login(mappedUser);
      
      // Navigate to role-specific dashboard
      if (mappedUser.userType === 'Logistics') {
        router.replace('/(tabs)/logistics');
      } else if (mappedUser.userType === 'Admin') {
        router.replace('/(tabs)/admin');
      } else {
        // Farmer & Trader share the 5-tab farmer-style dashboard
      router.replace('/(tabs)/home');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      Alert.alert('Error', 'Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
            <Image source={require('@/assets/images/mulsetu_logo.png')} style={{ width: 70, height: 70, alignSelf: 'center', marginBottom: 2 }} contentFit="contain" />
            <Text style={authStyles.logo}>Mulsetu</Text>
            <Text style={authStyles.logoSubtext}>Your Digital Mandi Partner</Text>
          </View>

          {/* Form */}
          <View style={authStyles.formContainer}>
            <Text style={authStyles.title}>Welcome Back</Text>
            <Text style={authStyles.subtitle}>Sign in to your account</Text>

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

            {/* Password Input */}
            <View style={authStyles.inputContainer}>
              <Text style={authStyles.inputLabel}>Password</Text>
              <TextInput
                style={[authStyles.input, errors.password && { borderColor: '#dc3545' }]}
                placeholder="Enter your password"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.password && <Text style={authStyles.errorText}>{errors.password}</Text>}
              
              {/* Forgot Password Link */}
              <TouchableOpacity style={authStyles.forgotPasswordContainer}>
                <Text style={authStyles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={authStyles.primaryButton}
              onPress={handleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={authStyles.loadingContainer}>
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text style={authStyles.loadingText}>Signing In...</Text>
                </View>
              ) : (
                <Text style={authStyles.primaryButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={authStyles.linkContainer}>
              <Text style={authStyles.linkText}>Don&apos;t have an account? </Text>
              <Link href="/sign-up" asChild>
                <TouchableOpacity>
                  <Text style={authStyles.link}>Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
