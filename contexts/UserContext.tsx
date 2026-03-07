import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import type { User as TypedUser, UserRole } from '@/types';
import { supabase } from '@/utils/supabaseClient';

export interface User extends TypedUser {}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        await AsyncStorage.removeItem('user');
      } else if (event === 'SIGNED_IN' && session) {
        // Load profile when user signs in
        await loadUserFromSupabase(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserFromSupabase = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        console.error('Error loading profile:', error);
        return null;
      }

      const mappedUser: User = {
        id: userId,
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

      setUser(mappedUser);
      await AsyncStorage.setItem('user', JSON.stringify(mappedUser));
      return mappedUser;
    } catch (error) {
      console.error('Error loading user from Supabase:', error);
      return null;
    }
  };

  const loadUser = async () => {
    try {
      // Check if user is authenticated in Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Load from Supabase
        await loadUserFromSupabase(session.user.id);
      } else {
        // No authenticated user - check AsyncStorage as fallback
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
          // Clear stale data if no Supabase session
          await AsyncStorage.removeItem('user');
        }
        setUser(null);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: User) => {
    try {
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear local state
      setUser(null);
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear local state even if Supabase signout fails
      setUser(null);
      await AsyncStorage.removeItem('user');
      throw error;
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    
    try {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    await loadUser();
  };

  const value: UserContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
    refreshUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
