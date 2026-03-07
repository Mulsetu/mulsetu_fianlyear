import { useUser } from '@/contexts/UserContext';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // User is authenticated, redirect to home
        router.replace('/(tabs)/home');
      } else {
        // User is not authenticated, redirect to sign-in
        router.replace('/sign-in');
      }
    }
  }, [user, isLoading]);

  // Show loading while checking authentication
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
